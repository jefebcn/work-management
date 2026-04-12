import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { fromMg } from '../../utils/weightConversions.js'

export default function CostSummary() {
  const { activeFormula, computed, packaging, setPackagingId } = useApp()

  if (!activeFormula || !computed) return null

  const unit = activeFormula.targetWeightUnit || 'mg'
  const displayWeight = fromMg(activeFormula.targetWeightMg, unit)

  return (
    <div className="bg-galenic-surface border border-galenic-border">
      <div className="px-5 py-3 border-b border-galenic-border">
        <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
          Riepilogo Economico
        </h3>
      </div>

      <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: cost breakdown */}
        <div className="space-y-3">
          <CostLine
            label="Costo Massa (per lotto)"
            value={`€ ${computed.batchCost.toFixed(4)}`}
            hint={`${displayWeight} ${unit} di formula`}
          />
          <CostLine
            label="Costo Massa / kg"
            value={`€ ${computed.massCostPerKg.toFixed(4)} /kg`}
            highlight
          />
        </div>

        {/* Right: packaging + final unit cost */}
        <div className="space-y-4">
          {/* Packaging selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-galenic-muted font-mono uppercase tracking-wide">
              Packaging Selezionato
            </label>
            <select
              value={activeFormula.packagingId ?? ''}
              onChange={e => setPackagingId(e.target.value || null)}
              className="bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-sm px-3 py-2 outline-none focus:border-galenic-accent transition-colors"
            >
              <option value="">— Nessun packaging —</option>
              {packaging.map(p => (
                <option key={p.id} value={p.id}>
                  {p.description} (€ {Number(p.unitCost).toFixed(3)})
                </option>
              ))}
            </select>
          </div>

          {/* Final cost */}
          <div className="border-t border-galenic-border pt-4 space-y-2">
            {computed.selectedPkg && (
              <CostLine
                label="Costo Packaging"
                value={`€ ${computed.packagingUnitCost.toFixed(4)}`}
              />
            )}
            <div className="flex items-center justify-between py-2 bg-galenic-elevated px-3 border border-galenic-accent border-opacity-30">
              <div>
                <div className="text-xs font-mono text-galenic-accent uppercase tracking-wide font-semibold">
                  Costo Unità Finale
                </div>
                <div className="text-xs font-mono text-galenic-muted mt-0.5">
                  Massa + {computed.selectedPkg ? computed.selectedPkg.description : 'senza packaging'}
                </div>
              </div>
              <div className="text-lg font-mono font-bold text-galenic-accent tabular-nums">
                € {computed.unitCost.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CostLine({ label, value, hint, highlight }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className={`text-xs font-mono ${highlight ? 'text-galenic-primary font-medium' : 'text-galenic-muted'}`}>
          {label}
        </div>
        {hint && <div className="text-xs font-mono text-galenic-muted opacity-60 mt-0.5">{hint}</div>}
      </div>
      <div className={`font-mono tabular-nums ${highlight ? 'text-galenic-primary font-semibold' : 'text-galenic-muted'}`}>
        {value}
      </div>
    </div>
  )
}
