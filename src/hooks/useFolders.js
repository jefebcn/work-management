import { useState, useEffect } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { dbLoadAll, dbUpsert, dbDelete } from '../lib/db.js'

// NOTE: requires a `folders` table in Supabase with columns:
//   id (text PK), user_id (uuid), data (jsonb), updated_at (timestamptz)
// Degrades to local-only if the table doesn't exist yet.

export function useFolders(user = null) {
  const [folders, setFolders] = useState(() =>
    loadFromStorage(STORAGE_KEYS.FOLDERS, []),
  )

  // Load from cloud on login
  useEffect(() => {
    if (!user) return
    dbLoadAll('folders', user.id).then(rows => {
      if (rows === null) return // table missing or network error — stay local
      if (rows.length > 0) {
        setFolders(rows)
        saveToStorage(STORAGE_KEYS.FOLDERS, rows)
      }
    })
  }, [user?.id])

  // Keep localStorage in sync
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FOLDERS, folders)
  }, [folders])

  function createFolder({ name, macrothemeId }) {
    const now = new Date().toISOString()
    const folder = {
      id:           generateId('fld'),
      name:         name.trim(),
      macrothemeId: macrothemeId || null,
      createdAt:    now,
      updatedAt:    now,
    }
    setFolders(prev => [...prev, folder])
    if (user) dbUpsert('folders', user.id, folder)
    return folder
  }

  function renameFolder(id, name) {
    const trimmed = name.trim()
    if (!trimmed) return
    setFolders(prev =>
      prev.map(f => {
        if (f.id !== id) return f
        const updated = { ...f, name: trimmed, updatedAt: new Date().toISOString() }
        if (user) dbUpsert('folders', user.id, updated)
        return updated
      }),
    )
  }

  function deleteFolder(id) {
    setFolders(prev => prev.filter(f => f.id !== id))
    if (user) dbDelete('folders', user.id, id)
  }

  return { folders, createFolder, renameFolder, deleteFolder }
}
