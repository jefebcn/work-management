import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import FormulaHeader from './FormulaHeader.jsx'
import IngredientRow from './IngredientRow.jsx'
import IngredientSelector from './IngredientSelector.jsx'
import WarningBanner from './WarningBanner.jsx'
import NRVSummaryPanel from './NRVSummaryPanel.jsx'
import StabilityPanel from '../stability/StabilityPanel.jsx'
import CostSummary from '../stability/CostSummary.jsx'
import Button from '../ui/Button.jsx'

export default function FormulaBuilder() {
  const {
    activeFormula,
    computed,
    resetActiveFormula,
    saveFormula,
    setFormulaField,
  } = useApp()

  if (!activeFormula) return null

  function handleSave(status = activeFormula.status) {
    saveFormula({ ...activeFormula, status })
  }

  const hasWarnings = computed?.warnings?.length > 0
  const totalPercent = computed?.totalPercent ?? 0
  const totalWeightMg = computed?.totalWeightMg ?? 0

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={resetActiveFormula}>
          ← Torna alla Lista
        </Button>
        <div className="flex items-center gap-3">
          {/* Status toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeFormula.status === 'finalized'}
              onChange={e => setFormulaField('status', e.target.checked ? 'finalized' : 'draft')}
              className="sr-only"
            />
            <span
              className={[
                'w-8 h-4 flex items-center px-0.5 transition-colors',
                activeFormula.status === 'finalized'
                  ? 'bg-galenic-ok'
                  : 'bg-galenic-elevated border border-galenic-border',
              ].join(' ')}
            >
              <span
                className={[
                  'w-3 h-3 bg-galenic-primary transition-transform',
                  activeFormula.status === 'finalized' ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')}
              />
            </span>
            <span className="text-xs font-mono text-galenic-muted">
              {activeFormula.status === 'finalized' ? 'Finalizzata' : 'Bozza'}
            </span>
          </label>

          <Button variant="subtle" size="sm" onClick={() => handleSave()}>
            Salva
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleSave('finalized')}>
            Salva & Finalizza
          </Button>
        </div>
      </div>

      {/* Formula header: name, type, target weight */}
      <FormulaHeader />

      {/* Warnings */}
      {hasWarnings && <WarningBanner warnings={computed.warnings} />}

      {/* Ingredients table */}
      <div className="bg-galenic-surface border border-galenic-border">
        <div className="px-5 py-3 border-b border-galenic-border flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
            Ingredienti
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-galenic-muted">
              Totale:{' '}
              <span className={`font-semibold ${totalPercent > 100 ? 'text-galenic-danger' : 'text-galenic-primary'}`}>
                {totalPercent.toFixed(2)}%
              </span>
            </span>
            <span className="text-galenic-muted">
              {totalWeightMg.toFixed(1)} mg / {activeFormula.targetWeightMg} mg
            </span>
            {totalPercent >= 99.9 && totalPercent <= 100.1 && (
              <span className="text-galenic-ok">✓ Bilanciata</span>
            )}
          </div>
        </div>

        {/* Table */}
        {activeFormula.ingredients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="bg-galenic-elevated border-b border-galenic-border">
                  <th className="px-4 py-3 text-left text-xs text-galenic-muted uppercase tracking-wider">Materia Prima</th>
                  <th className="px-4 py-3 text-left text-xs text-galenic-muted uppercase tracking-wider w-40">Quantità</th>
                  <th className="px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider">% Peso</th>
                  <th className="px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider">Apporto Reale</th>
                  <th className="px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider">VNR %</th>
                  <th className="px-4 py-3 text-center text-xs text-galenic-muted uppercase tracking-wider">Fill</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(computed?.rows || []).map(row => (
                  <IngredientRow key={row.rowId} computedRow={row} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-galenic-muted font-mono">
            Nessun ingrediente. Aggiungi la prima materia prima.
          </div>
        )}

        {/* Ingredient selector */}
        <IngredientSelector />
      </div>

      {/* NRV summary */}
      <NRVSummaryPanel />

      {/* Stability panel — only for Liquidi */}
      {activeFormula.type === 'Liquidi' && <StabilityPanel />}

      {/* Cost summary */}
      <CostSummary />
    </div>
  )
}
