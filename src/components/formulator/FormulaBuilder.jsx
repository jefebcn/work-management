import React, { useState, Suspense, lazy } from 'react'
import { AlertTriangle, Download, Save, CheckCircle, FileText } from 'lucide-react'
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
  } = useApp()
  const [showExport, setShowExport] = useState(false)

  if (!activeFormula) return null

  function handleSave(status = activeFormula.status) {
    saveFormula({ ...activeFormula, status })
  }

  const hasWarnings   = computed?.warnings?.length > 0
  const totalPercent  = computed?.totalPercent ?? 0
  const totalWeightMg = computed?.totalWeightMg ?? 0
  const isOverweight  = totalPercent > 100.05
  const isBalanced    = totalPercent >= 99.9 && totalPercent <= 100.1

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={resetActiveFormula}>
          ← Torna alla Lista
        </Button>
        <div className="flex items-center gap-2">
          {/* Finalized toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeFormula.status === 'finalized'}
              onChange={e => setFormulaField('status', e.target.checked ? 'finalized' : 'draft')}
              className="sr-only"
            />
            <span
              className={[
                'w-8 h-4 flex items-center px-0.5 rounded-full transition-colors',
                activeFormula.status === 'finalized' ? 'bg-galenic-ok' : 'bg-galenic-elevated border border-galenic-border',
              ].join(' ')}
            >
              <span
                className={[
                  'w-3 h-3 rounded-full bg-galenic-surface transition-transform shadow-sm',
                  activeFormula.status === 'finalized' ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')}
              />
            </span>
            <span className="text-xs font-mono text-galenic-muted hidden sm:inline">
              {activeFormula.status === 'finalized' ? 'Finalizzata' : 'Bozza'}
            </span>
          </label>

          <Button variant="ghost" size="sm" onClick={() => setShowExport(true)}>
            <Download size={14} className="mr-1.5" />
            Esporta
          </Button>
          <Button variant="subtle" size="sm" onClick={() => handleSave()}>
            <Save size={14} className="mr-1.5" />
            Salva
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleSave('finalized')}>
            <CheckCircle size={14} className="mr-1.5" />
            Finalizza
          </Button>
        </div>
      </div>

      {/* Formula header: name, type, target weight */}
      <FormulaHeader />

      {/* Warnings */}
      {hasWarnings && <WarningBanner warnings={computed.warnings} />}

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

      {/* Stability panel — only for Liquidi */}
      {activeFormula.type === 'Liquidi' && <StabilityPanel />}

      {/* Cost summary */}
      <CostSummary />

      {/* Export modal */}
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  )
}
