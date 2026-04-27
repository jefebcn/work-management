import React, { useState, useRef, useEffect } from 'react'
import {
  Layers, Plus, Trash2, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Info, Beaker,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../ui/Button.jsx'
import {
  computeCoatingResults,
  SYRUP_TEMPLATES,
  LAYER_ROLES,
  DEFAULT_SOFT_COATING,
} from '../../utils/softCoatingCalculations.js'

// ── Italian decimal helpers (mirrors IngredientRow) ────────────────────────
function fmtDec(v, d = 2) {
  if (v == null || isNaN(Number(v))) return '—'
  return Number(v).toFixed(d).replace('.', ',')
}
function parseDec(s) {
  return parseFloat(String(s ?? '').replace(',', '.'))
}

// ── Layer ingredient editor row ─────────────────────────────────────────────
function IngRow({ ing, onUpdate, onRemove }) {
  return (
    <tr className="border-t border-galenic-border/30 hover:bg-galenic-elevated/20 transition-colors">
      <td className="py-1.5 pr-2">
        <input
          type="text"
          className="cell-input w-32"
          value={ing.name}
          onChange={e => onUpdate({ name: e.target.value })}
        />
      </td>
      <td className="py-1.5 pr-2">
        <select
          className="cell-input text-xs"
          value={ing.role}
          onChange={e => onUpdate({ role: e.target.value })}
        >
          {LAYER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </td>
      <td className="py-1.5 pr-2 text-center">
        <input
          type="checkbox"
          checked={!!ing.isActive}
          onChange={e => onUpdate({ isActive: e.target.checked })}
          className="accent-[#00a4bd] w-3.5 h-3.5"
        />
      </td>
      <td className="py-1.5 pr-2">
        <input
          type="text" inputMode="decimal"
          className="cell-input w-16 text-right"
          defaultValue={fmtDec(ing.pctInDryFormula, 1)}
          onBlur={e => {
            const v = parseDec(e.target.value)
            if (!isNaN(v)) onUpdate({ pctInDryFormula: v })
            e.target.value = fmtDec(isNaN(parseDec(e.target.value)) ? ing.pctInDryFormula : parseDec(e.target.value), 1)
          }}
        />
      </td>
      <td className="py-1.5 pr-2">
        <input
          type="text" inputMode="decimal"
          className="cell-input w-16 text-right"
          defaultValue={fmtDec(ing.dryResiduePercent, 0)}
          onBlur={e => {
            const v = parseDec(e.target.value)
            if (!isNaN(v)) onUpdate({ dryResiduePercent: v })
            e.target.value = fmtDec(isNaN(parseDec(e.target.value)) ? ing.dryResiduePercent : parseDec(e.target.value), 0)
          }}
        />
      </td>
      <td className="py-1.5">
        <button
          onClick={onRemove}
          className="p-1 text-galenic-muted hover:text-galenic-danger transition-colors rounded"
        >
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  )
}

// ── Expanded layer detail ────────────────────────────────────────────────────
function LayerDetail({ layer, layerResult, dosiAlGiorno, onUpdate }) {
  function handleTemplateChange(key) {
    const tmpl = SYRUP_TEMPLATES[key]
    if (!tmpl) return
    onUpdate({
      syrupTemplate: key,
      ingredients: tmpl.ingredients.map(i => ({
        ...i,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        rawMaterialId: null,
      })),
    })
  }

  function addIngredient() {
    const newIng = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name: 'Nuovo ingrediente',
      role: 'altro',
      isActive: false,
      pctInDryFormula: 0,
      dryResiduePercent: 100,
      rawMaterialId: null,
    }
    onUpdate({ ingredients: [...(layer.ingredients || []), newIng] })
  }

  function updateIng(id, fields) {
    onUpdate({
      ingredients: (layer.ingredients || []).map(i => i.id === id ? { ...i, ...fields } : i),
    })
  }

  function removeIng(id) {
    onUpdate({ ingredients: (layer.ingredients || []).filter(i => i.id !== id) })
  }

  const mgPiece = layerResult?.targetDryWeightMg ?? 0
  const mgDie   = mgPiece * (dosiAlGiorno || 1)

  return (
    <div className="bg-galenic-elevated/20 border-t border-galenic-border/40 px-4 py-3 space-y-3">
      {/* Row 1: name, type, template, overdosage */}
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="cell-unit block mb-1">Nome strato</label>
          <input
            type="text"
            className="cell-input w-32"
            value={layer.name}
            onChange={e => onUpdate({ name: e.target.value })}
          />
        </div>

        <div>
          <label className="cell-unit block mb-1">Tipo</label>
          <div className="flex gap-1">
            {['coating', 'finishing'].map(t => (
              <button
                key={t}
                onClick={() => onUpdate({ type: t })}
                className={[
                  'px-2.5 py-1 rounded text-xs font-mono transition-colors',
                  layer.type === t
                    ? 'bg-galenic-accent text-white'
                    : 'bg-galenic-elevated border border-galenic-border text-galenic-muted hover:text-galenic-primary',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="cell-unit block mb-1">Template sciroppo</label>
          <select
            className="cell-input"
            value={layer.syrupTemplate || 'custom'}
            onChange={e => handleTemplateChange(e.target.value)}
          >
            {Object.entries(SYRUP_TEMPLATES).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="cell-unit block mb-1">Perdita processo</label>
          <div className="flex items-center gap-1">
            <input
              type="text" inputMode="decimal"
              className="cell-input w-16 text-right"
              defaultValue={fmtDec(layer.processLossOverdosagePct, 1)}
              onBlur={e => {
                const v = parseDec(e.target.value)
                if (!isNaN(v)) onUpdate({ processLossOverdosagePct: v })
                e.target.value = fmtDec(isNaN(parseDec(e.target.value)) ? layer.processLossOverdosagePct : parseDec(e.target.value), 1)
              }}
            />
            <span className="cell-unit">%</span>
          </div>
        </div>
      </div>

      {/* Calculated info row */}
      <div className="flex gap-4 text-xs font-mono text-galenic-muted">
        <span>Residuo secco per caramella: <span className="text-galenic-primary font-semibold">{fmtDec(mgPiece)} mg</span></span>
        <span>Per die: <span className="text-galenic-primary font-semibold">{fmtDec(mgDie)} mg</span></span>
      </div>

      {/* Ingredient table */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="cell-unit">Ingredienti sciroppo (% sul residuo secco)</span>
          <button
            onClick={addIngredient}
            className="flex items-center gap-1 text-xs text-galenic-accent hover:opacity-80 font-mono transition-opacity"
          >
            <Plus size={10} />Aggiungi
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-galenic-muted">
                <th className="text-left py-1 pr-2 font-medium">Nome</th>
                <th className="text-left py-1 pr-2 font-medium">Ruolo</th>
                <th className="text-center py-1 pr-2 font-medium" title="Ingrediente attivo — riceve sovra-dosaggio perdita di processo">
                  Attivo
                </th>
                <th className="text-right py-1 pr-2 font-medium">% dry</th>
                <th className="text-right py-1 pr-2 font-medium">Res.secco%</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(layer.ingredients || []).map(ing => (
                <IngRow
                  key={ing.id}
                  ing={ing}
                  onUpdate={f => updateIng(ing.id, f)}
                  onRemove={() => removeIng(ing.id)}
                />
              ))}
            </tbody>
          </table>
          {(layer.ingredients || []).length === 0 && (
            <p className="text-xs text-galenic-muted font-mono py-2 text-center">
              Nessun ingrediente — scegli un template o aggiungi manualmente.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Layer row (triple-sync: %, mg/piece, mg/die) ─────────────────────────────
function LayerRow({ layer, layerResult, coreWeightMg, dosiAlGiorno, onUpdate, onRemove, expanded, onToggle }) {
  const mgPiece = layerResult?.targetDryWeightMg ?? 0
  const mgDie   = mgPiece * (dosiAlGiorno || 1)

  const [pctStr, setPctStr] = useState(fmtDec(layer.targetWeightGainPct))
  const [mgStr,  setMgStr]  = useState(fmtDec(mgPiece))
  const focused = useRef(null)

  useEffect(() => {
    if (focused.current !== 'pct') setPctStr(fmtDec(layer.targetWeightGainPct))
  }, [layer.targetWeightGainPct])

  useEffect(() => {
    if (focused.current !== 'mg') setMgStr(fmtDec(mgPiece))
  }, [mgPiece])

  function handlePctBlur(e) {
    focused.current = null
    const v = parseDec(e.target.value)
    if (!isNaN(v)) {
      onUpdate({ targetWeightGainPct: v })
      setPctStr(fmtDec(v))
    } else {
      setPctStr(fmtDec(layer.targetWeightGainPct))
    }
  }

  function handleMgBlur(e) {
    focused.current = null
    const v = parseDec(e.target.value)
    if (!isNaN(v) && coreWeightMg > 0) {
      const pct = (v / coreWeightMg) * 100
      onUpdate({ targetWeightGainPct: pct })
      setMgStr(fmtDec(v))
    } else {
      setMgStr(fmtDec(mgPiece))
    }
  }

  return (
    <>
      <tr className="border-b border-galenic-border hover:bg-galenic-elevated/10 transition-colors">
        <td className="px-3 py-2.5">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 text-xs font-mono text-galenic-primary hover:text-galenic-accent transition-colors"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className={[
              'px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide',
              layer.type === 'finishing'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            ].join(' ')}>
              {layer.type === 'finishing' ? 'fin' : 'coat'}
            </span>
            <span>{layer.name}</span>
          </button>
        </td>

        {/* % weight gain input */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1">
            <input
              type="text" inputMode="decimal"
              className="cell-input w-20 text-right"
              value={pctStr}
              onFocus={() => { focused.current = 'pct' }}
              onBlur={handlePctBlur}
              onChange={e => setPctStr(e.target.value)}
            />
            <span className="cell-unit">%</span>
          </div>
        </td>

        {/* mg/piece input */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1">
            <input
              type="text" inputMode="decimal"
              className="cell-input w-24 text-right"
              value={mgStr}
              onFocus={() => { focused.current = 'mg' }}
              onBlur={handleMgBlur}
              onChange={e => setMgStr(e.target.value)}
            />
            <span className="cell-unit">mg/caram.</span>
          </div>
        </td>

        {/* mg/die (read-only) */}
        <td className="px-3 py-2.5 text-xs font-mono text-galenic-muted text-right whitespace-nowrap">
          {fmtDec(mgDie)} <span className="cell-unit">mg/die</span>
        </td>

        <td className="px-2 py-2.5">
          <button
            onClick={onRemove}
            className="p-1 text-galenic-muted hover:text-galenic-danger transition-colors rounded"
          >
            <Trash2 size={12} />
          </button>
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={5} className="p-0">
            <LayerDetail
              layer={layer}
              layerResult={layerResult}
              dosiAlGiorno={dosiAlGiorno}
              onUpdate={onUpdate}
            />
          </td>
        </tr>
      )}
    </>
  )
}

// ── Weight stack visualization ───────────────────────────────────────────────
function WeightStack({ results }) {
  if (!results) return null
  const { coreWeightMg, layerResults, finalWeightMg } = results
  if (finalWeightMg <= 0) return null

  const segments = [
    { label: 'Nucleo', mg: coreWeightMg, color: 'bg-galenic-accent' },
    ...layerResults.map((l, i) => ({
      label: l.name,
      mg: l.targetDryWeightMg,
      color: l.type === 'finishing'
        ? 'bg-purple-400'
        : i % 2 === 0 ? 'bg-sky-400' : 'bg-cyan-400',
    })),
  ]

  return (
    <div className="space-y-1.5">
      <div className="flex h-6 rounded-lg overflow-hidden border border-galenic-border gap-px">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`${seg.color} transition-all duration-500 flex items-center justify-center overflow-hidden`}
            style={{ width: `${(seg.mg / finalWeightMg) * 100}%` }}
            title={`${seg.label}: ${fmtDec(seg.mg)} mg`}
          />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] font-mono text-galenic-muted">
            <span className={`w-2 h-2 rounded-sm ${seg.color}`} />
            {seg.label} ({fmtDec(seg.mg, 0)} mg)
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function SoftCoatingPanel() {
  const {
    activeFormula,
    updateSoftCoating,
    addCoatingLayer,
    removeCoatingLayer,
    updateCoatingLayer,
  } = useApp()

  const [expandedLayer, setExpandedLayer] = useState(null)

  if (!activeFormula) return null

  const sc      = activeFormula.softCoating || DEFAULT_SOFT_COATING
  const results = computeCoatingResults(sc, activeFormula)

  function toggleEnabled() {
    updateSoftCoating({ enabled: !sc.enabled })
  }

  function toggleLayer(id) {
    setExpandedLayer(prev => prev === id ? null : id)
  }

  return (
    <div className="galenic-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-galenic-border bg-galenic-elevated/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-galenic-accent" />
          <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
            Soft Coating — Multi-Layer
          </h3>
        </div>
        <button
          onClick={toggleEnabled}
          className={[
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            sc.enabled ? 'bg-galenic-accent' : 'bg-galenic-border',
          ].join(' ')}
        >
          <span className={[
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
            sc.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]',
          ].join(' ')} />
        </button>
      </div>

      {!sc.enabled ? (
        <div className="px-5 py-8 text-center">
          <Layers size={28} className="mx-auto mb-2 text-galenic-border" />
          <p className="text-xs text-galenic-muted font-mono">
            Attiva il modulo per configurare i layer di rivestimento.
          </p>
        </div>
      ) : (
        <div className="p-5 space-y-5">

          {/* ── Core Configuration ────────────────────────────────────── */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-galenic-muted font-mono">
              Configurazione Nucleo
            </h4>
            <div className="flex gap-4 flex-wrap items-start">

              {/* Shape */}
              <div>
                <label className="cell-unit block mb-1.5">Forma</label>
                <div className="flex gap-1">
                  {['Sfera', 'Cilindro', 'Oblunga'].map(s => (
                    <button
                      key={s}
                      onClick={() => updateSoftCoating({ shape: s })}
                      className={[
                        'px-2.5 py-1 rounded text-xs font-mono transition-colors',
                        sc.shape === s
                          ? 'bg-galenic-accent text-white'
                          : 'bg-galenic-elevated border border-galenic-border text-galenic-muted hover:text-galenic-primary',
                      ].join(' ')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consistency */}
              <div>
                <label className="cell-unit block mb-1.5">Consistenza</label>
                <div className="flex gap-1">
                  {['Dura', 'Morbida'].map(c => (
                    <button
                      key={c}
                      onClick={() => updateSoftCoating({ consistency: c })}
                      className={[
                        'px-2.5 py-1 rounded text-xs font-mono transition-colors',
                        sc.consistency === c
                          ? 'bg-galenic-accent text-white'
                          : 'bg-galenic-elevated border border-galenic-border text-galenic-muted hover:text-galenic-primary',
                      ].join(' ')}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Porosity (only for Morbida) */}
              {sc.consistency === 'Morbida' && (
                <div>
                  <label className="cell-unit block mb-1.5">Porosità (assorbimento)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text" inputMode="decimal"
                      className="cell-input w-16 text-right"
                      defaultValue={fmtDec(sc.porosityFactor, 0)}
                      onBlur={e => {
                        const v = parseDec(e.target.value)
                        if (!isNaN(v)) updateSoftCoating({ porosityFactor: Math.max(0, Math.min(100, v)) })
                        e.target.value = fmtDec(sc.porosityFactor, 0)
                      }}
                    />
                    <span className="cell-unit">%</span>
                  </div>
                </div>
              )}

              {/* Core info */}
              <div className="text-xs font-mono space-y-0.5 pt-5 text-galenic-muted">
                <div>
                  Nucleo: <span className="text-galenic-primary font-semibold">
                    {fmtDec(activeFormula.targetWeightMg, 0)} mg
                  </span>
                  <span className="text-[10px] ml-1">(dal formulatore)</span>
                </div>
                {results && (
                  <div>
                    Superficie stimata: <span className="text-galenic-primary font-semibold">
                      {fmtDec(results.surfaceAreaMm2, 0)} mm²
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Weight stack visualization ────────────────────────────── */}
          {results && results.layerResults.length > 0 && (
            <section className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-galenic-muted font-mono">
                  Composizione peso finale
                </h4>
                <span className="text-xs font-mono text-galenic-primary font-semibold">
                  {fmtDec(results.finalWeightMg, 1)} mg / caramella
                </span>
              </div>
              <WeightStack results={results} />
            </section>
          )}

          {/* ── Layers table ─────────────────────────────────────────── */}
          <section className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-galenic-muted font-mono">
              Strati
            </h4>

            <div className="border border-galenic-border rounded-xl overflow-hidden">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="bg-galenic-elevated border-b border-galenic-border">
                    <th className="px-3 py-2.5 text-left text-xs text-galenic-muted font-medium uppercase tracking-wider">Strato</th>
                    <th className="px-3 py-2.5 text-left text-xs text-galenic-muted font-medium uppercase tracking-wider">Guadagno %</th>
                    <th className="px-3 py-2.5 text-left text-xs text-galenic-muted font-medium uppercase tracking-wider">mg / caramella</th>
                    <th className="px-3 py-2.5 text-right text-xs text-galenic-muted font-medium uppercase tracking-wider">mg / die</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {/* Core row (read-only) */}
                  <tr className="border-b border-galenic-border bg-galenic-elevated/30">
                    <td className="px-3 py-2.5 text-xs font-mono text-galenic-muted">
                      <span className="px-1.5 py-0.5 rounded bg-galenic-border/60 text-[10px] uppercase font-bold tracking-wide mr-1.5">core</span>
                      Nucleo
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono text-galenic-muted">100%</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-galenic-primary font-semibold">
                      {fmtDec(activeFormula.targetWeightMg, 0)} mg
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono text-galenic-muted text-right">
                      {fmtDec((activeFormula.targetWeightMg || 0) * (activeFormula.dosiAlGiorno || 1), 0)} mg
                    </td>
                    <td />
                  </tr>

                  {/* Dynamic layer rows */}
                  {(sc.layers || []).map(layer => {
                    const lr = results?.layerResults?.find(r => r.id === layer.id)
                    return (
                      <LayerRow
                        key={layer.id}
                        layer={layer}
                        layerResult={lr}
                        coreWeightMg={activeFormula.targetWeightMg || 500}
                        dosiAlGiorno={activeFormula.dosiAlGiorno || 1}
                        onUpdate={fields => updateCoatingLayer(layer.id, fields)}
                        onRemove={() => { removeCoatingLayer(layer.id); setExpandedLayer(null) }}
                        expanded={expandedLayer === layer.id}
                        onToggle={() => toggleLayer(layer.id)}
                      />
                    )
                  })}

                  {(sc.layers || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-xs font-mono text-galenic-muted">
                        Nessuno strato aggiunto. Usa i pulsanti sotto per iniziare.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add layer buttons */}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => addCoatingLayer('coating')}>
                <Plus size={11} className="mr-1" />Aggiungi Coating
              </Button>
              <Button variant="ghost" size="sm" onClick={() => addCoatingLayer('finishing')}>
                <Plus size={11} className="mr-1" />Aggiungi Finishing
              </Button>
            </div>
          </section>

          {/* ── Batch monitoring ─────────────────────────────────────── */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-galenic-muted font-mono">
              Monitoraggio Lotto
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Batch size input */}
              <div>
                <label className="cell-unit block mb-1">Pezzi per lotto</label>
                <input
                  type="text" inputMode="numeric"
                  className="cell-input w-full text-right"
                  defaultValue={(sc.batchPieces || 50000).toLocaleString('it-IT')}
                  onBlur={e => {
                    const v = parseInt(e.target.value.replace(/\D/g, ''), 10)
                    if (!isNaN(v) && v > 0) updateSoftCoating({ batchPieces: v })
                    e.target.value = (sc.batchPieces || 50000).toLocaleString('it-IT')
                  }}
                />
              </div>

              {/* Saturation threshold */}
              <div>
                <label className="cell-unit block mb-1">Soglia saturazione</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text" inputMode="decimal"
                    className="cell-input w-full text-right"
                    defaultValue={fmtDec(sc.saturationAlert, 0)}
                    onBlur={e => {
                      const v = parseDec(e.target.value)
                      if (!isNaN(v) && v > 0) updateSoftCoating({ saturationAlert: v })
                      e.target.value = fmtDec(sc.saturationAlert, 0)
                    }}
                  />
                  <span className="cell-unit">%</span>
                </div>
              </div>

              {/* Final weight display */}
              {results && (
                <div>
                  <label className="cell-unit block mb-1">Peso finale</label>
                  <div className="cell-output text-right">
                    {fmtDec(results.finalWeightMg, 1)} mg
                  </div>
                </div>
              )}

              {/* Total batch kg */}
              {results && (
                <div>
                  <label className="cell-unit block mb-1">Totale lotto</label>
                  <div className="cell-output text-right font-semibold">
                    {results.batchKg.toFixed(2)} kg
                  </div>
                </div>
              )}
            </div>

            {/* Saturation bar + alert */}
            {results && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-galenic-muted">
                    Guadagno peso totale: <span className={`font-semibold ${results.saturationExceeded ? 'text-galenic-danger' : 'text-galenic-ok'}`}>
                      {fmtDec(results.totalWeightGainPct, 1)}%
                    </span>
                  </span>
                  <span className="text-galenic-muted">Soglia: {fmtDec(sc.saturationAlert, 0)}%</span>
                </div>
                <div className="h-2 bg-galenic-elevated border border-galenic-border rounded-full overflow-hidden">
                  <div
                    className={[
                      'h-full rounded-full transition-all duration-500',
                      results.saturationExceeded ? 'bg-galenic-danger fill-pulse-red' : 'bg-galenic-ok',
                    ].join(' ')}
                    style={{ width: `${Math.min(100, (results.totalWeightGainPct / (sc.saturationAlert || 30)) * 100)}%` }}
                  />
                </div>
                {results.saturationExceeded && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-galenic-danger/10 border border-galenic-danger/30 rounded-lg text-xs font-mono text-galenic-danger">
                    <AlertTriangle size={13} className="shrink-0" />
                    Guadagno peso ({fmtDec(results.totalWeightGainPct, 1)}%) supera la soglia di saturazione ({fmtDec(sc.saturationAlert, 0)}%).
                    Rischio di cracking o distacco del coating.
                  </div>
                )}
                {!results.saturationExceeded && results.totalWeightGainPct > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-galenic-ok/10 border border-galenic-ok/30 rounded-lg text-xs font-mono text-galenic-ok">
                    <CheckCircle2 size={13} className="shrink-0" />
                    Guadagno peso nei limiti — coating ottimale.
                  </div>
                )}
              </div>
            )}

            {/* Porosity info */}
            {results && results.absorbedMg > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-galenic-elevated border border-galenic-border rounded-lg text-xs font-mono text-galenic-muted">
                <Info size={12} className="shrink-0" />
                Nucleo Morbido: ~{fmtDec(results.absorbedMg, 1)} mg di fase liquida assorbiti per porosità (non contribuiscono al guadagno superficiale).
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  )
}
