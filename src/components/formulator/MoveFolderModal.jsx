import React, { useState } from 'react'
import { Folder, FolderOpen, Plus, X, Check, Home } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

export default function MoveFolderModal({ formula, activeMacroId, onClose }) {
  const { folders, createFolder, setFolderForFormula } = useApp()

  const [creating,   setCreating]   = useState(false)
  const [newName,    setNewName]    = useState('')
  const [nameError,  setNameError]  = useState('')

  const macroFolders = folders.filter(f => (f.macrothemeId || null) === activeMacroId)
  const currentFolder = formula.folderId || null

  function handleMove(folderId) {
    if (folderId === currentFolder) { onClose(); return }
    setFolderForFormula(formula.id, folderId)
    onClose()
  }

  function handleCreateAndMove() {
    const trimmed = newName.trim()
    if (!trimmed) { setNameError('Il nome non può essere vuoto.'); return }
    if (macroFolders.some(f => f.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('Una cartella con questo nome esiste già.')
      return
    }
    const folder = createFolder({ name: trimmed, macrothemeId: activeMacroId })
    setFolderForFormula(formula.id, folder.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-galenic-surface border border-galenic-border rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-galenic-border">
          <div>
            <h3 className="text-sm font-semibold text-galenic-primary">Sposta in cartella</h3>
            <p className="text-xs font-mono text-galenic-muted/70 mt-0.5 truncate max-w-[220px]">
              {formula.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Folder list */}
        <div className="max-h-64 overflow-y-auto divide-y divide-galenic-border/30">
          {/* Root option */}
          <FolderRow
            icon={<Home size={14} />}
            label="Radice (nessuna cartella)"
            active={currentFolder === null}
            onClick={() => handleMove(null)}
          />

          {macroFolders.map(folder => (
            <FolderRow
              key={folder.id}
              icon={<Folder size={14} />}
              label={folder.name}
              active={currentFolder === folder.id}
              onClick={() => handleMove(folder.id)}
            />
          ))}

          {macroFolders.length === 0 && (
            <div className="px-5 py-4 text-xs font-mono text-galenic-muted/50 text-center">
              Nessuna cartella in questo macrotema
            </div>
          )}
        </div>

        {/* Inline create */}
        <div className="px-4 py-3 border-t border-galenic-border bg-galenic-elevated/30">
          {creating ? (
            <div className="space-y-2">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => { setNewName(e.target.value); setNameError('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateAndMove()
                  if (e.key === 'Escape') { setCreating(false); setNewName('') }
                }}
                placeholder="Nome nuova cartella..."
                className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-1.5 text-xs font-mono text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors"
              />
              {nameError && (
                <p className="text-xs font-mono text-galenic-danger">{nameError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAndMove}
                  className="flex-1 py-1.5 rounded-lg bg-galenic-accent text-white text-xs font-mono font-medium hover:opacity-90 transition-opacity"
                >
                  Crea e sposta
                </button>
                <button
                  onClick={() => { setCreating(false); setNewName(''); setNameError('') }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-galenic-accent hover:bg-galenic-accent/10 transition-colors"
            >
              <Plus size={12} />
              Crea nuova cartella
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FolderRow({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-galenic-elevated/60 transition-colors"
    >
      <span className={active ? 'text-galenic-accent' : 'text-galenic-muted/60'}>
        {icon}
      </span>
      <span className={`flex-1 text-xs font-mono truncate ${active ? 'text-galenic-accent font-semibold' : 'text-galenic-primary'}`}>
        {label}
      </span>
      {active && <Check size={12} className="text-galenic-accent shrink-0" />}
    </button>
  )
}
