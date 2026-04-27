import React, { useState, useEffect } from 'react'
import { FlaskConical, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { dbGetBriefingById, dbSubmitBriefing } from '../../lib/db.js'

const FORM_TYPES    = ['Compresse', 'Capsule', 'Polveri', 'Liquidi', 'Caramelle', 'Gel', 'Crema']
const PACK_OPTIONS  = ['Blister', 'Flacone', 'Bustina', 'Sacchetto', 'Barattolo', 'Altro']

const EMPTY = {
  name: '', clientName: '', type: '', format: '',
  targetPrice: '', packagingRequested: '', briefingNotes: '',
}

export default function PublicBriefingForm({ token }) {
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [form,       setForm]       = useState(EMPTY)
  const [errors,     setErrors]     = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)

  useEffect(() => {
    dbGetBriefingById(token).then(row => {
      setLoading(false)
      if (!row) { setNotFound(true); return }
      // Pre-fill from lab preset
      if (row.preset) {
        setForm(prev => ({
          ...prev,
          type:               row.preset.type               || '',
          format:             row.preset.format             || '',
          packagingRequested: row.preset.packagingRequested || '',
        }))
      }
    })
  }, [token])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors([])
  }

  function validate() {
    const errs = []
    if (!form.name.trim()) errs.push('Nome Prodotto obbligatorio')
    if (!form.type)        errs.push('Forma Farmaceutica obbligatoria')
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (errs.length) { setErrors(errs); return }
    setSubmitting(true)
    const ok = await dbSubmitBriefing(token, {
      name:               form.name.trim(),
      clientName:         form.clientName.trim(),
      type:               form.type,
      format:             form.format.trim(),
      targetPrice:        form.targetPrice !== '' ? parseFloat(form.targetPrice) : null,
      packagingRequested: form.packagingRequested,
      briefingNotes:      form.briefingNotes.trim(),
      submittedAt:        new Date().toISOString(),
    })
    setSubmitting(false)
    if (ok) setSubmitted(true)
    else setErrors(["Errore durante l'invio. Riprova."])
  }

  if (loading) return (
    <div className="min-h-screen bg-galenic-base flex items-center justify-center">
      <Loader2 size={24} className="text-galenic-accent animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-galenic-base flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-3">
        <AlertTriangle size={32} className="text-galenic-danger mx-auto" />
        <h2 className="text-lg font-semibold text-galenic-primary">Link non valido o già compilato</h2>
        <p className="text-sm text-galenic-muted font-mono">
          Questo link è scaduto, già usato, o non esiste.<br />
          Contatta il laboratorio per un nuovo link.
        </p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-galenic-base flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 bg-galenic-ok/10 border border-galenic-ok/30 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle size={28} className="text-galenic-ok" />
        </div>
        <h2 className="text-xl font-semibold text-galenic-primary">Brief inviato!</h2>
        <p className="text-sm text-galenic-muted font-mono">
          Il laboratorio ha ricevuto il tuo brief.<br />
          Verrà contattato al più presto.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-galenic-base">
      <div className="h-12 border-b border-galenic-border/60 bg-galenic-surface flex items-center px-6 gap-3 shrink-0">
        <div className="w-7 h-7 bg-galenic-accent/10 border border-galenic-accent/30 rounded-lg flex items-center justify-center">
          <FlaskConical size={14} className="text-galenic-accent" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold text-galenic-primary">Galenic-OS</span>
        <span className="text-xs font-mono text-galenic-muted px-2 py-0.5 rounded-md bg-galenic-elevated border border-galenic-border">
          Richiesta Progetto
        </span>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-galenic-primary">Compila il Brief</h1>
          <p className="text-xs font-mono text-galenic-muted mt-1">
            Inserisci i dati del progetto. Il laboratorio li riceverà automaticamente.
          </p>
        </div>

        <div className="bg-galenic-surface border border-galenic-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">Cliente</h2>
          <F label="Nome Prodotto *">
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="es. Drenante Plus"
              className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors" />
          </F>
          <F label="Nome Cliente / Azienda">
            <input value={form.clientName} onChange={e => set('clientName', e.target.value)}
              placeholder="es. Rossi Srl"
              className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors" />
          </F>
        </div>

        <div className="bg-galenic-surface border border-galenic-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">Specifiche</h2>
          <F label="Forma Farmaceutica *">
            <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors">
              <option value="">— Seleziona —</option>
              {FORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </F>
          <F label="Formato">
            <input value={form.format} onChange={e => set('format', e.target.value)}
              placeholder="es. 60 cps, 500 ml"
              className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors" />
          </F>
          <F label="Costo Massimo per Dose (€)">
            <input type="number" min="0" step="0.01" value={form.targetPrice}
              onChange={e => set('targetPrice', e.target.value)}
              placeholder="es. 0.35"
              className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors" />
          </F>
          <F label="Packaging Richiesto">
            <select value={form.packagingRequested} onChange={e => set('packagingRequested', e.target.value)} className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors">
              <option value="">— Seleziona —</option>
              {PACK_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </F>
        </div>

        <div className="bg-galenic-surface border border-galenic-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">Note</h2>
          <F label="Obiettivo / Ingredienti desiderati">
            <textarea value={form.briefingNotes} onChange={e => set('briefingNotes', e.target.value)}
              maxLength={500} rows={4}
              placeholder="es. Drenante forte con tarassaco e betulla. Preferibilmente senza caffeina..."
              className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors resize-none" />
            <div className="text-right text-xs font-mono text-galenic-muted/50">{form.briefingNotes.length}/500</div>
          </F>
        </div>

        {errors.length > 0 && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-galenic-danger/10 border border-galenic-danger/30 text-galenic-danger text-xs font-mono">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <ul className="space-y-0.5">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-galenic-accent text-galenic-surface text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
          {submitting ? 'Invio in corso...' : 'Invia Brief al Laboratorio'}
        </button>
      </div>
    </div>
  )
}

function F({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-mono text-galenic-muted">{label}</label>
      {children}
    </div>
  )
}
