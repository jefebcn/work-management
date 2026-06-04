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
  //  R2  (1) — "BATCH TARGET (g)"       | B2 ← INPUT yellow  (user writes batch size)
  //  R3  (2) — spacer
  //  R4  (3) — "PESO TARGET DOSE (mg)"  | B4 ← FORMULA =SUM(B6:B{lastDataRow})
  //  R5  (4) — Column headers: MATERIA PRIMA | mg/dose | % PESO | PESO DA PESARE (g)
  //  R6+ (5+)— Ingredient rows:
  //              A = name
  //              B = amountMg   ← INPUT yellow (user can override)
  //              C = =B6/$B$4   ← % of total dose, formatted as 0.00%
  //              D = =C6*$B$2   ← grams to weigh = % × batch
  //  blank separator
  //  Total row: A=TOTALE, B=SUM(B), C=SUM(C), D=SUM(D)
  const DATA_START = 6  // 1-based Excel row for first ingredient

  const dateStr = new Date().toLocaleDateString('it-IT')

  const bodyRows = validRows.map((row, i) => {
    const rm       = rmMap[row.rawMaterialId]
    const excelRow = DATA_START + i
    const pct      = row.amountMg / formula.targetWeightMg  // pre-calc for result cache
    return [
      rm.name,
      row.amountMg,   // INPUT: fixed mg value from formula, user can override
      { t: 'n', f: `B${excelRow}/$B$4`, v: pct },
      { t: 'n', f: `C${excelRow}*$B$2`, v: pct * 1000 },
    ]
  })

  const lastDataRow   = DATA_START + bodyRows.length - 1  // 1-based
  const totalAmountMg = validRows.reduce((s, r) => s + r.amountMg, 0)
  const totalPct      = formula.targetWeightMg > 0 ? totalAmountMg / formula.targetWeightMg : 0

  const data = [
    // R1 — title (idx 0)
    [`FOGLIO DI PESATA — ${formula.name}`, '', '', ''],
    // R2 — batch INPUT (idx 1) → cell B2: user writes how many grams to prepare
    ['BATCH TARGET (g)', 1000, '', ''],
    // R3 — spacer (idx 2)
    ['', '', '', ''],
    // R4 — dose formula (idx 3) → cell B4: auto-sums col B
    ['PESO TARGET DOSE (mg)',
      { t: 'n', f: `SUM(B${DATA_START}:B${lastDataRow})`, v: formula.targetWeightMg },
      '', ''],
    // R5 — column headers (idx 4)
    ['MATERIA PRIMA', 'mg/dose', '% PESO', 'PESO DA PESARE (g)'],
    // R6+ — ingredient rows (idx 5+)
    ...bodyRows,
    // blank separator (idx 5 + bodyRows.length)
    ['', '', '', ''],
    // total row (idx 6 + bodyRows.length)
    [
      'TOTALE',
      { t: 'n', f: `SUM(B${DATA_START}:B${lastDataRow})`, v: totalAmountMg },
      { t: 'n', f: `SUM(C${DATA_START}:C${lastDataRow})`, v: totalPct },
      { t: 'n', f: `SUM(D${DATA_START}:D${lastDataRow})`, v: totalPct * 1000 },
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

  const hdrRowIdx    = 4                    // 0-based (R5)
  const firstDataIdx = 5                    // 0-based (R6)
  const lastDataIdx  = 4 + bodyRows.length  // 0-based (inclusive)
  const totalRowIdx  = 6 + bodyRows.length  // 0-based (after blank separator)

  const notesLabelR = data.length - 5
  const notesLine1R = data.length - 2
  const notesLine2R = data.length - 1

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },  // R1: title
    { s: { r: notesLabelR, c: 0 }, e: { r: notesLabelR, c: 3 } },
    { s: { r: notesLine1R, c: 0 }, e: { r: notesLine1R, c: 3 } },
    { s: { r: notesLine2R, c: 0 }, e: { r: notesLine2R, c: 3 } },
  ]

  const rowHeights = {}
  rowHeights[0] = 28  // title
  rowHeights[1] = 22  // B2 batch input
  rowHeights[3] = 22  // B4 dose formula
  rowHeights[4] = 20  // column headers
  for (let i = 0; i < bodyRows.length; i++) rowHeights[5 + i] = 18
  rowHeights[totalRowIdx] = 18

  // Yellow INPUT cells: B2 (r=1,c=1) + col B of every ingredient row
  const inputCells = [
    { r: 1, c: 1 },
    ...Array.from({ length: bodyRows.length }, (_, i) => ({ r: 5 + i, c: 1 })),
  ]

  // Percentage format cells: col C of every ingredient row + total C
  const pctCells = [
    ...Array.from({ length: bodyRows.length }, (_, i) => ({ r: 5 + i, c: 2 })),
    { r: totalRowIdx, c: 2 },
  ]

  return {
    data,
    cols: [34, 14, 12, 22],
    merges,
    rowHeights,
    hdrRowIdx,
    firstDataIdx,
    lastDataIdx,
    totalRowIdx,
    inputCells,
    pctCells,
  }
}


/**
 * Generate and trigger download of formula as .xlsx
 * exceljs is loaded dynamically to keep the initial bundle lean.
 * exceljs is used instead of xlsx because it supports cell styles (borders,
 * fills, number formats) in browser-generated workbooks — xlsx community
 * edition silently discards all s.border / s.fill properties on write.
 *
 * @param {object} formula       active formula object
 * @param {object} computed      computed results from useFormula
 * @param {Array}  rawMaterials  full inventory array
 * @param {Array}  packaging     full packaging array (unused directly, via computed.selectedPkg)
 * @param {'full'|'public'} mode
 */
export async function exportFormulaToExcel(formula, computed, rawMaterials, packaging, mode = 'full') {
  const mod     = await import('exceljs')
  const ExcelJS = mod.default || mod

  const rmMap = {}
  rawMaterials.forEach(rm => { rmMap[rm.id] = rm })

  const wb = new ExcelJS.Workbook()

  // Convert SheetJS-format formula cells to exceljs value objects
  function toEjsValue(cell) {
    if (cell === null || cell === undefined) return ''
    if (typeof cell === 'object' && 'f' in cell) return { formula: cell.f, result: cell.v ?? 0 }
    return cell
  }

  // Simple sheet: populate from AOA + set column widths, no extra styling
  function makeSheet(sheetName, { data, cols }) {
    const ws = wb.addWorksheet(sheetName)
    data.forEach(row => ws.addRow(row.map(toEjsValue)))
    cols.forEach((w, i) => { ws.getColumn(i + 1).width = w })
    return ws
  }

  // Lab sheet: full styling — borders, fills, number formats, merges, row heights
  function makeLabSheet(sheetName, { data, cols, merges, rowHeights, hdrRowIdx, firstDataIdx, lastDataIdx, totalRowIdx, inputCells, pctCells }) {
    const ws = wb.addWorksheet(sheetName, {
      views:     [{ showGridLines: true }],
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    })
    ws.pageMargins = { top: 0.98, bottom: 0.98, left: 0.75, right: 0.75, header: 0.3, footer: 0.3 }

    // Populate rows (convert SheetJS-format formula objects to exceljs {formula, result})
    data.forEach(row => ws.addRow(row.map(toEjsValue)))

    // Column widths
    cols.forEach((w, i) => { ws.getColumn(i + 1).width = w })

    // Merges: 0-based {r,c} → exceljs 1-based (row, col)
    if (merges) {
      merges.forEach(({ s, e }) => {
        try { ws.mergeCells(s.r + 1, s.c + 1, e.r + 1, e.c + 1) } catch (_) { /* overlapping merge */ }
      })
    }

    // Row heights
    if (rowHeights) {
      Object.entries(rowHeights).forEach(([r, hpt]) => {
        ws.getRow(Number(r) + 1).height = hpt
      })
    }

    // Yellow fill for editable INPUT cells (B2 batch target + col B ingredient rows)
    const YELLOW = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }
    if (inputCells) {
      inputCells.forEach(({ r, c }) => {
        ws.getCell(r + 1, c + 1).fill = YELLOW
      })
    }

    // Percentage format for specified cells (col C ingredient rows + total C)
    if (pctCells) {
      pctCells.forEach(({ r, c }) => {
        ws.getCell(r + 1, c + 1).numFmt = '0.00%'
      })
    }

    // Per-cell borders — every cell in the table (header → total, all columns) gets
    // ALL FOUR sides set explicitly. Excel suppresses default gridlines on any cell
    // that has a background fill; only explicitly-declared borders remain visible.
    if (hdrRowIdx != null && totalRowIdx != null) {
      const MEDIUM   = { style: 'medium', color: { argb: 'FF000000' } }
      const THIN     = { style: 'thin',   color: { argb: 'FFA0A0A0' } }
      const NUM_COLS = cols.length  // 4: name | mg/dose | % | g

      const tableRows = [
        hdrRowIdx,
        ...Array.from({ length: lastDataIdx - firstDataIdx + 1 }, (_, i) => firstDataIdx + i),
        totalRowIdx,
      ]

      tableRows.forEach(row => {
        const isHeader   = row === hdrRowIdx
        const isTotalRow = row === totalRowIdx

        // MEDIUM on the header and total rows (top+bottom); thin everywhere else
        const hMedium = isHeader || isTotalRow

        for (let col = 0; col < NUM_COLS; col++) {
          ws.getCell(row + 1, col + 1).border = {
            top:    hMedium            ? MEDIUM : THIN,
            bottom: hMedium            ? MEDIUM : THIN,
            left:   col === 0          ? MEDIUM : THIN,
            right:  col === NUM_COLS-1 ? MEDIUM : THIN,
          }
        }
      })
    }

    return ws
  }

  // Build all sheets
  makeSheet('Prodotto', dataProdotto(formula, mode))

  if (mode === 'full') {
    makeSheet('Ingredienti',         dataIngredientiCompleto(computed.rows, rmMap))
    makeSheet('Profilo Nutrizionale', dataProfiloNutrizionale(computed.rows, rmMap))
    makeSheet('Analisi Costi',       dataCosti(computed.rows, rmMap, computed, formula))
    makeLabSheet('Foglio di Pesata LAB', dataFogliodiPesata(computed.rows, rmMap, formula))
  } else {
    makeSheet('Composizione', dataComposizioneAnonima(computed.rows, rmMap))
    const nutResult = dataNutrizionalePublico(computed.rows, rmMap)
    if (nutResult) makeSheet('Apporto Nutrizionale', nutResult)
  }

  const dateStr  = new Date().toISOString().slice(0, 10)
  const suffix   = mode === 'full' ? 'RISERVATO' : 'pubblica'
  const filename = `${slugify(formula.name)}_${suffix}_${dateStr}.xlsx`

  // Generate buffer and trigger browser download
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
