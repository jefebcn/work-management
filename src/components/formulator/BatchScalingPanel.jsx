import React, { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'

export default function BatchScalingPanel() {
  const { activeFormula, computed, rawMaterials, setFormulaField } = useApp()

  const rmMap = useMemo(() => {
    const map = {}
    rawMaterials.forEach(rm => { map[rm.id] = rm })
    return map
  }, [rawMaterials])

  if (!computed?.rows?.length || !activeFormula) return null

  const batchSize      = activeFormula.batchSize || 1000
  const totalBatchCost = computed.batchCost * batchSize
  const totalBatchKg   = (computed.totalWeightMg * batchSize) / 1_000_000

  return (
    <div className="bg-galenic-surface border border-galenic-border rounded-xl">
      {/* Header */}
      <div className="px-5 py-3 border-b border-galenic-border flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
          Scaling Lotto di Produzione
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-galenic-muted">Quantità unità</span>
          <input
            type="number"
            step="1"
            min="1"
            value={batchSize}
            onChange={e => setFormulaField('batchSize', Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-sm px-2 py-1.5 text-right outline-none focus:border-galenic-accent transition-colors rounded-lg"
          />
          <span className="text-xs font-mono text-galenic-muted">unità</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-galenic-elevated border-b border-galenic-border">
              <th className="px-4 py-2.5 text-left text-galenic-muted uppercase tracking-wider">Materia Prima</th>
              <th className="px-4 py-2.5 text-right text-galenic-muted uppercase tracking-wider whitespace-nowrap">mg / unità</th>
              <th className="px-4 py-2.5 text-right text-galenic-muted uppercase tracking-wider whitespace-nowrap">% peso</th>
              <th className="px-4 py-2.5 text-right text-galenic-muted uppercase tracking-wider whitespace-nowrap">g totali</th>
              <th className="px-4 py-2.5 text-right text-galenic-muted uppercase tracking-wider whitespace-nowrap">kg totali</th>
              <th className="px-4 py-2.5 text-right text-galenic-muted uppercase tracking-wider whitespace-nowrap">Costo lotto</th>
            </tr>
          </thead>
          <tbody>
            {computed.rows.map((r, idx) => {
              const rm       = rmMap[r.rawMaterialId]
              if (!rm) return null
              const totalMg  = r.amountMg * batchSize
              const totalG   = totalMg / 1000
              const totalKg  = totalMg / 1_000_000
              const rowCost  = totalKg * (rm.pricePerKg || 0)
              return (
                <tr
                  key={r.rowId}
                  className={`border-b border-galenic-border transition-colors hover:bg-galenic-accent/5 ${idx % 2 === 1 ? 'bg-galenic-elevated/20' : ''}`}
                >
                  <td className="px-4 py-2.5 text-galenic-primary">
                    {rm.name}
                    {r.isFiller && (
                      <span className="ml-1.5 text-galenic-muted/50 text-xs">filler</span>
                    )}
                    {(r.antiCakingPercent > 0) && (
                      <span className="ml-1.5 text-galenic-warning/70 text-xs">{r.antiCakingPercent}%ac</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-galenic-primary">
                    {r.amountMg.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-galenic-muted">
                    {r.percentOfTotal.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-galenic-primary">
                    {totalG.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-galenic-accent font-semibold">
                    {totalKg.toFixed(6)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-galenic-primary">
                    € {rowCost.toFixed(4)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-galenic-elevated border-t-2 border-galenic-border">
              <td className="px-4 py-2.5 font-semibold text-galenic-primary">
                TOTALE LOTTO &nbsp;
                <span className="font-normal text-galenic-muted">
                  ({batchSize.toLocaleString('it-IT')} unità)
                </span>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-galenic-primary font-semibold">
                {computed.totalWeightMg.toFixed(3)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-galenic-primary font-semibold">
                {computed.totalPercent.toFixed(2)}%
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-galenic-primary font-semibold">
                {(computed.totalWeightMg * batchSize / 1000).toFixed(3)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-galenic-accent font-bold">
                {totalBatchKg.toFixed(6)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-galenic-accent font-bold">
                € {totalBatchCost.toFixed(4)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
