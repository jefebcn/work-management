import React, { useState, useMemo, useEffect } from 'react'
import {
  Plus, GitCompare, Trash2, Layers,
  ExternalLink, Copy, History, FileSpreadsheet,
} from 'lucide-react'
import RecipeImportModal from './RecipeImportModal.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { generateId } from '../../utils/idGenerator.js'
import Button from '../ui/Button.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import { fromMg } from '../../utils/weightConversions.js'
import CompareView from './CompareView.jsx'
import VersionHistoryDrawer from './VersionHistoryDrawer.jsx'

const TYPE_DOT = {
  Compresse: 'bg-galenic-accent',
  Capsule:   'bg-galenic-ok',
  Polveri:   'bg-yellow-400',
  Liquidi:   'bg-blue-400',
  'Sistemi Gommosi e Coated': 'bg-orange-400',
}

export default function FormulaList({ selectedMacroId }) {
  const {
    formulas, openFormula, deleteFormula, newFormula, saveFormula, macrothemes,
  } = useApp()

  const [compareSelection, setCompareSelection] = useState([])
  const [compareModal,     setCompareModal]     = useState(null)
  const [historyGroup,     setHistoryGroup]     = useState(null)
  const [showRecipeImport, setShowRecipeImport] = useState(false)

  // Reset compare selection when the active macro changes
  useEffect(() => { setCompareSelection([]) }, [selectedMacroId])

  const activeMacro   = macrothemes.find(m => m.id === selectedMacroId) ?? macrothemes[0]
  const activeMacroId = activeMacro?.id ?? null

  const countsByMacro = useMemo(() => {
    const counts = {}
    formulas.forEach(f => {
      const id = f.macrothemeId || 'orphan'
      counts[id] = (counts[id] || 0) + 1
    })
    return counts
  }, [formulas])

  // Raggruppa per productGroupId; ogni "card" = ultimo prodotto del gruppo
  const productGroups = useMemo(() => {
    const inMacro = formulas.filter(f => (f.macrothemeId || null) === activeMacroId)
    const groups = new Map()
    inMacro.forEach(f => {
      const groupId = f.productGroupId || f.id
      if (!groups.has(groupId)) groups.set(groupId, [])
      groups.get(groupId).push(f)
    })
    return Array.from(groups.entries()).map(([groupId, versions]) => {
      versions.sort((a, b) => (b.versionLabel || '').localeCompare(a.versionLabel || ''))
      return { groupId, versions, latest: versions[0] }
    }).sort((a, b) =>
      new Date(b.latest.updatedAt).getTime() - new Date(a.latest.updatedAt).getTime(),
    )
  }, [formulas, activeMacroId])

  function toggleCompare(formulaId) {
    setCompareSelection(prev => {
      if (prev.includes(formulaId)) return prev.filter(id => id !== formulaId)
      if (prev.length >= 2) return [prev[1], formulaId]
      return [...prev, formulaId]
    })
  }

  function openCompare() {
    if (compareSelection.length !== 2) return
    const [a, b] = compareSelection.map(id => formulas.find(f => f.id === id))
    if (a && b) setCompareModal({ a, b })
  }

  function handleStatusChange(formula, newStatus) {
    saveFormula({ ...formula, status: newStatus })
  }

  function handleDuplicate(formula) {
    const now = new Date().toISOString()
    const dup = {
      ...formula,
      id:             generateId('frm'),
      productGroupId: generateId('frm'),
      name:           `${formula.name} (copia)`,
      versionLabel:   'v1.0',
      versionNote:    '',
      status:         'draft',
      createdAt:      now,
      updatedAt:      now,
    }
    saveFormula(dup)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-galenic-primary">
              {activeMacro?.name || 'Tutti i progetti'}
            </h2>
            <p className="text-xs font-mono text-galenic-muted/70 mt-0.5">
              {productGroups.length} {productGroups.length === 1 ? 'prodotto' : 'prodotti'} ·
              {' '}{productGroups.reduce((s, g) => s + g.versions.length, 0)} versioni
            </p>
          </div>
          <div className="flex items-center gap-2">
            {compareSelection.length === 2 && (
              <Button variant="subtle" size="sm" onClick={openCompare}>
                <GitCompare size={12} className="mr-1.5" />
                Confronta 2/2
              </Button>
            )}
            {activeMacroId === 'macro-auto-caramelle' && (
              <Button variant="ghost" size="sm" onClick={() => setShowRecipeImport(true)}>
                <FileSpreadsheet size={13} className="mr-1.5" />
                Importa Ricetta
              </Button>
            )}
            <Button variant="primary" onClick={() => newFormula({ macrothemeId: activeMacroId })}>
              <Plus size={14} className="mr-1.5" />
              Nuova Formula
            </Button>
          </div>
        </div>

        {productGroups.length === 0 ? (
          <div className="bg-galenic-surface border border-dashed border-galenic-border rounded-xl py-16 text-center shadow-sm">
            <div className="text-sm font-medium text-galenic-muted/70 mb-2">
              Nessun progetto in questa categoria
            </div>
            <p className="text-xs font-mono text-galenic-muted/50 mb-3">
              {activeMacro?.name} è ancora vuoto
            </p>
            <button
              onClick={() => newFormula({ macrothemeId: activeMacroId })}
              className="text-xs font-mono text-galenic-accent hover:opacity-80"
            >
              + Crea il primo progetto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {productGroups.map(group => (
              <ProductCard
                key={group.groupId}
                group={group}
                openFormula={openFormula}
                onDuplicate={handleDuplicate}
                onShowHistory={() => setHistoryGroup(group)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

      {/* Recipe import modal (Sistemi Gommosi e Coated only) */}
      {showRecipeImport && (
        <RecipeImportModal
          macrothemeId={activeMacroId}
          onClose={() => setShowRecipeImport(false)}
        />
      )}

      {compareModal && (
        <CompareView
          formulaA={compareModal.a}
          formulaB={compareModal.b}
          onClose={() => setCompareModal(null)}
        />
      )}
      <VersionHistoryDrawer
        group={historyGroup}
        compareSelection={compareSelection}
        onToggleCompare={toggleCompare}
        onClose={() => setHistoryGroup(null)}
        onOpen={(f) => { openFormula(f); setHistoryGroup(null) }}
        onDelete={(id) => {
          if (window.confirm('Eliminare questa versione?')) deleteFormula(id)
        }}
        onCompareSelected={() => { openCompare(); setHistoryGroup(null) }}
        macrothemes={macrothemes}
      />
    </div>
  )
}

// ── Single Project Card (HubSpot-style) ────────────────────────────────────
function ProductCard({ group, openFormula, onDuplicate, onShowHistory, onStatusChange }) {
  const { latest, versions } = group
  const unit = latest.targetWeightUnit || 'mg'
  const w    = fromMg(latest.targetWeightMg, unit)

  return (
    <div className="group relative bg-galenic-surface border border-galenic-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-galenic-accent/30 transition-all">

      {/* Type indicator (corner ribbon) */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full ${TYPE_DOT[latest.type] || 'bg-galenic-muted'} shrink-0`} />
          <span className="text-xs font-mono uppercase tracking-wider text-galenic-muted/70">
            {latest.type}
          </span>
        </div>
        <StatusBadge
          status={latest.status}
          editable
          onChange={(newStatus) => onStatusChange(latest, newStatus)}
        />
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-galenic-primary leading-tight mb-1 truncate">
        {latest.name}
      </h3>

      {/* Version note */}
      {latest.versionNote && (
        <p className="text-xs font-mono text-galenic-muted/60 italic line-clamp-2 mb-2 leading-snug">
          "{latest.versionNote}"
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 text-xs font-mono text-galenic-muted/60 mb-3 flex-wrap">
        <span className="text-galenic-accent font-semibold">
          {latest.versionLabel || `v${latest.version || 1}`}
        </span>
        {versions.length > 1 && (
          <span className="flex items-center gap-0.5">
            <Layers size={9} />
            {versions.length}
          </span>
        )}
        <span>·</span>
        <span>{w.toFixed(unit === 'mg' ? 0 : 3)} {unit}</span>
        <span>·</span>
        <span>{new Date(latest.updatedAt).toLocaleDateString('it-IT')}</span>
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-galenic-border/40">
        <button
          onClick={() => openFormula(latest)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium text-galenic-accent hover:bg-galenic-accent/10 transition-colors"
        >
          <ExternalLink size={11} />
          Apri
        </button>
        <button
          onClick={() => onDuplicate(latest)}
          title="Duplica come nuovo progetto"
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-colors"
        >
          <Copy size={11} />
          <span className="hidden lg:inline">Duplica</span>
        </button>
        <button
          onClick={onShowHistory}
          title="Cronologia versioni"
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-colors"
        >
          <History size={11} />
          <span className="hidden lg:inline">{versions.length}</span>
        </button>
      </div>
    </div>
  )
}
