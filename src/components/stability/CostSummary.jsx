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

  // Pricing engine
  const markupPercent  = activeFormula.markupPercent || 0
  const sellingPrice   = markupPercent > 0 ? finalUnitCost * (1 + markupPercent / 100) : null
  const grossMarginEur = sellingPrice ? sellingPrice - finalUnitCost : null
  const rosPercent     = sellingPrice ? ((sellingPrice - finalUnitCost) / sellingPrice) * 100 : null

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

      {/* ── Pricing Engine ─────────────────────────────────────────────── */}
      <div className="px-5 pb-5 border-t border-galenic-border pt-4">
        <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider mb-3">
          Pricing Engine
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Markup input */}
          <div>
            <div className="text-xs font-mono text-galenic-muted mb-1">Markup desiderato</div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.5"
                min="0"
                max="10000"
                value={markupPercent || ''}
                onChange={e => setFormulaField('markupPercent', parseFloat(e.target.value) || 0)}
                placeholder="es. 30"
                className="flex-1 bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-sm px-3 py-2 outline-none focus:border-galenic-accent transition-colors rounded-lg"
              />
              <span className="text-xs font-mono text-galenic-muted shrink-0">%</span>
            </div>
            <div className="text-xs font-mono text-galenic-muted/50 mt-0.5">
              COGS: € {finalUnitCost.toFixed(4)}
            </div>
          </div>

          {/* Selling price */}
          <div className={sellingPrice ? '' : 'opacity-30'}>
            <div className="text-xs font-mono text-galenic-muted mb-1">Prezzo di Vendita Suggerito</div>
            <div className="text-xl font-mono font-bold text-galenic-ok tabular-nums">
              {sellingPrice ? `€ ${sellingPrice.toFixed(4)}` : '—'}
            </div>
            {grossMarginEur && (
              <div className="text-xs font-mono text-galenic-muted/60 mt-0.5">
                Margine: € {grossMarginEur.toFixed(4)}
              </div>
            )}
          </div>

          {/* ROS (return on sales / margine su prezzo) */}
          <div className={rosPercent ? '' : 'opacity-30'}>
            <div className="text-xs font-mono text-galenic-muted mb-1">Margine Lordo (ROS)</div>
            <div className="text-xl font-mono font-bold text-galenic-ok tabular-nums">
              {rosPercent ? `${rosPercent.toFixed(1)}%` : '—'}
            </div>
            {rosPercent && (
              <div className="text-xs font-mono text-galenic-muted/60 mt-0.5">
                su prezzo di vendita
              </div>
            )}
          </div>

          {/* Batch revenue estimate */}
          {sellingPrice && (
            <div>
              <div className="text-xs font-mono text-galenic-muted mb-1">
                Ricavo Lotto ({(activeFormula.batchSize || 1000).toLocaleString('it-IT')} u.)
              </div>
              <div className="text-xl font-mono font-bold text-galenic-primary tabular-nums">
                € {(sellingPrice * (activeFormula.batchSize || 1000)).toFixed(2)}
              </div>
              <div className="text-xs font-mono text-galenic-muted/60 mt-0.5">
                Utile lordo: € {(grossMarginEur * (activeFormula.batchSize || 1000)).toFixed(2)}
              </div>
            </div>
          )}
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
