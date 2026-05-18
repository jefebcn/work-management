import React, { useState, useEffect, useRef, useMemo } from 'react'
import { X, Search, Plus, Check, TrendingUp } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

// Sort tier: 0=exact, 1=name-starts, 2=nutrient-starts, 3=name-contains, 4=nutrient-contains, 5=supplier
function matchTier(rm, lower) {
  const name     = rm.name.toLowerCase()
  const nutrient = (rm.activeNutrient || '').toLowerCase()
  const supplier = (rm.supplier || '').toLowerCase()
  if (name === lower)              return 0
  if (name.startsWith(lower))      return 1
  if (nutrient.startsWith(lower))  return 2
  if (name.includes(lower))        return 3
  if (nutrient.includes(lower))    return 4
  if (supplier.includes(lower))    return 5
  return 99
}

export default function IngredientDrawer({ open, onClose }) {
  const { rawMaterials, activeFormula, addIngredient, formulas } = useApp()
  const [query, setQuery]         = useState('')
  const [justAdded, setJustAdded] = useState(new Set())
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setJustAdded(new Set())
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Frequency map: how many formulas use each raw material
  const freqMap = useMemo(() => {
    const freq = {}
    formulas.forEach(f => {
      ;(f.ingredients || []).forEach(i => {
        freq[i.rawMaterialId] = (freq[i.rawMaterialId] || 0) + 1
      })
    })
    return freq
  }, [formulas])

  const usedIds   = new Set((activeFormula?.ingredients || []).map(i => i.rawMaterialId))
  const available = rawMaterials.filter(rm => !usedIds.has(rm.id))

  const q = query.toLowerCase().trim()
  const filtered = useMemo(() => {
    const pool = q ? rawMaterials : available
    const candidates = q
      ? pool.filter(rm => matchTier(rm, q) < 99)
      : pool
    return [...candidates].sort((a, b) => {
      if (q) {
        const ta = matchTier(a, q)
        const tb = matchTier(b, q)
        if (ta !== tb) return ta - tb
      }
      // Within same tier (or no query): frequency descending, then alpha
      const fa = freqMap[a.id] || 0
      const fb = freqMap[b.id] || 0
      if (fb !== fa) return fb - fa
      return a.name.localeCompare(b.name, 'it')
    })
  }, [q, rawMaterials, available, freqMap])

  function handleAdd(id) {
    addIngredient(id)
    setJustAdded(prev => new Set([...prev, id]))
    setTimeout(() => {
      setJustAdded(prev => { const s = new Set(prev); s.delete(id); return s })
    }, 1200)
  }

  const addedCount = (activeFormula?.ingredients || []).length

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className={[
        'fixed top-0 right-0 h-full z-50 w-full sm:w-[22rem] bg-galenic-surface border-l border-galenic-border shadow-2xl flex flex-col',
        'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        open ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-galenic-border shrink-0">
          <div>
            <h2 className="text-sm font-mono font-semibold text-galenic-primary">
              Database Materie Prime
            </h2>
            <div className="text-xs font-mono text-galenic-muted/60 mt-0.5">
              {addedCount} già in formula
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-galenic-muted hover:text-galenic-primary transition-colors p-1.5 rounded-lg hover:bg-galenic-elevated"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-galenic-border shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-galenic-muted pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nome, nutriente, fornitore..."
              className="w-full bg-galenic-elevated border border-galenic-border rounded-xl text-galenic-primary font-mono text-sm pl-8 pr-8 py-2 outline-none focus:border-galenic-accent transition-colors placeholder:text-galenic-muted"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-galenic-muted hover:text-galenic-primary transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="mt-1.5 text-xs font-mono text-galenic-muted/50">
            {filtered.length} risultati{q ? ' · per rilevanza' : ' · per frequenza d\'uso'}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="text-xs font-mono text-galenic-muted/50">
                {q ? `Nessun risultato per "${query}"` : 'Tutte le materie prime già in formula'}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-galenic-border/30">
              {filtered.map(rm => {
                const alreadyIn = usedIds.has(rm.id)
                const wasJustAdded = justAdded.has(rm.id)

                return (
                  <button
                    key={rm.id}
                    onClick={() => !alreadyIn && handleAdd(rm.id)}
                    disabled={alreadyIn}
                    className={[
                      'w-full text-left px-5 py-3 flex items-start gap-3 group transition-colors',
                      alreadyIn
                        ? 'opacity-35 cursor-default'
                        : 'hover:bg-galenic-elevated/70 active:bg-galenic-elevated cursor-pointer',
                    ].join(' ')}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono text-galenic-primary font-medium">
                          {rm.name}
                        </span>
                        {rm.titration > 0 && rm.titration < 100 && (
                          <span className="text-xs font-mono px-1.5 py-px rounded bg-galenic-accent/10 text-galenic-accent border border-galenic-accent/20 shrink-0">
                            {rm.titration}%
                          </span>
                        )}
                        {!q && (freqMap[rm.id] || 0) >= 3 && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-mono px-1.5 py-px rounded bg-galenic-ok/10 text-galenic-ok border border-galenic-ok/20 shrink-0" title={`Usato in ${freqMap[rm.id]} formule`}>
                            <TrendingUp size={9} />
                            {freqMap[rm.id]}×
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {rm.activeNutrient && (
                          <span className="text-xs font-mono text-galenic-muted/65">
                            {rm.activeNutrient}
                          </span>
                        )}
                        {rm.supplier && (
                          <span className="text-xs font-mono text-galenic-muted/35">
                            · {rm.supplier}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                      {rm.pricePerKg > 0 && (
                        <span className="text-xs font-mono text-galenic-muted tabular-nums">
                          €{Number(rm.pricePerKg).toFixed(2)}/kg
                        </span>
                      )}
                      <span className={[
                        'transition-all duration-300',
                        wasJustAdded
                          ? 'text-galenic-ok'
                          : alreadyIn
                          ? 'text-galenic-ok'
                          : 'text-galenic-accent opacity-0 group-hover:opacity-100',
                      ].join(' ')}>
                        {alreadyIn || wasJustAdded
                          ? <Check size={14} />
                          : <Plus size={14} />}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-galenic-border bg-galenic-elevated/30 shrink-0">
          <button
            onClick={onClose}
            className="w-full text-center text-xs font-mono text-galenic-muted hover:text-galenic-primary transition-colors py-1"
          >
            Chiudi  ·  ESC
          </button>
        </div>
      </div>
    </>
  )
}
