import { useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { seedInventory } from '../data/seedInventory.js'
import { dbLoadAll, dbUpsert, dbDelete, dbUpsertMany } from '../lib/db.js'

export function useInventory(user = null) {
  const [rawMaterials, setRawMaterials] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.RAW_MATERIALS)
    return stored.length > 0 ? stored : seedInventory
  })
  const [cloudLoaded, setCloudLoaded] = useState(false)

  // On login: load from cloud and replace state
  useEffect(() => {
    if (!user) { setCloudLoaded(false); return }
    dbLoadAll('raw_materials', user.id).then(rows => {
      if (rows === null) return // cloud unavailable — keep local
      if (rows.length > 0) {
        setRawMaterials(rows)
        saveToStorage(STORAGE_KEYS.RAW_MATERIALS, rows)
      } else {
        // First login with empty cloud — seed and push seed data up
        const seed = loadFromStorage(STORAGE_KEYS.RAW_MATERIALS)
        const data = seed.length > 0 ? seed : seedInventory
        setRawMaterials(data)
        dbUpsertMany('raw_materials', user.id, data)
      }
      setCloudLoaded(true)
    })
  }, [user?.id])

  // Keep localStorage in sync as offline cache
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RAW_MATERIALS, rawMaterials)
  }, [rawMaterials])

  function addRawMaterial(data) {
    const now = new Date().toISOString()
    const item = { ...data, id: generateId('rm'), createdAt: now, updatedAt: now }
    setRawMaterials(prev => [...prev, item])
    if (user) dbUpsert('raw_materials', user.id, item)
    return item
  }

  function updateRawMaterial(id, data) {
    setRawMaterials(prev =>
      prev.map(rm => {
        if (rm.id !== id) return rm
        const updated = { ...rm, ...data, id, updatedAt: new Date().toISOString() }
        if (user) dbUpsert('raw_materials', user.id, updated)
        return updated
      }),
    )
  }

  function deleteRawMaterial(id) {
    setRawMaterials(prev => prev.filter(rm => rm.id !== id))
    if (user) dbDelete('raw_materials', user.id, id)
  }

  function replaceRawMaterials(data) {
    setRawMaterials(data)
    if (user) dbUpsertMany('raw_materials', user.id, data)
  }

  return { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial, replaceRawMaterials, cloudLoaded }
}
