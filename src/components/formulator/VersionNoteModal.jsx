import React, { useState, useEffect } from 'react'
import { GitBranch, X } from 'lucide-react'
import { nextVersionLabel } from '../../utils/formulaMigration.js'

/**
 * Modal per creare una nuova versione (snapshot) chiedendo una nota descrittiva.
 *
 * Props:
 *   open: boolean
 *   currentLabel: string ("v1.2")
 *   onCancel: () => void
 *   onConfirm: (note: string) => void
 */
export default function VersionNoteModal({ open, currentLabel = 'v1.0', onCancel, onConfirm }) {
  const [note, setNote] = useState('')
  const proposedLabel = nextVersionLabel(currentLabel)

  // Reset al mount/open
  useEffect(() => { if (open) setNote('') }, [open])

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm(note)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-galenic-surface border border-galenic-border rounded-2xl shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-galenic-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-galenic-accent/10 border border-galenic-accent/30 flex items-center justify-center">
              <GitBranch size={13} className="text-galenic-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold text-galenic-primary">Nuova versione</div>
              <div className="text-xs font-mono text-galenic-muted">
                {currentLabel} → <span className="text-galenic-accent font-semibold">{proposedLabel}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-mono text-galenic-muted uppercase tracking-wider mb-1.5">
              Nota di versione
            </label>
            <input
              type="text"
              autoFocus
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="es. +10% Caffeina, migliorata solubilità"
              maxLength={120}
              className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2.5 text-sm font-mono text-galenic-primary placeholder:text-galenic-muted/40 outline-none focus:border-galenic-accent transition-colors"
            />
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs font-mono text-galenic-muted/50">
                Breve descrizione della modifica
              </div>
              <div className="text-xs font-mono text-galenic-muted/50 tabular-nums">
                {note.length}/120
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-mono text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-all"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-medium bg-galenic-accent text-galenic-surface hover:opacity-90 transition-opacity"
            >
              <GitBranch size={11} />
              Crea {proposedLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
