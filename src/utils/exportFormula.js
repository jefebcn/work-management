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
  const sorted    = [...rows].sort((a, b) => b.amountMg - a.amountMg)
  const validRows = sorted.filter(r => rmMap[r.rawMaterialId])

  // Layout (1-based Excel rows / 0-based indices):
  //  R1  (0) — Title (merged A:D)
  //  R2  (1) — Meta info (merged A:D)
  //  R3  (2) — spacer
  //  R4  (3) — "PESO TARGET DOSE (mg)" | B4 ← INPUT yellow
  //  R5  (4) — "QUANTITÀ CAMPIONE (g)"  | B5 ← INPUT yellow
  //  R6  (5) — spacer
  //  R7  (6) — Column headers
  //  R8+ (7+)— Ingredient rows: [name | pct_decimal (yellow) | =B*$B$4 | =B*$B$5]
  //  blank separator
  //  Total row with SUM formulas for cols B, C, D
  const DATA_START = 8  // 1-based Excel row for first ingredient

  const dateStr = new Date().toLocaleDateString('it-IT')

  const bodyRows = validRows.map((row, i) => {
    const rm         = rmMap[row.rawMaterialId]
    const excelRow   = DATA_START + i
    const pctDecimal = row.percentOfTotal / 100
    return [
      rm.name,
      pctDecimal,
      { t: 'n', f: `B${excelRow}*$B$4`, v: pctDecimal * formula.targetWeightMg },
      { t: 'n', f: `B${excelRow}*$B$5`, v: pctDecimal * 1000 },
    ]
  })

  const lastDataRow     = DATA_START + bodyRows.length - 1  // 1-based
  const totalPctDecimal = validRows.reduce((s, r) => s + r.percentOfTotal, 0) / 100

  const data = [
    // R1 — title (idx 0)
    [`FOGLIO DI PESATA — ${formula.name}`, '', '', ''],
    // R2 — meta (idx 1)
    [`${formula.type}  ·  Dosi/die: ${formula.dosiAlGiorno || 1}  ·  Data: ${dateStr}`, '', '', ''],
    // R3 — spacer (idx 2)
    ['', '', '', ''],
    // R4 — dose target INPUT (idx 3) → cell B4
    ['PESO TARGET DOSE (mg)', formula.targetWeightMg, '', ''],
    // R5 — batch INPUT (idx 4) → cell B5
    ['QUANTITÀ CAMPIONE (g)', 1000, '', ''],
    // R6 — spacer (idx 5)
    ['', '', '', ''],
    // R7 — column headers (idx 6)
    ['MATERIA PRIMA', '% PESO', 'mg/dose', 'PESO DA PESARE (g)'],
    // R8+ — ingredient rows (idx 7+)
    ...bodyRows,
    // blank separator
    ['', '', '', ''],
    // total row
    [
      'TOTALE',
      { t: 'n', f: `SUM(B${DATA_START}:B${lastDataRow})`, v: totalPctDecimal },
      { t: 'n', f: `SUM(C${DATA_START}:C${lastDataRow})`, v: totalPctDecimal * formula.targetWeightMg },
      { t: 'n', f: `SUM(D${DATA_START}:D${lastDataRow})`, v: totalPctDecimal * 1000 },
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

  const hdrRowIdx    = 6                    // 0-based (R7)
  const firstDataIdx = 7                    // 0-based (R8)
  const lastDataIdx  = 6 + bodyRows.length  // 0-based (inclusive)
  const totalRowIdx  = 8 + bodyRows.length  // 0-based (after blank separator)

  const notesLabelR = data.length - 5
  const notesLine1R = data.length - 2
  const notesLine2R = data.length - 1

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },  // R1: title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },  // R2: meta
    { s: { r: notesLabelR, c: 0 }, e: { r: notesLabelR, c: 3 } },
    { s: { r: notesLine1R, c: 0 }, e: { r: notesLine1R, c: 3 } },
    { s: { r: notesLine2R, c: 0 }, e: { r: notesLine2R, c: 3 } },
  ]

  const rowHeights = {}
  rowHeights[0] = 28  // title
  rowHeights[1] = 18  // meta
  rowHeights[3] = 22  // B4 input
  rowHeights[4] = 22  // B5 input
  rowHeights[6] = 20  // column headers
  for (let i = 0; i < bodyRows.length; i++) rowHeights[7 + i] = 18
  rowHeights[totalRowIdx] = 18

  // Input cells that get yellow fill: B4, B5, and col B of every ingredient row
  const inputCells = [
    { r: 3, c: 1 },
    { r: 4, c: 1 },
    ...Array.from({ length: bodyRows.length }, (_, i) => ({ r: 7 + i, c: 1 })),
  ]

  return {
    data,
    cols: [34, 12, 14, 22],
    merges,
    rowHeights,
    hdrRowIdx,
    firstDataIdx,
    lastDataIdx,
    totalRowIdx,
    inputCells,
  }
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

  function makeLabSheet({ data, cols, merges, rowHeights, hdrRowIdx, firstDataIdx, lastDataIdx, totalRowIdx, inputCells }) {
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = cols.map(w => ({ wch: w }))
    if (merges) ws['!merges'] = merges
    if (rowHeights) {
      ws['!rows'] = []
      Object.entries(rowHeights).forEach(([r, hpt]) => {
        ws['!rows'][Number(r)] = { hpt }
      })
    }

    // Yellow fill for editable input cells (B4, B5, col B ingredient rows)
    const YELLOW = { fgColor: { rgb: 'FFF2CC' }, patternType: 'solid' }
    if (inputCells) {
      inputCells.forEach(({ r, c }) => {
        const addr = XLSX.utils.encode_cell({ r, c })
        if (!ws[addr]) ws[addr] = { t: 'n', v: 0 }
        ws[addr].s = { ...(ws[addr].s || {}), fill: YELLOW }
      })
    }

    // Percentage format for col B (data rows + total): stored as decimal, displayed as 60.00%
    if (firstDataIdx != null) {
      for (let row = firstDataIdx; row <= lastDataIdx; row++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: 1 })
        if (ws[addr]) ws[addr].z = '0.00%'
      }
      if (totalRowIdx != null) {
        const addr = XLSX.utils.encode_cell({ r: totalRowIdx, c: 1 })
        if (ws[addr]) ws[addr].z = '0.00%'
      }
    }

    // Per-cell border styling for the weighing table
    if (hdrRowIdx != null && totalRowIdx != null) {
      const MEDIUM   = { style: 'medium', color: { rgb: '000000' } }
      const THIN     = { style: 'thin',   color: { rgb: 'A0A0A0' } }
      const NUM_COLS = 4

      const tableRows = [
        hdrRowIdx,
        ...Array.from({ length: lastDataIdx - firstDataIdx + 1 }, (_, i) => firstDataIdx + i),
        totalRowIdx,
      ]

      tableRows.forEach(row => {
        const isHeader   = row === hdrRowIdx
        const isTotalRow = row === totalRowIdx
        for (let col = 0; col < NUM_COLS; col++) {
          const addr = XLSX.utils.encode_cell({ r: row, c: col })
          if (!ws[addr]) ws[addr] = { t: 's', v: '' }
          ws[addr].s = {
            ...(ws[addr].s || {}),
            border: {
              top:    (isHeader || isTotalRow) ? MEDIUM : THIN,
              bottom: (isHeader || isTotalRow) ? MEDIUM : THIN,
              left:   col === 0              ? MEDIUM : THIN,
              right:  col === NUM_COLS - 1   ? MEDIUM : THIN,
            },
          }
        }
      })
    }

    ws['!sheetViews'] = [{ showGridLines: true }]
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

  XLSX.writeFile(wb, filename, { cellStyles: true })
}
