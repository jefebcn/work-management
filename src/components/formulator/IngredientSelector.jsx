import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../ui/Button.jsx'

export default function IngredientSelector() {
  const { rawMaterials, activeFormula, addIngredient } = useApp()
  const [selectedId, setSelectedId] = useState('')

  // Filter out already-added ingredients
  const usedIds = new Set((activeFormula?.ingredients || []).map(i => i.rawMaterialId))
  const available = rawMaterials.filter(rm => !usedIds.has(rm.id))

  function handleAdd() {
    if (!selectedId) return
    addIngredient(selectedId)
    setSelectedId('')
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-galenic-elevated border border-dashed border-galenic-border">
      <select
        value={selectedId}
        onChange={e => setSelectedId(e.target.value)}
        className="flex-1 bg-galenic-surface border border-galenic-border text-galenic-primary font-mono text-sm px-3 py-2 outline-none focus:border-galenic-accent"
      >
        <option value="">— Seleziona materia prima da aggiungere —</option>
        {available.map(rm => (
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
      {available.length === 0 && (
        <span className="text-xs text-galenic-muted font-mono">
          Tutti gli ingredienti già aggiunti
        </span>
      )}
    </div>
  )
}
