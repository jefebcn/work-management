import { useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { seedPackaging } from '../data/seedPackaging.js'
import { loadUserData, upsertItem, deleteItem, bulkUpsert } from '../lib/cloudSync.js'

export function usePackaging(userId = null) {
  const [packaging, setPackaging] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.PACKAGING)
    return stored.length > 0 ? stored : seedPackaging
  })

  // ── localStorage sync ─────────────────────────────────────────────────────
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PACKAGING, packaging)
  }, [packaging])

  // ── Cloud sync: load on login ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    let active = true
    async function loadCloud() {
      const items = await loadUserData('packaging', userId)
      if (!active) return
      if (items.length > 0) {
        setPackaging(items)
      } else {
        const current = loadFromStorage(STORAGE_KEYS.PACKAGING)
        const initial = current.length > 0 ? current : seedPackaging
        await bulkUpsert('packaging', userId, initial)
      }
    }
    loadCloud()
    return () => { active = false }
  }, [userId])

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function addPackaging(data) {
    const now = new Date().toISOString()
    const item = { ...data, id: generateId('pkg'), createdAt: now, updatedAt: now }
    setPackaging(prev => [...prev, item])
    if (userId) upsertItem('packaging', userId, item)
    return item
  }

  function updatePackaging(id, data) {
    let updated
    setPackaging(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        updated = { ...p, ...data, id, updatedAt: new Date().toISOString() }
        return updated
      }),
    )
    if (userId && updated) upsertItem('packaging', userId, updated)
  }

  function deletePackaging(id) {
    setPackaging(prev => prev.filter(p => p.id !== id))
    if (userId) deleteItem('packaging', id)
  }

  function replacePackaging(data) {
    setPackaging(data)
    if (userId) bulkUpsert('packaging', userId, data)
  }

  return { packaging, addPackaging, updatePackaging, deletePackaging, replacePackaging }
}
