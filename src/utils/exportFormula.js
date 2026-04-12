/**
 * Formula export utility — generates Excel (.xlsx) files.
 *
 * Two modes:
 *  'full'   → Scheda Tecnica Completa (RISERVATO): all data, 4 sheets
 *  'public' → Scheda Pubblica Anonimizzata: ingredients coded as ING-01,
 *             quantities shown as % ranges, no supplier / price / titration
 *
 * xlsx is loaded dynamically so it doesn't bloat the initial bundle.
 */

import { fromMg } from './weightConversions.js'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtN(n, dec = 4) {
  if (n === null || n === undefined || isNaN(n)) return ''
  return Number(n).toFixed(dec)
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function percentBucket(pct) {
  if (pct <= 0) return '—'
  if (pct < 1)  return '< 1%'
  if (pct < 5)  return '1–5%'
  if (pct < 15) return '5–15%'
  if (pct < 30) return '15–30%'
  if (pct < 60) return '30–60%'
  return '> 60%'
}

function slugify(name) {
  return (name || 'formula').replace(/[^a-zA-Z0-9À-ù]/g, '_').replace(/_+/g, '_').slice(0, 40)
}

// ─── Data builders (return plain arrays — no XLSX dependency) ─────────────────

function dataProdotto(formula, mode) {
  const unit = formula.targetWeightUnit || 'mg'
  const rows = [
    ['GALENIC-OS — SCHEDA TECNICA FORMULA', mode === 'full' ? '⚠ RISERVATO / CONFIDENZIALE' : 'Scheda Pubblica Anonimizzata'],
    [],
    ['Nome Formula',   formula.name],
    ['Tipo',           formula.type],
    ['Peso per Dose',  `${fromMg(formula.targetWeightMg, unit).toFixed(3)} ${unit} (${formula.targetWeightMg} mg)`],
    ['Dosi al Giorno', formula.dosiAlGiorno || 1],
    ['Stato',          formula.status === 'finalized' ? 'Finalizzata' : 'Bozza'],
    [],
    ['Data Export',    fmtDate(Date.now())],
    ['Data Creazione', fmtDate(formula.createdAt)],
  ]
  if (formula.type === 'Liquidi') {
    if (formula.pH   !== null && formula.pH   !== '') rows.push(['pH',   formula.pH])
    if (formula.brix !== null && formula.brix !== '') rows.push(['Brix', formula.brix])
  }
  return { data: rows, cols: [28, 40] }
}

function dataIngredientiCompleto(rows, rmMap) {
  const header = [
    '#', 'Materia Prima', 'Fornitore',
    'mg/dose', '% Formula',
    'Purezza %', 'Titolo %', 'Nutriente Attivo',
    'Apporto/Dose (mg)', 'Apporto/Die (mg)', 'VNR %',
    'Limite Max (mg/die)', 'Stato',
  ]
  const body = rows.map((row, i) => {
    const rm = rmMap[row.rawMaterialId]
    if (!rm) return null
    return [
      i + 1,
      rm.name,
      rm.supplier || '',
      fmtN(row.amountMg, 3),
      fmtN(row.percentOfTotal, 2) + '%',
      fmtN(rm.purity, 1),
      fmtN(rm.titration, 1),
      rm.activeNutrient || '',
      fmtN(row.realNutrientContribution, 4),
      fmtN(row.dailyContribution, 4),
      row.nrvPercent !== null ? fmtN(row.nrvPercent, 1) + '%' : 'N/D',
      rm.maxLimitMg > 0 ? fmtN(rm.maxLimitMg, 3) : '',
      row.exceedsMaxLimit ? '⚠ SUPERA LIMITE' : (rm.maxLimitMg > 0 ? '✓ OK' : ''),
    ]
  }).filter(Boolean)
  return { data: [header, ...body], cols: [4, 28, 20, 10, 10, 10, 10, 20, 16, 16, 10, 16, 14] }
}

function dataProfiloNutrizionale(rows, rmMap) {
  const header = ['Nutriente Attivo', 'Apporto/Die (mg)', 'VNR %', 'Limite Max (mg/die)', 'Conforme']
  const body = rows
    .map(row => {
      const rm = rmMap[row.rawMaterialId]
      if (!rm || !(rm.nrvReference > 0)) return null
      return [
        rm.activeNutrient || rm.name,
        fmtN(row.dailyContribution, 4),
        row.nrvPercent !== null ? fmtN(row.nrvPercent, 1) + '%' : 'N/D',
        rm.maxLimitMg > 0 ? fmtN(rm.maxLimitMg, 3) : 'N/D',
        row.exceedsMaxLimit ? 'NO — supera limite' : 'Sì',
      ]
    })
    .filter(Boolean)
  return { data: [header, ...body], cols: [24, 16, 10, 16, 20] }
}

function dataCosti(rows, rmMap, computed, formula) {
  const header = ['Materia Prima', 'mg/dose', 'kg/dose', '€/kg (inventario)', 'Costo Riga (€)']
  const body = rows.map(row => {
    const rm = rmMap[row.rawMaterialId]
    if (!rm) return null
    return [
      rm.name,
      fmtN(row.amountMg, 3),
      fmtN(row.amountMg / 1_000_000, 8),
      fmtN(rm.pricePerKg, 4),
      fmtN(row.rowCost, 6),
    ]
  }).filter(Boolean)

  const qtyPerPackMg   = formula.qtyPerPackMg || 0
  const qtyPerPackUnit = formula.qtyPerPackUnit || 'g'
  const massCostPerUnit = qtyPerPackMg > 0
    ? computed.massCostPerKg * (qtyPerPackMg / 1_000_000)
    : computed.batchCost
  const packagingUnitCost = computed.selectedPkg?.unitCost || 0
  const finalUnitCost = massCostPerUnit + packagingUnitCost

  const summary = [
    [],
    ['TOTALE MASSA (lotto)', '', '', '', fmtN(computed.batchCost, 6)],
    ['Costo Massa / kg',    '', '', '', fmtN(computed.massCostPerKg, 4)],
    ['Costo Massa / unità', '', '',
      qtyPerPackMg > 0 ? `${fromMg(qtyPerPackMg, qtyPerPackUnit).toFixed(3)} ${qtyPerPackUnit}/unità` : 'intero lotto',
      fmtN(massCostPerUnit, 6),
    ],
    computed.selectedPkg
      ? ['Packaging (' + computed.selectedPkg.description + ')', '', '', '', fmtN(packagingUnitCost, 4)]
      : ['Packaging', '', '', '', '—'],
    ['COSTO UNITÀ FINALE', '', '', '', fmtN(finalUnitCost, 4)],
  ]

  return { data: [header, ...body, ...summary], cols: [28, 10, 12, 18, 14] }
}

function dataComposizioneAnonima(rows, rmMap) {
  const header = ['Codice', 'Categoria', '% Intervallo', 'Nutriente Attivo', 'Apporto/Die (mg)', 'VNR %']
  const body = rows.map((row, i) => {
    const rm = rmMap[row.rawMaterialId]
    if (!rm) return null
    const nutrient = rm.activeNutrient || ''
    const nl = nutrient.toLowerCase()
    const cat = nutrient
      ? (nl.includes('vitamina') || nl.includes('vit.') ? 'Vitamina' :
         nl.includes('calcio') || nl.includes('magnesio') || nl.includes('zinco') || nl.includes('ferro') ? 'Minerale' :
         'Attivo')
      : 'Eccipiente'
    return [
      `ING-${String(i + 1).padStart(2, '0')}`,
      cat,
      percentBucket(row.percentOfTotal),
      nutrient || '—',
      row.dailyContribution > 0 ? fmtN(row.dailyContribution, 4) : '—',
      row.nrvPercent !== null ? fmtN(row.nrvPercent, 1) + '%' : '—',
    ]
  }).filter(Boolean)
  return { data: [header, ...body], cols: [10, 12, 12, 22, 16, 10] }
}

function dataNutrizionalePublico(rows, rmMap) {
  const header = ['Nutriente', 'Apporto Giornaliero', 'VNR %', 'Entro Limiti di Legge']
  const body = rows
    .map(row => {
      const rm = rmMap[row.rawMaterialId]
      if (!rm || !(rm.nrvReference > 0)) return null
      return [
        rm.activeNutrient || '—',
        fmtN(row.dailyContribution, 4) + ' mg',
        row.nrvPercent !== null ? fmtN(row.nrvPercent, 1) + '%' : 'N/D',
        row.exceedsMaxLimit ? 'No' : 'Sì',
      ]
    })
    .filter(Boolean)
  if (body.length === 0) return null
  return { data: [header, ...body], cols: [24, 20, 10, 22] }
}

// ─── Main export function ─────────────────────────────────────────────────────

/**
 * Generate and trigger download of formula as .xlsx
 * xlsx is loaded dynamically to keep the initial bundle lean.
 *
 * @param {object} formula       active formula object
 * @param {object} computed      computed results from useFormula
 * @param {Array}  rawMaterials  full inventory array
 * @param {Array}  packaging     full packaging array (unused directly, via computed.selectedPkg)
 * @param {'full'|'public'} mode
 */
export async function exportFormulaToExcel(formula, computed, rawMaterials, packaging, mode = 'full') {
  const XLSX = await import('xlsx')

  const rmMap = {}
  rawMaterials.forEach(rm => { rmMap[rm.id] = rm })

  function makeSheet({ data, cols }) {
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = cols.map(w => ({ wch: w }))
    return ws
  }

  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, makeSheet(dataProdotto(formula, mode)), 'Prodotto')

  if (mode === 'full') {
    XLSX.utils.book_append_sheet(wb, makeSheet(dataIngredientiCompleto(computed.rows, rmMap)), 'Ingredienti')
    XLSX.utils.book_append_sheet(wb, makeSheet(dataProfiloNutrizionale(computed.rows, rmMap)), 'Profilo Nutrizionale')
    XLSX.utils.book_append_sheet(wb, makeSheet(dataCosti(computed.rows, rmMap, computed, formula)), 'Analisi Costi')
  } else {
    XLSX.utils.book_append_sheet(wb, makeSheet(dataComposizioneAnonima(computed.rows, rmMap)), 'Composizione')
    const nutResult = dataNutrizionalePublico(computed.rows, rmMap)
    if (nutResult) XLSX.utils.book_append_sheet(wb, makeSheet(nutResult), 'Apporto Nutrizionale')
  }

  const dateStr  = new Date().toISOString().slice(0, 10)
  const suffix   = mode === 'full' ? 'RISERVATO' : 'pubblica'
  const filename = `${slugify(formula.name)}_${suffix}_${dateStr}.xlsx`

  XLSX.writeFile(wb, filename)
}
