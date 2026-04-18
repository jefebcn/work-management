import React from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { CAPSULE_SIZES } from '../../utils/formulaValidation.js'

// ── Capsule pill bar ──────────────────────────────────────────────────────────

function CapsuleBar({ capsuleSize, totalVolumeMl, isRecommended }) {
  const ratio      = totalVolumeMl / capsuleSize.volumeMl
  const fillPct    = Math.min(100, ratio * 100)
  const overfilled = ratio > 1
  const nearFull   = !overfilled && ratio > 0.88

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Pill shape */}
      <div className={[
        'relative w-7 h-[4.5rem] rounded-full border-2 overflow-hidden',
        isRecommended
          ? 'border-galenic-ok shadow-sm'
          : overfilled
          ? 'border-galenic-danger/50'
          : 'border-galenic-border/50',
      ].join(' ')}>
        {/* Empty cavity */}
        <div className="absolute inset-0 bg-galenic-elevated/20" />

        {/* Fill column (rises from bottom) */}
        <div
          className={[
            'absolute bottom-0 left-0 right-0 transition-all duration-500',
            overfilled ? 'bg-galenic-danger/55' :
            nearFull   ? 'bg-galenic-warning/55' :
            isRecommended ? 'bg-galenic-ok/50' :
            'bg-galenic-accent/30',
          ].join(' ')}
          style={{ height: `${fillPct}%` }}
        />

        {/* Mid-line dividing the two capsule halves */}
        <div
          className="absolute left-0 right-0 border-t border-white/10"
          style={{ top: '50%' }}
        />
      </div>

      {/* Size label */}
      <span className={`text-xs font-mono font-bold leading-none ${
        isRecommended ? 'text-galenic-ok' :
        overfilled    ? 'text-galenic-danger/50' :
        'text-galenic-muted/40'
      }`}>
        {capsuleSize.size}
      </span>

      {/* Fill % */}
      <span className={`text-xs font-mono leading-none ${
        overfilled ? 'text-galenic-danger/60' : 'text-galenic-muted/35'
      }`}>
        {Math.round(ratio * 100)}%
      </span>
    </div>
  )
}

function CapsuleSection({ tv }) {
  const { totalVolumeMl, fittingSize, warnings } = tv
  const cautionWarnings = (warnings || []).filter(w => w.severity !== 'danger')

  return (
    <div className="flex items-start gap-6 flex-wrap">
      {/* All 6 capsule bars */}
      <div className="flex items-end gap-3 pb-1">
        {CAPSULE_SIZES.map(cs => (
          <CapsuleBar
            key={cs.size}
            capsuleSize={cs}
            totalVolumeMl={totalVolumeMl}
            isRecommended={fittingSize?.size === cs.size}
          />
        ))}
      </div>

      {/* Metrics */}
      <div className="flex-1 min-w-[180px] space-y-3">
        <div>
          <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider mb-0.5">
            Volume totale polveri
          </div>
          <div className="text-xl font-mono font-semibold text-galenic-primary tabular-nums">
            {totalVolumeMl.toFixed(3)} mL
          </div>
        </div>

        {fittingSize ? (
          <div className="flex items-start gap-2">
            <CheckCircle size={13} className="text-galenic-ok mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-mono text-galenic-ok font-semibold">
                Capsula {fittingSize.size} consigliata
              </div>
              <div className="text-xs font-mono text-galenic-muted/60">
                capacità {fittingSize.volumeMl} mL &nbsp;·&nbsp;
                riempimento {((totalVolumeMl / fittingSize.volumeMl) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-1.5 text-galenic-danger text-xs font-mono">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            Volume supera la 000 — suddividere la dose in più unità
          </div>
        )}

        {cautionWarnings.map((w, i) => (
          <div key={i} className="text-xs font-mono text-galenic-warning/80 bg-galenic-warning/5 border border-galenic-warning/15 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            {w.message}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Compressa (tablet cross-section) ─────────────────────────────────────────

function CompressaSection({ tv }) {
  const { activePct, excipientPct, lubricantPct, binderPct, friabilityRisk, warnings } = tv
  const cautionWarnings = (warnings || []).filter(w => w.severity !== 'danger')

  return (
    <div className="flex items-start gap-6 flex-wrap">
      {/* Tablet cross-section visualization */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full border-2 border-galenic-border/50 overflow-hidden relative">
          <div className="absolute inset-0 bg-galenic-elevated/20" />
          {/* Active layer — fills from top */}
          <div
            className={`absolute top-0 left-0 right-0 transition-all duration-500 ${
              friabilityRisk ? 'bg-galenic-danger/50' : 'bg-galenic-accent/40'
            }`}
            style={{ height: `${activePct}%` }}
          />
          {/* Binder layer */}
          {binderPct > 0 && (
            <div
              className="absolute left-0 right-0 bg-galenic-ok/35 transition-all duration-500"
              style={{ top: `${activePct}%`, height: `${binderPct}%` }}
            />
          )}
          {/* Lubricant layer — bottom stripe */}
          {lubricantPct > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-galenic-warning/45 transition-all duration-500"
              style={{ height: `${lubricantPct}%` }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${friabilityRisk ? 'bg-galenic-danger/50' : 'bg-galenic-accent/50'}`} />
            <span className="text-galenic-muted/70">Attivi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-galenic-ok/40" />
            <span className="text-galenic-muted/70">Leganti</span>
          </div>
          {lubricantPct > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-galenic-warning/50" />
              <span className="text-galenic-muted/70">Lubrif.</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics + bars */}
      <div className="flex-1 min-w-[200px] space-y-2.5">
        {[
          { label: 'Attivi',        pct: activePct,    colorBar: friabilityRisk ? 'bg-galenic-danger/60'  : 'bg-galenic-accent/60',  colorText: friabilityRisk ? 'text-galenic-danger' : 'text-galenic-accent' },
          { label: 'Leganti',       pct: binderPct,    colorBar: 'bg-galenic-ok/55',      colorText: 'text-galenic-ok' },
          { label: 'Lubrificanti',  pct: lubricantPct, colorBar: 'bg-galenic-warning/55', colorText: 'text-galenic-warning' },
        ].map(({ label, pct, colorBar, colorText }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-24 text-xs font-mono text-galenic-muted">{label}</div>
            <div className="flex-1 h-2 bg-galenic-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colorBar} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className={`w-12 text-right text-xs font-mono tabular-nums ${colorText}`}>
              {pct.toFixed(1)}%
            </div>
          </div>
        ))}

        <div className="pt-1">
          {warnings.length === 0 ? (
            <div className="flex items-center gap-1.5 text-xs font-mono text-galenic-ok">
              <CheckCircle size={12} />
              Formula bilanciata per compressione diretta
            </div>
          ) : (
            <div className="space-y-1.5">
              {cautionWarnings.map((w, i) => (
                <div key={i} className={`text-xs font-mono rounded-lg px-2.5 py-1.5 flex items-start gap-1.5 ${
                  w.severity === 'danger'
                    ? 'bg-galenic-danger/5 text-galenic-danger/80 border border-galenic-danger/15'
                    : 'bg-galenic-warning/5 text-galenic-warning/80 border border-galenic-warning/15'
                }`}>
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                  {w.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Liquido (vial fill) ───────────────────────────────────────────────────────

function LiquidoSection({ tv }) {
  const { volumeMl, concentrations, estimatedDensity, warnings } = tv

  return (
    <div className="flex items-start gap-6 flex-wrap">
      {/* Vial visualization */}
      <div className="flex flex-col items-center gap-0.5">
        {/* Vial neck */}
        <div className="w-6 h-5 border-2 border-b-0 border-galenic-border/50 bg-galenic-elevated/20 rounded-t-sm mx-auto" />
        {/* Vial body */}
        <div className="w-14 h-28 border-2 border-galenic-border/50 rounded-b-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-galenic-elevated/15" />
          {/* Liquid fill */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-blue-400/35 transition-all duration-500"
            style={{ height: '80%' }}
          />
          {/* Meniscus line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-blue-400/40"
            style={{ bottom: '80%' }}
          />
          {/* Volume label inside vial */}
          <div className="absolute inset-0 flex items-end justify-center pb-3">
            <span className="text-xs font-mono text-galenic-primary/70 tabular-nums">
              {volumeMl.toFixed(0)} mL
            </span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex-1 min-w-[180px] space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider mb-0.5">Volume</div>
            <div className="text-lg font-mono font-semibold text-galenic-primary tabular-nums">
              {volumeMl.toFixed(1)} mL
            </div>
          </div>
          <div>
            <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider mb-0.5">Densità stimata</div>
            <div className="text-lg font-mono font-semibold text-galenic-primary tabular-nums">
              {estimatedDensity.toFixed(3)} g/mL
            </div>
          </div>
        </div>

        {/* Concentration list */}
        {concentrations.length > 0 && (
          <div>
            <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider mb-1">
              Concentrazioni (mg/mL)
            </div>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {concentrations.map(c => (
                <div key={c.rowId} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-galenic-muted truncate max-w-[160px]">
                    {c.name}
                  </span>
                  <span className="text-xs font-mono text-galenic-primary tabular-nums shrink-0">
                    {c.concentrationMgMl.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.map((w, i) => (
          <div key={i} className="text-xs font-mono text-galenic-warning/80 bg-galenic-warning/5 border border-galenic-warning/15 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            {w.message}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

const TITLES = {
  Capsule:   'Analisi Volume Capsula',
  Compresse: 'Analisi Compressibilità',
  Liquidi:   'Analisi Soluzione Liquida',
}

export default function FillVisualization() {
  const { computed } = useApp()
  const tv = computed?.typeValidation
  if (!tv) return null

  return (
    <div className="bg-galenic-surface border border-galenic-border rounded-xl">
      <div className="px-5 py-3 border-b border-galenic-border">
        <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
          {TITLES[tv.type] || 'Analisi Farmaceutica'}
        </h3>
      </div>
      <div className="px-5 py-4">
        {tv.type === 'Capsule'   && <CapsuleSection   tv={tv} />}
        {tv.type === 'Compresse' && <CompressaSection tv={tv} />}
        {tv.type === 'Liquidi'   && <LiquidoSection   tv={tv} />}
      </div>
    </div>
  )
}
