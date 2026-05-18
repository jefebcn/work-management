import React, { useState, useMemo } from 'react'
import { Folder, FolderPlus, FolderEdit, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import MacrothemeForm from './MacrothemeForm.jsx'

export default function MacrothemeSidebar({ selectedMacroId, onSelect }) {
  const {
    macrothemes, formulas,
    addMacrotheme, updateMacrotheme, deleteMacrotheme, setMacrothemeForFormula,
  } = useApp()
  const [macroModal, setMacroModal] = useState(null)

  const countsByMacro = useMemo(() => {
    const counts = {}
    formulas.forEach(f => { counts[f.macrothemeId || 'orphan'] = (counts[f.macrothemeId || 'orphan'] || 0) + 1 })
    return counts
  }, [formulas])

  function handleCreate(name) {
    const created = addMacrotheme(name)
    if (created) onSelect(created.id)
    setMacroModal(null)
  }

  function handleRename(name) {
    if (macroModal?.id) updateMacrotheme(macroModal.id, { name })
    setMacroModal(null)
  }

  function handleDelete(id) {
    if (!window.confirm('Eliminare questo macrotema? Le formule saranno spostate in "Compresse".')) return
    const fallback = macrothemes.find(m => m.kind === 'auto')
    if (fallback) {
      formulas.filter(f => f.macrothemeId === id).forEach(f => setMacrothemeForFormula(f.id, fallback.id))
    }
    deleteMacrotheme(id)
    if (selectedMacroId === id) onSelect(fallback?.id ?? null)
  }

  return (
    <>
      <aside>
        <div className="sticky top-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-galenic-muted uppercase tracking-wider">
              Macrotemi
            </h3>
            <button
              onClick={() => setMacroModal({ mode: 'create' })}
              title="Nuovo macrotema"
              className="p-1 rounded text-galenic-muted hover:text-galenic-accent hover:bg-galenic-elevated transition-all"
            >
              <FolderPlus size={13} />
            </button>
          </div>

          <div className="space-y-0.5 bg-galenic-surface border border-galenic-border rounded-xl p-2 shadow-sm">
            {macrothemes.map(m => {
              const isActive = m.id === selectedMacroId
              const count    = countsByMacro[m.id] || 0
              return (
                <div key={m.id} className="group relative">
                  <button
                    onClick={() => onSelect(m.id)}
                    className={[
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all',
                      isActive
                        ? 'bg-galenic-accent/12 text-galenic-accent font-medium'
                        : 'text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/60',
                    ].join(' ')}
                  >
                    <Folder size={12} className={isActive ? 'text-galenic-accent' : 'opacity-60'} />
                    <span className="text-xs truncate flex-1">{m.name}</span>
                    <span className={[
                      'text-xs font-mono tabular-nums px-1.5 rounded',
                      isActive ? 'text-galenic-accent' : 'text-galenic-muted/60',
                    ].join(' ')}>
                      {count}
                    </span>
                  </button>
                  {m.kind === 'custom' && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5 bg-galenic-surface/95 backdrop-blur rounded">
                      <button
                        onClick={e => { e.stopPropagation(); setMacroModal({ mode: 'rename', initial: m.name, id: m.id }) }}
                        title="Rinomina"
                        className="p-1 rounded text-galenic-muted hover:text-galenic-accent"
                      >
                        <FolderEdit size={10} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(m.id) }}
                        title="Elimina"
                        className="p-1 rounded text-galenic-muted hover:text-galenic-danger"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      <MacrothemeForm
        open={!!macroModal}
        initialName={macroModal?.initial || ''}
        onCancel={() => setMacroModal(null)}
        onConfirm={macroModal?.mode === 'create' ? handleCreate : handleRename}
      />
    </>
  )
}
