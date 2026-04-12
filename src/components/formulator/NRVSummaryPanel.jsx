import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Badge from '../ui/Badge.jsx'

export default function NRVSummaryPanel() {
  const { rawMaterials, computed } = useApp()

  if (!computed || !computed.rows || computed.rows.length === 0) return null

  // Only show rows with actual nutrients (skip excipients without NRV)
  const nutrientRows = computed.rows.filter(r => {
    const rm = rawMaterials.find(m => m.id === r.rawMaterialId)
    return rm && (rm.nrvReference > 0 || rm.maxLimitMg > 0)
  })

  if (nutrientRows.length === 0) return null

  return (
    <div className="bg-galenic-surface border border-galenic-border">
      <div className="px-5 py-3 border-b border-galenic-border">
        <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
          Riepilogo Nutrienti & VNR
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-galenic-elevated border-b border-galenic-border">
              <th className="px-4 py-2 text-left text-galenic-muted uppercase tracking-wider">Ingrediente</th>
              <th className="px-4 py-2 text-left text-galenic-muted uppercase tracking-wider">Nutriente Attivo</th>
              <th className="px-4 py-2 text-center text-galenic-muted uppercase tracking-wider">Apporto Reale</th>
              <th className="px-4 py-2 text-center text-galenic-muted uppercase tracking-wider">VNR %</th>
              <th className="px-4 py-2 text-center text-galenic-muted uppercase tracking-wider">Limite Max</th>
              <th className="px-4 py-2 text-center text-galenic-muted uppercase tracking-wider">Stato</th>
            </tr>
          </thead>
          <tbody>
            {nutrientRows.map(r => {
              const rm = rawMaterials.find(m => m.id === r.rawMaterialId)
              if (!rm) return null

              let statusBadge
              if (r.exceedsMaxLimit) {
                statusBadge = <Badge variant="warning">LIMITE</Badge>
              } else if (r.nrvPercent !== null && r.nrvPercent > 200) {
                statusBadge = <Badge variant="caution">Alto</Badge>
              } else if (r.nrvPercent !== null && r.nrvPercent >= 15) {
                statusBadge = <Badge variant="ok">OK</Badge>
              } else {
                statusBadge = <Badge variant="neutral">—</Badge>
              }

              return (
                <tr key={r.rowId} className="border-b border-galenic-border hover:bg-galenic-elevated hover:bg-opacity-30">
                  <td className="px-4 py-2.5 text-galenic-primary">{rm.name}</td>
                  <td className="px-4 py-2.5 text-galenic-muted">{rm.activeNutrient || '—'}</td>
                  <td className="px-4 py-2.5 text-center tabular-nums text-galenic-primary">
                    {r.realNutrientContribution.toFixed(4)} mg
                  </td>
                  <td className="px-4 py-2.5 text-center tabular-nums">
                    {r.nrvPercent !== null ? (
                      <span className={r.nrvPercent > 200 ? 'text-galenic-danger' : r.nrvPercent > 100 ? 'text-galenic-warning' : 'text-galenic-primary'}>
                        {r.nrvPercent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-galenic-muted">N/D</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center tabular-nums text-galenic-muted">
                    {rm.maxLimitMg > 0 ? `${rm.maxLimitMg} mg` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">{statusBadge}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
