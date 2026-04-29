import { useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { SEED_MACROTHEMES } from '../data/seedMacrothemes.js'
import { dbLoadAll, dbUpsert, dbDelete, dbUpsertMany } from '../lib/db.js'

export function useMacrothemes(user = null) {
  const [macrothemes, setMacrothemes] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.MACROTHEMES)
    if (stored.length > 0) {
      const ids = new Set(stored.map(m => m.id))
      const missing = SEED_MACROTHEMES.filter(s => !ids.has(s.id))
      // Refresh name/formType on existing auto-seeds so renames propagate
      const refreshed = stored.map(m => {
        const seed = SEED_MACROTHEMES.find(s => s.id === m.id)
        return seed ? { ...m, name: seed.name, formType: seed.formType } : m
      })
      return missing.length > 0 ? [...refreshed, ...missing] : refreshed
    }
    return SEED_MACROTHEMES
  })

  useEffect(() => {
    if (!user) return
    dbLoadAll('macrothemes', user.id).then(rows => {
      if (rows === null) return
      if (rows.length > 0) {
        // Always ensure seed auto-themes are present
        const ids = new Set(rows.map(m => m.id))
        const missing = SEED_MACROTHEMES.filter(s => !ids.has(s.id))
        const merged = missing.length > 0 ? [...rows, ...missing] : rows
        setMacrothemes(merged)
        saveToStorage(STORAGE_KEYS.MACROTHEMES, merged)
        if (missing.length > 0) dbUpsertMany('macrothemes', user.id, missing)
      } else {
        const local = loadFromStorage(STORAGE_KEYS.MACROTHEMES)
        const data = local.length > 0 ? local : SEED_MACROTHEMES
        setMacrothemes(data)
        dbUpsertMany('macrothemes', user.id, data)
      }
    })
  }, [user?.id])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MACROTHEMES, macrothemes)
  }, [macrothemes])

  function addMacrotheme(name, icon = null) {
    const trimmed = (name || '').trim()
    if (!trimmed) return null
    const item = {
      id: generateId('macro'),
      name: trimmed,
      kind: 'custom',
      formType: null,
      icon,
      createdAt: new Date().toISOString(),
    }
    setMacrothemes(prev => [...prev, item])
    if (user) dbUpsert('macrothemes', user.id, item)
    return item
  }

  function updateMacrotheme(id, data) {
    setMacrothemes(prev =>
      prev.map(m => {
        if (m.id !== id) return m
        const updated = m.kind === 'auto'
          ? { ...m, icon: data.icon ?? m.icon }
          : { ...m, ...data, id, kind: 'custom' }
        if (user) dbUpsert('macrothemes', user.id, updated)
        return updated
      }),
    )
  }

  function deleteMacrotheme(id) {
    setMacrothemes(prev => prev.filter(m => m.id !== id || m.kind === 'auto'))
    if (user) dbDelete('macrothemes', user.id, id)
  }

  return { macrothemes, addMacrotheme, updateMacrotheme, deleteMacrotheme }
}
