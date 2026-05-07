import React, { useState, useEffect } from 'react'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import { validateRequired, validatePositiveNumber, validatePercent } from '../../utils/validators.js'
import { VITAMINE_REF, MINERALI_REF, fmtLimit } from '../../data/regulatoryLimits.js'

const CATEGORIES = [
  { key: 'vitamina',     label: 'Vitamina' },
  { key: 'minerale',     label: 'Minerale' },
  { key: 'botanical',    label: 'Botanical / Funzionale' },
  { key: 'eccipiente',   label: 'Eccipiente' },
  { key: 'lubrificante', label: 'Lubrificante / Antiaderente' },
]

const EMPTY_FORM = {
  name: '',
  supplier: '',
  pricePerKg: '',
  purity: '100',
  titration: '100',
  activeNutrient: '',
  maxLimitMg: '',
  nrvReference: '',
  densityGml: '',
}

function detectCategory(initial) {
  if (!initial) return 'vitamina'
  if (initial.category) return initial.category  // saved field (new data)
  if (initial.activeNutrient === 'Eccipiente' || (!initial.activeNutrient && !initial.nrvReference && !initial.maxLimitMg)) return 'eccipiente'  // legacy
  if (VITAMINE_REF.some(r => r.activeNutrient === initial.activeNutrient)) return 'vitamina'
  if (MINERALI_REF.some(r => r.activeNutrient === initial.activeNutrient)) return 'minerale'
  if (initial.activeNutrient) return 'botanical'
  return 'vitamina'
}

export default function RawMaterialForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [category, setCategory] = useState('vitamina')
  const [nutrientRef, setNutrientRef] = useState('')

  useEffect(() => {
    if (initial) {
      setForm({
        name:           initial.name          ?? '',
        supplier:       initial.supplier      ?? '',
        pricePerKg:     initial.pricePerKg    ?? '',
        purity:         initial.purity        ?? '100',
        titration:      initial.titration     ?? '100',
        activeNutrient: initial.activeNutrient ?? '',
        maxLimitMg:     initial.maxLimitMg    ?? '',
        nrvReference:   initial.nrvReference  ?? '',
        densityGml:     initial.densityGml    ?? '',
      })
      setCategory(detectCategory(initial))
    } else {
      setForm(EMPTY_FORM)
      setCategory('vitamina')
    }
    setNutrientRef('')
    setErrors({})
  }, [initial])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  function handleCategoryChange(cat) {
    setCategory(cat)
    setNutrientRef('')
    if (cat === 'eccipiente' || cat === 'lubrificante') {
      setForm(prev => ({ ...prev, maxLimitMg: '', nrvReference: '', activeNutrient: '', titration: '100' }))
    }
  }

  function handleNutrientRefChange(e) {
    const key = e.target.value
    setNutrientRef(key)
    if (!key) return
    const refList = category === 'vitamina' ? VITAMINE_REF : MINERALI_REF
    const ref = refList.find(r => r.key === key)
    if (!ref) return
    setForm(prev => ({
      ...prev,
      activeNutrient: ref.activeNutrient,
      maxLimitMg:     ref.maxLimitMg,
      nrvReference:   ref.nrvReference,
    }))
    setErrors(prev => ({ ...prev, activeNutrient: null, maxLimitMg: null, nrvReference: null }))
  }

  function validate() {
    const e = {}
    e.name       = validateRequired(form.name, 'Nome')
    e.pricePerKg = validatePositiveNumber(form.pricePerKg, 'Prezzo/kg')
    e.purity     = validatePercent(form.purity, 'Purezza')
    if (category !== 'eccipiente' && category !== 'lubrificante') {
      e.titration = validatePercent(form.titration, 'Titolazione')
    }
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
    const isInert = category === 'eccipiente' || category === 'lubrificante'
    onSubmit({
      name:           form.name.trim(),
      supplier:       form.supplier.trim(),
      pricePerKg:     parseFloat(form.pricePerKg) || 0,
      purity:         parseFloat(form.purity) || 100,
      titration:      isInert ? 100 : (parseFloat(form.titration) || 100),
      activeNutrient: isInert ? '' : form.activeNutrient.trim(),
      maxLimitMg:     isInert ? 0 : (form.maxLimitMg !== '' ? parseFloat(form.maxLimitMg) : 0),
      nrvReference:   isInert ? 0 : (form.nrvReference !== '' ? parseFloat(form.nrvReference) : 0),
      densityGml:     form.densityGml !== '' ? parseFloat(form.densityGml) : undefined,
      category,
    })
  }

  const refList = category === 'vitamina' ? VITAMINE_REF : MINERALI_REF
  const showRefSelect = (category === 'vitamina' || category === 'minerale')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Category selector */}
      <div>
        <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider mb-2">
          Categoria
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleCategoryChange(cat.key)}
              className={[
                'px-3 py-1.5 text-xs font-mono border transition-colors',
                category === cat.key
                  ? 'border-galenic-accent text-galenic-accent bg-galenic-accent bg-opacity-10'
                  : 'border-galenic-border text-galenic-muted hover:border-galenic-primary hover:text-galenic-primary',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nutrient reference selector (vitamina / minerale only) */}
      {showRefSelect && (
        <div>
          <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider mb-1">
            Compila automaticamente dai limiti normativi
          </div>
          <select
            value={nutrientRef}
            onChange={handleNutrientRefChange}
            className="w-full border border-galenic-border bg-galenic-elevated text-galenic-primary text-xs font-mono px-3 py-2 outline-none focus:border-galenic-accent"
          >
            <option value="">— Seleziona per compilare automaticamente —</option>
            {refList.map(r => (
              <option key={r.key} value={r.key}>
                {r.label}  ({fmtLimit(r.maxLimitMg)})
              </option>
            ))}
          </select>
          {nutrientRef && (
            <div className="text-xs text-galenic-muted mt-1">
              Puoi modificare manualmente i valori compilati.
            </div>
          )}
        </div>
      )}

      {/* Nome + Fornitore */}
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

      {/* Prezzo + Purezza (always shown) + Titolazione + Nutriente Attivo (hidden for eccipiente) */}
      {(category === 'eccipiente' || category === 'lubrificante') ? (
        <>
          {/* Eccipiente info */}
          <div className="flex items-start gap-2.5 bg-galenic-elevated/60 border border-galenic-border/60 rounded-lg p-3 text-xs text-galenic-muted">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="shrink-0 mt-0.5 text-galenic-muted/60">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span>
              Gli eccipienti sono sostanze inerti (es. cellulosa microcristallina, magnesio stearato, silice colloidale).
              Non contribuiscono all'apporto nutrizionale — non hanno VNR né limiti di legge.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prezzo / kg (€) *"
              type="number" step="0.01" min="0"
              value={form.pricePerKg}
              onChange={e => set('pricePerKg', e.target.value)}
              error={errors.pricePerKg}
              placeholder="0.00"
            />
            <Input
              label="Purezza % *"
              type="number" step="0.01" min="0" max="100"
              value={form.purity}
              onChange={e => set('purity', e.target.value)}
              error={errors.purity}
              placeholder="100"
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="Prezzo / kg (€) *"
            type="number" step="0.01" min="0"
            value={form.pricePerKg}
            onChange={e => set('pricePerKg', e.target.value)}
            error={errors.pricePerKg}
            placeholder="0.00"
          />
          <Input
            label="Purezza % *"
            type="number" step="0.01" min="0" max="100"
            value={form.purity}
            onChange={e => set('purity', e.target.value)}
            error={errors.purity}
            placeholder="100"
          />
          <Input
            label="Titolazione % *"
            type="number" step="0.01" min="0" max="100"
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
      )}

      {/* Limite Max + VNR (nascosti per eccipiente) */}
      {category !== 'eccipiente' && category !== 'lubrificante' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Limite Max (mg)"
            type="number"
            step="0.0001"
            min="0"
            value={form.maxLimitMg}
            onChange={e => set('maxLimitMg', e.target.value)}
            error={errors.maxLimitMg}
            hint="Limite regolatorio giornaliero — Min. Salute 2021 (0 = nessun limite)"
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
            hint="Valore Nutritivo di Riferimento — Reg. UE 1169/2011 (0 = N/D)"
            placeholder="0"
          />
        </div>
      )}

      {/* Physical parameters — used for capsule volume calculations */}
      <div>
        <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider mb-2">
          Parametri Fisici
        </div>
        <div className="max-w-[200px]">
          <Input
            label="Densità Bulk (g/mL)"
            type="number"
            step="0.001"
            min="0.01"
            max="5"
            value={form.densityGml}
            onChange={e => set('densityGml', e.target.value)}
            hint="Densità apparente polvere — per calcolo volume capsule (default: 0.6)"
            placeholder="0.60"
          />
        </div>
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
