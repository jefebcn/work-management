import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  ClipboardList, CheckCircle, Copy, QrCode, Save, Trash2,
  AlertTriangle, ChevronDown, ChevronUp, FlaskConical,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { encodeBriefing, decodeBriefing, validateBriefing } from '../../utils/briefingCodec.js'
import Button from '../ui/Button.jsx'

const FORM_TYPES = ['Compresse', 'Capsule', 'Polveri', 'Liquidi', 'Gel', 'Crema']
const PACKAGING_OPTIONS = ['Blister', 'Flacone', 'Bustina', 'Sacchetto', 'Barattolo', 'Altro']
const TEMPLATES_KEY = 'galenic_briefing_templates'

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]') } catch { return [] }
}
function saveTemplates(list) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list))
}

const EMPTY_FORM = {
  name: '', clientName: '', type: '', macrothemeId: '',
  format: '', targetPrice: '', packagingRequested: '', briefingNotes: '',
}

export default function BriefingPage() {
  const { macrothemes, importBriefing, setCurrentModule } = useApp()

  const [formData, setFormData]     = useState(EMPTY_FORM)
  const [code, setCode]             = useState('')
  const [copied, setCopied]         = useState(false)
  const [showQR, setShowQR]         = useState(false)
  const [errors, setErrors]         = useState([])
  const [templates, setTemplates]   = useState(loadTemplates)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateName, setTemplateName]   = useState('')
  const [savingTpl, setSavingTpl]         = useState(false)
  const [successMsg, setSuccessMsg]       = useState('')

  // Re-load templates from localStorage when section opens
  useEffect(() => {
    if (showTemplates) setTemplates(loadTemplates())
  }, [showTemplates])

  function set(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    setCode('')   // reset code when form changes
    setErrors([])
  }

  function handleGenerate() {
    const errs = validateBriefing({
      name: formData.name,
      type: formData.type,
      macrothemeId: formData.macrothemeId,
    })
    if (errs.length) { setErrors(errs); return }

    const payload = {
      name:               formData.name.trim(),
      clientName:         formData.clientName.trim(),
      type:               formData.type,
      macrothemeId:       formData.macrothemeId,
      format:             formData.format.trim(),
      targetPrice:        formData.targetPrice !== '' ? parseFloat(formData.targetPrice) : null,
      packagingRequested: formData.packagingRequested,
      briefingNotes:      formData.briefingNotes.trim(),
    }
    setCode(encodeBriefing(payload))
    setShowQR(false)
  }

  async function handleCopy() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCreateHere() {
    if (!code) return
    const decoded = decodeBriefing(code)
    if (!decoded) return
    const macro = macrothemes.find(m => m.id === decoded.m)
    importBriefing(decoded, code)
    setSuccessMsg(`Progetto "${decoded.n}" creato nel macrotema "${macro?.name || '—'}"`)
    setTimeout(() => {
      setSuccessMsg('')
      setCurrentModule('formulator')
    }, 2000)
  }

  function handleSaveTemplate() {
    if (!templateName.trim()) return
    const list = loadTemplates()
    const tpl = {
      id:   `tpl-${Date.now()}`,
      name: templateName.trim(),
      data: { ...formData },
    }
    const updated = [...list, tpl]
    saveTemplates(updated)
    setTemplates(updated)
    setTemplateName('')
    setSavingTpl(false)
  }

  function handleLoadTemplate(tpl) {
    setFormData({ ...EMPTY_FORM, ...tpl.data })
    setCode('')
    setErrors([])
  }

  function handleDeleteTemplate(id) {
    const updated = templates.filter(t => t.id !== id)
    saveTemplates(updated)
    setTemplates(updated)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={18} className="text-galenic-accent" />
          <h1 className="text-xl font-semibold text-galenic-primary">Briefing Commerciale</h1>
        </div>
        <p className="text-xs font-mono text-galenic-muted">
          Compila i requisiti del progetto e genera un codice da inviare al laboratorio.
        </p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-galenic-ok/10 border border-galenic-ok/30 text-galenic-ok text-sm font-mono">
          <CheckCircle size={14} />
          {successMsg}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── LEFT: Form ── */}
        <div className="space-y-4">
          <div className="bg-galenic-surface border border-galenic-border rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
              Dati Cliente
            </h2>

            <Field label="Nome Prodotto *">
              <input
                value={formData.name}
                onChange={e => set('name', e.target.value)}
                placeholder="es. Drenante Plus"
                className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors"
              />
            </Field>

            <Field label="Nome Cliente">
              <input
                value={formData.clientName}
                onChange={e => set('clientName', e.target.value)}
                placeholder="es. Rossi Srl"
                className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors"
              />
            </Field>
          </div>

          <div className="bg-galenic-surface border border-galenic-border rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
              Target Tecnico
            </h2>

            <Field label="Macrotema *">
              <select
                value={formData.macrothemeId}
                onChange={e => set('macrothemeId', e.target.value)}
                className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary focus:outline-none focus:border-galenic-accent transition-colors"
              >
                <option value="">— Seleziona —</option>
                {macrothemes.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Forma Farmaceutica *">
              <select
                value={formData.type}
                onChange={e => set('type', e.target.value)}
                className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary focus:outline-none focus:border-galenic-accent transition-colors"
              >
                <option value="">— Seleziona —</option>
                {FORM_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Formato">
              <input
                value={formData.format}
                onChange={e => set('format', e.target.value)}
                placeholder="es. 60 cps, 500 ml"
                className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors"
              />
            </Field>
          </div>

          <div className="bg-galenic-surface border border-galenic-border rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
              Vincoli Commerciali
            </h2>

            <Field label="Costo Massimo per Unità (€)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.targetPrice}
                onChange={e => set('targetPrice', e.target.value)}
                placeholder="es. 0.35"
                className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors"
              />
            </Field>

            <Field label="Packaging Richiesto">
              <select
                value={formData.packagingRequested}
                onChange={e => set('packagingRequested', e.target.value)}
                className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary focus:outline-none focus:border-galenic-accent transition-colors"
              >
                <option value="">— Seleziona —</option>
                {PACKAGING_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="bg-galenic-surface border border-galenic-border rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
              Note R&D
            </h2>
            <Field label="Obiettivo / Ingredienti desiderati">
              <textarea
                value={formData.briefingNotes}
                onChange={e => set('briefingNotes', e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="es. Drenante forte con tarassaco e betulla. Preferibilmente senza caffeina..."
                className="w-full bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors resize-none"
              />
              <div className="text-right text-xs font-mono text-galenic-muted/50">
                {formData.briefingNotes.length}/500
              </div>
            </Field>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-galenic-danger/10 border border-galenic-danger/30 text-galenic-danger text-xs font-mono">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <ul className="space-y-0.5">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Generate button */}
          <Button variant="primary" size="sm" onClick={handleGenerate} className="w-full justify-center">
            <ClipboardList size={14} className="mr-1.5" />
            Genera Codice Briefing
          </Button>
        </div>

        {/* ── RIGHT: Code + QR output ── */}
        <div className="space-y-4">
          {/* Code output */}
          <div className="bg-galenic-surface border border-galenic-border rounded-xl p-5 space-y-4 min-h-[200px] flex flex-col">
            <h2 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
              Codice Briefing
            </h2>

            {code ? (
              <>
                <div className="bg-galenic-elevated border border-galenic-border rounded-lg p-3 font-mono text-xs text-galenic-accent break-all leading-relaxed flex-1">
                  {code}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant={copied ? 'primary' : 'subtle'}
                    size="sm"
                    onClick={handleCopy}
                    className="w-full justify-center"
                  >
                    {copied
                      ? <><CheckCircle size={14} className="mr-1.5 text-galenic-ok" />Copiato!</>
                      : <><Copy size={14} className="mr-1.5" />Copia Codice</>
                    }
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQR(v => !v)}
                    className="w-full justify-center"
                  >
                    <QrCode size={14} className="mr-1.5" />
                    {showQR ? 'Nascondi QR' : 'Mostra QR Code'}
                  </Button>

                  {showQR && (
                    <div className="flex justify-center py-4 bg-white rounded-xl border border-galenic-border">
                      <QRCodeSVG value={code} size={200} level="M" includeMargin />
                    </div>
                  )}

                  <div className="border-t border-galenic-border/60 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCreateHere}
                      className="w-full justify-center"
                    >
                      <FlaskConical size={14} className="mr-1.5" />
                      Crea Progetto e Apri nel Formulatore
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs font-mono text-galenic-muted/40 text-center px-4">
                Compila il form e clicca<br />"Genera Codice Briefing"
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="bg-galenic-surface border border-galenic-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTemplates(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-galenic-elevated/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Save size={13} className="text-galenic-accent" />
                <span className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
                  Template di Briefing
                </span>
                {templates.length > 0 && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-galenic-accent/10 text-galenic-accent">
                    {templates.length}
                  </span>
                )}
              </div>
              {showTemplates ? <ChevronUp size={13} className="text-galenic-muted" /> : <ChevronDown size={13} className="text-galenic-muted" />}
            </button>

            {showTemplates && (
              <div className="border-t border-galenic-border px-5 py-4 space-y-3">
                {/* Save current form as template */}
                {savingTpl ? (
                  <div className="flex gap-2">
                    <input
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      placeholder="Nome template..."
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveTemplate(); if (e.key === 'Escape') setSavingTpl(false) }}
                      className="flex-1 bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-1.5 text-xs text-galenic-primary placeholder-galenic-muted/50 focus:outline-none focus:border-galenic-accent transition-colors"
                    />
                    <Button variant="primary" size="sm" onClick={handleSaveTemplate}>Salva</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSavingTpl(false)}>✕</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setSavingTpl(true)} className="w-full justify-center">
                    <Save size={12} className="mr-1.5" />
                    Salva configurazione attuale come Template
                  </Button>
                )}

                {templates.length === 0 ? (
                  <p className="text-xs font-mono text-galenic-muted/40 text-center py-2">
                    Nessun template salvato
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {templates.map(tpl => (
                      <div
                        key={tpl.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-galenic-elevated/50 border border-galenic-border/60"
                      >
                        <span className="text-xs font-mono text-galenic-primary truncate flex-1">{tpl.name}</span>
                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          <button
                            onClick={() => handleLoadTemplate(tpl)}
                            className="text-xs font-mono text-galenic-accent hover:opacity-80 transition-opacity px-2 py-0.5"
                          >
                            Carica
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-1 rounded text-galenic-muted hover:text-galenic-danger hover:bg-galenic-danger/10 transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-mono text-galenic-muted">{label}</label>
      {children}
    </div>
  )
}
