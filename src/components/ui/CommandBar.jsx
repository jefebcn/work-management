import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, FlaskConical, Package, ArrowRight, X } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

/**
 * Universal command bar — opens on Cmd+K / Ctrl+K.
 * Searches rawMaterials (to add to active formula) and formulas (to open).
 */
export default function CommandBar({ open, onClose }) {
  const { rawMaterials, formulas, addIngredient, openFormula, activeFormula } = useApp()
  const [query, setQuery]     = useState('')
  const [cursor, setCursor]   = useState(0)
  const inputRef              = useRef(null)

  // Focus input whenever bar opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Build results list
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = []

    if (activeFormula) {
      // Section 1: add ingredient
      const mats = rawMaterials
        .filter(rm => !q || rm.name.toLowerCase().includes(q) || (rm.activeNutrient || '').toLowerCase().includes(q))
        .slice(0, 6)
        .map(rm => ({
          kind:    'ingredient',
          id:      rm.id,
          label:   rm.name,
          sub:     rm.activeNutrient || rm.supplier || '',
          action:  () => { addIngredient(rm.id); onClose() },
        }))
      if (mats.length) {
        list.push({ kind: 'header', label: 'Aggiungi ingrediente' })
        list.push(...mats)
      }
    }

    // Section 2: open project
    const fmls = formulas
      .filter(f => !q || f.name.toLowerCase().includes(q) || (f.clientName || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map(f => ({
        kind:    'formula',
        id:      f.id,
        label:   f.name,
        sub:     `${f.versionLabel || 'v1.0'} · ${f.status}`,
        action:  () => { openFormula(f); onClose() },
      }))
    if (fmls.length) {
      list.push({ kind: 'header', label: 'Apri progetto' })
      list.push(...fmls)
    }

    return list
  }, [query, rawMaterials, formulas, activeFormula])

  // Only items (non-headers) are navigable
  const items = results.filter(r => r.kind !== 'header')

  function handleKey(e) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, items.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && items[cursor]) { items[cursor].action() }
  }

  if (!open) return null

  // Map item index to result index (skip headers)
  let itemIdx = -1

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-[10%] sm:top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-sm sm:max-w-lg px-3 sm:px-4">
        <div className="bg-galenic-surface border border-galenic-border rounded-2xl shadow-2xl overflow-hidden">

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-galenic-border">
            <Search size={15} className="text-galenic-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setCursor(0) }}
              onKeyDown={handleKey}
              placeholder={activeFormula ? 'Cerca ingrediente o progetto…' : 'Cerca progetto…'}
              className="flex-1 bg-transparent text-sm text-galenic-primary placeholder-galenic-muted/50 outline-none"
            />
            <button onClick={onClose} className="text-galenic-muted hover:text-galenic-primary transition-colors shrink-0">
              <X size={13} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[55vh] sm:max-h-80 overflow-y-auto py-2">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs font-mono text-galenic-muted/50">
                Nessun risultato per "{query}"
              </div>
            ) : (
              results.map((r, i) => {
                if (r.kind === 'header') {
                  return (
                    <div key={`h-${i}`} className="px-4 py-1.5 text-xs font-mono text-galenic-muted/60 uppercase tracking-wider">
                      {r.label}
                    </div>
                  )
                }
                itemIdx++
                const idx = itemIdx
                const isActive = idx === cursor
                return (
                  <button
                    key={r.id}
                    onClick={r.action}
                    onMouseEnter={() => setCursor(idx)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      isActive ? 'bg-galenic-accent/8 text-galenic-primary' : 'text-galenic-primary hover:bg-galenic-elevated/60',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      r.kind === 'ingredient'
                        ? 'bg-galenic-accent/10 text-galenic-accent'
                        : 'bg-blue-500/10 text-blue-400',
                    ].join(' ')}>
                      {r.kind === 'ingredient' ? <Package size={13} /> : <FlaskConical size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.label}</div>
                      {r.sub && <div className="text-xs font-mono text-galenic-muted/70 truncate">{r.sub}</div>}
                    </div>
                    {isActive && <ArrowRight size={13} className="text-galenic-accent shrink-0" />}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-galenic-border/60 flex items-center gap-3 text-xs font-mono text-galenic-muted/50">
            <span>↑↓ naviga</span>
            <span>↵ seleziona</span>
            <span>Esc chiudi</span>
          </div>
        </div>
      </div>
    </>
  )
}
