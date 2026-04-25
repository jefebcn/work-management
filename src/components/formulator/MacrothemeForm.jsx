import React, { useState, useEffect } from 'react'
import { FolderPlus, X } from 'lucide-react'

/**
 * Modal per creare o rinominare un macrotheme custom.
 *
 * Props:
 *   open: boolean
 *   initialName?: string (per rinominare)
 *   onCancel: () => void
 *   onConfirm: (name: string) => void
 */
export default function MacrothemeForm({ open, initialName = '', onCancel, onConfirm }) {
  const [name, setName] = useState(initialName)

  useEffect(() => { if (open) setName(initialName) }, [open, initialName])

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  const isRename = !!initialName

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-galenic-surface border border-galenic-border rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-galenic-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-galenic-accent/10 border border-galenic-accent/30 flex items-center justify-center">
              <FolderPlus size={13} className="text-galenic-accent" />
            </div>
            <div className="text-sm font-semibold text-galenic-primary">
              {isRename ? 'Rinomina macrotema' : 'Nuovo macrotema'}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-mono text-galenic-muted uppercase tracking-wider mb-1.5">
              Nome cartella
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="es. Cliente Rossi, Progetti 2026, Target Sport"
              maxLength={40}
              className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2.5 text-sm font-mono text-galenic-primary placeholder:text-galenic-muted/40 outline-none focus:border-galenic-accent transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-mono text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-all"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-lg text-xs font-mono font-medium bg-galenic-accent text-galenic-surface hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {isRename ? 'Rinomina' : 'Crea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
