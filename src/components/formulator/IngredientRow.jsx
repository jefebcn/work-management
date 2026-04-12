import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import FillerToggle from './FillerToggle.jsx'
import { fromMg, toMg } from '../../utils/weightConversions.js'

// inputMode values:
//   'qty-dose' — raw material weight per single dose   (QUANTITÀ editable)
//   'qty-die'  — raw material weight per day           (QUANTITÀ editable, ×dosiAlGiorno)
//   'apt-dose' — active nutrient per single dose       (APPORTO editable)
//   'apt-die'  — active nutrient per day               (APPORTO editable, ×dosiAlGiorno)

const MODE_LABELS = {
  'qty-dose': { short: 'Q/d', title: 'Inserisci quantità ingrediente per dose singola' },
  'qty-die':  { short: 'Q/g', title: 'Inserisci quantità ingrediente al giorno' },
  'apt-dose': { short: 'A/d', title: 'Inserisci apporto nutriente per dose singola' },
  'apt-die':  { short: 'A/g', title: 'Inserisci apporto nutriente al giorno' },
}

export default function IngredientRow({ computedRow }) {
  const { rawMaterials, activeFormula, setIngredientAmount, removeIngredient } = useApp()
  const [inputMode, setInputMode] = useState('qty-dose')

  const rm = rawMaterials.find(r => r.id === computedRow.rawMaterialId)
  if (!rm) return null

  const ingredient = activeFormula.ingredients.find(i => i.rowId === computedRow.rowId)
  if (!ingredient) return null

  const unit = activeFormula.targetWeightUnit || 'mg'
  const dosiAlGiorno = activeFormula.dosiAlGiorno || 1
  const factor = (rm.purity / 100) * (rm.titration / 100)
  const canBackCalculate = factor > 0

  // ── Four input handlers ────────────────────────────────────────────────────

  function handleQtyDoseChange(e) {
    setIngredientAmount(computedRow.rowId, toMg(parseFloat(e.target.value) || 0, unit))
  }

  function handleQtyDieChange(e) {
    const dailyQty = parseFloat(e.target.value) || 0
    setIngredientAmount(computedRow.rowId, toMg(dailyQty, unit) / dosiAlGiorno)
  }

  function handleAptDoseChange(e) {
    if (!canBackCalculate) return
    const dose = parseFloat(e.target.value) || 0
    setIngredientAmount(computedRow.rowId, dose / factor)
  }

  function handleAptDieChange(e) {
    if (!canBackCalculate) return
    const daily = parseFloat(e.target.value) || 0
    setIngredientAmount(computedRow.rowId, daily / (dosiAlGiorno * factor))
  }

  // ── Derived display values ─────────────────────────────────────────────────

  const displayAmountPerDose = fromMg(computedRow.amountMg, unit)
  const displayAmountPerDay  = displayAmountPerDose * dosiAlGiorno

  // NRV badge variant
  function nrvVariant(pct) {
    if (pct === null) return 'neutral'
    if (pct > 200)    return 'warning'
    if (pct > 100)    return 'caution'
    if (pct >= 15)    return 'ok'
    return 'neutral'
  }

  const rowBg = computedRow.exceedsMaxLimit
    ? 'bg-galenic-danger bg-opacity-5 border-l-2 border-galenic-danger'
    : 'border-l-2 border-transparent'

  const qtyEditable = !computedRow.isFiller && (inputMode === 'qty-dose' || inputMode === 'qty-die')
  const aptEditable = !computedRow.isFiller && (inputMode === 'apt-dose' || inputMode === 'apt-die')

  // ── QUANTITÀ cell ──────────────────────────────────────────────────────────

  let qtyValue, qtyHandler, qtyUnit
  if (computedRow.isFiller) {
    qtyValue   = displayAmountPerDose.toFixed(3)
    qtyUnit    = unit
    qtyHandler = undefined
  } else if (inputMode === 'qty-dose') {
    qtyValue   = fromMg(ingredient.amountMg, unit) || ''
    qtyUnit    = unit
    qtyHandler = handleQtyDoseChange
  } else if (inputMode === 'qty-die') {
    qtyValue   = displayAmountPerDay || ''
    qtyUnit    = `${unit}/die`
    qtyHandler = handleQtyDieChange
  } else {
    // apt modes — read-only, show per-dose
    qtyValue   = displayAmountPerDose.toFixed(3)
    qtyUnit    = unit
    qtyHandler = undefined
  }

  // ── APPORTO cell ───────────────────────────────────────────────────────────

  const isAptDoseMode = inputMode === 'apt-dose'
  const isAptDieMode  = inputMode === 'apt-die'

  return (
    <tr className={`border-b border-galenic-border hover:bg-galenic-elevated hover:bg-opacity-30 transition-colors ${rowBg}`}>

      {/* Material name */}
      <td className="px-4 py-3">
        <div className="font-medium text-sm text-galenic-primary">{rm.name}</div>
        {rm.activeNutrient && (
          <div className="text-xs text-galenic-muted mt-0.5">{rm.activeNutrient}</div>
        )}
      </td>

      {/* QUANTITÀ */}
      <td className="px-4 py-2 w-44">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="any"
              min="0"
              value={qtyValue}
              onChange={qtyEditable ? qtyHandler : undefined}
              readOnly={!qtyEditable}
              className={[
                'w-full border text-galenic-primary font-mono text-sm px-2 py-1.5',
                'outline-none tabular-nums transition-colors',
                qtyEditable
                  ? inputMode === 'qty-die'
                    ? 'bg-galenic-elevated border-galenic-accent focus:border-galenic-accent'
                    : 'bg-galenic-elevated border-galenic-border focus:border-galenic-accent'
                  : 'bg-galenic-base border-galenic-border text-galenic-muted cursor-default opacity-70',
              ].join(' ')}
            />
            <span className="text-xs text-galenic-muted font-mono whitespace-nowrap">{qtyUnit}</span>
          </div>
          {/* Show per-dose sub-line when in qty-die or apt modes with dosiAlGiorno>1 */}
          {!computedRow.isFiller && inputMode === 'qty-die' && dosiAlGiorno > 1 && (
            <div className="text-xs font-mono text-galenic-muted tabular-nums opacity-70 pl-1">
              {displayAmountPerDose.toFixed(3)} {unit}/dose
            </div>
          )}
          {!computedRow.isFiller && (inputMode === 'apt-dose' || inputMode === 'apt-die') && dosiAlGiorno > 1 && (
            <div className="text-xs font-mono text-galenic-muted tabular-nums opacity-70 pl-1">
              {displayAmountPerDay.toFixed(3)} {unit}/die
            </div>
          )}
        </div>
      </td>

      {/* % of total */}
      <td className="px-4 py-3 tabular-nums text-center">
        <span className={`font-mono text-sm ${computedRow.percentOfTotal > 100 ? 'text-galenic-danger' : 'text-galenic-primary'}`}>
          {computedRow.percentOfTotal.toFixed(2)}%
        </span>
      </td>

      {/* APPORTO REALE */}
      <td className="px-4 py-3 tabular-nums text-center">
        <div className="flex flex-col items-center gap-0.5">
          {isAptDoseMode ? (
            <>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={computedRow.realNutrientContribution.toFixed(4)}
                  key={computedRow.realNutrientContribution.toFixed(4)}
                  onChange={handleAptDoseChange}
                  disabled={!canBackCalculate}
                  className={[
                    'w-32 border text-galenic-primary font-mono text-sm px-2 py-1.5',
                    'outline-none tabular-nums transition-colors',
                    canBackCalculate
                      ? 'bg-galenic-elevated border-galenic-accent focus:border-galenic-accent'
                      : 'bg-galenic-base border-galenic-border text-galenic-muted cursor-not-allowed opacity-50',
                  ].join(' ')}
                />
                <span className="text-xs text-galenic-muted font-mono">mg/dose</span>
              </div>
              {dosiAlGiorno > 1 && (
                <div className={`text-xs font-mono tabular-nums ${computedRow.exceedsMaxLimit ? 'text-galenic-danger font-semibold' : 'text-galenic-muted opacity-70'}`}>
                  {computedRow.dailyContribution.toFixed(3)} mg/die
                </div>
              )}
            </>
          ) : isAptDieMode ? (
            <>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={computedRow.dailyContribution.toFixed(4)}
                  key={computedRow.dailyContribution.toFixed(4)}
                  onChange={handleAptDieChange}
                  disabled={!canBackCalculate}
                  className={[
                    'w-32 border text-galenic-primary font-mono text-sm px-2 py-1.5',
                    'outline-none tabular-nums transition-colors',
                    canBackCalculate
                      ? 'bg-galenic-elevated border-galenic-accent focus:border-galenic-accent'
                      : 'bg-galenic-base border-galenic-border text-galenic-muted cursor-not-allowed opacity-50',
                  ].join(' ')}
                />
                <span className="text-xs text-galenic-muted font-mono">mg/die</span>
              </div>
              {dosiAlGiorno > 1 && (
                <div className="text-xs font-mono text-galenic-muted tabular-nums opacity-70">
                  {computedRow.realNutrientContribution.toFixed(3)} mg/dose
                </div>
              )}
            </>
          ) : (
            // Read-only display (qty-dose or qty-die)
            <div className="flex flex-col items-center gap-0.5">
              <div className={`font-mono text-sm tabular-nums ${computedRow.exceedsMaxLimit ? 'text-galenic-danger font-semibold' : 'text-galenic-primary'}`}>
                {computedRow.dailyContribution.toFixed(3)} mg/die
              </div>
              {dosiAlGiorno > 1 && (
                <div className="text-xs font-mono text-galenic-muted tabular-nums opacity-70">
                  {computedRow.realNutrientContribution.toFixed(3)} mg/dose
                </div>
              )}
            </div>
          )}
          {computedRow.exceedsMaxLimit && (
            <div className="text-xs text-galenic-danger">
              &gt; {rm.maxLimitMg} mg/die max
            </div>
          )}
        </div>
      </td>

      {/* NRV % */}
      <td className="px-4 py-3 text-center">
        {computedRow.nrvPercent !== null ? (
          <Badge variant={nrvVariant(computedRow.nrvPercent)}>
            {computedRow.nrvPercent.toFixed(1)}% VNR
          </Badge>
        ) : (
          <span className="text-galenic-muted text-xs font-mono">N/D</span>
        )}
      </td>

      {/* Input mode toggle — 2×2 grid */}
      <td className="px-3 py-3 text-center">
        <div className="inline-grid grid-cols-2 gap-px border border-galenic-border">
          {(['qty-dose', 'apt-dose', 'qty-die', 'apt-die']).map(mode => {
            const active = inputMode === mode
            const isDisabled = computedRow.isFiller
            return (
              <button
                key={mode}
                title={MODE_LABELS[mode].title}
                disabled={isDisabled}
                onClick={() => !isDisabled && setInputMode(mode)}
                className={[
                  'px-1.5 py-1 text-xs font-mono transition-colors leading-none',
                  active
                    ? 'bg-galenic-accent bg-opacity-15 text-galenic-accent border-galenic-accent'
                    : 'text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated',
                  isDisabled ? 'opacity-40 cursor-default' : 'cursor-pointer',
                ].join(' ')}
              >
                {MODE_LABELS[mode].short}
              </button>
            )
          })}
        </div>
      </td>

      {/* Filler toggle */}
      <td className="px-4 py-3 text-center">
        <FillerToggle rowId={computedRow.rowId} isFiller={computedRow.isFiller} />
      </td>

      {/* Delete */}
      <td className="px-4 py-3 text-right">
        <Button
          size="sm"
          variant="danger"
          onClick={() => removeIngredient(computedRow.rowId)}
        >
          ×
        </Button>
      </td>
    </tr>
  )
}
