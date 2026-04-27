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

// Approximate density in mg/mm³ (≈ g/cm³ numerically)
const DENSITY = { Dura: 1.3, Morbida: 1.1 }

export function estimateSurfaceAreaMm2(shape, coreWeightMg, consistency) {
  const density  = DENSITY[consistency] || 1.2
  const vol      = coreWeightMg / density        // mm³

  switch (shape) {
    case 'Cilindro': {
      // squat cylinder h=2r → V=2πr³
      const r = Math.cbrt(vol / (2 * Math.PI))
      return 6 * Math.PI * r * r               // 2πr(r+h) = 6πr²
    }
    case 'Oblunga': {
      // prolate spheroid a=2b: SA ≈ sphere×1.2
      const r = Math.cbrt((3 * vol) / (4 * Math.PI))
      return 4 * Math.PI * r * r * 1.2
    }
    default: {                                  // Sfera
      const r = Math.cbrt((3 * vol) / (4 * Math.PI))
      return 4 * Math.PI * r * r
    }
  }
}

export function computeCoatingResults(softCoating, formula) {
  if (!softCoating?.enabled) return null

  const coreWeightMg  = formula?.targetWeightMg || 500
  const batchPieces   = softCoating.batchPieces  || 50000
  const satThreshold  = softCoating.saturationAlert || 30

  const surfaceAreaMm2 = estimateSurfaceAreaMm2(
    softCoating.shape       || 'Sfera',
    coreWeightMg,
    softCoating.consistency || 'Dura',
  )

  let accMg = coreWeightMg

  const layerResults = (softCoating.layers || []).map(layer => {
    // Weight gain is calculated on the accumulated weight up to this layer
    const targetDryWeightMg = accMg * ((layer.targetWeightGainPct || 0) / 100)

    const ingredientResults = (layer.ingredients || []).map(ing => {
      const nominalDryMg    = targetDryWeightMg * ((ing.pctInDryFormula || 0) / 100)
      const overdosage      = ing.isActive ? (1 + (layer.processLossOverdosagePct || 0) / 100) : 1
      const effectiveDryMg  = nominalDryMg * overdosage
      const dryPct          = (ing.dryResiduePercent ?? 100)
      const wetAmountMg     = dryPct > 0 ? effectiveDryMg / (dryPct / 100) : 0
      return { ...ing, nominalDryMg, effectiveDryMg, wetAmountMg }
    })

    accMg += targetDryWeightMg

    return { ...layer, targetDryWeightMg, ingredientResults, accumulatedWeightMg: accMg }
  })

  const totalCoatingDryMg  = layerResults.reduce((s, l) => s + l.targetDryWeightMg, 0)
  const finalWeightMg      = coreWeightMg + totalCoatingDryMg
  const totalWeightGainPct = coreWeightMg > 0 ? (totalCoatingDryMg / coreWeightMg) * 100 : 0
  const saturationExceeded = totalWeightGainPct > satThreshold

  // Morbida cores absorb part of the liquid phase (porosity reduces surface build-up)
  const porosityFactor = (softCoating.consistency === 'Morbida')
    ? (softCoating.porosityFactor || 0) / 100
    : 0
  const absorbedMg = porosityFactor > 0
    ? layerResults.reduce((s, l) =>
        s + l.ingredientResults.reduce((ss, i) =>
          ss + (i.wetAmountMg - i.effectiveDryMg) * porosityFactor, 0), 0)
    : 0

  const batchKg = (finalWeightMg * batchPieces) / 1e6

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
    batchKg,
  }
}
