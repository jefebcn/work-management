/**
 * Backup & Restore utilities.
 * Exports all galenic-os data as a single JSON file that can be
 * imported on any device/browser to restore the full working state.
 */

import { STORAGE_KEYS } from './storageKeys.js'
import { loadFromStorage } from './localStorage.js'

export const BACKUP_VERSION = '1'

/**
 * Build a full backup object from localStorage.
 */
export function buildBackup() {
  return {
    _app:        'galenic-os',
    _version:    BACKUP_VERSION,
    _exportedAt: new Date().toISOString(),
    rawMaterials: loadFromStorage(STORAGE_KEYS.RAW_MATERIALS, []),
    packaging:    loadFromStorage(STORAGE_KEYS.PACKAGING, []),
    formulas:     loadFromStorage(STORAGE_KEYS.FORMULAS, []),
  }
}

/**
 * Trigger a .json download of the full backup.
 */
export function downloadBackup() {
  const data = buildBackup()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `galenic-os_backup_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parse and validate a backup JSON string.
 * Returns { ok: true, data } or { ok: false, error }
 */
export function parseBackup(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data._app !== 'galenic-os') {
      return { ok: false, error: 'File non valido — non è un backup di Galenic-OS.' }
    }
    if (!Array.isArray(data.rawMaterials) || !Array.isArray(data.formulas)) {
      return { ok: false, error: 'Struttura del file non riconosciuta.' }
    }
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Il file non è un JSON valido.' }
  }
}

/**
 * Merge strategy: keep existing items by ID, add new ones from backup.
 * Returns { rawMaterials, packaging, formulas, added } with added counts.
 */
export function mergeBackup(backup, current) {
  function mergeList(existing, incoming) {
    const ids = new Set(existing.map(x => x.id))
    const added = incoming.filter(x => !ids.has(x.id))
    return { merged: [...existing, ...added], added: added.length }
  }

  const rm  = mergeList(current.rawMaterials, backup.rawMaterials)
  const pkg = mergeList(current.packaging,    backup.packaging)
  const fml = mergeList(current.formulas,     backup.formulas)

  return {
    rawMaterials: rm.merged,
    packaging:    pkg.merged,
    formulas:     fml.merged,
    added: { rawMaterials: rm.added, packaging: pkg.added, formulas: fml.added },
  }
}
