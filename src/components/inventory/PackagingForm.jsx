import React, { useState, useEffect } from 'react'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import { validateRequired, validatePositiveNumber } from '../../utils/validators.js'

const EMPTY_FORM = { description: '', unitCost: '' }

export default function PackagingForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setForm({
        description: initial.description ?? '',
        unitCost:    initial.unitCost    ?? '',
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

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    const descErr = validateRequired(form.description, 'Descrizione')
    const costErr = validatePositiveNumber(form.unitCost, 'Costo Unitario')
    if (descErr) errs.description = descErr
    if (costErr) errs.unitCost    = costErr

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit({
      description: form.description.trim(),
      unitCost:    parseFloat(form.unitCost) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Descrizione Packaging *"
        value={form.description}
        onChange={e => set('description', e.target.value)}
        error={errors.description}
        placeholder="es. Flacone HDPE 100ml con tappo"
      />
      <Input
        label="Costo Unitario (€) *"
        type="number"
        step="0.001"
        min="0"
        value={form.unitCost}
        onChange={e => set('unitCost', e.target.value)}
        error={errors.unitCost}
        hint="Costo per singola unità di confezionamento"
        placeholder="0.00"
      />
      <div className="flex justify-end gap-3 pt-2 border-t border-galenic-border">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Annulla
        </Button>
        <Button variant="primary" type="submit">
          {initial ? 'Salva Modifiche' : 'Aggiungi Packaging'}
        </Button>
      </div>
    </form>
  )
}
