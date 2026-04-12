import { useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { seedPackaging } from '../data/seedPackaging.js'

export function usePackaging() {
  const [packaging, setPackaging] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.PACKAGING)
    return stored.length > 0 ? stored : seedPackaging
  })

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PACKAGING, packaging)
  }, [packaging])

  function addPackaging(data) {
    const now = new Date().toISOString()
    const item = {
      ...data,
      id: generateId('pkg'),
      createdAt: now,
      updatedAt: now,
    }
    setPackaging(prev => [...prev, item])
    return item
  }

  function updatePackaging(id, data) {
    setPackaging(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, ...data, id, updatedAt: new Date().toISOString() }
          : p
      )
    )
  }

  function deletePackaging(id) {
    setPackaging(prev => prev.filter(p => p.id !== id))
  }

  return { packaging, addPackaging, updatePackaging, deletePackaging }
}
