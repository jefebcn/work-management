import { computeFormulaResults } from './formulaCalculations.js'

/**
 * Calcola gli indicatori KPI per la Dashboard Home.
 * @param {Array} formulas - Array piatto di tutte le formule
 * @param {Array} rawMaterials
 * @param {Array} packaging
 */
export function computeDashboardKPIs(formulas, rawMaterials, packaging) {
  if (!formulas?.length) {
    return {
      total:       0,
      inDev:       0,
      ready:       0,
      avgDoseCost: 0,
      lastProduct: null,
    }
  }

  const total  = formulas.length
  const inDev  = formulas.filter(f => f.status === 'rd' || f.status === 'draft').length
  const ready  = formulas.filter(f => f.status === 'ready' || f.status === 'finalized').length

  // Costo medio per dose: media dei batchCost (= costo per singola dose) di formule con ingredienti
  const withCosts = formulas
    .map(f => computeFormulaResults(f, rawMaterials, packaging))
    .filter(c => c?.batchCost > 0)
  const avgDoseCost = withCosts.length > 0
    ? withCosts.reduce((s, c) => s + c.batchCost, 0) / withCosts.length
    : 0

  // Ultima formula modificata
  const lastProduct = [...formulas].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0] || null

  return { total, inDev, ready, avgDoseCost, lastProduct }
}

/**
 * Restituisce le ultime N formule modificate.
 */
export function recentActivity(formulas, limit = 5) {
  return [...formulas]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
}
