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
    'mg/dose', '% Formula', 'Produzione (g per kg)',
    'Purezza %', 'Titolo %', 'Nutriente Attivo',
    'Apporto/Dose (mg)', 'Apporto/Die (mg)', 'VNR %',
    'Limite Max (mg/die)', 'Stato',
  ]
  const body = rows.map((row, i) => {
    const rm = rmMap[row.rawMaterialId]
    if (!rm) return null
    const gPerKg = row.percentOfTotal > 0 ? row.percentOfTotal * 10 : 0
    return [
      i + 1,
      rm.name,
      rm.supplier || '',
      fmtN(row.amountMg, 3),
      fmtN(row.percentOfTotal, 2) + '%',
      fmtN(gPerKg, 3) + ' g',
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
  return { data: [header, ...body], cols: [4, 28, 20, 10, 10, 18, 10, 10, 20, 16, 16, 10, 16, 14] }
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

function dataFogliodiPesata(rows, rmMap, formula) {
  const sorted     = [...rows].sort((a, b) => b.amountMg - a.amountMg)
  const validRows  = sorted.filter(r => rmMap[r.rawMaterialId])

  // Fixed rows before data (1-based Excel rows):
  //  R1  — Title (merged A:D)
  //  R2  — "BATCH TARGET (g)" label in A2 | 1000 in B2  ← master interactive cell
  //  R3  — Formula meta info (merged A:D)
  //  R4  — spacer
  //  R5  — Column headers
  //  R6+ — Ingredient rows with =C_n/100*$B$2 formulas
  const DATA_START = 6

  const bodyRows = validRows.map((row, i) => {
    const rm       = rmMap[row.rawMaterialId]
    const excelRow = DATA_START + i
    const preCalc  = row.percentOfTotal / 100 * 1000
    return [
      rm.name,
      row.amountMg,
      row.percentOfTotal,
      { t: 'n', f: `C${excelRow}/100*$B$2`, v: preCalc },
    ]
  })

  const lastDataRow  = DATA_START + bodyRows.length - 1
  const totalRow     = lastDataRow + 2  // one blank between data and total
  const totalMg      = validRows.reduce((s, r) => s + r.amountMg, 0)
  const totalPct     = validRows.reduce((s, r) => s + r.percentOfTotal, 0)
  const totalPreCalc = totalPct / 100 * 1000
  const dateStr      = new Date().toLocaleDateString('it-IT')

  const data = [
    // R1 — title
    [`FOGLIO DI PESATA — ${formula.name}`, '', '', ''],
    // R2 — interactive batch target
    ['BATCH TARGET (g)', 1000, '', ''],
    // R3 — meta
    [`${formula.type}  ·  Dose: ${formula.targetWeightMg} mg  ·  Dosi/die: ${formula.dosiAlGiorno || 1}  ·  Data: ${dateStr}`, '', '', ''],
    // R4 — spacer
    ['', '', '', ''],
    // R5 — headers
    ['MATERIA PRIMA', 'mg/dose', '% PESO', 'PESO DA PESARE (g)'],
    // R6+ — ingredient rows
    ...bodyRows,
    // blank separator before total
    ['', '', '', ''],
    // total row
    [
      'TOTALE',
      totalMg,
      totalPct,
      { t: 'n', f: `SUM(D${DATA_START}:D${lastDataRow})`, v: totalPreCalc },
    ],
    // footer spacers
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    // signature row
    ['Firma Operatore:', '', '', 'Data / Ora:'],
    ['', '', '', ''],
    ['_____________________________', '', '', '______________'],
    ['', '', '', ''],
    // notes
    ['Note di Produzione:', '', '', ''],
    ['', '', '', ''],
    ['____________________________________________', '', '', ''],
    ['____________________________________________', '', '', ''],
  ]

  // R index (0-based) of the notes lines — used for merges
  const notesLabelR = data.length - 5
  const notesLine1R = data.length - 2
  const notesLine2R = data.length - 1

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },            // R1: title
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },            // R3: meta
    { s: { r: notesLabelR, c: 0 }, e: { r: notesLabelR, c: 3 } },
    { s: { r: notesLine1R, c: 0 }, e: { r: notesLine1R, c: 3 } },
    { s: { r: notesLine2R, c: 0 }, e: { r: notesLine2R, c: 3 } },
  ]

  // Row heights (points): title tall, header row tall, data rows normal
  const rowHeights = {}
  rowHeights[0] = 28   // title
  rowHeights[1] = 22   // batch target
  rowHeights[4] = 20   // column headers
  for (let i = 0; i < bodyRows.length; i++) rowHeights[DATA_START - 1 + i] = 18
  rowHeights[totalRow - 1] = 18  // total

  return { data, cols: [34, 14, 12, 22], merges, rowHeights }
}


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

  function makeLabSheet({ data, cols, merges, rowHeights }) {
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = cols.map(w => ({ wch: w }))
    if (merges) ws['!merges'] = merges
    if (rowHeights) {
      ws['!rows'] = []
      Object.entries(rowHeights).forEach(([r, hpt]) => {
        ws['!rows'][Number(r)] = { hpt }
      })
    }
    // A4 portrait, fit to one page wide
    ws['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    ws['!pageMargins'] = { top: 0.98, bottom: 0.98, left: 0.75, right: 0.75, header: 0.3, footer: 0.3 }
    return ws
  }

  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, makeSheet(dataProdotto(formula, mode)), 'Prodotto')

  if (mode === 'full') {
    XLSX.utils.book_append_sheet(wb, makeSheet(dataIngredientiCompleto(computed.rows, rmMap)), 'Ingredienti')
    XLSX.utils.book_append_sheet(wb, makeSheet(dataProfiloNutrizionale(computed.rows, rmMap)), 'Profilo Nutrizionale')
    XLSX.utils.book_append_sheet(wb, makeSheet(dataCosti(computed.rows, rmMap, computed, formula)), 'Analisi Costi')
    XLSX.utils.book_append_sheet(wb, makeLabSheet(dataFogliodiPesata(computed.rows, rmMap, formula)), 'Foglio di Pesata LAB')
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
