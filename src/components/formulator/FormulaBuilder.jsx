import React, { useState, Suspense, lazy } from 'react'
import { AlertTriangle, Download, Save, CheckCircle, Printer, GitBranch } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import FormulaHeader from './FormulaHeader.jsx'
import IngredientRow from './IngredientRow.jsx'
import IngredientSelector from './IngredientSelector.jsx'
import WarningBanner from './WarningBanner.jsx'
import NRVSummaryPanel from './NRVSummaryPanel.jsx'
import StabilityPanel from '../stability/StabilityPanel.jsx'
import CostSummary from '../stability/CostSummary.jsx'
import Button from '../ui/Button.jsx'
import ExportModal from './ExportModal.jsx'
import FillVisualization from './FillVisualization.jsx'
import BatchScalingPanel from './BatchScalingPanel.jsx'
import QuickActions from './QuickActions.jsx'
import VersionNoteModal from './VersionNoteModal.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import BriefingPanel from './BriefingPanel.jsx'
import { openLabReportWindow } from '../../utils/pdfReport.js'

// Lazy-load the chart so recharts doesn't bloat the initial bundle
const CompositionChart = lazy(() => import('./CompositionChart.jsx'))

export default function FormulaBuilder() {
  const {
    activeFormula,
    computed,
    rawMaterials,
    resetActiveFormula,
    saveFormula,
    setFormulaField,
    createSnapshot,
  } = useApp()
  const [showExport, setShowExport]           = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)

  if (!activeFormula) return null

  function handleSave(status = activeFormula.status) {
    saveFormula({ ...activeFormula, status })
  }

  function handleSnapshotConfirm(note) {
    createSnapshot(note)
    setShowVersionModal(false)
  }

  const hasWarnings   = computed?.warnings?.length > 0
  const totalPercent  = computed?.totalPercent ?? 0
  const totalWeightMg = computed?.totalWeightMg ?? 0
  const isOverweight  = totalPercent > 100.05
  const isBalanced    = totalPercent >= 99.9 && totalPercent <= 100.1

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={resetActiveFormula}>
            ← Torna alla Lista
          </Button>
          {/* Version label + nota */}
          <div className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-lg bg-galenic-elevated/50 border border-galenic-border min-w-0">
            <GitBranch size={11} className="text-galenic-accent shrink-0" />
            <span className="text-galenic-accent font-semibold shrink-0">
              {activeFormula.versionLabel || `v${activeFormula.version || 1}.0`}
            </span>
            {activeFormula.versionNote && (
              <span className="text-galenic-muted/70 italic truncate hidden sm:inline">
                · "{activeFormula.versionNote}"
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status lifecycle dropdown */}
          <StatusBadge
            status={activeFormula.status}
            editable
            onChange={(newStatus) => setFormulaField('status', newStatus)}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => openLabReportWindow(activeFormula, computed, rawMaterials)}
            title="Stampa foglio di lavorazione PDF"
          >
            <Printer size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Stampa</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVersionModal(true)}
            title="Crea nuova versione con nota"
          >
            <GitBranch size={14} className="mr-1.5" />
            <span className="hidden sm:inline">
              Nuova versione
            </span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowExport(true)}>
            <Download size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Esporta</span>
          </Button>
          <Button variant="subtle" size="sm" onClick={() => handleSave()}>
            <Save size={14} className="mr-1.5" />
            Salva
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleSave('ready')}>
            <CheckCircle size={14} className="mr-1.5" />
            Pubblica
          </Button>
        </div>
      </div>

      {/* Formula header: name, type, target weight */}
      <FormulaHeader />

      {/* Warnings */}
      {hasWarnings && <WarningBanner warnings={computed.warnings} />}

      {/* Type-specific analysis: capsule volume, tablet friability, liquid density */}
      <FillVisualization />

      {/* Ingredients table */}
      <div className="bg-galenic-surface border border-galenic-border rounded-xl overflow-hidden">
        {/* Table header bar */}
        <div className="px-5 py-3 border-b border-galenic-border bg-galenic-elevated/50 flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
            Ingredienti
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-galenic-muted">
              Totale:{' '}
              <span className={`font-semibold ${isOverweight ? 'text-galenic-danger' : 'text-galenic-primary'}`}>
                {isOverweight && <AlertTriangle size={11} className="inline mr-1 mb-px" />}
                {totalPercent.toFixed(2)}%
              </span>
            </span>
            <span className="text-galenic-muted hidden sm:inline">
              {totalWeightMg.toFixed(1)} / {activeFormula.targetWeightMg} mg
            </span>
            {isBalanced && (
              <span className="text-galenic-ok flex items-center gap-1">
                <CheckCircle size={11} />
                Bilanciata
              </span>
            )}
          </div>
        </div>

        {/* Scrollable table with sticky header */}
        {activeFormula.ingredients.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-[28rem]">
            <table className="w-full text-sm font-mono galenic-table">
              <thead className="sticky top-0 z-10">
                <tr className="bg-galenic-elevated border-b border-galenic-border">
                  <th className="px-4 py-3 text-left text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">Materia Prima</th>
                  <th className="px-4 py-3 text-left text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">Quantità</th>
                  <th className="px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">% Peso</th>
                  <th className="px-4 py-3 text-left text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">Apporto Reale</th>
                  <th className="px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">VNR %</th>
                  <th className="px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">Fill</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(computed?.rows || []).map((row, index) => (
                  <IngredientRow key={row.rowId} computedRow={row} rowIndex={index} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-galenic-muted font-mono">
            Nessun ingrediente. Aggiungi la prima materia prima.
          </div>
        )}

        {/* Quick actions: "Colma a volume" + anti-caking auto-insert */}
        {activeFormula.ingredients.length > 0 && <QuickActions />}

        {/* Ingredient selector */}
        <IngredientSelector />
      </div>

      {/* Composition chart — lazy loaded, only when there are ingredients */}
      {computed?.rows?.length > 0 && (
        <Suspense fallback={
          <div className="h-44 bg-galenic-surface border border-galenic-border rounded-xl animate-pulse" />
        }>
          <CompositionChart rows={computed.rows} rawMaterials={rawMaterials} />
        </Suspense>
      )}

      {/* NRV summary */}
      <NRVSummaryPanel />

      {/* Batch scaling */}
      <BatchScalingPanel />

      {/* Stability panel — only for Liquidi */}
      {activeFormula.type === 'Liquidi' && <StabilityPanel />}

      {/* Cost summary */}
      <CostSummary />

      {/* Briefing panel — visible when formula was created from a briefing */}
      <BriefingPanel />

      {/* Export modal */}
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />

      {/* Version snapshot modal */}
      <VersionNoteModal
        open={showVersionModal}
        currentLabel={activeFormula.versionLabel || `v${activeFormula.version || 1}.0`}
        onCancel={() => setShowVersionModal(false)}
        onConfirm={handleSnapshotConfirm}
      />
    </div>
  )
}
