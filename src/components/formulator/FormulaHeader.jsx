import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import { fromMg, toMg } from '../../utils/weightConversions.js'

const FORMULA_TYPES = [
  { value: 'Compresse', label: 'Compresse' },
  { value: 'Capsule',   label: 'Capsule' },
  { value: 'Polveri',   label: 'Polveri' },
  { value: 'Liquidi',   label: 'Liquidi' },
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
    <div className="bg-galenic-surface border border-galenic-border p-5">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        {/* Formula name */}
        <div className="md:col-span-2">
          <Input
            label="Nome Formula"
            value={activeFormula.name}
            onChange={e => setFormulaField('name', e.target.value)}
            placeholder="es. Vitamina C Effervescente"
          />
        </div>

        {/* Formula type */}
        <Select
          label="Tipo di Formula"
          options={FORMULA_TYPES}
          value={activeFormula.type}
          onChange={e => setFormulaField('type', e.target.value)}
        />

        {/* Target weight */}
        <div className="flex gap-2 items-end">
          <Input
            label="Peso Target"
            type="number"
            step="any"
            min="0"
            value={displayWeight}
            onChange={e =>
              setTargetWeight(parseFloat(e.target.value) || 0, activeFormula.targetWeightUnit || 'mg')
            }
            containerClassName="flex-1"
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

        {/* Daily doses */}
        <Input
          label="Dosi/die"
          type="number"
          step="1"
          min="1"
          value={activeFormula.dosiAlGiorno ?? 1}
          onChange={e => setFormulaField('dosiAlGiorno', Math.max(1, parseInt(e.target.value) || 1))}
          hint="N. dosi giornaliere"
        />
      </div>
    </div>
  )
}
