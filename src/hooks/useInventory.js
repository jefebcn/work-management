import { useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { seedInventory } from '../data/seedInventory.js'
import { loadUserData, upsertItem, deleteItem, bulkUpsert } from '../lib/cloudSync.js'

export function useInventory(userId = null) {
  const [rawMaterials, setRawMaterials] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.RAW_MATERIALS)
    return stored.length > 0 ? stored : seedInventory
  })

  // ── localStorage sync (always, for offline/instant access) ────────────────
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RAW_MATERIALS, rawMaterials)
  }, [rawMaterials])

  // ── Cloud sync: load on login ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    let active = true
    async function loadCloud() {
      const items = await loadUserData('raw_materials', userId)
      if (!active) return
      if (items.length > 0) {
        setRawMaterials(items)
      } else {
        // First-ever login: upload current seed/localStorage data to cloud
        const current = loadFromStorage(STORAGE_KEYS.RAW_MATERIALS)
        const initial = current.length > 0 ? current : seedInventory
        await bulkUpsert('raw_materials', userId, initial)
      }
    }
    loadCloud()
    return () => { active = false }
  }, [userId])

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function addRawMaterial(data) {
    const now = new Date().toISOString()
    const item = { ...data, id: generateId('rm'), createdAt: now, updatedAt: now }
    setRawMaterials(prev => [...prev, item])
    if (userId) upsertItem('raw_materials', userId, item)
    return item
  }

  function updateRawMaterial(id, data) {
    let updated
    setRawMaterials(prev =>
      prev.map(rm => {
        if (rm.id !== id) return rm
        updated = { ...rm, ...data, id, updatedAt: new Date().toISOString() }
        return updated
      }),
    )
    if (userId && updated) upsertItem('raw_materials', userId, updated)
  }

  function deleteRawMaterial(id) {
    setRawMaterials(prev => prev.filter(rm => rm.id !== id))
    if (userId) deleteItem('raw_materials', id)
  }

  function replaceRawMaterials(data) {
    setRawMaterials(data)
    if (userId) bulkUpsert('raw_materials', userId, data)
  }

  return { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial, replaceRawMaterials }
}
