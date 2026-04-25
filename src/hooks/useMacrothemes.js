import { useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { SEED_MACROTHEMES } from '../data/seedMacrothemes.js'

export function useMacrothemes() {
  const [macrothemes, setMacrothemes] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.MACROTHEMES)
    if (stored.length > 0) {
      // Garantisci che gli auto-temi seed esistano sempre
      const ids = new Set(stored.map(m => m.id))
      const missing = SEED_MACROTHEMES.filter(s => !ids.has(s.id))
      return missing.length > 0 ? [...stored, ...missing] : stored
    }
    return SEED_MACROTHEMES
  })

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
    return item
  }

  function updateMacrotheme(id, data) {
    setMacrothemes(prev =>
      prev.map(m => {
        if (m.id !== id) return m
        // Non permettere di modificare nome/kind/formType degli auto
        if (m.kind === 'auto') return { ...m, icon: data.icon ?? m.icon }
        return { ...m, ...data, id, kind: 'custom' }
      }),
    )
  }

  function deleteMacrotheme(id) {
    // Gli auto non sono eliminabili
    setMacrothemes(prev => prev.filter(m => m.id !== id || m.kind === 'auto'))
  }

  return { macrothemes, addMacrotheme, updateMacrotheme, deleteMacrotheme }
}
