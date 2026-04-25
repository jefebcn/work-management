import React, { useState, useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Badge from '../ui/Badge.jsx'
import FillerToggle from './FillerToggle.jsx'
import { fromMg, toMg } from '../../utils/weightConversions.js'

// All four input fields are always visible.
// Changing any one field back-calculates amountMg and the other three update live.
//
//  QUANTITÀ           APPORTO REALE
//  [___] {unit}/dose  [___] mg/dose
//  [___] {unit}/die   [___] mg/die

export default function IngredientRow({ computedRow, rowIndex = 0 }) {
  const { rawMaterials, activeFormula, setIngredientAmount, removeIngredient } = useApp()

  const rm = rawMaterials.find(r => r.id === computedRow.rawMaterialId)
  if (!rm) return null

  const ingredient = activeFormula.ingredients.find(i => i.rowId === computedRow.rowId)
  if (!ingredient) return null

  const unit          = activeFormula.targetWeightUnit || 'mg'
  const dosiAlGiorno  = activeFormula.dosiAlGiorno || 1
  const isLiquido     = activeFormula.type === 'Liquidi'
  const volumeMl      = isLiquido ? activeFormula.targetWeightMg / 1000 : 0
  const factor        = (rm.purity / 100) * (rm.titration / 100)
  const canApt        = factor > 0
  const isReadOnly    = computedRow.isFiller

  // ── Derived display values ─────────────────────────────────────────────────

  const qtyPerDose  = fromMg(computedRow.amountMg, unit)
  const qtyPerDay   = qtyPerDose * dosiAlGiorno
  const aptPerDose  = computedRow.realNutrientContribution
  const aptPerDay   = computedRow.dailyContribution
  const concMgMl    = isLiquido && volumeMl > 0 ? computedRow.amountMg / volumeMl : 0

  // ── Local string states — allow typing "0.001" without intermediate wipe ──
  // Controlled inputs with value={fmt(computed)} wipe "0" on every keystroke
  // because fmt(0)='' causes React to clear the input after parseFloat("0")=0.
  // Fix: each input holds its own string; useEffect syncs from computed only
  // when that field is not focused.

  const [qDoseStr, setQDoseStr] = useState('')
  const [qDieStr,  setQDieStr]  = useState('')
  const [aDoseStr, setADoseStr] = useState('')
  const [aDieStr,  setADieStr]  = useState('')
  const [concStr,  setConcStr]  = useState('')
  const focused = useRef(null)  // 'qDose' | 'qDie' | 'aDose' | 'aDie' | 'conc' | null

  // Format: strip trailing zeros, show empty string for zero/null
  function display(v) {
    if (!v) return ''
    return String(parseFloat(v.toFixed(6)))
  }

  // Sync display strings from computed values whenever they change,
  // but skip the field the user is currently typing in.
  useEffect(() => {
    if (focused.current !== 'qDose') setQDoseStr(display(qtyPerDose))
    if (focused.current !== 'qDie')  setQDieStr(display(qtyPerDay))
    if (focused.current !== 'aDose') setADoseStr(display(aptPerDose))
    if (focused.current !== 'aDie')  setADieStr(display(aptPerDay))
    if (focused.current !== 'conc')  setConcStr(display(concMgMl))
  }, [qtyPerDose, qtyPerDay, aptPerDose, aptPerDay, concMgMl])

  // ── Four handlers, each back-calculating amountMg ─────────────────────────

  function onQtyDose(e) {
    setIngredientAmount(computedRow.rowId, toMg(parseFloat(e.target.value) || 0, unit))
  }
  function onQtyDie(e) {
    const daily = parseFloat(e.target.value) || 0
    setIngredientAmount(computedRow.rowId, daily > 0 ? toMg(daily, unit) / dosiAlGiorno : 0)
  }
  function onAptDose(e) {
    if (!canApt) return
    setIngredientAmount(computedRow.rowId, (parseFloat(e.target.value) || 0) / factor)
  }
  function onAptDie(e) {
    if (!canApt) return
    const daily = parseFloat(e.target.value) || 0
    setIngredientAmount(computedRow.rowId, daily > 0 ? daily / (dosiAlGiorno * factor) : 0)
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  function nrvVariant(pct) {
    if (pct === null) return 'neutral'
    if (pct > 200)    return 'warning'
    if (pct > 100)    return 'caution'
    if (pct >= 15)    return 'ok'
    return 'neutral'
  }

  const rowBg = computedRow.exceedsMaxLimit
    ? 'bg-galenic-danger/5 border-l-2 border-galenic-danger'
    : `border-l-2 border-transparent ${rowIndex % 2 === 1 ? 'bg-galenic-elevated/25' : ''}`

  // Borderless by default — ring appears only on focus (user request)
  function inputCls(editable, danger = false) {
    if (!editable) return 'w-full font-mono text-sm px-2 py-1 outline-none tabular-nums bg-transparent text-galenic-muted cursor-default opacity-50'
    if (danger)   return 'w-full font-mono text-sm px-2 py-1 outline-none tabular-nums bg-transparent rounded-md text-galenic-danger focus:ring-2 focus:ring-galenic-danger focus:bg-galenic-danger/5 transition-all'
    return 'w-full font-mono text-sm px-2 py-1 outline-none tabular-nums bg-transparent rounded-md text-galenic-primary hover:bg-galenic-elevated/60 focus:ring-2 focus:ring-galenic-accent focus:bg-galenic-elevated/80 transition-all'
  }

  const lbl = 'text-xs text-galenic-muted font-mono whitespace-nowrap w-16 shrink-0'

  return (
    <tr className={`border-b border-galenic-border hover:bg-galenic-accent/5 transition-colors ${rowBg}`}>

      {/* Material name */}
      <td className="px-4 py-3">
        <div className="font-medium text-sm text-galenic-primary">{rm.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {rm.activeNutrient && (
            <span className="text-xs text-galenic-muted">{rm.activeNutrient}</span>
          )}
          {rm.titration > 0 && rm.titration < 100 && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-galenic-accent/10 text-galenic-accent border border-galenic-accent/20 shrink-0">
              {rm.titration}% tit.
            </span>
          )}
          {rm.purity > 0 && rm.purity < 100 && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-galenic-elevated text-galenic-muted border border-galenic-border shrink-0">
              {rm.purity}% pur.
            </span>
          )}
        </div>
      </td>

      {/* QUANTITÀ — Q/dose on top, Q/die below */}
      <td className="px-4 py-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type="number" step="any" min="0"
              value={qDoseStr}
              onChange={!isReadOnly ? e => {
                setQDoseStr(e.target.value)
                const v = parseFloat(e.target.value)
                if (v > 0) setIngredientAmount(computedRow.rowId, toMg(v, unit))
              } : undefined}
              onFocus={!isReadOnly ? () => { focused.current = 'qDose' } : undefined}
              onBlur={!isReadOnly ? e => { focused.current = null; onQtyDose(e) } : undefined}
              readOnly={isReadOnly}
              className={inputCls(!isReadOnly)}
            />
            <span className={lbl}>{unit}/dose</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number" step="any" min="0"
              value={qDieStr}
              onChange={!isReadOnly ? e => {
                setQDieStr(e.target.value)
                const v = parseFloat(e.target.value)
                if (v > 0) setIngredientAmount(computedRow.rowId, toMg(v, unit) / dosiAlGiorno)
              } : undefined}
              onFocus={!isReadOnly ? () => { focused.current = 'qDie' } : undefined}
              onBlur={!isReadOnly ? e => { focused.current = null; onQtyDie(e) } : undefined}
              readOnly={isReadOnly}
              className={inputCls(!isReadOnly)}
            />
            <span className={lbl}>{unit}/die</span>
          </div>

          {/* mg/mL concentration — Liquidi only */}
          {isLiquido && (
            <div className="flex items-center gap-1.5">
              <input
                type="number" step="any" min="0"
                value={concStr}
                onChange={!isReadOnly && volumeMl > 0 ? e => {
                  setConcStr(e.target.value)
                  const v = parseFloat(e.target.value)
                  if (v > 0) setIngredientAmount(computedRow.rowId, v * volumeMl)
                } : undefined}
                onFocus={!isReadOnly && volumeMl > 0 ? () => { focused.current = 'conc' } : undefined}
                onBlur={!isReadOnly && volumeMl > 0 ? e => {
                  focused.current = null
                  const v = parseFloat(e.target.value) || 0
                  if (v >= 0) setIngredientAmount(computedRow.rowId, v * volumeMl)
                } : undefined}
                readOnly={isReadOnly || volumeMl === 0}
                className={inputCls(!isReadOnly && volumeMl > 0) + ' border-t border-galenic-border/30 mt-0.5 pt-1.5'}
              />
              <span className={`${lbl} text-galenic-accent/70`}>mg/mL</span>
            </div>
          )}
        </div>
      </td>

      {/* % of total */}
      <td className="px-4 py-3 tabular-nums text-center align-middle">
        <span className={`font-mono text-sm ${computedRow.percentOfTotal > 100 ? 'text-galenic-danger' : 'text-galenic-primary'}`}>
          {computedRow.percentOfTotal.toFixed(2)}%
        </span>
      </td>

      {/* TARGET ATTIVO — reverse-calc from active nutrient content */}
      <td className="px-4 py-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type="number" step="any" min="0"
              value={aDoseStr}
              onChange={!isReadOnly && canApt ? e => {
                setADoseStr(e.target.value)
                const v = parseFloat(e.target.value)
                if (v > 0) setIngredientAmount(computedRow.rowId, v / factor)
              } : undefined}
              onFocus={!isReadOnly && canApt ? () => { focused.current = 'aDose' } : undefined}
              onBlur={!isReadOnly && canApt ? e => { focused.current = null; onAptDose(e) } : undefined}
              readOnly={isReadOnly || !canApt}
              title={canApt ? 'Inserisci mg di attivo per dose → calcola peso estratto automaticamente' : 'Titolazione non impostata'}
              className={inputCls(!isReadOnly && canApt)}
            />
            <span className={`${lbl} ${canApt ? 'text-galenic-accent/80' : ''}`}>
              {canApt ? 'att./dose' : 'mg/dose'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number" step="any" min="0"
              value={aDieStr}
              onChange={!isReadOnly && canApt ? e => {
                setADieStr(e.target.value)
                const v = parseFloat(e.target.value)
                if (v > 0) setIngredientAmount(computedRow.rowId, v / (dosiAlGiorno * factor))
              } : undefined}
              onFocus={!isReadOnly && canApt ? () => { focused.current = 'aDie' } : undefined}
              onBlur={!isReadOnly && canApt ? e => { focused.current = null; onAptDie(e) } : undefined}
              readOnly={isReadOnly || !canApt}
              title={canApt ? 'Inserisci mg di attivo/die → calcola peso estratto automaticamente' : 'Titolazione non impostata'}
              className={inputCls(!isReadOnly && canApt, computedRow.exceedsMaxLimit)}
            />
            <span className={`${lbl} ${computedRow.exceedsMaxLimit ? 'text-galenic-danger font-semibold' : canApt ? 'text-galenic-accent/80' : ''}`}>
              {canApt ? 'att./die' : 'mg/die'}
            </span>
          </div>
          {computedRow.exceedsMaxLimit && (
            <div className="text-xs text-galenic-danger">&gt; {rm.maxLimitMg} mg/die max</div>
          )}
        </div>
      </td>

      {/* NRV % */}
      <td className="px-4 py-3 text-center align-middle">
        {computedRow.nrvPercent !== null ? (
          <Badge variant={nrvVariant(computedRow.nrvPercent)}>
            {computedRow.nrvPercent.toFixed(1)}% VNR
          </Badge>
        ) : (
          <span className="text-galenic-muted text-xs font-mono">N/D</span>
        )}
      </td>

      {/* Filler toggle */}
      <td className="px-4 py-3 text-center align-middle">
        <FillerToggle rowId={computedRow.rowId} isFiller={computedRow.isFiller} />
      </td>

      {/* Delete */}
      <td className="px-3 py-3 text-right align-middle">
        <button
          onClick={() => removeIngredient(computedRow.rowId)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-galenic-muted hover:text-galenic-danger hover:bg-galenic-danger/10 transition-all"
          title="Rimuovi ingrediente"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}
