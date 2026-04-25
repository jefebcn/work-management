import { suggestMacrothemeId } from './macrothemeAutoSuggest.js'
import { migrateStatus } from './statusLifecycle.js'

/**
 * Migra una formula al nuovo schema (back-compat).
 * Aggiunge: macrothemeId, productGroupId, versionLabel, versionNote.
 * Idempotente: chiamabile più volte senza effetti collaterali.
 */
export function migrateFormula(f, macrothemes) {
  const out = { ...f }

  if (!out.macrothemeId) {
    out.macrothemeId = suggestMacrothemeId(out.type, macrothemes)
  }
  if (!out.productGroupId) {
    out.productGroupId = out.parentId || out.id
  }
  if (!out.versionLabel) {
    const v = out.version || 1
    out.versionLabel = `v${v}.0`
  }
  if (out.versionNote == null) {
    out.versionNote = ''
  }

  // Migra status da binario {draft|finalized} al lifecycle a 4 stati
  out.status = migrateStatus(out.status)

  return out
}

export function migrateAllFormulas(formulas, macrothemes) {
  return formulas.map(f => migrateFormula(f, macrothemes))
}

/**
 * Genera la prossima version label.
 * Esempi: "v1.0" → "v1.1", "v1.9" → "v1.10", "v2.3" → "v2.4"
 */
export function nextVersionLabel(currentLabel) {
  if (!currentLabel) return 'v1.1'
  const match = /^v(\d+)\.(\d+)$/.exec(currentLabel)
  if (!match) return 'v1.1'
  const major = parseInt(match[1], 10)
  const minor = parseInt(match[2], 10)
  return `v${major}.${minor + 1}`
}
