import React, { useState } from 'react'
import { Layers, Zap, X } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

export default function QuickActions() {
  const {
    rawMaterials, activeFormula,
    addFillerIngredient, addAntiCakingIngredient,
  } = useApp()

  const [panel, setPanel]           = useState(null)   // 'fill' | 'anticaking' | null
  const [fillId, setFillId]         = useState('')
  const [acId,   setAcId]           = useState('')
  const [acPct,  setAcPct]          = useState('1.5')

  if (!activeFormula) return null

  // Only excipients (no active nutrient) make sense as fillers / anti-caking agents
  const excipients = rawMaterials.filter(rm => !rm.activeNutrient)

  function toggle(name) {
    setPanel(p => (p === name ? null : name))
  }

  function handleFill() {
    if (!fillId) return
    addFillerIngredient(fillId)
    setFillId('')
    setPanel(null)
  }

  function handleAntiCaking() {
    const pct = parseFloat(acPct)
    if (!acId || !(pct > 0)) return
    addAntiCakingIngredient(acId, pct)
    setAcId('')
    setPanel(null)
  }

  const btnBase = 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border rounded-lg transition-all'
  const btnActive = 'border-galenic-accent/40 bg-galenic-accent/10 text-galenic-accent'
  const btnIdle   = 'border-galenic-border text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/60'

  return (
    <div className="px-4 py-3 border-t border-dashed border-galenic-border/50 bg-galenic-elevated/15">
      <div className="flex flex-wrap items-start gap-3">

        {/* ── Colma a volume ─────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => toggle('fill')}
            className={`${btnBase} ${panel === 'fill' ? btnActive : btnIdle}`}
          >
            <Layers size={12} />
            Colma a Volume
            {panel === 'fill' && <X size={11} className="ml-0.5 opacity-60" />}
          </button>

          {panel === 'fill' && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <select
                value={fillId}
                onChange={e => setFillId(e.target.value)}
                className="flex-1 min-w-[180px] bg-galenic-surface border border-galenic-border text-galenic-primary font-mono text-xs px-3 py-1.5 outline-none focus:border-galenic-accent transition-colors rounded-lg"
              >
                <option value="">— Scegli eccipiente riempitivo —</option>
                {excipients.map(rm => (
                  <option key={rm.id} value={rm.id}>{rm.name}</option>
                ))}
              </select>
              <button
                onClick={handleFill}
                disabled={!fillId}
                className="px-3 py-1.5 text-xs font-mono bg-galenic-accent text-galenic-surface rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Applica Filler
              </button>
              <span className="text-xs font-mono text-galenic-muted/60">
                L'eccipiente raggiungerà automaticamente il peso target
              </span>
            </div>
          )}
        </div>

        {/* ── Antiagglomerante auto ───────────────────────────────────── */}
        <div>
          <button
            onClick={() => toggle('anticaking')}
            className={`${btnBase} ${panel === 'anticaking' ? btnActive : btnIdle}`}
          >
            <Zap size={12} />
            Antiagglomerante Auto
            {panel === 'anticaking' && <X size={11} className="ml-0.5 opacity-60" />}
          </button>

          {panel === 'anticaking' && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <select
                value={acId}
                onChange={e => setAcId(e.target.value)}
                className="flex-1 min-w-[180px] bg-galenic-surface border border-galenic-border text-galenic-primary font-mono text-xs px-3 py-1.5 outline-none focus:border-galenic-accent transition-colors rounded-lg"
              >
                <option value="">— Scegli antiagglomerante —</option>
                {excipients.map(rm => (
                  <option key={rm.id} value={rm.id}>{rm.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={acPct}
                  onChange={e => setAcPct(e.target.value)}
                  className="w-16 bg-galenic-surface border border-galenic-border text-galenic-primary font-mono text-xs px-2 py-1.5 text-right outline-none focus:border-galenic-accent transition-colors rounded-lg"
                />
                <span className="text-xs font-mono text-galenic-muted">%</span>
              </div>
              <button
                onClick={handleAntiCaking}
                disabled={!acId || !(parseFloat(acPct) > 0)}
                className="px-3 py-1.5 text-xs font-mono bg-galenic-accent text-galenic-surface rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Inserisci
              </button>
              <span className="text-xs font-mono text-galenic-muted/60">
                L'importo è calcolato in automatico sul peso target
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
