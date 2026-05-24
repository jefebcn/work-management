import React, { useState, useMemo, useEffect } from 'react'
import {
  Plus, GitCompare, Layers, ExternalLink, Copy, History,
  FileSpreadsheet, Folder, FolderOpen, FolderPlus, ChevronRight,
  Trash2, Pencil, FolderInput, MoreHorizontal, X, Check,
} from 'lucide-react'
import RecipeImportModal from './RecipeImportModal.jsx'
import MoveFolderModal from './MoveFolderModal.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { generateId } from '../../utils/idGenerator.js'
import Button from '../ui/Button.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import { fromMg } from '../../utils/weightConversions.js'
import CompareView from './CompareView.jsx'
import VersionHistoryDrawer from './VersionHistoryDrawer.jsx'

const TYPE_DOT = {
  Compresse:                'bg-galenic-accent',
  Capsule:                  'bg-galenic-ok',
  Polveri:                  'bg-yellow-400',
  Liquidi:                  'bg-blue-400',
  'Sistemi Gommosi e Coated': 'bg-orange-400',
}

export default function FormulaList({ selectedMacroId }) {
  const {
    formulas, openFormula, deleteFormula, newFormula, saveFormula, macrothemes,
    folders, createFolder, renameFolder, deleteFolder,
  } = useApp()

  const [compareSelection,  setCompareSelection]  = useState([])
  const [compareModal,      setCompareModal]       = useState(null)
  const [historyGroup,      setHistoryGroup]       = useState(null)
  const [showRecipeImport,  setShowRecipeImport]   = useState(false)
  const [currentFolderId,   setCurrentFolderId]    = useState(null)
  const [moveTarget,        setMoveTarget]         = useState(null)  // formula to move
  const [creatingFolder,    setCreatingFolder]     = useState(false)
  const [newFolderName,     setNewFolderName]      = useState('')
  const [renamingFolderId,  setRenamingFolderId]   = useState(null)
  const [renameValue,       setRenameValue]        = useState('')

  // Reset folder navigation when the active macro changes
  useEffect(() => {
    setCompareSelection([])
    setCurrentFolderId(null)
  }, [selectedMacroId])

  const activeMacro   = macrothemes.find(m => m.id === selectedMacroId) ?? macrothemes[0]
  const activeMacroId = activeMacro?.id ?? null

  // Folders belonging to the active macrotheme, sorted alphabetically
  const macroFolders = useMemo(
    () => folders
      .filter(f => (f.macrothemeId || null) === activeMacroId)
      .sort((a, b) => a.name.localeCompare(b.name, 'it')),
    [folders, activeMacroId],
  )

  // Product groups — scoped by macrotheme AND current folder
  const productGroups = useMemo(() => {
    const inScope = formulas.filter(f => {
      if ((f.macrothemeId || null) !== activeMacroId) return false
      return currentFolderId !== null
        ? (f.folderId || null) === currentFolderId
        : (f.folderId || null) === null
    })
    const groups = new Map()
    inScope.forEach(f => {
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
  }, [formulas, activeMacroId, currentFolderId])

  // Count of projects in each folder (for badges)
  const folderCounts = useMemo(() => {
    const counts = {}
    formulas
      .filter(f => (f.macrothemeId || null) === activeMacroId && f.folderId)
      .forEach(f => {
        const gId = f.productGroupId || f.id
        counts[f.folderId] = counts[f.folderId] || new Set()
        counts[f.folderId].add(gId)
      })
    return Object.fromEntries(Object.entries(counts).map(([k, s]) => [k, s.size]))
  }, [formulas, activeMacroId])

  const currentFolder = macroFolders.find(f => f.id === currentFolderId) ?? null

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
      folderId:       null,
      createdAt:      now,
      updatedAt:      now,
    }
    saveFormula(dup)
  }

  function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name) return
    createFolder({ name, macrothemeId: activeMacroId })
    setNewFolderName('')
    setCreatingFolder(false)
  }

  function handleRenameFolder(id) {
    renameFolder(id, renameValue)
    setRenamingFolderId(null)
    setRenameValue('')
  }

  function handleDeleteFolder(id) {
    if (!window.confirm('Eliminare la cartella? I progetti al suo interno torneranno alla radice.')) return
    // Move all formulas in this folder back to root
    formulas
      .filter(f => (f.folderId || null) === id)
      .forEach(f => saveFormula({ ...f, folderId: null }))
    deleteFolder(id)
    if (currentFolderId === id) setCurrentFolderId(null)
  }

  const isInFolder = currentFolderId !== null
  const showFolders = !isInFolder && macroFolders.length > 0
  const isEmpty     = (showFolders ? macroFolders.length : 0) + productGroups.length === 0

  return (
    <div>
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-xs font-mono text-galenic-muted/60 mb-1">
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`hover:text-galenic-primary transition-colors ${!isInFolder ? 'text-galenic-primary font-semibold pointer-events-none' : ''}`}
            >
              {activeMacro?.name || 'Progetti'}
            </button>
            {isInFolder && (
              <>
                <ChevronRight size={10} className="opacity-40" />
                <span className="flex items-center gap-1 text-galenic-primary font-semibold">
                  <Folder size={10} className="text-galenic-accent" />
                  {currentFolder?.name || '—'}
                </span>
              </>
            )}
          </nav>

          <p className="text-xs font-mono text-galenic-muted/70">
            {isInFolder
              ? `${productGroups.length} ${productGroups.length === 1 ? 'progetto' : 'progetti'} in questa cartella`
              : `${macroFolders.length} cartelle · ${productGroups.length} ${productGroups.length === 1 ? 'progetto' : 'progetti'} liberi`
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {compareSelection.length === 2 && (
            <Button variant="subtle" size="sm" onClick={openCompare}>
              <GitCompare size={12} className="mr-1.5" />
              Confronta 2/2
            </Button>
          )}
          {activeMacroId === 'macro-auto-caramelle' && !isInFolder && (
            <Button variant="ghost" size="sm" onClick={() => setShowRecipeImport(true)}>
              <FileSpreadsheet size={13} className="mr-1.5" />
              Importa Ricetta
            </Button>
          )}
          {!isInFolder && (
            <Button variant="ghost" size="sm" onClick={() => setCreatingFolder(true)}>
              <FolderPlus size={13} className="mr-1.5" />
              Nuova Cartella
            </Button>
          )}
          <Button variant="primary" onClick={() => newFormula({ macrothemeId: activeMacroId, folderId: currentFolderId })}>
            <Plus size={14} className="mr-1.5" />
            Nuova Formula
          </Button>
        </div>
      </div>

      {/* ── Inline new-folder input ────────────────────────────────────────── */}
      {creatingFolder && (
        <div className="mb-3 flex items-center gap-2 p-3 bg-galenic-elevated/50 border border-galenic-accent/30 rounded-xl">
          <FolderPlus size={14} className="text-galenic-accent shrink-0" />
          <input
            autoFocus
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
            }}
            placeholder="Nome cartella..."
            className="flex-1 bg-transparent text-sm font-mono text-galenic-primary placeholder-galenic-muted/50 outline-none"
          />
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
            className="px-3 py-1 rounded-lg bg-galenic-accent text-white text-xs font-mono disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Crea
          </button>
          <button
            onClick={() => { setCreatingFolder(false); setNewFolderName('') }}
            className="p-1 text-galenic-muted hover:text-galenic-primary transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {isEmpty && !creatingFolder && (
        <div className="bg-galenic-surface border border-dashed border-galenic-border rounded-xl py-16 text-center shadow-sm">
          <div className="text-sm font-medium text-galenic-muted/70 mb-2">
            {isInFolder ? 'Cartella vuota' : 'Nessun progetto in questa categoria'}
          </div>
          <p className="text-xs font-mono text-galenic-muted/50 mb-3">
            {isInFolder
              ? `Aggiungi un progetto o spostane uno nella cartella "${currentFolder?.name}"`
              : `${activeMacro?.name} è ancora vuoto`
            }
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => newFormula({ macrothemeId: activeMacroId, folderId: currentFolderId })}
              className="text-xs font-mono text-galenic-accent hover:opacity-80"
            >
              + Crea il primo progetto
            </button>
            {!isInFolder && (
              <>
                <span className="text-galenic-muted/30">·</span>
                <button
                  onClick={() => setCreatingFolder(true)}
                  className="text-xs font-mono text-galenic-muted hover:text-galenic-primary"
                >
                  + Nuova cartella
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Grid: folders + project cards ─────────────────────────────────── */}
      {!isEmpty && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">

          {/* Folder cards (root view only) */}
          {showFolders && macroFolders.map(folder => (
            <FolderCard
              key={folder.id}
              folder={folder}
              count={folderCounts[folder.id] || 0}
              isRenaming={renamingFolderId === folder.id}
              renameValue={renameValue}
              onRenameChange={setRenameValue}
              onRenameConfirm={() => handleRenameFolder(folder.id)}
              onRenameStart={() => { setRenamingFolderId(folder.id); setRenameValue(folder.name) }}
              onRenameCancel={() => { setRenamingFolderId(null); setRenameValue('') }}
              onOpen={() => setCurrentFolderId(folder.id)}
              onDelete={() => handleDeleteFolder(folder.id)}
            />
          ))}

          {/* Project cards */}
          {productGroups.map(group => (
            <ProductCard
              key={group.groupId}
              group={group}
              openFormula={openFormula}
              onDuplicate={handleDuplicate}
              onShowHistory={() => setHistoryGroup(group)}
              onStatusChange={handleStatusChange}
              onMove={() => setMoveTarget(group.latest)}
            />
          ))}
        </div>
      )}

      {/* ── Modals & drawers ───────────────────────────────────────────────── */}
      {showRecipeImport && (
        <RecipeImportModal macrothemeId={activeMacroId} onClose={() => setShowRecipeImport(false)} />
      )}

      {moveTarget && (
        <MoveFolderModal
          formula={moveTarget}
          activeMacroId={activeMacroId}
          onClose={() => setMoveTarget(null)}
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

// ── Folder card ─────────────────────────────────────────────────────────────
function FolderCard({ folder, count, isRenaming, renameValue, onRenameChange, onRenameConfirm, onRenameStart, onRenameCancel, onOpen, onDelete }) {
  return (
    <div className="group relative bg-galenic-surface border border-galenic-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-galenic-accent/20 transition-all">
      <div className="flex items-start gap-3">
        {/* Folder icon */}
        <div className="w-10 h-10 rounded-xl bg-galenic-accent/10 border border-galenic-accent/20 flex items-center justify-center shrink-0 group-hover:bg-galenic-accent/15 transition-colors">
          <FolderOpen size={18} className="text-galenic-accent" />
        </div>

        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={renameValue}
                onChange={e => onRenameChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') onRenameConfirm()
                  if (e.key === 'Escape') onRenameCancel()
                }}
                className="flex-1 bg-galenic-elevated border border-galenic-accent/40 rounded-md px-2 py-0.5 text-sm font-semibold text-galenic-primary outline-none"
              />
              <button onClick={onRenameConfirm} className="p-1 text-galenic-ok hover:opacity-80">
                <Check size={12} />
              </button>
              <button onClick={onRenameCancel} className="p-1 text-galenic-muted hover:text-galenic-primary">
                <X size={12} />
              </button>
            </div>
          ) : (
            <h3 className="text-sm font-semibold text-galenic-primary leading-tight truncate">
              {folder.name}
            </h3>
          )}
          <p className="text-xs font-mono text-galenic-muted/60 mt-0.5">
            {count} {count === 1 ? 'progetto' : 'progetti'}
          </p>
        </div>

        {/* Context actions (visible on hover) */}
        {!isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onRenameStart}
              title="Rinomina cartella"
              className="p-1.5 rounded-md text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-colors"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={onDelete}
              title="Elimina cartella"
              className="p-1.5 rounded-md text-galenic-muted hover:text-galenic-danger hover:bg-galenic-danger/10 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Open button */}
      <button
        onClick={onOpen}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-galenic-accent hover:bg-galenic-accent/10 border border-galenic-border/40 hover:border-galenic-accent/20 transition-all"
      >
        <FolderOpen size={11} />
        Apri cartella
      </button>
    </div>
  )
}

// ── Project card ────────────────────────────────────────────────────────────
function ProductCard({ group, openFormula, onDuplicate, onShowHistory, onStatusChange, onMove }) {
  const { latest, versions } = group
  const unit = latest.targetWeightUnit || 'mg'
  const w    = fromMg(latest.targetWeightMg, unit)

  return (
    <div className="group relative bg-galenic-surface border border-galenic-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-galenic-accent/30 transition-all">

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

      <h3 className="text-sm font-semibold text-galenic-primary leading-tight mb-1 truncate">
        {latest.name}
      </h3>

      {latest.versionNote && (
        <p className="text-xs font-mono text-galenic-muted/60 italic line-clamp-2 mb-2 leading-snug">
          "{latest.versionNote}"
        </p>
      )}

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
          onClick={onMove}
          title="Sposta in cartella"
          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-colors"
        >
          <FolderInput size={11} />
          <span className="hidden lg:inline">Sposta</span>
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
