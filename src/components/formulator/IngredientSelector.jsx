import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../ui/Button.jsx'

export default function IngredientSelector() {
  const { rawMaterials, activeFormula, addIngredient } = useApp()
  const [selectedId, setSelectedId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter out already-added ingredients
  const usedIds = new Set((activeFormula?.ingredients || []).map(i => i.rawMaterialId))
  const available = rawMaterials.filter(rm => !usedIds.has(rm.id))

  // Apply search filter
  const q = searchQuery.toLowerCase().trim()
  const filtered = q
    ? available.filter(
        rm =>
          rm.name.toLowerCase().includes(q) ||
          (rm.activeNutrient && rm.activeNutrient.toLowerCase().includes(q))
      )
    : available

  function handleAdd() {
    if (!selectedId) return
    addIngredient(selectedId)
    setSelectedId('')
    setSearchQuery('')
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-galenic-elevated border border-dashed border-galenic-border">
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-galenic-muted pointer-events-none">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value)
            setSelectedId('') // reset selection when query changes
          }}
          placeholder="Cerca materia prima per nome o nutriente..."
          className="w-full bg-galenic-surface border border-galenic-border text-galenic-primary font-mono text-sm pl-8 pr-3 py-2 outline-none focus:border-galenic-accent transition-colors placeholder:text-galenic-muted"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedId('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-galenic-muted hover:text-galenic-primary transition-colors font-mono text-base leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Select + Add button */}
      <div className="flex items-center gap-3">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="flex-1 bg-galenic-surface border border-galenic-border text-galenic-primary font-mono text-sm px-3 py-2 outline-none focus:border-galenic-accent transition-colors"
        >
          <option value="">
            {filtered.length === 0 && q
              ? '— Nessun risultato —'
              : '— Seleziona materia prima da aggiungere —'}
          </option>
          {filtered.map(rm => (
            <option key={rm.id} value={rm.id}>
              {rm.name} {rm.activeNutrient ? `(${rm.activeNutrient})` : ''}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAdd}
          disabled={!selectedId}
        >
          + Aggiungi
        </Button>
      </div>

      {available.length === 0 && (
        <span className="text-xs text-galenic-muted font-mono">
          Tutti gli ingredienti già aggiunti
        </span>
      )}
      {filtered.length === 0 && q && available.length > 0 && (
        <span className="text-xs text-galenic-muted font-mono">
          Nessun risultato per "{searchQuery}" — prova un termine diverso
        </span>
      )}
    </div>
  )
}
