// ── Templates & defaults ──────────────────────────────────────────────────

// Syrup template presets (binder:thickener at 4:1 default)
export const SYRUP_TEMPLATES = {
  maltitolo_gomma: {
    name: 'Maltitolo + Gomma Arabica',
    ingredients: [
      { name: 'Maltitolo',     role: 'legante',     pctInDryFormula: 80, dryResiduePercent: 100, isActive: false },
      { name: 'Gomma Arabica', role: 'addensante',  pctInDryFormula: 20, dryResiduePercent: 100, isActive: false },
    ],
  },
  glucosio_pectina: {
    name: 'Glucosio + Pectina',
    ingredients: [
      { name: 'Glucosio', role: 'legante',    pctInDryFormula: 80, dryResiduePercent: 100, isActive: false },
      { name: 'Pectina',  role: 'addensante', pctInDryFormula: 20, dryResiduePercent: 100, isActive: false },
    ],
  },
  custom: {
    name: 'Personalizzato',
    ingredients: [],
  },
}

export const LAYER_ROLES = ['legante', 'addensante', 'colorante', 'aromatizzante', 'altro']

export const DEFAULT_SOFT_COATING = {
  enabled: false,
  shape: 'Sfera',
  consistency: 'Dura',
  porosityFactor: 0,
  batchPieces: 50000,
  saturationAlert: 30,
  layers: [],
}

// ── Geometry ──────────────────────────────────────────────────────────────

const DENSITY = { Dura: 1.3, Morbida: 1.1 }   // mg/mm³ ≈ g/cm³

export function estimateSurfaceAreaMm2(shape, weightMg, consistency) {
  const density = DENSITY[consistency] || 1.2
  const vol     = weightMg / density
  switch (shape) {
    case 'Cilindro': {
      const r = Math.cbrt(vol / (2 * Math.PI))
      return 6 * Math.PI * r * r
    }
    case 'Oblunga': {
      const r = Math.cbrt((3 * vol) / (4 * Math.PI))
      return 4 * Math.PI * r * r * 1.2
    }
    default: {
      const r = Math.cbrt((3 * vol) / (4 * Math.PI))
      return 4 * Math.PI * r * r
    }
  }
}

// ── Active-ingredient detection ───────────────────────────────────────────
// An ingredient is "active" when its raw material has an activeNutrient field
// set to anything other than null/undefined/empty/'Eccipiente'.
export function isIngredientActive(rawMaterial) {
  const an = rawMaterial?.activeNutrient
  return !!an && an !== 'Eccipiente'
}

// ── Mass-balance calculation ──────────────────────────────────────────────
// Final piece weight = Core + Σ(Syrup dry residue) + Σ(Assigned powder dry weight)
//
// Process loss (overdosage) is applied SELECTIVELY:
//   - Only to ingredients assigned to a *coating* layer (layer.type === 'coating')
//     AND flagged as Active (rawMaterial.activeNutrient set)
//   - Used in batch-quantity calculations (appliedMg) — does NOT inflate the
//     dry weight that stays on the finished piece (amountMg).
export function computeCoatingResults(softCoating, formula, rawMaterials = []) {
  if (!softCoating?.enabled) return null

  const coreWeightMg   = formula?.targetWeightMg || 500
  const batchPieces    = softCoating.batchPieces  || 50000
  const satThreshold   = softCoating.saturationAlert || 30
  const allIngredients = formula?.ingredients || []

  const surfaceAreaMm2 = estimateSurfaceAreaMm2(
    softCoating.shape       || 'Sfera',
    coreWeightMg,
    softCoating.consistency || 'Dura',
  )

  let accMg = coreWeightMg

  const layerResults = (softCoating.layers || []).map(layer => {
    // ── Target weight gain on accumulated weight up to this layer ─────────
    const targetDryWeightMg = accMg * ((layer.targetWeightGainPct || 0) / 100)

    // ── Syrup excipients (back-compat with existing panel UI) ─────────────
    const ingredientResults = (layer.ingredients || []).map(ing => {
      const nominalDryMg   = targetDryWeightMg * ((ing.pctInDryFormula || 0) / 100)
      const overdosage     = ing.isActive ? (1 + (layer.processLossOverdosagePct || 0) / 100) : 1
      const effectiveDryMg = nominalDryMg * overdosage
      const dryPct         = ing.dryResiduePercent ?? 100
      const wetAmountMg    = dryPct > 0 ? effectiveDryMg / (dryPct / 100) : 0
      return { ...ing, nominalDryMg, effectiveDryMg, wetAmountMg }
    })
    const syrupDryMg = ingredientResults.reduce((s, i) => s + i.effectiveDryMg, 0)

    // ── Powders assigned from Composizione → this layer ───────────────────
    // Selective overdosage: only on coating layers AND only on Active ingredients
    const isCoatingType = (layer.type || 'coating') === 'coating'
    const assigned = allIngredients.filter(i => i.coatingLayerId === layer.id)

    const assignedResults = assigned.map(ing => {
      const rm         = rawMaterials.find(r => r.id === ing.rawMaterialId) || null
      const active     = isIngredientActive(rm)
      const eligible   = isCoatingType && active                       // overdosage gate
      const overdosage = eligible ? (1 + (layer.processLossOverdosagePct || 0) / 100) : 1
      const amountMg   = parseFloat(ing.amountMg) || 0
      return {
        rowId:     ing.rowId,
        rawMaterialId: ing.rawMaterialId,
        name:      rm?.name || '—',
        amountMg,                               // dry weight that stays on the piece
        appliedMg: amountMg * overdosage,       // quantity actually used in batch (with loss)
        isActive:  active,
        overdosage,
      }
    })

    const assignedDryMg     = assignedResults.reduce((s, i) => s + i.amountMg,  0)
    const assignedAppliedMg = assignedResults.reduce((s, i) => s + i.appliedMg, 0)

    // Layer totals — mass balance: dry powder + dry syrup residue
    const totalLayerDryMg = assignedDryMg + syrupDryMg
    accMg += totalLayerDryMg

    return {
      ...layer,
      // Back-compat fields used by existing UI
      targetDryWeightMg,
      ingredientResults,
      // Mass-balance additions
      assignedResults,
      assignedDryMg,
      assignedAppliedMg,
      syrupDryMg,
      totalLayerDryMg,
      accumulatedWeightMg: accMg,
    }
  })

  const totalCoatingDryMg  = layerResults.reduce((s, l) => s + l.totalLayerDryMg, 0)
  const finalWeightMg      = coreWeightMg + totalCoatingDryMg
  const totalWeightGainPct = coreWeightMg > 0 ? (totalCoatingDryMg / coreWeightMg) * 100 : 0
  const saturationExceeded = totalWeightGainPct > satThreshold

  // Soft-core porosity: a fraction of the liquid phase is absorbed and never
  // builds up on the surface (corrects external volume but not internal mass)
  const porosityFactor = (softCoating.consistency === 'Morbida')
    ? (softCoating.porosityFactor || 0) / 100
    : 0
  const absorbedMg = porosityFactor > 0
    ? layerResults.reduce((s, l) =>
        s + l.ingredientResults.reduce((ss, i) =>
          ss + (i.wetAmountMg - i.effectiveDryMg) * porosityFactor, 0), 0)
    : 0

  // Batch totals: piece weight × batch count (in kg).
  // For the *applied* mass (consumption with loss) we use appliedMg of assigned actives.
  const batchPieceWeightMg  = finalWeightMg
  const batchAppliedDryMg   = layerResults.reduce(
    (s, l) => s + l.assignedAppliedMg + l.syrupDryMg, 0,
  )
  const batchKg             = (batchPieceWeightMg * batchPieces) / 1e6
  const batchAppliedKg      = ((coreWeightMg + batchAppliedDryMg) * batchPieces) / 1e6

  return {
    coreWeightMg,
    surfaceAreaMm2,
    layerResults,
    totalCoatingDryMg,
    finalWeightMg,
    totalWeightGainPct,
    saturationExceeded,
    satThreshold,
    absorbedMg,
    batchKg,             // kg actually deposited on finished pieces
    batchAppliedKg,      // kg consumed during process (with selective overdosage)
  }
}
