import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import FillerToggle from './FillerToggle.jsx'
import Tooltip from '../ui/Tooltip.jsx'
import { fromMg, toMg } from '../../utils/weightConversions.js'

export default function IngredientRow({ computedRow }) {
  const { rawMaterials, activeFormula, setIngredientAmount, removeIngredient } = useApp()

  // 'quantity' = user types total weight, contribution is derived
  // 'contribution' = user types active nutrient amount, quantity is back-calculated
  const [inputMode, setInputMode] = useState('quantity')

  const rm = rawMaterials.find(r => r.id === computedRow.rawMaterialId)
  if (!rm) return null

  const ingredient = activeFormula.ingredients.find(i => i.rowId === computedRow.rowId)
  if (!ingredient) return null

  const unit = activeFormula.targetWeightUnit || 'mg'
  const factor = (rm.purity / 100) * (rm.titration / 100)
  const canBackCalculate = factor > 0

  // ── Quantity input handler ─────────────────────────────────────────────────
  function handleAmountChange(e) {
    const display = parseFloat(e.target.value) || 0
    setIngredientAmount(computedRow.rowId, toMg(display, unit))
  }

  // ── Contribution input handler (back-calculates quantity) ──────────────────
  function handleContributionChange(e) {
    const contribution = parseFloat(e.target.value) || 0
    if (!canBackCalculate) return
    // reverse: amountMg = contribution / factor
    const newAmountMg = contribution / factor
    setIngredientAmount(computedRow.rowId, newAmountMg)
  }

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

  const displayAmount = fromMg(computedRow.amountMg, unit)

  return (
    <tr className={`border-b border-galenic-border hover:bg-galenic-elevated hover:bg-opacity-30 transition-colors ${rowBg}`}>
      {/* Material name */}
      <td className="px-4 py-3">
        <div className="font-medium text-sm text-galenic-primary">{rm.name}</div>
        {rm.activeNutrient && (
          <div className="text-xs text-galenic-muted mt-0.5">{rm.activeNutrient}</div>
        )}
      </td>

      {/* Quantità — editable when inputMode='quantity', read-only otherwise */}
      <td className="px-4 py-2 w-40">
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="any"
            min="0"
            value={
              computedRow.isFiller
                ? displayAmount.toFixed(3)
                : inputMode === 'quantity'
                  ? (fromMg(ingredient.amountMg, unit) || '')
                  : displayAmount.toFixed(4)
            }
            onChange={inputMode === 'quantity' ? handleAmountChange : undefined}
            readOnly={computedRow.isFiller || inputMode === 'contribution'}
            className={[
              'w-full border text-galenic-primary font-mono text-sm px-2 py-1.5',
              'outline-none tabular-nums transition-colors',
              computedRow.isFiller || inputMode === 'contribution'
                ? 'bg-galenic-base border-galenic-border text-galenic-muted cursor-default opacity-70'
                : 'bg-galenic-elevated border-galenic-border focus:border-galenic-accent',
            ].join(' ')}
          />
          <span className="text-xs text-galenic-muted font-mono whitespace-nowrap">{unit}</span>
        </div>
      </td>

      {/* % of total */}
      <td className="px-4 py-3 tabular-nums text-center">
        <span className={`font-mono text-sm ${computedRow.percentOfTotal > 100 ? 'text-galenic-danger' : 'text-galenic-primary'}`}>
          {computedRow.percentOfTotal.toFixed(2)}%
        </span>
      </td>

      {/* Apporto Reale — editable when inputMode='contribution', read-only otherwise */}
      <td className="px-4 py-3 tabular-nums text-center">
        <div className="flex flex-col items-center gap-1">
          {inputMode === 'contribution' ? (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={computedRow.realNutrientContribution.toFixed(4)}
                  key={computedRow.realNutrientContribution.toFixed(4)} // re-mount when changed externally
                  onChange={handleContributionChange}
                  disabled={!canBackCalculate}
                  className={[
                    'w-24 border text-galenic-primary font-mono text-sm px-2 py-1.5',
                    'outline-none tabular-nums transition-colors',
                    canBackCalculate
                      ? 'bg-galenic-elevated border-galenic-accent focus:border-galenic-accent'
                      : 'bg-galenic-base border-galenic-border text-galenic-muted cursor-not-allowed opacity-50',
                  ].join(' ')}
                />
                <span className="text-xs text-galenic-muted font-mono">mg</span>
              </div>
              {computedRow.dailyContribution !== computedRow.realNutrientContribution && (
                <div className={`text-xs font-mono tabular-nums ${computedRow.exceedsMaxLimit ? 'text-galenic-danger font-semibold' : 'text-galenic-muted'}`}>
                  {computedRow.dailyContribution.toFixed(3)} mg/die
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <div className={`font-mono text-sm tabular-nums ${computedRow.exceedsMaxLimit ? 'text-galenic-danger font-semibold' : 'text-galenic-primary'}`}>
                {computedRow.dailyContribution.toFixed(3)} mg/die
              </div>
              {computedRow.dailyContribution !== computedRow.realNutrientContribution && (
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

      {/* Input mode toggle */}
      <td className="px-3 py-3 text-center">
        <Tooltip
          content={
            inputMode === 'quantity'
              ? 'Passa a: inserisci Apporto Reale'
              : 'Passa a: inserisci Quantità totale'
          }
        >
          <button
            onClick={() => setInputMode(m => m === 'quantity' ? 'contribution' : 'quantity')}
            className={[
              'flex flex-col items-center gap-0.5 px-2 py-1 border text-xs font-mono transition-colors',
              inputMode === 'quantity'
                ? 'border-galenic-border text-galenic-muted hover:border-galenic-accent hover:text-galenic-accent'
                : 'border-galenic-accent text-galenic-accent bg-galenic-accent bg-opacity-10',
            ].join(' ')}
            title=""
          >
            <span className={inputMode === 'quantity' ? 'font-bold' : 'opacity-50'}>Q</span>
            <span className="text-galenic-muted text-xs leading-none">⇅</span>
            <span className={inputMode === 'contribution' ? 'font-bold' : 'opacity-50'}>A</span>
          </button>
        </Tooltip>
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
