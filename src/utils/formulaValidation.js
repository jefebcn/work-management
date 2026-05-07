/**
 * Per-formula-type validation and derived metrics.
 * Pure functions — no side effects.
 */
import { isLubricantName } from './ingredientNorm.js'

// Standard pharmaceutical hard capsule fill volumes (mL)
export const CAPSULE_SIZES = [
  { size: '000', volumeMl: 1.37 },
  { size: '00',  volumeMl: 0.91 },
  { size: '0',   volumeMl: 0.68 },
  { size: '1',   volumeMl: 0.50 },
  { size: '2',   volumeMl: 0.37 },
  { size: '3',   volumeMl: 0.30 },
]

// Default apparent bulk density for pharmaceutical powders (g/mL)
export const DEFAULT_POWDER_DENSITY = 0.6

function buildRmMap(rawMaterials) {
  const m = {}
  rawMaterials.forEach(rm => { m[rm.id] = rm })
  return m
}

// ── Capsule ───────────────────────────────────────────────────────────────────

export function validateCapsule(rows, rawMaterials) {
  const rmMap = buildRmMap(rawMaterials)

  const totalVolumeMl = rows.reduce((acc, row) => {
    const rm = rmMap[row.rawMaterialId]
    const density = rm?.densityGml || DEFAULT_POWDER_DENSITY
    return acc + (row.amountMg / 1000) / density
  }, 0)

  const fittingSize = CAPSULE_SIZES.find(s => totalVolumeMl <= s.volumeMl) || null

  const warnings = []
  if (rows.length > 0 && !fittingSize) {
    warnings.push({
      type: 'CAPSULE_TOO_LARGE',
      severity: 'danger',
      message: `Volume totale polveri ${totalVolumeMl.toFixed(2)} mL supera anche la capsula 000 (max 1.37 mL) — considera di suddividere in più unità posologiche`,
    })
  } else if (fittingSize) {
    const fillPct = (totalVolumeMl / fittingSize.volumeMl) * 100
    if (fillPct > 90) {
      warnings.push({
        type: 'CAPSULE_NEARLY_FULL',
        severity: 'caution',
        message: `Capsula ${fittingSize.size} riempita al ${fillPct.toFixed(1)}% — margine ridotto, verificare con densità misurata`,
      })
    }
  }

  return { totalVolumeMl, fittingSize, warnings }
}

// ── Compressa ─────────────────────────────────────────────────────────────────

export function validateCompressa(rows, rawMaterials) {
  const rmMap = buildRmMap(rawMaterials)
  let activeMg = 0, excipientMg = 0, lubricantMg = 0, totalMg = 0

  rows.forEach(row => {
    const rm = rmMap[row.rawMaterialId]
    if (!rm) return
    totalMg += row.amountMg

    const isLub = rm.category === 'lubrificante' || isLubricantName(rm.name)
    if (isLub) {
      excipientMg += row.amountMg
      lubricantMg += row.amountMg
    } else if (rm.activeNutrient) {
      activeMg += row.amountMg
    } else {
      excipientMg += row.amountMg
    }
  })

  const activePct    = totalMg > 0 ? (activeMg    / totalMg) * 100 : 0
  const excipientPct = totalMg > 0 ? (excipientMg / totalMg) * 100 : 0
  const lubricantPct = totalMg > 0 ? (lubricantMg / totalMg) * 100 : 0
  const binderPct    = excipientPct - lubricantPct

  const warnings = []

  if (totalMg > 0) {
    if (activePct > 70) {
      warnings.push({ type: 'FRIABILITY_HIGH', severity: 'danger',
        message: `Attivi al ${activePct.toFixed(1)}% — rischio friabilità elevato (soglia critica >70%)` })
    } else if (activePct > 50) {
      warnings.push({ type: 'FRIABILITY_MODERATE', severity: 'caution',
        message: `Attivi al ${activePct.toFixed(1)}% — monitorare la durezza durante la compressione` })
    }
    if (lubricantPct === 0) {
      warnings.push({ type: 'NO_LUBRICANT', severity: 'caution',
        message: 'Nessun lubrificante rilevato — aggiungere Mg stearato allo 0.5–1% per evitare aderenza ai punzoni' })
    } else if (lubricantPct > 1.5) {
      warnings.push({ type: 'EXCESS_LUBRICANT', severity: 'caution',
        message: `Attenzione: concentrazione di lubrificante elevata (${lubricantPct.toFixed(2)}%). Possibile impatto sulla durezza o sul tempo di disgregazione.` })
    }
    if (excipientPct < 10) {
      warnings.push({ type: 'LOW_BINDER', severity: 'danger',
        message: `Eccipienti al ${excipientPct.toFixed(1)}% — insufficienti per compressione diretta (min. consigliato ~15%)` })
    }
  }

  return { activePct, excipientPct, lubricantPct, binderPct, friabilityRisk: activePct > 70, warnings }
}

// ── Liquido ───────────────────────────────────────────────────────────────────

export function validateLiquido(formula, rows, rawMaterials) {
  const rmMap = buildRmMap(rawMaterials)

  // Aqueous base assumption: volume (mL) ≈ targetWeightMg / 1000 (g/mL ≈ 1.0)
  const volumeMl = formula.targetWeightMg / 1000

  const concentrations = rows
    .map(row => {
      const rm = rmMap[row.rawMaterialId]
      if (!rm) return null
      return {
        rowId:             row.rowId,
        name:              rm.name,
        amountMg:          row.amountMg,
        concentrationMgMl: volumeMl > 0 ? row.amountMg / volumeMl : 0,
      }
    })
    .filter(Boolean)

  // Density estimate: total mass / total volume
  const totalMassG    = formula.targetWeightMg / 1000
  const estimatedDensity = volumeMl > 0 ? totalMassG / volumeMl : 1.0

  const warnings = []
  if (estimatedDensity > 1.3) {
    warnings.push({ type: 'HIGH_DENSITY', severity: 'caution',
      message: `Densità stimata ${estimatedDensity.toFixed(3)} g/mL — soluzione molto concentrata, verificare la solubilità` })
  }

  return { volumeMl, concentrations, estimatedDensity, warnings }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function computeTypeValidation(formula, rows, rawMaterials) {
  if (!formula || !rows || rows.length === 0) return null
  switch (formula.type) {
    case 'Capsule':
      return { type: 'Capsule',   ...validateCapsule(rows, rawMaterials) }
    case 'Compresse':
      return { type: 'Compresse', ...validateCompressa(rows, rawMaterials) }
    case 'Liquidi':
      return { type: 'Liquidi',   ...validateLiquido(formula, rows, rawMaterials) }
    default:
      return null
  }
}
