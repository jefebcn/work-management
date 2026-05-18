import React, { useState, useEffect, Suspense, lazy } from 'react'
import { AlertTriangle, Download, Save, CheckCircle, Printer, GitBranch, Scale, Euro, Beaker, Plus, Layers } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import FormulaHeader from './FormulaHeader.jsx'
import IngredientRow from './IngredientRow.jsx'
import IngredientDrawer from './IngredientDrawer.jsx'
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
import LabelPanel from './LabelPanel.jsx'
import SoftCoatingPanel from './SoftCoatingPanel.jsx'
import { openLabReportWindow } from '../../utils/pdfReport.js'

const CompositionChart = lazy(() => import('./CompositionChart.jsx'))

const TABS = [
  { id: 'balance',  label: 'Composizione',       icon: <Scale size={13} /> },
  { id: 'costs',    label: 'Analisi Economica',  icon: <Euro size={13} /> },
  { id: 'label',    label: 'Claims & Etichetta', icon: <Beaker size={13} /> },
  { id: 'coating',  label: 'Soft Coating',       icon: <Layers size={13} /> },
]

// Vertical fill bar — rises as formula fills, pulses red when over target weight
function FillBar({ totalPercent }) {
  const clamped = Math.min(totalPercent, 100)
  const over    = totalPercent > 100.05
  const near    = !over && totalPercent > 88
  const color   = over ? 'bg-galenic-danger/70 fill-pulse-red'
                : near ? 'bg-galenic-warning/60'
                       : 'bg-galenic-accent/50'

  return (
    <div className="hidden lg:flex flex-col items-center gap-2 w-10 shrink-0 pt-1 self-start sticky top-20">
      <span className={`text-xs font-mono tabular-nums leading-none ${over ? 'text-galenic-danger font-semibold' : 'text-galenic-muted/50'}`}>
        {totalPercent.toFixed(0)}%
      </span>
      <div className="w-4 h-48 bg-galenic-elevated border border-galenic-border rounded-full overflow-hidden flex flex-col-reverse">
        <div
          className={`${color} transition-all duration-500 rounded-full`}
          style={{ height: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-mono text-galenic-muted/30 leading-none">0%</span>
    </div>
  )
}

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
  const [showExport, setShowExport]             = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [activeTab, setActiveTab]               = useState(
    () => activeFormula?.type === 'Sistemi Gommosi e Coated' ? 'coating' : 'balance',
  )
  const [unitMode, setUnitMode]                 = useState('dose') // 'dose' | 'die'
  const [drawerOpen, setDrawerOpen]             = useState(false)

  // Reset to the most relevant tab when a different formula is opened
  useEffect(() => {
    setActiveTab(activeFormula?.type === 'Sistemi Gommosi e Coated' ? 'coating' : 'balance')
  }, [activeFormula?.id])

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
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={resetActiveFormula}>
            ← Torna alla Lista
          </Button>
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
          <StatusBadge
            status={activeFormula.status}
            editable
            onChange={(newStatus) => setFormulaField('status', newStatus)}
          />
          <Button
            variant="ghost" size="sm"
            onClick={() => openLabReportWindow(activeFormula, computed, rawMaterials)}
            title="Stampa foglio di lavorazione PDF"
          >
            <Printer size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Stampa</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowVersionModal(true)}>
            <GitBranch size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Nuova versione</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowExport(true)}>
            <Download size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Esporta</span>
          </Button>
          <Button variant="subtle" size="sm" onClick={() => handleSave()}>
            <Save size={14} className="mr-1.5" />Salva
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleSave('ready')}>
            <CheckCircle size={14} className="mr-1.5" />Pubblica
          </Button>
        </div>
      </div>

      {/* Formula header */}
      <FormulaHeader />

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 bg-galenic-elevated/40 rounded-xl border border-galenic-border w-fit max-w-full overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
              activeTab === tab.id
                ? 'bg-galenic-surface text-galenic-accent shadow-sm border border-galenic-border'
                : 'text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/60',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Composizione ── */}
      {activeTab === 'balance' && (
        <div key="balance" className="space-y-4 tab-fade-in">
          {hasWarnings && <WarningBanner warnings={computed.warnings} />}
          <FillVisualization />

          {/* Table + vertical fill bar side by side */}
          <div className="flex gap-3 items-start">
            <div className="flex-1 min-w-0 space-y-4">

              <div className="bg-galenic-surface border border-galenic-border rounded-xl overflow-hidden">
                {/* Table header row */}
                <div className="px-5 py-3 border-b border-galenic-border bg-galenic-elevated/50 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
                      Ingredienti
                    </h3>
                    {/* mg/dose ↔ mg/die toggle */}
                    <div className="flex items-center gap-0.5 p-0.5 bg-galenic-elevated rounded-lg border border-galenic-border text-xs font-mono">
                      {['dose', 'die'].map(m => (
                        <button
                          key={m}
                          onClick={() => setUnitMode(m)}
                          className={[
                            'px-2 py-0.5 rounded-md transition-all',
                            unitMode === m
                              ? 'bg-galenic-surface text-galenic-accent shadow-sm'
                              : 'text-galenic-muted hover:text-galenic-primary',
                          ].join(' ')}
                        >
                          /{m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 text-xs font-mono">
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
                          <CheckCircle size={11} />Bilanciata
                        </span>
                      )}
                    </div>

                    {/* Drawer trigger */}
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-galenic-accent text-white text-xs font-mono font-medium hover:opacity-90 active:scale-95 transition-all shrink-0"
                    >
                      <Plus size={12} />
                      <span className="hidden sm:inline">Aggiungi</span>
                    </button>
                  </div>
                </div>

                {activeFormula.ingredients.length > 0 ? (
                  <div className="overflow-x-auto overflow-y-auto max-h-[28rem]">
                    <table className="w-full text-sm font-mono galenic-table">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-galenic-elevated border-b border-galenic-border">
                          <th className="px-3 sm:px-4 py-3 text-left text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">Materia Prima</th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">Quantità</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">% Peso</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap print:font-bold print:bg-gray-100">g / 1 kg</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-left text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">Apporto Reale</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">VNR %</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider font-medium whitespace-nowrap">Fill</th>
                          <th className="px-2 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {(computed?.rows || []).map((row, index) => (
                          <IngredientRow key={row.rowId} computedRow={row} rowIndex={index} unitMode={unitMode} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-14 text-center">
                    <div className="text-xs text-galenic-muted font-mono mb-4">
                      Nessun ingrediente. Apri il database per iniziare.
                    </div>
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-galenic-accent text-white text-xs font-mono hover:opacity-90 transition-opacity"
                    >
                      <Plus size={12} />
                      Apri database materie prime
                    </button>
                  </div>
                )}

                {activeFormula.ingredients.length > 0 && <QuickActions />}

                {/* Bottom "add more" row */}
                {activeFormula.ingredients.length > 0 && (
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-3 border-t border-dashed border-galenic-border text-xs font-mono text-galenic-muted hover:text-galenic-accent hover:bg-galenic-elevated/30 transition-all"
                  >
                    <Plus size={11} />
                    Aggiungi materia prima
                  </button>
                )}
              </div>

              {computed?.rows?.length > 0 && (
                <Suspense fallback={
                  <div className="h-44 bg-galenic-surface border border-galenic-border rounded-xl animate-pulse" />
                }>
                  <CompositionChart rows={computed.rows} rawMaterials={rawMaterials} />
                </Suspense>
              )}
            </div>

            {/* Sticky vertical fill bar */}
            <FillBar totalPercent={totalPercent} />
          </div>
        </div>
      )}

      {/* ── Tab 2: Analisi Economica ── */}
      {activeTab === 'costs' && (
        <div key="costs" className="space-y-4 tab-fade-in">
          <BriefingPanel />
          <CostSummary />
          <BatchScalingPanel />
          {activeFormula.type === 'Liquidi' && <StabilityPanel />}
        </div>
      )}

      {/* ── Tab 3: Claims & Etichetta ── */}
      {activeTab === 'label' && (
        <div key="label" className="space-y-4 tab-fade-in">
          <NRVSummaryPanel />
          <LabelPanel />
        </div>
      )}

      {/* ── Tab 4: Soft Coating ── */}
      {activeTab === 'coating' && (
        <div key="coating" className="space-y-4 tab-fade-in">
          <SoftCoatingPanel />
        </div>
      )}

      {/* Right-side ingredient drawer */}
      <IngredientDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
      <VersionNoteModal
        open={showVersionModal}
        currentLabel={activeFormula.versionLabel || `v${activeFormula.version || 1}.0`}
        onCancel={() => setShowVersionModal(false)}
        onConfirm={handleSnapshotConfirm}
      />
    </div>
  )
}
