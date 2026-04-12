import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { fromMg, toMg } from '../../utils/weightConversions.js'

const UNITS = ['mg', 'g', 'kg']

export default function CostSummary() {
  const { activeFormula, computed, packaging, setPackagingId, setFormulaField } = useApp()

  if (!activeFormula || !computed) return null

  const unit = activeFormula.targetWeightUnit || 'mg'
  const displayWeight = fromMg(activeFormula.targetWeightMg, unit)

  // Qty per pack state (stored in formula)
  const qtyPerPackUnit = activeFormula.qtyPerPackUnit || 'g'
  const qtyPerPackMg   = activeFormula.qtyPerPackMg || 0
  const qtyPerPackDisplay = fromMg(qtyPerPackMg, qtyPerPackUnit)

  function handleQtyChange(e) {
    const val = parseFloat(e.target.value) || 0
    setFormulaField('qtyPerPackMg', toMg(val, qtyPerPackUnit))
  }

  function handleQtyUnitChange(e) {
    const newUnit = e.target.value
    // Keep the same mg value, just change display unit
    setFormulaField('qtyPerPackUnit', newUnit)
  }

  // Final unit cost calculation
  // massCostPerUnit = massCostPerKg × (qtyPerPackMg / 1_000_000)
  const massCostPerUnit = qtyPerPackMg > 0
    ? computed.massCostPerKg * (qtyPerPackMg / 1_000_000)
    : computed.batchCost  // fallback: full batch if qty not set

  const packagingUnitCost = computed.selectedPkg ? computed.selectedPkg.unitCost : 0
  const finalUnitCost = massCostPerUnit + packagingUnitCost

  const qtyLabel = qtyPerPackMg > 0
    ? `${qtyPerPackDisplay % 1 === 0 ? qtyPerPackDisplay.toFixed(0) : qtyPerPackDisplay.toFixed(3)} ${qtyPerPackUnit} per unità`
    : 'intero lotto'

  return (
    <div className="bg-galenic-surface border border-galenic-border rounded-xl">
      <div className="px-5 py-3 border-b border-galenic-border">
        <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
          Riepilogo Economico
        </h3>
      </div>

      <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: mass cost */}
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

          {/* Qty per pack input */}
          <div className="pt-2 border-t border-galenic-border space-y-1">
            <div className="text-xs text-galenic-muted font-mono uppercase tracking-wide">
              Quantità formula per confezione
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                min="0"
                value={qtyPerPackDisplay || ''}
                onChange={handleQtyChange}
                placeholder="es. 100"
                className="flex-1 bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-sm px-3 py-2 outline-none focus:border-galenic-accent transition-colors placeholder:text-galenic-muted"
              />
              <select
                value={qtyPerPackUnit}
                onChange={handleQtyUnitChange}
                className="bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-sm px-2 py-2 outline-none focus:border-galenic-accent transition-colors w-16"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="text-xs text-galenic-muted font-mono opacity-60">
              Massa di formula contenuta in ogni unità di vendita
            </div>
          </div>
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

          {/* Final cost breakdown */}
          <div className="border-t border-galenic-border pt-4 space-y-2">
            <CostLine
              label={`Costo Massa / unità`}
              value={`€ ${massCostPerUnit.toFixed(4)}`}
              hint={qtyLabel}
            />
            {computed.selectedPkg && (
              <CostLine
                label="Costo Packaging"
                value={`€ ${packagingUnitCost.toFixed(4)}`}
              />
            )}
            <div className="flex items-center justify-between py-2 bg-galenic-elevated px-3 border border-galenic-accent border-opacity-30">
              <div>
                <div className="text-xs font-mono text-galenic-accent uppercase tracking-wide font-semibold">
                  Costo Unità Finale
                </div>
                <div className="text-xs font-mono text-galenic-muted mt-0.5">
                  Massa ({qtyLabel}) + {computed.selectedPkg ? computed.selectedPkg.description : 'senza packaging'}
                </div>
              </div>
              <div className="text-lg font-mono font-bold text-galenic-accent tabular-nums">
                € {finalUnitCost.toFixed(4)}
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
