import React, { useState } from 'react'
import { ClipboardList, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Euro, User, Package, Tag } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

export default function BriefingPanel() {
  const { activeFormula, computed } = useApp()
  const [showNotes, setShowNotes]   = useState(false)

  if (!activeFormula) return null

  const { clientName, targetPrice, format, packagingRequested, briefingNotes } = activeFormula

  // Only render when at least one briefing field is set
  const hasBriefing = clientName || targetPrice != null || briefingNotes || format || packagingRequested
  if (!hasBriefing) return null

  const unitCost  = computed?.unitCost ?? null
  const overBudget = targetPrice != null && unitCost != null && unitCost > targetPrice
  const underBudget = targetPrice != null && unitCost != null && unitCost <= targetPrice

  return (
    <div className="bg-galenic-surface border border-galenic-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-galenic-border bg-galenic-elevated/50 flex items-center gap-2">
        <ClipboardList size={13} className="text-galenic-accent shrink-0" />
        <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest flex-1">
          Requisiti Commerciali
        </h3>
        {clientName && (
          <span className="text-xs font-mono text-galenic-muted/70 flex items-center gap-1">
            <User size={10} />
            {clientName}
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Target Price widget */}
        {targetPrice != null && (
          <div className={[
            'flex items-center justify-between px-4 py-3 rounded-xl border',
            overBudget
              ? 'bg-galenic-danger/10 border-galenic-danger/30'
              : underBudget
                ? 'bg-galenic-ok/10 border-galenic-ok/30'
                : 'bg-galenic-elevated/50 border-galenic-border',
          ].join(' ')}>
            <div className="flex items-center gap-2">
              {overBudget
                ? <AlertTriangle size={14} className="text-galenic-danger" />
                : underBudget
                  ? <CheckCircle size={14} className="text-galenic-ok" />
                  : <Euro size={14} className="text-galenic-muted" />
              }
              <div>
                <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider">
                  Costo Target / Attuale
                </div>
                <div className={[
                  'text-sm font-semibold font-mono mt-0.5',
                  overBudget ? 'text-galenic-danger' : underBudget ? 'text-galenic-ok' : 'text-galenic-primary',
                ].join(' ')}>
                  € {targetPrice.toFixed(4)}
                  {unitCost != null && (
                    <span className="ml-2 text-galenic-muted font-normal">
                      / € {unitCost.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {unitCost != null && targetPrice != null && (
              <div className={[
                'text-xs font-mono font-semibold px-2.5 py-1 rounded-lg',
                overBudget
                  ? 'bg-galenic-danger/20 text-galenic-danger'
                  : 'bg-galenic-ok/20 text-galenic-ok',
              ].join(' ')}>
                {overBudget ? '+' : ''}
                {((unitCost - targetPrice) * 100 / targetPrice).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {/* Quick meta row */}
        {(format || packagingRequested) && (
          <div className="flex items-center gap-4 text-xs font-mono text-galenic-muted">
            {format && (
              <span className="flex items-center gap-1">
                <Tag size={10} />
                {format}
              </span>
            )}
            {packagingRequested && (
              <span className="flex items-center gap-1">
                <Package size={10} />
                {packagingRequested}
              </span>
            )}
          </div>
        )}

        {/* Collapsible notes */}
        {briefingNotes && (
          <div>
            <button
              onClick={() => setShowNotes(v => !v)}
              className="flex items-center gap-1.5 text-xs font-mono text-galenic-accent hover:opacity-80 transition-opacity"
            >
              {showNotes ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {showNotes ? 'Nascondi' : 'Vedi'} Briefing Originale
            </button>

            {showNotes && (
              <div className="mt-2 px-3 py-2.5 rounded-lg bg-galenic-elevated/60 border border-galenic-border/60 text-xs font-mono text-galenic-primary/90 leading-relaxed italic whitespace-pre-wrap">
                "{briefingNotes}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
