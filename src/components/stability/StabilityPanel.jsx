import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import PHInput from './pHInput.jsx'
import BrixInput from './BrixInput.jsx'

export default function StabilityPanel() {
  const { activeFormula, setFormulaField } = useApp()

  if (!activeFormula || activeFormula.type !== 'Liquidi') return null

  return (
    <div className="bg-galenic-surface border border-galenic-border rounded-xl">
      <div className="px-5 py-3 border-b border-galenic-border">
        <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
          Parametri Stabilità — Liquidi
        </h3>
        <p className="text-xs font-mono text-galenic-muted mt-0.5">
          Parametri specifici per formulazioni liquide
        </p>
      </div>
      <div className="px-5 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg">
          <PHInput
            value={activeFormula.pH ?? ''}
            onChange={val => setFormulaField('pH', val)}
          />
          <BrixInput
            value={activeFormula.brix ?? ''}
            onChange={val => setFormulaField('brix', val)}
          />
        </div>
      </div>
    </div>
  )
}
