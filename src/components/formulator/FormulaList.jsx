import React, { useState, useMemo } from 'react'
import {
  Plus, Folder, FolderPlus, ChevronRight, ChevronDown, GitCompare,
  Trash2, FolderEdit, Layers,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import { fromMg } from '../../utils/weightConversions.js'
import MacrothemeForm from './MacrothemeForm.jsx'
import CompareView from './CompareView.jsx'

const TYPE_COLORS = {
  Compresse: 'accent',
  Capsule:   'ok',
  Polveri:   'caution',
  Liquidi:   'neutral',
}

export default function FormulaList() {
  const {
    formulas, openFormula, deleteFormula, newFormula,
    macrothemes, addMacrotheme, updateMacrotheme, deleteMacrotheme,
    setMacrothemeForFormula,
  } = useApp()

  const [selectedMacroId, setSelectedMacroId] = useState(macrothemes[0]?.id ?? null)
  const [expandedGroups,  setExpandedGroups]  = useState(new Set())
  const [compareSelection, setCompareSelection] = useState([])  // array di formula IDs (max 2)
  const [compareModal,    setCompareModal]    = useState(null)  // { a, b }
  const [macroModal,      setMacroModal]      = useState(null)  // { mode, initial, id }

  // Mantieni selezione valida
  const activeMacro = macrothemes.find(m => m.id === selectedMacroId) ?? macrothemes[0]
  const activeMacroId = activeMacro?.id

  // Conta formule per macrotheme
  const countsByMacro = useMemo(() => {
    const counts = {}
    formulas.forEach(f => {
      const id = f.macrothemeId || 'orphan'
      counts[id] = (counts[id] || 0) + 1
    })
    return counts
  }, [formulas])

  // Raggruppa per productGroupId nel macrotheme attivo
  const productGroups = useMemo(() => {
    const inMacro = formulas.filter(f => (f.macrothemeId || null) === activeMacroId)
    const groups = new Map()
    inMacro.forEach(f => {
      const groupId = f.productGroupId || f.id
      if (!groups.has(groupId)) groups.set(groupId, [])
      groups.get(groupId).push(f)
    })
    // Ordina versioni per versionLabel desc dentro ogni gruppo
    return Array.from(groups.entries()).map(([groupId, versions]) => {
      versions.sort((a, b) => (b.versionLabel || '').localeCompare(a.versionLabel || ''))
      return { groupId, versions, latest: versions[0] }
    }).sort((a, b) =>
      new Date(b.latest.updatedAt).getTime() - new Date(a.latest.updatedAt).getTime(),
    )
  }, [formulas, activeMacroId])

  function toggleGroup(groupId) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  function toggleCompare(formulaId) {
    setCompareSelection(prev => {
      if (prev.includes(formulaId)) return prev.filter(id => id !== formulaId)
      if (prev.length >= 2) return [prev[1], formulaId]   // FIFO: keep last 2
      return [...prev, formulaId]
    })
  }

  function openCompare() {
    if (compareSelection.length !== 2) return
    const [a, b] = compareSelection.map(id => formulas.find(f => f.id === id))
    if (a && b) setCompareModal({ a, b })
  }

  function handleCreateMacro(name) {
    const created = addMacrotheme(name)
    if (created) setSelectedMacroId(created.id)
    setMacroModal(null)
  }

  function handleRenameMacro(name) {
    if (macroModal?.id) updateMacrotheme(macroModal.id, { name })
    setMacroModal(null)
  }

  function handleDeleteMacro(id) {
    if (!window.confirm('Eliminare questo macrotema? Le formule contenute saranno spostate in "Compresse".')) return
    // Sposta formule al primo macrotheme auto disponibile
    const fallback = macrothemes.find(m => m.kind === 'auto')
    if (fallback) {
      formulas.filter(f => f.macrothemeId === id).forEach(f => {
        setMacrothemeForFormula(f.id, fallback.id)
      })
    }
    deleteMacrotheme(id)
    if (selectedMacroId === id) setSelectedMacroId(fallback?.id ?? null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">

      {/* ── Pannello sinistro: macrotemi ────────────────────────────────── */}
      <aside className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-mono font-semibold text-galenic-muted uppercase tracking-wider">
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

        <div className="space-y-1">
          {macrothemes.map(m => {
            const isActive = m.id === activeMacroId
            const count = countsByMacro[m.id] || 0
            return (
              <div key={m.id} className="group relative">
                <button
                  onClick={() => { setSelectedMacroId(m.id); setCompareSelection([]) }}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all',
                    isActive
                      ? 'bg-galenic-accent/10 border border-galenic-accent/30 text-galenic-accent'
                      : 'border border-transparent text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/60',
                  ].join(' ')}
                >
                  <Folder size={13} className={isActive ? 'text-galenic-accent' : 'opacity-60'} />
                  <span className="text-xs font-medium truncate flex-1">{m.name}</span>
                  <span className="text-xs font-mono opacity-60 tabular-nums">{count}</span>
                </button>

                {/* Azioni hover (solo per custom) */}
                {m.kind === 'custom' && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5 bg-galenic-surface/95 backdrop-blur rounded">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMacroModal({ mode: 'rename', initial: m.name, id: m.id }) }}
                      title="Rinomina"
                      className="p-1 rounded text-galenic-muted hover:text-galenic-accent"
                    >
                      <FolderEdit size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteMacro(m.id) }}
                      title="Elimina"
                      className="p-1 rounded text-galenic-muted hover:text-galenic-danger"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Pannello destro: prodotti del macrotheme attivo ─────────────── */}
      <div>
        {/* Header con azioni */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-mono font-semibold text-galenic-primary uppercase tracking-widest">
              {activeMacro?.name || 'Tutte le formule'}
            </h2>
            <p className="text-xs font-mono text-galenic-muted mt-0.5">
              {productGroups.length} {productGroups.length === 1 ? 'prodotto' : 'prodotti'} ·
              {' '}{productGroups.reduce((s, g) => s + g.versions.length, 0)} versioni totali
            </p>
          </div>
          <div className="flex items-center gap-2">
            {compareSelection.length === 2 && (
              <Button variant="subtle" size="sm" onClick={openCompare}>
                <GitCompare size={12} className="mr-1.5" />
                Confronta {compareSelection.length}/2
              </Button>
            )}
            <Button variant="primary" onClick={() => newFormula({ macrothemeId: activeMacroId })}>
              <Plus size={14} className="mr-1.5" />
              Nuova Formula
            </Button>
          </div>
        </div>

        {/* Lista gruppi prodotto */}
        {productGroups.length === 0 ? (
          <div className="bg-galenic-surface border border-galenic-border rounded-xl py-12 text-center">
            <div className="text-xs font-mono text-galenic-muted/60">
              Nessuna formula in <span className="text-galenic-primary">{activeMacro?.name}</span>
            </div>
            <button
              onClick={() => newFormula({ macrothemeId: activeMacroId })}
              className="mt-3 text-xs font-mono text-galenic-accent hover:opacity-80"
            >
              + Crea la prima formula
            </button>
          </div>
        ) : (
          <div className="bg-galenic-surface border border-galenic-border rounded-xl overflow-hidden divide-y divide-galenic-border">
            {productGroups.map(group => (
              <ProductGroupRow
                key={group.groupId}
                group={group}
                expanded={expandedGroups.has(group.groupId)}
                onToggle={() => toggleGroup(group.groupId)}
                compareSelection={compareSelection}
                onToggleCompare={toggleCompare}
                openFormula={openFormula}
                deleteFormula={deleteFormula}
                macrothemes={macrothemes}
                onChangeMacro={(formulaId, macroId) => setMacrothemeForFormula(formulaId, macroId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modali */}
      <MacrothemeForm
        open={!!macroModal}
        initialName={macroModal?.initial || ''}
        onCancel={() => setMacroModal(null)}
        onConfirm={macroModal?.mode === 'create' ? handleCreateMacro : handleRenameMacro}
      />
      {compareModal && (
        <CompareView
          formulaA={compareModal.a}
          formulaB={compareModal.b}
          onClose={() => setCompareModal(null)}
        />
      )}
    </div>
  )
}

// ── Riga gruppo prodotto (espandibile con elenco versioni) ─────────────────
function ProductGroupRow({
  group, expanded, onToggle, compareSelection, onToggleCompare,
  openFormula, deleteFormula, macrothemes, onChangeMacro,
}) {
  const { latest, versions } = group
  const unit = latest.targetWeightUnit || 'mg'
  const w    = fromMg(latest.targetWeightMg, unit)

  return (
    <div className="px-4 py-3">
      {/* Header gruppo */}
      <div className="flex items-center gap-3">
        <button onClick={onToggle} className="text-galenic-muted hover:text-galenic-primary transition-colors">
          {expanded
            ? <ChevronDown size={14} />
            : <ChevronRight size={14} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-galenic-primary truncate">{latest.name}</span>
            <Badge variant={TYPE_COLORS[latest.type] || 'neutral'}>{latest.type}</Badge>
            {versions.length > 1 && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-galenic-elevated border border-galenic-border text-galenic-muted">
                <Layers size={9} className="inline mr-0.5 -mt-0.5" />
                {versions.length} versioni
              </span>
            )}
            <span className="text-xs font-mono text-galenic-muted/60">
              · {latest.versionLabel || `v${latest.version}`} · {w.toFixed(unit === 'mg' ? 0 : 3)} {unit}
            </span>
          </div>
          {latest.versionNote && (
            <div className="text-xs font-mono text-galenic-muted/60 italic mt-0.5 truncate">
              "{latest.versionNote}"
            </div>
          )}
        </div>

        {/* Dropdown cambio macrotheme */}
        <select
          value={latest.macrothemeId || ''}
          onChange={e => versions.forEach(v => onChangeMacro(v.id, e.target.value))}
          onClick={e => e.stopPropagation()}
          title="Sposta in altro macrotema"
          className="bg-galenic-elevated border border-galenic-border rounded-lg px-2 py-1 text-xs font-mono text-galenic-muted hover:text-galenic-primary outline-none focus:border-galenic-accent transition-colors"
        >
          {macrothemes.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <Button size="sm" variant="primary" onClick={() => openFormula(latest)}>
          Apri
        </Button>
      </div>

      {/* Versioni espanse */}
      {expanded && (
        <div className="mt-3 ml-7 border-l-2 border-galenic-border/40 pl-4 space-y-1">
          {versions.map(v => {
            const isSelected = compareSelection.includes(v.id)
            return (
              <div
                key={v.id}
                className={[
                  'flex items-center gap-3 px-2 py-1.5 rounded-md transition-all',
                  isSelected
                    ? 'bg-galenic-accent/10 border border-galenic-accent/30'
                    : 'border border-transparent hover:bg-galenic-elevated/40',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleCompare(v.id)}
                  className="accent-galenic-accent"
                />
                <span className="text-xs font-mono font-semibold text-galenic-accent w-12 shrink-0">
                  {v.versionLabel || `v${v.version}`}
                </span>
                <div className="flex-1 min-w-0">
                  {v.versionNote
                    ? <div className="text-xs font-mono text-galenic-primary truncate">"{v.versionNote}"</div>
                    : <div className="text-xs font-mono text-galenic-muted/40 italic truncate">— nessuna nota —</div>
                  }
                </div>
                <Badge variant={v.status === 'finalized' ? 'ok' : 'neutral'}>
                  {v.status === 'finalized' ? 'Finalizzata' : 'Bozza'}
                </Badge>
                <span className="text-xs font-mono text-galenic-muted/60 hidden sm:inline">
                  {new Date(v.updatedAt).toLocaleDateString('it-IT')}
                </span>
                <button
                  onClick={() => openFormula(v)}
                  className="text-xs font-mono text-galenic-accent hover:opacity-80 transition-opacity"
                >
                  Apri
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Eliminare ${v.versionLabel || `v${v.version}`}?`)) deleteFormula(v.id)
                  }}
                  className="text-galenic-muted hover:text-galenic-danger transition-colors"
                  title="Elimina versione"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
