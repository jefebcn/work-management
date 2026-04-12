import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import CostSummary from './CostSummary.jsx'
import StabilityPanel from './StabilityPanel.jsx'

export default function StabilityPage() {
  const { formulas, activeFormula, openFormula, setCurrentModule } = useApp()

  // If there's already an active formula, show its stability/cost data
  if (activeFormula) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono font-semibold text-galenic-primary uppercase tracking-widest">
              {activeFormula.name}
            </h2>
            <p className="text-xs font-mono text-galenic-muted mt-0.5">
              Tipo: {activeFormula.type} — Stabilità & Analisi Costi
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCurrentModule('formulator')}>
            ← Torna al Formulatore
          </Button>
        </div>

        {activeFormula.type === 'Liquidi' && <StabilityPanel />}
        <CostSummary />
      </div>
    )
  }

  // Otherwise show a list to pick a formula
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-mono font-semibold text-galenic-primary uppercase tracking-widest">
          Seleziona Formula
        </h2>
        <p className="text-xs font-mono text-galenic-muted mt-0.5">
          Scegli una formula per visualizzarne stabilità e costi
        </p>
      </div>

      {formulas.length === 0 ? (
        <div className="bg-galenic-surface border border-galenic-border rounded-xl p-8 text-center">
          <p className="text-galenic-muted text-sm font-mono mb-4">
            Nessuna formula disponibile. Creane una nel Formulatore.
          </p>
          <Button variant="primary" onClick={() => setCurrentModule('formulator')}>
            Vai al Formulatore
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {formulas.map(formula => (
            <button
              key={formula.id}
              onClick={() => openFormula(formula)}
              className="w-full text-left bg-galenic-surface border border-galenic-border rounded-xl px-5 py-4 hover:border-galenic-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-mono font-medium text-galenic-primary">
                    {formula.name}
                  </div>
                  <div className="text-xs font-mono text-galenic-muted mt-1">
                    {formula.ingredients?.length ?? 0} ingredienti
                    {formula.type === 'Liquidi' && formula.pH
                      ? ` · pH ${formula.pH}`
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={formula.type === 'Liquidi' ? 'neutral' : 'accent'}>
                    {formula.type}
                  </Badge>
                  <Badge variant={formula.status === 'finalized' ? 'ok' : 'neutral'}>
                    {formula.status === 'finalized' ? 'Finalizzata' : 'Bozza'}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
