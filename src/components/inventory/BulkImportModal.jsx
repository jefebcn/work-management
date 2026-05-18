import React, { useState, useRef } from 'react'
import { Upload, X, AlertTriangle, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../ui/Button.jsx'

const GALENIC_FIELDS = [
  { key: 'name',           label: 'Nome Ingrediente',  required: true,  type: 'string'   },
  { key: 'purity',         label: 'Purezza %',         required: true,  type: 'number'   },
  { key: 'pricePerKg',     label: 'Prezzo al kg (€)',  required: true,  type: 'number'   },
  { key: 'supplier',       label: 'Fornitore',         required: false, type: 'string'   },
  { key: 'activeNutrient', label: 'Principio Attivo',  required: false, type: 'string'   },
  { key: 'category',       label: 'Categoria',         required: false, type: 'category' },
  { key: 'titration',      label: 'Titolazione %',     required: false, type: 'number'   },
  { key: 'maxLimitMg',     label: 'Dose Max (mg/die)', required: false, type: 'number'   },
  { key: 'nrvReference',   label: 'NRV (mg)',          required: false, type: 'number'   },
  { key: 'densityGml',     label: 'Densità (g/mL)',    required: false, type: 'number'   },
]

const CATEGORY_VALUES = ['vitamina', 'minerale', 'botanical', 'eccipiente', 'lubrificante']

const HEADER_KEYWORDS = {
  name:           ['nome', 'name', 'ingrediente', 'materia', 'ingredient', 'description', 'descrizione', 'raw material'],
  pricePerKg:     ['prezzo', 'price', 'costo', 'cost', 'euro', 'eur', '€/kg', 'prezzo/kg'],
  purity:         ['purezza', 'purity', 'titolo', 'grade'],
  supplier:       ['fornitore', 'supplier', 'vendor', 'produttore'],
  activeNutrient: ['attivo', 'active', 'nutriente', 'nutrient', 'principio'],
  category:       ['categoria', 'category', 'tipo', 'type'],
  titration:      ['titolazione', 'titration', 'titer'],
  maxLimitMg:     ['limite', 'limit', 'dose max', 'maxlimit'],
  nrvReference:   ['nrv', 'vnr', 'reference', 'riferimento', 'rda'],
  densityGml:     ['densità', 'density', 'bulk', 'densita'],
}

function suggestMapping(headers) {
  const mapping = {}
  const usedFields = new Set()
  headers.forEach(h => {
    const lower = h.toLowerCase()
    for (const [field, keywords] of Object.entries(HEADER_KEYWORDS)) {
      if (!usedFields.has(field) && keywords.some(kw => lower.includes(kw))) {
        mapping[h] = field
        usedFields.add(field)
        return
      }
    }
    mapping[h] = ''
  })
  return mapping
}

function parseValue(raw, type) {
  if (raw === undefined || raw === null || raw === '') return ''
  if (type === 'number') {
    const n = parseFloat(String(raw).replace(',', '.'))
    return isNaN(n) ? '' : n
  }
  if (type === 'category') {
    const lower = String(raw).toLowerCase()
    const direct = CATEGORY_VALUES.find(c => lower.includes(c))
    if (direct) return direct
    if (lower.includes('lubri') || lower.includes('stear') || lower.includes('antiader')) return 'lubrificante'
    return ''
  }
  return String(raw).trim()
}

function buildRow(xlsxRow, mapping) {
  const row = {}
  for (const [col, field] of Object.entries(mapping)) {
    if (!field) continue
    const fieldDef = GALENIC_FIELDS.find(f => f.key === field)
    if (!fieldDef) continue
    row[field] = parseValue(xlsxRow[col], fieldDef.type)
  }
  return row
}

function validateRow(row) {
  const errors = {}
  const warnings = {}
  if (!row.name || String(row.name).trim() === '') errors.name = true
  const price = Number(row.pricePerKg)
  if (row.pricePerKg === '' || isNaN(price) || price <= 0) errors.pricePerKg = true
  const pur = Number(row.purity)
  if (row.purity === '' || isNaN(pur) || pur < 0 || pur > 100) errors.purity = true
  if (!row.supplier) warnings.supplier = true
  if (!row.activeNutrient) warnings.activeNutrient = true
  return { errors, warnings }
}

export default function BulkImportModal({ onClose }) {
  const { addRawMaterial } = useApp()
  const [step, setStep]           = useState('upload')
  const [dragOver, setDragOver]   = useState(false)
  const [parseError, setParseError] = useState(null)
  const [headers, setHeaders]     = useState([])
  const [xlsxRows, setXlsxRows]   = useState([])
  const [mapping, setMapping]     = useState({})
  const [previewRows, setPreviewRows] = useState([])
  const [editCell, setEditCell]   = useState(null)
  const [localVal, setLocalVal]   = useState('')
  const [importCount, setImportCount] = useState(0)
  const fileInputRef = useRef(null)

  async function parseFile(file) {
    setParseError(null)
    try {
      const XLSX = (await import('xlsx')).default
      const ab   = await file.arrayBuffer()
      const wb   = XLSX.read(ab, { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (data.length === 0) { setParseError('Il file non contiene righe dati.'); return }
      const cols = Object.keys(data[0])
      setHeaders(cols)
      setXlsxRows(data)
      setMapping(suggestMapping(cols))
      setStep('mapping')
    } catch {
      setParseError('Impossibile leggere il file. Assicurati che sia un file Excel (.xlsx, .xls) o CSV valido.')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) parseFile(file)
    e.target.value = ''
  }

  function goToPreview() {
    setPreviewRows(xlsxRows.map(xlRow => {
      const built = buildRow(xlRow, mapping)
      const { errors, warnings } = validateRow(built)
      return { ...built, _errors: errors, _warnings: warnings }
    }))
    setStep('preview')
  }

  function commitEdit() {
    if (!editCell) return
    const { ridx, field } = editCell
    setPreviewRows(prev => {
      const rows   = [...prev]
      const row    = { ...rows[ridx], [field]: localVal }
      const { errors, warnings } = validateRow(row)
      rows[ridx]   = { ...row, _errors: errors, _warnings: warnings }
      return rows
    })
    setEditCell(null)
  }

  function doImport() {
    let count = 0
    previewRows.forEach(row => {
      if (Object.keys(row._errors).length > 0) return
      const { _errors, _warnings, ...data } = row
      addRawMaterial({
        name:           String(data.name || '').trim(),
        supplier:       String(data.supplier || '').trim(),
        pricePerKg:     parseFloat(data.pricePerKg) || 0,
        purity:         parseFloat(data.purity)     || 100,
        titration:      parseFloat(data.titration)  || 100,
        activeNutrient: String(data.activeNutrient || '').trim(),
        maxLimitMg:     parseFloat(data.maxLimitMg)  || 0,
        nrvReference:   parseFloat(data.nrvReference) || 0,
        densityGml:     (data.densityGml !== '' && data.densityGml !== undefined)
                          ? parseFloat(data.densityGml) : undefined,
        category:       CATEGORY_VALUES.includes(data.category) ? data.category : 'vitamina',
      })
      count++
    })
    setImportCount(count)
    setStep('done')
  }

  const mappedFields  = Object.values(mapping).filter(Boolean)
  const missingReq    = GALENIC_FIELDS.filter(f => f.required && !mappedFields.includes(f.key))
  const validCount    = previewRows.filter(r => Object.keys(r._errors).length === 0).length
  const invalidCount  = previewRows.length - validCount

  const STEP_LABELS = ['1. File', '2. Colonne', '3. Anteprima']
  const STEP_KEYS   = ['upload', 'mapping', 'preview']

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-galenic-surface border border-galenic-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-galenic-border shrink-0">
          <div className="flex items-center gap-3">
            {(step === 'mapping' || step === 'preview') && (
              <button
                onClick={() => setStep(step === 'preview' ? 'mapping' : 'upload')}
                className="text-galenic-muted hover:text-galenic-primary transition-colors"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <h2 className="text-sm font-mono font-semibold text-galenic-primary uppercase tracking-wider">
              Importa Materie Prime
            </h2>
            <div className="flex items-center gap-1 text-[10px] font-mono text-galenic-muted ml-2">
              {STEP_KEYS.map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && <ChevronRight size={9} />}
                  <span className={step === s || (step === 'done' && s === 'preview') ? 'text-galenic-accent' : ''}>
                    {STEP_LABELS[i]}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-galenic-muted hover:text-galenic-primary transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">

          {/* ── Step 1: Upload ────────────────────────────────── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-xs font-mono text-galenic-muted">
                Carica un file Excel (.xlsx, .xls) o CSV. La prima riga deve contenere le intestazioni delle colonne.
              </p>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  'border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-colors select-none',
                  dragOver
                    ? 'border-galenic-accent bg-galenic-accent/5'
                    : 'border-galenic-border hover:border-galenic-accent/50 hover:bg-galenic-elevated/30',
                ].join(' ')}
              >
                <Upload size={30} className="mx-auto mb-3 text-galenic-muted" />
                <p className="text-sm font-mono text-galenic-primary mb-1">Trascina il file qui</p>
                <p className="text-xs font-mono text-galenic-muted">oppure clicca per selezionare — .xlsx · .xls · .csv</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {parseError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-galenic-danger/10 border border-galenic-danger/30 rounded-lg text-xs font-mono text-galenic-danger">
                  <AlertTriangle size={12} className="shrink-0" />
                  {parseError}
                </div>
              )}
              <div className="text-xs font-mono text-galenic-muted bg-galenic-elevated/60 border border-galenic-border/50 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-galenic-primary/70 text-[10px] uppercase tracking-wider">Colonne consigliate</p>
                <p>Nome · Fornitore · Prezzo/kg · Purezza% · Titolazione% · Principio Attivo · Dose Max · NRV · Densità · Categoria</p>
              </div>
            </div>
          )}

          {/* ── Step 2: Column mapping ────────────────────────── */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-xs font-mono text-galenic-muted">
                Assegna ogni colonna del file al campo corrispondente. I campi con * sono obbligatori.
              </p>
              <div className="border border-galenic-border rounded-xl overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-galenic-elevated border-b border-galenic-border">
                      <th className="px-4 py-2.5 text-left text-[10px] text-galenic-muted font-medium uppercase tracking-wider w-1/2">
                        Colonna nel file
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] text-galenic-muted font-medium uppercase tracking-wider">
                        Mappa a campo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((h, i) => (
                      <tr key={h} className={i > 0 ? 'border-t border-galenic-border/50' : ''}>
                        <td className="px-4 py-2 text-galenic-primary">{h}</td>
                        <td className="px-4 py-2">
                          <select
                            value={mapping[h] || ''}
                            onChange={e => setMapping(prev => ({ ...prev, [h]: e.target.value }))}
                            className="w-full bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-xs px-2 py-1.5 outline-none focus:border-galenic-accent rounded-md"
                          >
                            <option value="">— Ignora —</option>
                            {GALENIC_FIELDS.map(f => (
                              <option key={f.key} value={f.key}>
                                {f.label}{f.required ? ' *' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {missingReq.length > 0 && (
                <div className="flex items-start gap-2 px-3 py-2 bg-galenic-danger/10 border border-galenic-danger/30 rounded-lg text-xs font-mono text-galenic-danger">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>Campi obbligatori non mappati: {missingReq.map(f => f.label).join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Preview ───────────────────────────────── */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                <span className="text-galenic-ok font-semibold">{validCount} {validCount === 1 ? 'riga valida' : 'righe valide'}</span>
                {invalidCount > 0 && (
                  <span className="text-galenic-danger">{invalidCount} con errori (non verranno importate)</span>
                )}
                <span className="text-galenic-muted ml-auto">Clicca su una cella per modificarla</span>
              </div>

              <div className="border border-galenic-border rounded-xl overflow-auto max-h-[52vh]">
                <table className="w-full text-xs font-mono">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-galenic-elevated border-b border-galenic-border">
                      <th className="px-3 py-2 text-left text-[10px] text-galenic-muted font-medium w-8">#</th>
                      {GALENIC_FIELDS.map(f => (
                        <th key={f.key} className="px-3 py-2 text-left text-[10px] text-galenic-muted font-medium uppercase tracking-wider whitespace-nowrap">
                          {f.label}{f.required ? ' *' : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ridx) => {
                      const rowHasErrors = Object.keys(row._errors).length > 0
                      return (
                        <tr
                          key={ridx}
                          className={['border-t border-galenic-border/50', rowHasErrors ? 'bg-galenic-danger/5' : ''].join(' ')}
                        >
                          <td className="px-3 py-1.5 text-galenic-muted/60">{ridx + 1}</td>
                          {GALENIC_FIELDS.map(f => {
                            const hasError   = !!row._errors[f.key]
                            const hasWarning = !!row._warnings[f.key]
                            const isEditing  = editCell?.ridx === ridx && editCell?.field === f.key
                            const cellVal    = row[f.key] !== undefined ? String(row[f.key]) : ''
                            return (
                              <td
                                key={f.key}
                                className={[
                                  'px-1 py-1',
                                  hasError                 ? 'bg-galenic-danger/15'  : '',
                                  hasWarning && !hasError  ? 'bg-yellow-500/10'      : '',
                                ].join(' ')}
                              >
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    type="text"
                                    className="w-full min-w-[80px] bg-galenic-surface border border-galenic-accent text-galenic-primary font-mono text-xs px-2 py-0.5 outline-none rounded"
                                    value={localVal}
                                    onChange={e => setLocalVal(e.target.value)}
                                    onBlur={commitEdit}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter')  commitEdit()
                                      if (e.key === 'Escape') setEditCell(null)
                                    }}
                                  />
                                ) : (
                                  <span
                                    onClick={() => { setEditCell({ ridx, field: f.key }); setLocalVal(cellVal) }}
                                    className={[
                                      'block min-w-[60px] px-1.5 py-0.5 rounded cursor-pointer hover:bg-galenic-elevated/70 transition-colors whitespace-nowrap',
                                      hasError                ? 'text-galenic-danger font-semibold' : '',
                                      hasWarning && !hasError ? 'text-yellow-400'                   : '',
                                      !hasError && !hasWarning ? 'text-galenic-primary'             : '',
                                      !cellVal                ? 'text-galenic-muted/40 italic'      : '',
                                    ].join(' ')}
                                  >
                                    {cellVal || '—'}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-mono text-galenic-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-galenic-danger/20 border border-galenic-danger/40 inline-block shrink-0" />
                  Campo obbligatorio mancante
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-yellow-500/15 border border-yellow-500/30 inline-block shrink-0" />
                  Campo opzionale vuoto
                </span>
              </div>
            </div>
          )}

          {/* ── Done ──────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <CheckCircle2 size={44} className="text-galenic-ok" />
              <div className="text-center">
                <p className="text-sm font-mono font-semibold text-galenic-primary">Importazione completata</p>
                <p className="text-xs font-mono text-galenic-muted mt-1">
                  {importCount} {importCount === 1 ? 'nuovo ingrediente aggiunto' : 'nuovi ingredienti aggiunti'} all'inventario
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-galenic-border shrink-0 flex items-center justify-end gap-3">
          {step === 'upload' && (
            <Button variant="ghost" onClick={onClose}>Annulla</Button>
          )}
          {step === 'mapping' && (
            <>
              <Button variant="ghost" onClick={onClose}>Annulla</Button>
              <Button variant="primary" onClick={goToPreview} disabled={missingReq.length > 0}>
                Anteprima →
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="ghost" onClick={onClose}>Annulla</Button>
              <Button variant="primary" onClick={doImport} disabled={validCount === 0}>
                Importa {validCount} {validCount === 1 ? 'voce' : 'voci'}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button variant="primary" onClick={onClose}>Chiudi</Button>
          )}
        </div>
      </div>
    </div>
  )
}
