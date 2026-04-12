import React, { useState, useEffect } from 'react'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import { validateRequired, validatePositiveNumber, validatePercent } from '../../utils/validators.js'

const EMPTY_FORM = {
  name: '',
  supplier: '',
  pricePerKg: '',
  purity: '100',
  titration: '100',
  activeNutrient: '',
  maxLimitMg: '',
  nrvReference: '',
}

export default function RawMaterialForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setForm({
        name:          initial.name         ?? '',
        supplier:      initial.supplier     ?? '',
        pricePerKg:    initial.pricePerKg   ?? '',
        purity:        initial.purity       ?? '100',
        titration:     initial.titration    ?? '100',
        activeNutrient: initial.activeNutrient ?? '',
        maxLimitMg:    initial.maxLimitMg   ?? '',
        nrvReference:  initial.nrvReference ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [initial])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  function validate() {
    const e = {}
    e.name        = validateRequired(form.name, 'Nome')
    e.pricePerKg  = validatePositiveNumber(form.pricePerKg, 'Prezzo/kg')
    e.purity      = validatePercent(form.purity, 'Purezza')
    e.titration   = validatePercent(form.titration, 'Titolazione')
    if (form.maxLimitMg !== '' && form.maxLimitMg !== null) {
      e.maxLimitMg = validatePositiveNumber(form.maxLimitMg, 'Limite Max')
    }
    if (form.nrvReference !== '' && form.nrvReference !== null) {
      e.nrvReference = validatePositiveNumber(form.nrvReference, 'VNR Rif.')
    }
    // Remove null errors
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k] })
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit({
      name:           form.name.trim(),
      supplier:       form.supplier.trim(),
      pricePerKg:     parseFloat(form.pricePerKg) || 0,
      purity:         parseFloat(form.purity) || 100,
      titration:      parseFloat(form.titration) || 100,
      activeNutrient: form.activeNutrient.trim(),
      maxLimitMg:     form.maxLimitMg !== '' ? parseFloat(form.maxLimitMg) : 0,
      nrvReference:   form.nrvReference !== '' ? parseFloat(form.nrvReference) : 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nome Materia Prima *"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          error={errors.name}
          placeholder="es. Acido Ascorbico"
        />
        <Input
          label="Fornitore"
          value={form.supplier}
          onChange={e => set('supplier', e.target.value)}
          placeholder="es. DSM Nutritional"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Input
          label="Prezzo / kg (€) *"
          type="number"
          step="0.01"
          min="0"
          value={form.pricePerKg}
          onChange={e => set('pricePerKg', e.target.value)}
          error={errors.pricePerKg}
          placeholder="0.00"
        />
        <Input
          label="Purezza % *"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={form.purity}
          onChange={e => set('purity', e.target.value)}
          error={errors.purity}
          placeholder="100"
        />
        <Input
          label="Titolazione % *"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={form.titration}
          onChange={e => set('titration', e.target.value)}
          error={errors.titration}
          placeholder="100"
        />
        <Input
          label="Nutriente Attivo"
          value={form.activeNutrient}
          onChange={e => set('activeNutrient', e.target.value)}
          placeholder="es. Vitamina C"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Limite Max (mg)"
          type="number"
          step="0.001"
          min="0"
          value={form.maxLimitMg}
          onChange={e => set('maxLimitMg', e.target.value)}
          error={errors.maxLimitMg}
          hint="Limite regolatorio per dose (0 = nessun limite)"
          placeholder="0"
        />
        <Input
          label="VNR Rif. (mg)"
          type="number"
          step="0.0001"
          min="0"
          value={form.nrvReference}
          onChange={e => set('nrvReference', e.target.value)}
          error={errors.nrvReference}
          hint="Valore Nutritivo di Riferimento (0 = N/D)"
          placeholder="0"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-galenic-border">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Annulla
        </Button>
        <Button variant="primary" type="submit">
          {initial ? 'Salva Modifiche' : 'Aggiungi Materia Prima'}
        </Button>
      </div>
    </form>
  )
}
