import { useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { seedInventory } from '../data/seedInventory.js'

export function useInventory() {
  const [rawMaterials, setRawMaterials] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.RAW_MATERIALS)
    return stored.length > 0 ? stored : seedInventory
  })

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RAW_MATERIALS, rawMaterials)
  }, [rawMaterials])

  function addRawMaterial(data) {
    const now = new Date().toISOString()
    const item = {
      ...data,
      id: generateId('rm'),
      createdAt: now,
      updatedAt: now,
    }
    setRawMaterials(prev => [...prev, item])
    return item
  }

  function updateRawMaterial(id, data) {
    setRawMaterials(prev =>
      prev.map(rm =>
        rm.id === id
          ? { ...rm, ...data, id, updatedAt: new Date().toISOString() }
          : rm
      )
    )
  }

  function deleteRawMaterial(id) {
    setRawMaterials(prev => prev.filter(rm => rm.id !== id))
  }

  return { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial }
}
