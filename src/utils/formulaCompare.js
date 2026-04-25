import { computeFormulaResults } from './formulaCalculations.js'

/**
 * Confronta due formule e restituisce un diff strutturato.
 * @returns {{ ingredients: Array, costs: object, meta: object }}
 */
export function diffFormulas(formulaA, formulaB, rawMaterials, packaging) {
  const compA = computeFormulaResults(formulaA, rawMaterials, packaging)
  const compB = computeFormulaResults(formulaB, rawMaterials, packaging)

  return {
    ingredients: diffIngredients(formulaA, formulaB, rawMaterials),
    costs:       diffCosts(compA, compB),
    meta:        diffMeta(formulaA, formulaB),
  }
}

function diffIngredients(a, b, rawMaterials) {
  const rmMap = Object.fromEntries(rawMaterials.map(rm => [rm.id, rm]))

  const allIds = new Set([
    ...(a?.ingredients || []).map(i => i.rawMaterialId),
    ...(b?.ingredients || []).map(i => i.rawMaterialId),
  ])

  const rows = []
  for (const rmId of allIds) {
    const ingA = a?.ingredients.find(i => i.rawMaterialId === rmId)
    const ingB = b?.ingredients.find(i => i.rawMaterialId === rmId)
    const rm   = rmMap[rmId]

    let status = 'unchanged'
    if (!ingA && ingB)  status = 'added'
    else if (ingA && !ingB) status = 'removed'
    else if (Math.abs((ingA?.amountMg ?? 0) - (ingB?.amountMg ?? 0)) > 0.001) status = 'changed'

    const amountA = ingA?.amountMg ?? 0
    const amountB = ingB?.amountMg ?? 0
    const deltaMg = amountB - amountA
    const deltaPct = amountA > 0 ? (deltaMg / amountA) * 100 : null

    rows.push({
      rawMaterialId: rmId,
      name: rm?.name || '?',
      status,
      amountA,
      amountB,
      deltaMg,
      deltaPct,
    })
  }

  // Ordine: changed/added/removed prima, unchanged dopo
  const order = { added: 0, removed: 1, changed: 2, unchanged: 3 }
  rows.sort((x, y) => order[x.status] - order[y.status])
  return rows
}

function diffCosts(compA, compB) {
  const fields = [
    { key: 'batchCost',     label: 'Costo Massa (lotto)' },
    { key: 'massCostPerKg', label: 'Costo Massa €/kg' },
    { key: 'totalWeightMg', label: 'Peso Totale mg' },
    { key: 'totalPercent',  label: 'Totale %' },
  ]
  return fields.map(f => {
    const valA  = compA?.[f.key] ?? 0
    const valB  = compB?.[f.key] ?? 0
    const delta = valB - valA
    return { ...f, valA, valB, delta }
  })
}

function diffMeta(a, b) {
  const fields = [
    { key: 'name',             label: 'Nome' },
    { key: 'type',             label: 'Forma' },
    { key: 'targetWeightMg',   label: 'Peso target (mg)' },
    { key: 'targetWeightUnit', label: 'Unità peso' },
    { key: 'status',           label: 'Stato' },
    { key: 'batchSize',        label: 'Lotto (unità)' },
    { key: 'markupPercent',    label: 'Markup %' },
    { key: 'qtyPerPackMg',     label: 'Qty/conf (mg)' },
    { key: 'dosiAlGiorno',     label: 'Dosi/giorno' },
    { key: 'packagingId',      label: 'Packaging ID' },
    { key: 'versionLabel',     label: 'Versione' },
    { key: 'versionNote',      label: 'Nota versione' },
  ]
  return fields.map(f => {
    const valA = a?.[f.key]
    const valB = b?.[f.key]
    const changed = JSON.stringify(valA) !== JSON.stringify(valB)
    return { ...f, valA, valB, changed }
  })
}
