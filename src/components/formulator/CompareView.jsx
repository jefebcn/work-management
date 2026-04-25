import React, { useState, useMemo } from 'react'
import { X, GitCompare, ArrowRight, Plus, Minus, ArrowUpDown } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { diffFormulas } from '../../utils/formulaCompare.js'

const TABS = [
  { key: 'ingredients', label: 'Ingredienti' },
  { key: 'costs',       label: 'Costi' },
  { key: 'meta',        label: 'Meta' },
]

export default function CompareView({ formulaA, formulaB, onClose }) {
  const { rawMaterials, packaging } = useApp()
  const [tab, setTab] = useState('ingredients')

  const diff = useMemo(
    () => diffFormulas(formulaA, formulaB, rawMaterials, packaging),
    [formulaA, formulaB, rawMaterials, packaging],
  )

  if (!formulaA || !formulaB) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-galenic-surface border border-galenic-border rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-galenic-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-galenic-accent/10 border border-galenic-accent/30 flex items-center justify-center shrink-0">
              <GitCompare size={13} className="text-galenic-accent" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-galenic-primary truncate">
                Confronto versioni
              </div>
              <div className="text-xs font-mono text-galenic-muted truncate">
                <span className="text-galenic-primary">{formulaA.versionLabel || `v${formulaA.version}`}</span>
                <ArrowRight size={9} className="inline mx-1.5 -mt-0.5" />
                <span className="text-galenic-accent">{formulaB.versionLabel || `v${formulaB.version}`}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-all shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-galenic-border shrink-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'px-4 py-2.5 text-xs font-mono transition-all',
                tab === t.key
                  ? 'text-galenic-accent border-b-2 border-galenic-accent bg-galenic-accent/5'
                  : 'text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/30',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'ingredients' && <IngredientsDiff rows={diff.ingredients} />}
          {tab === 'costs'       && <CostsDiff       rows={diff.costs} />}
          {tab === 'meta'        && <MetaDiff        rows={diff.meta} />}
        </div>
      </div>
    </div>
  )
}

// ── Ingredient diff ──────────────────────────────────────────────────────────
function IngredientsDiff({ rows }) {
  if (rows.length === 0) return <Empty msg="Nessun ingrediente da confrontare" />

  const stats = {
    added:     rows.filter(r => r.status === 'added').length,
    removed:   rows.filter(r => r.status === 'removed').length,
    changed:   rows.filter(r => r.status === 'changed').length,
    unchanged: rows.filter(r => r.status === 'unchanged').length,
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        <Pill icon={<Plus size={10} />}      color="ok"      label={`+${stats.added} aggiunti`} />
        <Pill icon={<Minus size={10} />}     color="danger"  label={`−${stats.removed} rimossi`} />
        <Pill icon={<ArrowUpDown size={10} />} color="warning" label={`${stats.changed} modificati`} />
        <Pill                                color="muted"   label={`${stats.unchanged} invariati`} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-galenic-border">
        <table className="w-full text-xs font-mono">
          <thead className="bg-galenic-elevated">
            <tr className="border-b border-galenic-border">
              <th className="px-3 py-2 text-left text-galenic-muted uppercase tracking-wider">Ingrediente</th>
              <th className="px-3 py-2 text-right text-galenic-muted uppercase tracking-wider">A (mg)</th>
              <th className="px-3 py-2 text-right text-galenic-muted uppercase tracking-wider">B (mg)</th>
              <th className="px-3 py-2 text-right text-galenic-muted uppercase tracking-wider">Δ mg</th>
              <th className="px-3 py-2 text-right text-galenic-muted uppercase tracking-wider">Δ %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.rawMaterialId} className={`border-b border-galenic-border/50 ${rowColor(r.status)}`}>
                <td className="px-3 py-2 text-galenic-primary">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={r.status} />
                    {r.name}
                  </div>
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${r.status === 'added' ? 'text-galenic-muted/40' : 'text-galenic-primary'}`}>
                  {r.amountA.toFixed(2)}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${r.status === 'removed' ? 'text-galenic-muted/40' : 'text-galenic-primary'}`}>
                  {r.amountB.toFixed(2)}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums font-semibold ${
                  r.deltaMg > 0 ? 'text-galenic-ok' : r.deltaMg < 0 ? 'text-galenic-danger' : 'text-galenic-muted/40'
                }`}>
                  {r.deltaMg !== 0 && (r.deltaMg > 0 ? '+' : '')}{r.deltaMg.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-galenic-muted">
                  {r.deltaPct == null ? '—' : `${r.deltaPct > 0 ? '+' : ''}${r.deltaPct.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Cost diff ───────────────────────────────────────────────────────────────
function CostsDiff({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-galenic-border">
      <table className="w-full text-xs font-mono">
        <thead className="bg-galenic-elevated">
          <tr className="border-b border-galenic-border">
            <th className="px-3 py-2 text-left text-galenic-muted uppercase tracking-wider">Voce</th>
            <th className="px-3 py-2 text-right text-galenic-muted uppercase tracking-wider">A</th>
            <th className="px-3 py-2 text-right text-galenic-muted uppercase tracking-wider">B</th>
            <th className="px-3 py-2 text-right text-galenic-muted uppercase tracking-wider">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const changed = Math.abs(r.delta) > 0.0001
            return (
              <tr key={r.key} className={`border-b border-galenic-border/50 ${changed ? 'bg-galenic-warning/5' : ''}`}>
                <td className="px-3 py-2 text-galenic-primary">{r.label}</td>
                <td className="px-3 py-2 text-right tabular-nums text-galenic-primary">{fmtNum(r.valA)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-galenic-primary">{fmtNum(r.valB)}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-semibold ${
                  r.delta > 0 ? 'text-galenic-ok' : r.delta < 0 ? 'text-galenic-danger' : 'text-galenic-muted/40'
                }`}>
                  {changed ? `${r.delta > 0 ? '+' : ''}${fmtNum(r.delta)}` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Meta diff ───────────────────────────────────────────────────────────────
function MetaDiff({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-galenic-border">
      <table className="w-full text-xs font-mono">
        <thead className="bg-galenic-elevated">
          <tr className="border-b border-galenic-border">
            <th className="px-3 py-2 text-left text-galenic-muted uppercase tracking-wider">Campo</th>
            <th className="px-3 py-2 text-left text-galenic-muted uppercase tracking-wider">A</th>
            <th className="px-3 py-2 text-left text-galenic-muted uppercase tracking-wider">B</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.key} className={`border-b border-galenic-border/50 ${r.changed ? 'bg-galenic-warning/5' : ''}`}>
              <td className="px-3 py-2 text-galenic-muted">{r.label}</td>
              <td className={`px-3 py-2 ${r.changed ? 'text-galenic-primary' : 'text-galenic-muted/60'}`}>
                {fmtVal(r.valA)}
              </td>
              <td className={`px-3 py-2 ${r.changed ? 'text-galenic-accent font-semibold' : 'text-galenic-muted/60'}`}>
                {fmtVal(r.valB)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function rowColor(status) {
  if (status === 'added')   return 'bg-galenic-ok/5'
  if (status === 'removed') return 'bg-galenic-danger/5'
  if (status === 'changed') return 'bg-galenic-warning/5'
  return ''
}

function StatusBadge({ status }) {
  const config = {
    added:     { color: 'text-galenic-ok',      symbol: '+' },
    removed:   { color: 'text-galenic-danger',  symbol: '−' },
    changed:   { color: 'text-galenic-warning', symbol: '~' },
    unchanged: { color: 'text-galenic-muted/40', symbol: '=' },
  }[status]
  return <span className={`text-xs font-bold ${config.color} w-3 inline-block`}>{config.symbol}</span>
}

function Pill({ icon, color, label }) {
  const colors = {
    ok:      'bg-galenic-ok/10 text-galenic-ok border-galenic-ok/20',
    danger:  'bg-galenic-danger/10 text-galenic-danger border-galenic-danger/20',
    warning: 'bg-galenic-warning/10 text-galenic-warning border-galenic-warning/20',
    muted:   'bg-galenic-elevated text-galenic-muted border-galenic-border',
  }
  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-md border ${colors[color]}`}>
      {icon}
      {label}
    </span>
  )
}

function Empty({ msg }) {
  return <div className="text-xs font-mono text-galenic-muted/40 text-center py-12">{msg}</div>
}

function fmtNum(v) {
  if (typeof v !== 'number') return '—'
  if (Math.abs(v) < 0.01) return v.toFixed(4)
  return v.toFixed(3)
}

function fmtVal(v) {
  if (v == null || v === '') return '—'
  if (typeof v === 'number')  return v.toString()
  return String(v)
}
