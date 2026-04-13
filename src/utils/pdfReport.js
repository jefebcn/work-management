/**
 * PDF / Print report generator.
 * Uses the browser's native print dialog (Save as PDF) — no external lib needed.
 *
 * ── JSON Schema Reference ─────────────────────────────────────────────────────
 *
 * Formula (extended):
 * {
 *   id, name, type, targetWeightMg, targetWeightUnit,
 *   dosiAlGiorno, packagingId, pH, brix, status,
 *   batchSize:     1000,    // number of production units
 *   markupPercent: 30,      // desired margin for pricing engine
 *   version:       1,       // snapshot version (1 = original)
 *   parentId:      null,    // links to original formula when version > 1
 *   ingredients: [
 *     {
 *       rowId, rawMaterialId,
 *       amountMg,
 *       isFiller:          false,  // auto-fills to target weight
 *       antiCakingPercent: 0,      // if > 0: amountMg = targetWeightMg × pct / 100
 *     }
 *   ],
 *   createdAt, updatedAt
 * }
 *
 * RawMaterial (extended):
 * {
 *   id, name, supplier, pricePerKg,
 *   purity, titration, activeNutrient,
 *   maxLimitMg, nrvReference,
 *   densityGml: 0.6,   // apparent bulk density — for capsule volume calc
 *   category:   'vitamina' | 'minerale' | 'botanical' | 'eccipiente',
 *   createdAt, updatedAt
 * }
 */

function esc(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function generateLabReport(formula, computed, rawMaterials) {
  if (!formula || !computed) return ''

  // Sort by weight descending — EU Reg. 1169/2011 labelling order
  const rmMap = {}
  rawMaterials.forEach(rm => { rmMap[rm.id] = rm })

  const sortedRows = [...computed.rows].sort((a, b) => b.amountMg - a.amountMg)
  const batchSize   = formula.batchSize || 1000
  const markupPct   = formula.markupPercent || 0
  const finalCost   = computed.batchCost + (computed.packagingUnitCost || 0)
  const sellingPrice = markupPct > 0 ? finalCost * (1 + markupPct / 100) : null
  const version     = formula.version || 1

  const ingredientRows = sortedRows.map((r, i) => {
    const rm = rmMap[r.rawMaterialId]
    if (!rm) return ''
    const totalG  = (r.amountMg * batchSize) / 1000
    const totalKg = totalG / 1000
    const flagged = r.exceedsMaxLimit ? ' style="background:#fef2f2"' : ''
    return `
      <tr${flagged}>
        <td>${i + 1}</td>
        <td><strong>${esc(rm.name)}</strong></td>
        <td class="muted">${esc(rm.supplier || '—')}</td>
        <td class="num">${r.amountMg.toFixed(3)}</td>
        <td class="num">${r.percentOfTotal.toFixed(2)}%</td>
        <td class="muted">${esc(rm.activeNutrient || '—')}</td>
        <td class="num">${rm.activeNutrient ? r.realNutrientContribution.toFixed(4) + ' mg' : '—'}</td>
      </tr>`
  }).join('')

  const batchRows = sortedRows.map(r => {
    const rm = rmMap[r.rawMaterialId]
    if (!rm) return ''
    const totalG  = (r.amountMg * batchSize) / 1000
    const totalKg = totalG / 1000
    return `
      <tr>
        <td>${esc(rm.name)}</td>
        <td class="num">${(r.amountMg / 1000).toFixed(6)} g</td>
        <td class="num">${totalG.toFixed(3)} g</td>
        <td class="num"><strong>${totalKg.toFixed(6)} kg</strong></td>
        <td class="check">□</td>
      </tr>`
  }).join('')

  const warningBlocks = computed.warnings
    .filter(w => !w.source)   // skip type-validation warnings already shown in analysis
    .map(w => `<div class="warning">⚠ ${esc(w.message)}</div>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Foglio di Lavorazione — ${esc(formula.name)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    max-width: 210mm;
    margin: 0 auto;
    padding: 15mm 15mm 20mm;
    line-height: 1.4;
  }
  h1  { font-size: 17px; margin: 0 0 4px; color: #0f172a; }
  h2  { font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
        color: #374151; border-bottom: 1px solid #e2e8f0;
        padding-bottom: 4px; margin: 20px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th, td { border: 1px solid #e2e8f0; padding: 5px 8px; vertical-align: middle; }
  th  { background: #f8fafc; font-size: 10px; text-transform: uppercase;
        letter-spacing: .04em; color: #475569; }
  .num   { text-align: right; font-variant-numeric: tabular-nums; }
  .check { text-align: center; font-size: 14px; }
  .muted { color: #6b7280; }
  tfoot td { background: #f1f5f9; font-weight: bold; }
  .warning {
    background: #fef2f2; color: #b91c1c;
    border-left: 3px solid #ef4444;
    padding: 6px 10px; margin: 4px 0; border-radius: 3px;
  }
  .meta-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .meta-tag { font-size: 9px; text-transform: uppercase; letter-spacing: .12em;
              color: #94a3b8; margin-bottom: 4px; }
  .pill { display: inline-block; font-size: 9px; background: #e0f2fe;
          color: #0369a1; border-radius: 3px; padding: 1px 6px; margin-right: 4px; }
  .eco-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 6px; }
  .eco-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 10px; }
  .eco-card .val { font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 2px; }
  .eco-card .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; }
  .ok { color: #059669; }
  footer { margin-top: 30px; border-top: 1px solid #e2e8f0;
           padding-top: 8px; font-size: 9px; color: #94a3b8; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
    h2 { break-before: avoid; }
    table { break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="meta-row">
  <div>
    <div class="meta-tag">Foglio di Lavorazione Galenista</div>
    <h1>${esc(formula.name)}</h1>
    <div style="margin-top:4px">
      <span class="pill">${esc(formula.type)}</span>
      <span class="pill">v${version}</span>
      ${formula.status === 'finalized' ? '<span class="pill" style="background:#d1fae5;color:#065f46">Finalizzata</span>' : ''}
    </div>
  </div>
  <div style="text-align:right; color:#6b7280">
    <div>Generato: <strong>${fmtDate(new Date().toISOString())}</strong></div>
    <div>Peso dose: <strong>${formula.targetWeightMg} mg</strong></div>
    <div>Dosi/die: <strong>${formula.dosiAlGiorno || 1}</strong></div>
    <div>Lotto: <strong>${batchSize.toLocaleString('it-IT')} unità</strong></div>
  </div>
</div>

<h2>Lista Ingredienti — ordine decrescente peso (Reg. UE 1169/2011)</h2>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Materia Prima</th>
      <th>Fornitore</th>
      <th class="num">mg/dose</th>
      <th class="num">% peso</th>
      <th>Nutriente Attivo</th>
      <th class="num">Apporto/dose</th>
    </tr>
  </thead>
  <tbody>${ingredientRows}</tbody>
  <tfoot>
    <tr>
      <td colspan="3">TOTALE</td>
      <td class="num">${computed.totalWeightMg.toFixed(3)}</td>
      <td class="num">${computed.totalPercent.toFixed(2)}%</td>
      <td colspan="2"></td>
    </tr>
  </tfoot>
</table>

${warningBlocks ? `<h2>Avvertenze Regolamentari</h2>${warningBlocks}` : ''}

<h2>Dati Economici</h2>
<div class="eco-grid">
  <div class="eco-card">
    <div class="lbl">COGS / dose</div>
    <div class="val">€ ${computed.batchCost.toFixed(6)}</div>
  </div>
  <div class="eco-card">
    <div class="lbl">Costo Massa / kg</div>
    <div class="val">€ ${computed.massCostPerKg.toFixed(4)}</div>
  </div>
  <div class="eco-card">
    <div class="lbl">Costo Lotto (${batchSize.toLocaleString('it-IT')} u.)</div>
    <div class="val">€ ${(computed.batchCost * batchSize).toFixed(3)}</div>
  </div>
  ${sellingPrice ? `
  <div class="eco-card">
    <div class="lbl">Markup (${markupPct.toFixed(1)}%)</div>
    <div class="val ok">€ ${sellingPrice.toFixed(4)}</div>
  </div>
  <div class="eco-card">
    <div class="lbl">Margine Lordo (ROS)</div>
    <div class="val ok">${(((sellingPrice - finalCost) / sellingPrice) * 100).toFixed(1)}%</div>
  </div>` : ''}
</div>

<h2>Piano di Pesata — Lotto ${batchSize.toLocaleString('it-IT')} unità</h2>
<table>
  <thead>
    <tr>
      <th>Materia Prima</th>
      <th class="num">g/dose</th>
      <th class="num">g totali lotto</th>
      <th class="num">kg totali lotto</th>
      <th class="check">✓ Pesato</th>
    </tr>
  </thead>
  <tbody>${batchRows}</tbody>
  <tfoot>
    <tr>
      <td>TOTALE LOTTO</td>
      <td class="num">${(computed.totalWeightMg / 1000).toFixed(6)} g</td>
      <td class="num">${(computed.totalWeightMg * batchSize / 1000).toFixed(3)} g</td>
      <td class="num">${(computed.totalWeightMg * batchSize / 1_000_000).toFixed(6)} kg</td>
      <td></td>
    </tr>
  </tfoot>
</table>

<footer>
  Generato da Galenic-OS &nbsp;·&nbsp; ${new Date().toISOString()} &nbsp;·&nbsp;
  Documento riservato — uso interno laboratorio &nbsp;·&nbsp; Non divulgare
</footer>

</body>
</html>`
}

export function openLabReportWindow(formula, computed, rawMaterials) {
  const html = generateLabReport(formula, computed, rawMaterials)
  const win  = window.open('', '_blank', 'width=960,height=720,scrollbars=yes')
  if (!win) { alert('Consenti i popup per stampare il report.'); return }
  win.document.write(html)
  win.document.close()
  // Slight delay so the browser paints before opening print dialog
  setTimeout(() => win.print(), 600)
}
