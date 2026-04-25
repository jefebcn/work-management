import React, { useMemo, useState } from 'react'
import { Layers, Beaker, Euro, Clock, ArrowRight, Folder, ClipboardList, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { computeDashboardKPIs, recentActivity } from '../../utils/dashboardStats.js'
import { decodeBriefing } from '../../utils/briefingCodec.js'
import StatusBadge from '../ui/StatusBadge.jsx'
import Button from '../ui/Button.jsx'

export default function DashboardPage() {
  const { formulas, rawMaterials, packaging, macrothemes, openFormula, setCurrentModule, importBriefing } = useApp()

  const kpis   = useMemo(() => computeDashboardKPIs(formulas, rawMaterials, packaging), [formulas, rawMaterials, packaging])
  const recent = useMemo(() => recentActivity(formulas, 5), [formulas])

  const [showImport, setShowImport]   = useState(false)
  const [importCode, setImportCode]   = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')

  function handleImport() {
    setImportError('')
    const decoded = decodeBriefing(importCode.trim())
    if (!decoded || !decoded.n) {
      setImportError('Codice non valido o corrotto. Verifica di aver incollato il testo completo.')
      return
    }
    const macro = macrothemes.find(m => m.id === decoded.m)
    importBriefing(decoded, importCode.trim())
    setImportSuccess(`Progetto "${decoded.n}" creato nel macrotema "${macro?.name || '—'}"`)
    setTimeout(() => {
      setShowImport(false)
      setImportCode('')
      setImportSuccess('')
      setCurrentModule('formulator')
    }, 2000)
  }

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

      {/* Briefing import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-galenic-surface rounded-xl border border-galenic-border shadow-2xl w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-galenic-accent" />
                <h3 className="text-sm font-semibold text-galenic-primary">Importa da Briefing</h3>
              </div>
              <button
                onClick={() => { setShowImport(false); setImportCode(''); setImportError(''); setImportSuccess('') }}
                className="p-1.5 rounded-lg text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {importSuccess ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-galenic-ok/10 border border-galenic-ok/30 text-galenic-ok text-xs font-mono">
                <CheckCircle size={13} />
                {importSuccess}
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-galenic-muted">Codice Briefing</label>
                  <textarea
                    value={importCode}
                    onChange={e => { setImportCode(e.target.value); setImportError('') }}
                    rows={4}
                    placeholder="Incolla qui il codice ricevuto dal commerciale..."
                    className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-xs font-mono text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors resize-none"
                  />
                </div>

                {importError && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-galenic-danger/10 border border-galenic-danger/30 text-galenic-danger text-xs font-mono">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    {importError}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setShowImport(false); setImportCode(''); setImportError('') }}>
                    Annulla
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleImport} disabled={!importCode.trim()}>
                    Importa Progetto
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-galenic-surface border border-galenic-border rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-galenic-border">
          <div>
            <h3 className="text-sm font-semibold text-galenic-primary">Attività Recente</h3>
            <p className="text-xs font-mono text-galenic-muted/60 mt-0.5">
              Ultime 5 modifiche ai progetti
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1 text-xs font-mono text-galenic-muted hover:text-galenic-primary transition-colors border border-galenic-border/60 px-2.5 py-1 rounded-md hover:bg-galenic-elevated/60"
            >
              <ClipboardList size={11} />
              Importa Briefing
            </button>
            <button
              onClick={() => setCurrentModule('formulator')}
              className="flex items-center gap-1 text-xs font-mono text-galenic-accent hover:opacity-80 transition-opacity"
            >
              Vedi tutto
              <ArrowRight size={11} />
            </button>
          </div>
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
