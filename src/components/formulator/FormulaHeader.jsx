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

  const displayWeight = fromMg(activeFormula.targetWeightMg, activeFormula.targetWeightUnit || 'mg')

  return (
    <div className="bg-galenic-surface border border-galenic-border rounded-xl p-5">
      {/*
        flex-wrap: fields wrap to next line instead of squeezing / overlapping.
        Each field has an explicit min-width so it never collapses below readability.
      */}
      <div className="flex flex-wrap gap-4 items-start">

        {/* Nome Formula — grows to absorb available width */}
        <div className="grow min-w-[200px]">
          <Input
            label="Nome Formula"
            value={activeFormula.name}
            onChange={e => setFormulaField('name', e.target.value)}
            placeholder="es. Vitamina C Effervescente"
          />
        </div>

        {/* Tipo Formula — fixed minimum, never wraps text inside */}
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

        {/* Peso Target + Unit — kept as a rigid pair, never shrinks */}
        <div className="flex gap-2 items-end shrink-0">
          <Input
            label="Peso Target"
            type="number"
            step="any"
            min="0"
            value={displayWeight}
            onChange={e =>
              setTargetWeight(parseFloat(e.target.value) || 0, activeFormula.targetWeightUnit || 'mg')
            }
            containerClassName="w-28"
          />
          <Select
            options={WEIGHT_UNITS}
            value={activeFormula.targetWeightUnit || 'mg'}
            onChange={e => {
              const newUnit = e.target.value
              const currentDisplay = fromMg(activeFormula.targetWeightMg, activeFormula.targetWeightUnit || 'mg')
              setTargetWeight(currentDisplay, newUnit)
            }}
            containerClassName="w-20"
          />
        </div>

        {/* Dosi/die — fixed-width, enough for 4-digit numbers */}
        <Input
          label="Dosi/die"
          type="number"
          step="1"
          min="1"
          value={activeFormula.dosiAlGiorno ?? 1}
          onChange={e => setFormulaField('dosiAlGiorno', Math.max(1, parseInt(e.target.value) || 1))}
          hint="N. dosi giornaliere"
          containerClassName="w-24"
        />

      </div>
    </div>
  )
}
