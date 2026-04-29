import React, { useState, useEffect } from 'react'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../ui/Button.jsx'

function fmtDec(v, d = 2) {
  if (v == null || isNaN(Number(v))) return '—'
  return Number(v).toFixed(d).replace('.', ',')
}
function parseDec(s) {
  return parseFloat(String(s ?? '').replace(',', '.'))
}

export default function FastLabPrototype({ onExported }) {
  const { activeFormula, rawMaterials, importFastLabPrototype } = useApp()

  const [coreStr,  setCoreStr]  = useState(() => String(activeFormula?.targetWeightMg || 500))
  const [finalStr, setFinalStr] = useState(() => String((activeFormula?.targetWeightMg || 500) + 200))
  const [batch,    setBatch]    = useState(10000)

  // selected: [{ rowId, amountMg }]
  const [selected, setSelected] = useState([])

  // Reset core when a different formula is opened
  useEffect(() => {
    setCoreStr(String(activeFormula?.targetWeightMg || 500))
    setFinalStr(String((activeFormula?.targetWeightMg || 500) + 200))
    setSelected([])
  }, [activeFormula?.id])

  const coreWeightMg  = parseDec(coreStr)  || 0
  const finalWeightMg = parseDec(finalStr) || 0
  const coatingSpaceMg = Math.max(0, finalWeightMg - coreWeightMg)
  const weightGainPct  = coreWeightMg > 0 ? (coatingSpaceMg / coreWeightMg) * 100 : 0

  const totalActiveMg = selected.reduce((s, a) => s + (a.amountMg || 0), 0)
  const excipientMg   = Math.max(0, coatingSpaceMg - totalActiveMg)
  const overfilled    = totalActiveMg > coatingSpaceMg && coatingSpaceMg > 0

  const formulaIngs = (activeFormula?.ingredients || []).filter(i => i.rawMaterialId)

  function toggleSelect(rowId) {
    setSelected(prev => {
      const exists = prev.find(a => a.rowId === rowId)
      if (exists) return prev.filter(a => a.rowId !== rowId)
      const ing = formulaIngs.find(i => i.rowId === rowId)
      return [...prev, { rowId, amountMg: parseFloat(ing?.amountMg) || 0 }]
    })
  }

  function setActiveMg(rowId, mg) {
    setSelected(prev => prev.map(a => a.rowId === rowId ? { ...a, amountMg: mg } : a))
  }

  const tableRows = [
    ...selected.map(a => {
      const ing = formulaIngs.find(i => i.rowId === a.rowId)
      const rm  = rawMaterials.find(r => r.id === ing?.rawMaterialId)
      const mg  = a.amountMg || 0
      return {
        key:      a.rowId,
        name:     rm?.name || '—',
        mg,
        pct:      coatingSpaceMg > 0 ? (mg / coatingSpaceMg) * 100 : 0,
        isActive: true,
      }
    }),
    {
      key:      '__exc__',
      name:     'Eccipiente Neutro',
      mg:       Math.max(0, excipientMg),
      pct:      coatingSpaceMg > 0 ? (Math.max(0, excipientMg) / coatingSpaceMg) * 100 : 0,
      isActive: false,
    },
  ]

  function handleExport() {
    if (coatingSpaceMg <= 0 || overfilled) return
    importFastLabPrototype({
      coreWeightMg,
      finalWeightMg,
      actives: selected.map(a => ({ rowId: a.rowId, amountMg: a.amountMg || 0 })),
    })
    onExported?.()
  }

  return (
    <div className="p-5 space-y-5">

      {/* ── Core + Final weight ──────────────────────────── */}
      <section className="space-y-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-galenic-muted font-mono">
          Pesi
        </h4>
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="cell-unit block mb-1">Peso Nucleo</label>
            <div className="flex items-center gap-1">
              <input
                type="text" inputMode="decimal"
                className="cell-input w-24 text-right"
                value={coreStr}
                onChange={e => setCoreStr(e.target.value)}
                onBlur={e => {
                  const v = parseDec(e.target.value)
                  if (!isNaN(v) && v > 0) setCoreStr(fmtDec(v, 0))
                }}
              />
              <span className="cell-unit">mg</span>
            </div>
          </div>

          <span className="text-galenic-muted font-mono mb-2">→</span>

          <div>
            <label className="cell-unit block mb-1">Peso Finale Target</label>
            <div className="flex items-center gap-1">
              <input
                type="text" inputMode="decimal"
                className="cell-input w-24 text-right"
                value={finalStr}
                onChange={e => setFinalStr(e.target.value)}
                onBlur={e => {
                  const v = parseDec(e.target.value)
                  if (!isNaN(v) && v > 0) setFinalStr(fmtDec(v, 0))
                }}
              />
              <span className="cell-unit">mg</span>
            </div>
          </div>

          {coatingSpaceMg > 0 && (
            <div className="text-xs font-mono space-y-0.5 mb-0.5">
              <div>
                <span className="text-galenic-muted">Spazio coating: </span>
                <span className="text-galenic-primary font-semibold">{fmtDec(coatingSpaceMg, 0)} mg</span>
              </div>
              <div className="text-galenic-muted">
                Guadagno peso: <span className="text-galenic-accent">{fmtDec(weightGainPct, 1)}%</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Active ingredient selector ───────────────────── */}
      <section className="space-y-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-galenic-muted font-mono">
          Attivi da Composizione
        </h4>

        {formulaIngs.length === 0 ? (
          <p className="text-xs font-mono text-galenic-muted italic py-2">
            Aggiungi ingredienti nella scheda Composizione per selezionarli.
          </p>
        ) : (
          <div className="space-y-1.5">
            {formulaIngs.map(ing => {
              const rm      = rawMaterials.find(r => r.id === ing.rawMaterialId)
              const sel     = selected.find(a => a.rowId === ing.rowId)
              const checked = !!sel
              return (
                <label
                  key={ing.rowId}
                  className={[
                    'flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none',
                    checked
                      ? 'border-galenic-accent/50 bg-galenic-accent/5'
                      : 'border-galenic-border/50 hover:border-galenic-border',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(ing.rowId)}
                    className="accent-[#00a4bd] shrink-0"
                  />
                  <span className="flex-1 text-xs font-mono text-galenic-primary">
                    {rm?.name || '—'}
                  </span>
                  <span className="text-[10px] font-mono text-galenic-muted shrink-0">
                    {fmtDec(ing.amountMg)} mg in formula
                  </span>
                  {checked && (
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.preventDefault()}>
                      <input
                        type="text" inputMode="decimal"
                        className="cell-input w-20 text-right text-xs"
                        defaultValue={fmtDec(sel.amountMg, 1)}
                        onBlur={e => {
                          const v = parseDec(e.target.value)
                          if (!isNaN(v) && v >= 0) {
                            setActiveMg(ing.rowId, v)
                          }
                          e.target.value = fmtDec(
                            isNaN(parseDec(e.target.value)) ? sel.amountMg : parseDec(e.target.value), 1,
                          )
                        }}
                      />
                      <span className="cell-unit text-[10px]">mg</span>
                    </div>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Powder composition table ─────────────────────── */}
      {coatingSpaceMg > 0 && (
        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-galenic-muted font-mono">
            Ricetta Polvere di Rivestimento
          </h4>

          {overfilled && (
            <div className="flex items-center gap-2 px-3 py-2 bg-galenic-danger/10 border border-galenic-danger/30 rounded-lg text-xs font-mono text-galenic-danger">
              <AlertTriangle size={12} className="shrink-0" />
              Totale attivi ({fmtDec(totalActiveMg, 0)} mg) supera lo spazio coating ({fmtDec(coatingSpaceMg, 0)} mg).
            </div>
          )}

          <div className="border border-galenic-border rounded-xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-galenic-elevated border-b border-galenic-border">
                  <th className="px-3 py-2 text-left text-[10px] text-galenic-muted font-medium uppercase tracking-wider">Componente</th>
                  <th className="px-3 py-2 text-right text-[10px] text-galenic-muted font-medium uppercase tracking-wider">mg / pz</th>
                  <th className="px-3 py-2 text-right text-[10px] text-galenic-muted font-medium uppercase tracking-wider">%</th>
                  <th className="px-3 py-2 text-right text-[10px] text-galenic-muted font-medium uppercase tracking-wider">
                    g / {batch.toLocaleString('it-IT')} pz
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr
                    key={row.key}
                    className={[
                      'border-t border-galenic-border/50',
                      !row.isActive ? 'text-galenic-muted' : '',
                    ].join(' ')}
                  >
                    <td className="px-3 py-2 text-galenic-primary">{row.name}</td>
                    <td className="px-3 py-2 text-right">{fmtDec(row.mg, 1)}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={row.isActive && row.pct > 0 ? 'text-galenic-ok font-semibold' : ''}>
                        {fmtDec(row.pct, 1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtDec((row.mg * batch) / 1000, 1)} g
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-galenic-border bg-galenic-elevated/40 font-semibold text-galenic-primary">
                  <td className="px-3 py-2">Totale polvere</td>
                  <td className="px-3 py-2 text-right">{fmtDec(coatingSpaceMg, 1)}</td>
                  <td className="px-3 py-2 text-right">100,0%</td>
                  <td className="px-3 py-2 text-right">
                    {fmtDec((coatingSpaceMg * batch) / 1000, 1)} g
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Batch size */}
          <div className="flex items-center gap-2 text-xs font-mono text-galenic-muted">
            <span>Lotto:</span>
            <input
              type="text" inputMode="numeric"
              className="cell-input w-28 text-right"
              defaultValue={batch.toLocaleString('it-IT')}
              onBlur={e => {
                const v = parseInt(e.target.value.replace(/\D/g, ''), 10)
                if (!isNaN(v) && v > 0) setBatch(v)
                e.target.value = (isNaN(v) ? batch : v).toLocaleString('it-IT')
              }}
            />
            <span>pezzi</span>
          </div>
        </section>
      )}

      {/* ── Export button ─────────────────────────────────── */}
      <div className="pt-2 border-t border-galenic-border/50 flex items-center justify-between gap-3">
        <p className="text-[10px] font-mono text-galenic-muted">
          Esportando: crea un layer "Strato Coating" e imposta il Peso Nucleo nel formulatore.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          disabled={coatingSpaceMg <= 0 || overfilled}
        >
          <ArrowRight size={13} className="mr-1.5" />
          Esporta in Soft-Coating
        </Button>
      </div>

    </div>
  )
}
