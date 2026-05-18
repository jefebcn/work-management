import React from 'react'
import { Lock } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import { fromMg, toMg } from '../../utils/weightConversions.js'

const FORMULA_TYPES = [
  { value: 'Compresse',                  label: 'Compresse' },
  { value: 'Capsule',                    label: 'Capsule' },
  { value: 'Polveri',                    label: 'Polveri' },
  { value: 'Liquidi',                    label: 'Liquidi' },
  { value: 'Sistemi Gommosi e Coated',   label: 'Sistemi Gommosi e Coated' },
]

const WEIGHT_UNITS = [
  { value: 'mg', label: 'mg' },
  { value: 'g',  label: 'g' },
  { value: 'kg', label: 'kg' },
]

export default function FormulaHeader() {
  const { activeFormula, setFormulaField, setTargetWeight } = useApp()

  if (!activeFormula) return null

  const unit          = activeFormula.targetWeightUnit || 'mg'
  const displayWeight = fromMg(activeFormula.targetWeightMg, unit)
  const dosiAlGiorno  = activeFormula.dosiAlGiorno || 1
  const totalDose     = fromMg(activeFormula.targetWeightMg * dosiAlGiorno, unit)

  return (
    <div className="bg-galenic-surface border border-galenic-border rounded-xl p-4">
      {/* Row 1: Nome + Tipo — nome grows, tipo has fixed min-width */}
      <div className="flex flex-wrap gap-4 items-start mb-4">
        <div className="grow min-w-[200px]">
          <Input
            label="Nome Formula"
            value={activeFormula.name}
            onChange={e => setFormulaField('name', e.target.value)}
            placeholder="es. Vitamina C Effervescente"
          />
        </div>
        <div className="min-w-[170px]">
          {activeFormula.briefingLocked?.type ? (
            <div>
              <div className="text-xs font-mono text-galenic-muted mb-1">Tipo di Formula</div>
              <div className="flex items-center gap-2 px-3 py-2 bg-galenic-elevated/70 border border-galenic-border/60 rounded-lg">
                <Lock size={11} className="text-galenic-muted/60 shrink-0" />
                <span className="text-sm text-galenic-primary truncate">{activeFormula.type}</span>
                <span className="ml-auto text-xs font-mono text-galenic-muted/50 shrink-0">bloccato</span>
              </div>
            </div>
          ) : (
            <Select
              label="Tipo di Formula"
              options={FORMULA_TYPES}
              value={activeFormula.type}
              onChange={e => setFormulaField('type', e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Row 2: Peso Target + unit + Dosi/die + Dose Totale — wrap as group, never squeeze */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Peso Target + unit: rigid pair */}
        <div className="flex gap-2 items-end shrink-0">
          <Input
            label="Peso Target"
            type="number"
            step="any"
            min="0"
            value={displayWeight}
            onChange={e =>
              setTargetWeight(parseFloat(e.target.value) || 0, unit)
            }
            containerClassName="w-28"
          />
          <Select
            options={WEIGHT_UNITS}
            value={unit}
            onChange={e => {
              const newUnit = e.target.value
              setTargetWeight(fromMg(activeFormula.targetWeightMg, unit), newUnit)
            }}
            containerClassName="w-20"
          />
        </div>

        {/* Dosi/die */}
        <Input
          label="Dosi/die"
          type="number"
          step="1"
          min="1"
          value={dosiAlGiorno}
          onChange={e => setFormulaField('dosiAlGiorno', Math.max(1, parseInt(e.target.value) || 1))}
          containerClassName="w-24"
        />

        {/* Dose Totale/die — read-only computed */}
        <div className="shrink-0">
          <div className="text-xs font-mono text-galenic-muted mb-1">Dose Totale/die</div>
          <div className="flex items-center h-9 px-3 bg-galenic-elevated/50 border border-galenic-border/40 rounded-lg min-w-[110px]">
            <span className="text-sm font-mono tabular-nums text-galenic-primary">
              {totalDose.toFixed(unit === 'mg' ? 0 : 3)}
            </span>
            <span className="text-xs font-mono text-galenic-muted/60 ml-1.5">{unit}/die</span>
          </div>
        </div>
      </div>
    </div>
  )
}
