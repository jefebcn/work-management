/**
 * Core pharmaceutical calculation engine.
 * All functions are pure — no side effects.
 */

import { computeTypeValidation } from './formulaValidation.js'

/**
 * Compute the auto-filler ingredient's weight so that the total equals targetWeightMg.
 * @param {number} targetWeightMg
 * @param {Array<{amountMg: number}>} nonFillerIngredients
 * @returns {number} filler amountMg (minimum 0)
 */
export function computeFillerAmount(targetWeightMg, nonFillerIngredients) {
  const sumOthers = nonFillerIngredients.reduce((acc, ing) => acc + (ing.amountMg || 0), 0)
  return Math.max(0, targetWeightMg - sumOthers)
}

/**
 * Compute derived values for a single ingredient row.
 * @param {{ rowId, rawMaterialId, amountMg, isFiller }} ingredient
 * @param {{ purity, titration, maxLimitMg, nrvReference, pricePerKg }} rawMaterial
 * @param {number} targetWeightMg
 * @param {number} dosiAlGiorno  — daily servings (default 1)
 * @returns {object} enriched row with all computed fields
 */
export function computeIngredientRow(ingredient, rawMaterial, targetWeightMg, dosiAlGiorno = 1) {
  const amountMg = ingredient.amountMg || 0

  const percentOfTotal =
    targetWeightMg > 0 ? (amountMg / targetWeightMg) * 100 : 0

  // Active nutrient per dose in mg = amountMg × purity% × titration%
  // Excipients (no activeNutrient) contribute 0 — they are inert
  const realNutrientContribution = rawMaterial.activeNutrient
    ? amountMg * ((rawMaterial.purity || 100) / 100) * ((rawMaterial.titration || 100) / 100)
    : 0

  // Daily active nutrient = per-dose contribution × doses/day
  const dailyContribution = realNutrientContribution * (dosiAlGiorno || 1)

  const nrvPercent =
    rawMaterial.nrvReference > 0
      ? (dailyContribution / rawMaterial.nrvReference) * 100
      : null

  // Limit check uses daily figure (regulatory limits are per day)
  const exceedsMaxLimit =
    rawMaterial.maxLimitMg > 0
      ? dailyContribution > rawMaterial.maxLimitMg
      : false

  // Row cost contribution in EUR per formula batch
  const weightKg = amountMg / 1_000_000
  const rowCost = weightKg * (rawMaterial.pricePerKg || 0)

  return {
    rowId: ingredient.rowId,
    rawMaterialId: ingredient.rawMaterialId,
    amountMg,
    isFiller: ingredient.isFiller,
    percentOfTotal,
    realNutrientContribution,
    dailyContribution,
    nrvPercent,
    exceedsMaxLimit,
    rowCost,
  }
}

/**
 * Compute the full set of derived results for a formula.
 * This is called inside useFormula's useMemo and is the single source of truth
 * for all display values.
 *
 * @param {object} formula
 * @param {Array} rawMaterials  — full rawMaterials array from inventory
 * @param {Array} packaging     — full packaging array
 * @returns {object} computed results
 */
export function computeFormulaResults(formula, rawMaterials, packaging = []) {
  if (!formula) return null

  // Build a fast lookup map
  const rmMap = {}
  rawMaterials.forEach(rm => { rmMap[rm.id] = rm })

  const pkgMap = {}
  packaging.forEach(p => { pkgMap[p.id] = p })

  // Separate filler from non-fillers
  const nonFillerIngredients = formula.ingredients.filter(i => !i.isFiller)

  // Resolve ingredient amounts (filler gets auto-computed)
  const resolvedIngredients = formula.ingredients.map(ing => {
    if (ing.isFiller) {
      return {
        ...ing,
        amountMg: computeFillerAmount(formula.targetWeightMg, nonFillerIngredients),
      }
    }
    return ing
  })

  const dosiAlGiorno = formula.dosiAlGiorno || 1

  // Compute per-row derived data (skip rows whose rawMaterial was deleted)
  const rows = resolvedIngredients
    .map(ing => {
      const rm = rmMap[ing.rawMaterialId]
      if (!rm) return null
      return computeIngredientRow(ing, rm, formula.targetWeightMg, dosiAlGiorno)
    })
    .filter(Boolean)

  // Totals
  const totalWeightMg = rows.reduce((acc, r) => acc + r.amountMg, 0)
  const totalPercent  = rows.reduce((acc, r) => acc + r.percentOfTotal, 0)
  const totalCost     = rows.reduce((acc, r) => acc + r.rowCost, 0)

  // Normalize cost to per-kg of finished formula
  const formulaWeightKg = formula.targetWeightMg / 1_000_000
  const massCostPerKg = formulaWeightKg > 0 ? totalCost / formulaWeightKg : 0

  // Cost per single unit of formula (one batch dose)
  const batchCost = totalCost
  const selectedPkg = formula.packagingId ? pkgMap[formula.packagingId] : null
  const packagingUnitCost = selectedPkg ? selectedPkg.unitCost : 0
  const unitCost = batchCost + packagingUnitCost

  // Warnings
  const warnings = []

  if (formula.targetWeightMg > 0 && totalWeightMg > formula.targetWeightMg + 0.001) {
    warnings.push({
      type: 'OVERWEIGHT',
      message: `Total weight (${totalWeightMg.toFixed(1)} mg) exceeds target (${formula.targetWeightMg} mg)`,
    })
  }

  rows.forEach(r => {
    if (r.exceedsMaxLimit) {
      const rm = rmMap[r.rawMaterialId]
      warnings.push({
        type: 'MAX_LIMIT',
        rowId: r.rowId,
        message: `${rm.name}: apporto giornaliero ${r.dailyContribution.toFixed(2)} mg supera il limite ${rm.maxLimitMg} mg/die`,
      })
    }
  })

  // pH validation for Liquidi
  if (formula.type === 'Liquidi' && formula.pH !== null && formula.pH !== '') {
    const ph = parseFloat(formula.pH)
    if (!isNaN(ph) && (ph < 3.5 || ph > 4.5)) {
      warnings.push({
        type: 'PH_OUT_OF_RANGE',
        message: `pH ${ph} is outside the valid pharmaceutical range (3.5 – 4.5)`,
      })
    }
  }

  // Type-specific validation (capsule volume, tablet friability, liquid density)
  const typeValidation = computeTypeValidation(formula, rows, rawMaterials)

  // Promote critical type-validation warnings into the main list so they appear in WarningBanner
  if (typeValidation?.warnings) {
    typeValidation.warnings
      .filter(w => w.severity === 'danger')
      .forEach(w => warnings.push({ ...w, source: 'typeValidation' }))
  }

  return {
    rows,
    totalWeightMg,
    totalPercent,
    warnings,
    massCostPerKg,
    batchCost,
    unitCost,
    packagingUnitCost,
    selectedPkg,
    typeValidation,
  }
}
