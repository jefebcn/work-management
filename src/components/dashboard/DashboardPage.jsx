import React, { useMemo } from 'react'
import { Layers, Beaker, Euro, Clock, ArrowRight, Folder } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { computeDashboardKPIs, recentActivity } from '../../utils/dashboardStats.js'
import StatusBadge from '../ui/StatusBadge.jsx'

export default function DashboardPage() {
  const { formulas, rawMaterials, packaging, macrothemes, openFormula, setCurrentModule } = useApp()

  const kpis   = useMemo(() => computeDashboardKPIs(formulas, rawMaterials, packaging), [formulas, rawMaterials, packaging])
  const recent = useMemo(() => recentActivity(formulas, 5), [formulas])

  const macroById = Object.fromEntries(macrothemes.map(m => [m.id, m]))

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-xl font-semibold text-galenic-primary">Dashboard</h1>
        <p className="text-xs font-mono text-galenic-muted mt-0.5">
          Panoramica del tuo archivio formule
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Layers size={16} />}
          label="Totale Progetti"
          value={kpis.total}
          accent="accent"
        />
        <KpiCard
          icon={<Beaker size={16} />}
          label="In Sviluppo"
          value={kpis.inDev}
          sub={`${kpis.ready} ready`}
          accent="info"
        />
        <KpiCard
          icon={<Euro size={16} />}
          label="Costo Medio Dose"
          value={`€ ${kpis.avgDoseCost.toFixed(4)}`}
          accent="ok"
        />
        <KpiCard
          icon={<Clock size={16} />}
          label="Ultimo Prodotto"
          value={kpis.lastProduct?.name || '—'}
          sub={kpis.lastProduct
            ? `${kpis.lastProduct.versionLabel || `v${kpis.lastProduct.version}`} · ${new Date(kpis.lastProduct.updatedAt).toLocaleDateString('it-IT')}`
            : 'nessuna formula'}
          onClick={kpis.lastProduct ? () => openFormula(kpis.lastProduct) : null}
          accent="warning"
        />
      </div>

      {/* Recent activity */}
      <div className="bg-galenic-surface border border-galenic-border rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-galenic-border">
          <div>
            <h3 className="text-sm font-semibold text-galenic-primary">Attività Recente</h3>
            <p className="text-xs font-mono text-galenic-muted/60 mt-0.5">
              Ultime 5 modifiche ai progetti
            </p>
          </div>
          <button
            onClick={() => setCurrentModule('formulator')}
            className="flex items-center gap-1 text-xs font-mono text-galenic-accent hover:opacity-80 transition-opacity"
          >
            Vedi tutto
            <ArrowRight size={11} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-xs font-mono text-galenic-muted/50">
              Nessuna attività ancora. Crea la tua prima formula.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-galenic-muted/60 border-b border-galenic-border/60">
                  <th className="px-5 py-2.5 text-left font-medium uppercase tracking-wider">Nome Prodotto</th>
                  <th className="px-3 py-2.5 text-left font-medium uppercase tracking-wider hidden sm:table-cell">Macrotema</th>
                  <th className="px-3 py-2.5 text-left font-medium uppercase tracking-wider">Versione</th>
                  <th className="px-3 py-2.5 text-left font-medium uppercase tracking-wider">Stato</th>
                  <th className="px-3 py-2.5 text-left font-medium uppercase tracking-wider hidden md:table-cell">Modifica</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(f => (
                  <tr key={f.id} className="border-b border-galenic-border/40 hover:bg-galenic-elevated/30 transition-colors">
                    <td className="px-5 py-3 text-galenic-primary font-medium truncate max-w-xs">{f.name}</td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className="text-galenic-muted">
                        <Folder size={10} className="inline mr-1 opacity-60" />
                        {macroById[f.macrothemeId]?.name || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-galenic-accent">
                      {f.versionLabel || `v${f.version || 1}`}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-3 py-3 text-galenic-muted/70 hidden md:table-cell">
                      {new Date(f.updatedAt).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => openFormula(f)}
                        className="text-galenic-accent hover:opacity-80 transition-opacity"
                      >
                        Apri →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── KPI card component ─────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent = 'accent', onClick }) {
  const accentColors = {
    accent:  'text-galenic-accent  bg-galenic-accent/10',
    ok:      'text-galenic-ok      bg-galenic-ok/10',
    info:    'text-blue-400        bg-blue-500/10',
    warning: 'text-yellow-400      bg-yellow-500/10',
  }

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={[
        'bg-galenic-surface border border-galenic-border rounded-xl px-4 py-3.5 text-left',
        'shadow-sm hover:shadow-md transition-all',
        onClick ? 'cursor-pointer hover:border-galenic-accent/30' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-galenic-muted uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accentColors[accent]}`}>
          {icon}
        </div>
      </div>
      <div className="text-lg font-semibold text-galenic-primary truncate">
        {value}
      </div>
      {sub && (
        <div className="text-xs font-mono text-galenic-muted/60 truncate mt-0.5">
          {sub}
        </div>
      )}
    </Component>
  )
}
