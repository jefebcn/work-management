import React, { useState, useEffect, useRef } from 'react'
import { Trash2, Beaker } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Badge from '../ui/Badge.jsx'
import FillerToggle from './FillerToggle.jsx'
import { fromMg, toMg } from '../../utils/weightConversions.js'

// Triple-sync ingredient row.
// Three primary editable inputs synced via amountMg as canonical state:
//   1. Quantità  (mg/dose ↔ mg/die toggle via unitMode)
//   2. % Peso    (incidence on targetWeightMg)
//   3. Target Attivo (active per dose ↔ active per die)
// Storage: amountMg only — % and active are derived. No drift, no redundancy.

// ── Italian decimal formatting ──────────────────────────────────────────────
function fmtDec(v, digits = 2) {
  if (v === null || v === undefined || v === 0 || Number.isNaN(v)) return ''
  return v.toFixed(digits).replace('.', ',')
}
function parseDec(str) {
  if (!str) return 0
  return parseFloat(String(str).replace(',', '.')) || 0
}

export default function IngredientRow({ computedRow, rowIndex = 0, unitMode = 'dose' }) {
  const {
    rawMaterials, activeFormula,
    setIngredientAmount, setIngredientPercent, setIngredientActive,
    removeIngredient,
  } = useApp()

  const rm = rawMaterials.find(r => r.id === computedRow.rawMaterialId)
  if (!rm) return null

  const ingredient = activeFormula.ingredients.find(i => i.rowId === computedRow.rowId)
  if (!ingredient) return null

  const unit          = activeFormula.targetWeightUnit || 'mg'
  const dosiAlGiorno  = activeFormula.dosiAlGiorno || 1
  const targetWeight  = activeFormula.targetWeightMg || 0
  const factor        = ((rm.purity || 100) / 100) * ((rm.titration || 100) / 100)
  const canApt        = factor > 0 && rm.activeNutrient
  const isReadOnly    = computedRow.isFiller
  const isTitrated    = rm.titration > 0 && rm.titration < 100

  // ── Derived display values ─────────────────────────────────────────────────
  const qtyPerDose  = fromMg(computedRow.amountMg, unit)
  const qtyPerDay   = qtyPerDose * dosiAlGiorno
  const percent     = computedRow.percentOfTotal
  const aptPerDose  = computedRow.realNutrientContribution
  const aptPerDay   = computedRow.dailyContribution

  // ── Local string states (focused field keeps user typing intact) ──────────
  const [qDoseStr, setQDoseStr] = useState(fmtDec(qtyPerDose))
  const [qDieStr,  setQDieStr]  = useState(fmtDec(qtyPerDay))
  const [pctStr,   setPctStr]   = useState(fmtDec(percent))
  const [aDoseStr, setADoseStr] = useState(fmtDec(aptPerDose))
  const [aDieStr,  setADieStr]  = useState(fmtDec(aptPerDay))
  const focused = useRef(null)

  // ── Sync flash detection — animate cells whose value changed but were NOT
  //    just typed in (i.e. updated via triple-sync from another field). ─────
  const prevValues = useRef({ qDose: qtyPerDose, qDie: qtyPerDay, pct: percent, aDose: aptPerDose, aDie: aptPerDay })
  const [flash, setFlash] = useState({})

  useEffect(() => {
    const next = {}
    function check(key, oldV, newV) {
      if (focused.current === key) return false
      if (Math.abs(oldV - newV) > 0.001) { next[key] = Date.now(); return true }
      return false
    }
    const anyChanged = [
      check('qDose', prevValues.current.qDose, qtyPerDose),
      check('qDie',  prevValues.current.qDie,  qtyPerDay),
      check('pct',   prevValues.current.pct,   percent),
      check('aDose', prevValues.current.aDose, aptPerDose),
      check('aDie',  prevValues.current.aDie,  aptPerDay),
    ].some(Boolean)

    // Always refresh string state for non-focused fields so the formatted value
    // shows up after the underlying amountMg changes.
    if (focused.current !== 'qDose') setQDoseStr(fmtDec(qtyPerDose))
    if (focused.current !== 'qDie')  setQDieStr(fmtDec(qtyPerDay))
    if (focused.current !== 'pct')   setPctStr(fmtDec(percent))
    if (focused.current !== 'aDose') setADoseStr(fmtDec(aptPerDose))
    if (focused.current !== 'aDie')  setADieStr(fmtDec(aptPerDay))

    prevValues.current = { qDose: qtyPerDose, qDie: qtyPerDay, pct: percent, aDose: aptPerDose, aDie: aptPerDay }

    if (anyChanged) {
      setFlash(next)
      const t = setTimeout(() => setFlash({}), 500)
      return () => clearTimeout(t)
    }
  }, [qtyPerDose, qtyPerDay, percent, aptPerDose, aptPerDay])

  // ── Handlers — write the canonical amountMg, derived fields update on render
  function commit(key, value, setter) {
    focused.current = null
    setter(fmtDec(value))  // normalize on blur
  }

  function onQtyDoseChange(e) {
    setQDoseStr(e.target.value)
    setIngredientAmount(computedRow.rowId, toMg(parseDec(e.target.value), unit))
  }
  function onQtyDieChange(e) {
    setQDieStr(e.target.value)
    const dailyMg = toMg(parseDec(e.target.value), unit)
    setIngredientAmount(computedRow.rowId, dosiAlGiorno > 0 ? dailyMg / dosiAlGiorno : 0)
  }
  function onPercentChange(e) {
    setPctStr(e.target.value)
    setIngredientPercent(computedRow.rowId, parseDec(e.target.value))
  }
  function onAptDoseChange(e) {
    setADoseStr(e.target.value)
    setIngredientActive(computedRow.rowId, parseDec(e.target.value))
  }
  function onAptDieChange(e) {
    setADieStr(e.target.value)
    const daily = parseDec(e.target.value)
    setIngredientActive(computedRow.rowId, dosiAlGiorno > 0 ? daily / dosiAlGiorno : 0)
  }

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

  const cellInputCls = (key, opts = {}) => {
    const base    = opts.lg ? 'cell-input cell-input-lg' : 'cell-input'
    const flashOn = flash[key] ? ' cell-flash' : ''
    return base + flashOn
  }

  return (
    <tr className={`border-b border-galenic-border hover:bg-galenic-accent/5 transition-colors ${rowBg}`}>

      {/* Material name + meta */}
      <td className="px-3 sm:px-4 py-3 align-top">
        <div className="font-medium text-sm text-galenic-primary">{rm.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {rm.activeNutrient && (
            <span className="text-xs text-galenic-muted">{rm.activeNutrient}</span>
          )}
          {isTitrated && (
            <span className="inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded bg-[#00a4bd]/10 text-[#00a4bd] border border-[#00a4bd]/30 shrink-0">
              <Beaker size={9} strokeWidth={2.5} />
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

      {/* QUANTITÀ — mg/dose primary; mg/die below */}
      <td className="px-3 sm:px-4 py-2 align-top">
        <div className="flex flex-col gap-1.5">
          <div className={unitMode === 'die' ? 'opacity-50 hidden sm:block' : ''}>
            <input
              type="text" inputMode="decimal"
              value={qDoseStr}
              onChange={!isReadOnly ? onQtyDoseChange : undefined}
              onFocus={!isReadOnly ? () => { focused.current = 'qDose' } : undefined}
              onBlur={!isReadOnly ? () => commit('qDose', qtyPerDose, setQDoseStr) : undefined}
              readOnly={isReadOnly}
              className={cellInputCls('qDose')}
            />
            <div className="cell-unit mt-0.5 pl-1">{unit}/dose</div>
          </div>
          <div className={unitMode === 'dose' ? 'opacity-50 hidden sm:block' : ''}>
            <input
              type="text" inputMode="decimal"
              value={qDieStr}
              onChange={!isReadOnly ? onQtyDieChange : undefined}
              onFocus={!isReadOnly ? () => { focused.current = 'qDie' } : undefined}
              onBlur={!isReadOnly ? () => commit('qDie', qtyPerDay, setQDieStr) : undefined}
              readOnly={isReadOnly}
              className={cellInputCls('qDie')}
            />
            <div className="cell-unit mt-0.5 pl-1">{unit}/die</div>
          </div>
        </div>
      </td>

      {/* % PESO — now editable (was readonly before) */}
      <td className="hidden sm:table-cell px-4 py-2 align-top">
        <div>
          <input
            type="text" inputMode="decimal"
            value={pctStr}
            onChange={!isReadOnly ? onPercentChange : undefined}
            onFocus={!isReadOnly ? () => { focused.current = 'pct' } : undefined}
            onBlur={!isReadOnly ? () => commit('pct', percent, setPctStr) : undefined}
            readOnly={isReadOnly}
            className={cellInputCls('pct')
              + (percent > 100 ? ' !text-galenic-danger !border-galenic-danger/40' : '')}
          />
          <div className="cell-unit mt-0.5 pl-1">% peso</div>
        </div>
      </td>

      {/* TARGET ATTIVO — emphasized when titrated */}
      <td className="hidden sm:table-cell px-4 py-2 align-top">
        <div className="flex flex-col gap-1.5">
          <div className={unitMode === 'die' ? 'opacity-60 hidden sm:block' : ''}>
            <input
              type="text" inputMode="decimal"
              value={aDoseStr}
              onChange={!isReadOnly && canApt ? onAptDoseChange : undefined}
              onFocus={!isReadOnly && canApt ? () => { focused.current = 'aDose' } : undefined}
              onBlur={!isReadOnly && canApt ? () => commit('aDose', aptPerDose, setADoseStr) : undefined}
              readOnly={isReadOnly || !canApt}
              title={canApt ? 'mg di principio attivo per dose — il peso dell\'ingrediente si calcola automaticamente' : 'Materia prima senza titolazione — campo non applicabile'}
              className={cellInputCls('aDose', { lg: isTitrated })}
              placeholder={canApt ? '' : '—'}
            />
            <div className={`cell-unit mt-0.5 pl-1 ${isTitrated ? 'text-[#00a4bd]' : ''}`}>
              attivo/dose
            </div>
          </div>
          <div className={unitMode === 'dose' ? 'opacity-60 hidden sm:block' : ''}>
            <input
              type="text" inputMode="decimal"
              value={aDieStr}
              onChange={!isReadOnly && canApt ? onAptDieChange : undefined}
              onFocus={!isReadOnly && canApt ? () => { focused.current = 'aDie' } : undefined}
              onBlur={!isReadOnly && canApt ? () => commit('aDie', aptPerDay, setADieStr) : undefined}
              readOnly={isReadOnly || !canApt}
              className={cellInputCls('aDie')
                + (computedRow.exceedsMaxLimit ? ' !text-galenic-danger !border-galenic-danger/40' : '')}
              placeholder={canApt ? '' : '—'}
            />
            <div className={`cell-unit mt-0.5 pl-1 ${computedRow.exceedsMaxLimit ? 'text-galenic-danger font-semibold' : isTitrated ? 'text-[#00a4bd]' : ''}`}>
              attivo/die
            </div>
          </div>
          {computedRow.exceedsMaxLimit && (
            <div className="text-xs text-galenic-danger font-mono">&gt; {rm.maxLimitMg} mg/die max</div>
          )}
        </div>
      </td>

      {/* VNR % */}
      <td className="hidden sm:table-cell px-4 py-3 text-center align-middle">
        {computedRow.nrvPercent !== null ? (
          <span key={Math.round(computedRow.nrvPercent)} className="num-fade-in inline-flex">
            <Badge variant={nrvVariant(computedRow.nrvPercent)}>
              {computedRow.nrvPercent.toFixed(1).replace('.', ',')}% VNR
            </Badge>
          </span>
        ) : (
          <span className="text-galenic-muted text-xs font-mono">N/D</span>
        )}
      </td>

      {/* Filler */}
      <td className="hidden sm:table-cell px-4 py-3 text-center align-middle">
        <FillerToggle rowId={computedRow.rowId} isFiller={computedRow.isFiller} />
      </td>

      {/* Delete */}
      <td className="px-2 py-3 text-right align-middle">
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
