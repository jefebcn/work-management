import { useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { seedPackaging } from '../data/seedPackaging.js'
import { dbLoadAll, dbUpsert, dbDelete, dbUpsertMany } from '../lib/db.js'

export function usePackaging(user = null) {
  const [packaging, setPackaging] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.PACKAGING)
    return stored.length > 0 ? stored : seedPackaging
  })

  useEffect(() => {
    if (!user) return
    dbLoadAll('packaging', user.id).then(rows => {
      if (rows === null) return
      if (rows.length > 0) {
        setPackaging(rows)
        saveToStorage(STORAGE_KEYS.PACKAGING, rows)
      } else {
        const seed = loadFromStorage(STORAGE_KEYS.PACKAGING)
        const data = seed.length > 0 ? seed : seedPackaging
        setPackaging(data)
        dbUpsertMany('packaging', user.id, data)
      }
    })
  }, [user?.id])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PACKAGING, packaging)
  }, [packaging])

  function addPackaging(data) {
    const now = new Date().toISOString()
    const item = { ...data, id: generateId('pkg'), createdAt: now, updatedAt: now }
    setPackaging(prev => [...prev, item])
    if (user) dbUpsert('packaging', user.id, item)
    return item
  }

  function updatePackaging(id, data) {
    setPackaging(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        const updated = { ...p, ...data, id, updatedAt: new Date().toISOString() }
        if (user) dbUpsert('packaging', user.id, updated)
        return updated
      }),
    )
  }

  function deletePackaging(id) {
    setPackaging(prev => prev.filter(p => p.id !== id))
    if (user) dbDelete('packaging', user.id, id)
  }

  function replacePackaging(data) {
    setPackaging(data)
    if (user) dbUpsertMany('packaging', user.id, data)
  }

  return { packaging, addPackaging, updatePackaging, deletePackaging, replacePackaging }
}
