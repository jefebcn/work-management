import React, { useState, useRef } from 'react'
import {
  Upload, X, CheckCircle2, AlertTriangle, HelpCircle, Plus,
  ChevronRight, Edit2, ArrowRight,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Button from '../ui/Button.jsx'

// ── Column auto-detection keyword lists ────────────────────────────────────────
const ING_KW  = ['ingrediente', 'ingredient', 'nome', 'name', 'materia', 'component', 'formula', 'descrizione', 'raw material']
const AMT_KW  = ['quantità', 'quantity', 'mg', 'dose', 'amount', 'peso', 'weight', 'grammi', 'g/caram', 'mg/pz']
const NOTE_KW = ['note', 'notes', 'comment', 'commento', 'osservazione', 'remark', 'descrizione']

const CATEGORY_OPTS = [
  { key: 'vitamina',   label: 'Vitamina' },
  { key: 'minerale',   label: 'Minerale' },
  { key: 'botanical',  label: 'Botanical / Funzionale' },
  { key: 'eccipiente', label: 'Eccipiente' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function detectCol(headers, keywords) {
  return headers.find(h => keywords.some(kw => h.toLowerCase().includes(kw))) ?? null
}

function parseAmount(raw) {
  if (raw === undefined || raw === null || raw === '') return 0
  const n = parseFloat(String(raw).replace(',', '.').replace(/[^\d.-]/g, ''))
  return isNaN(n) || n < 0 ? 0 : n
}

function fuzzyMatch(name, rawMaterials) {
  const lower = name.toLowerCase().trim()
  if (!lower) return null
  const exact = rawMaterials.find(rm => rm.name.toLowerCase() === lower)
  if (exact) return exact
  // Partial match — return longest candidate (most specific)
  const partials = rawMaterials.filter(rm =>
    lower.includes(rm.name.toLowerCase()) || rm.name.toLowerCase().includes(lower),
  )
  return partials.length === 0 ? null : partials.sort((a, b) => b.name.length - a.name.length)[0]
}

let _uid = 0
function uid() { return `ri_${++_uid}_${Math.random().toString(36).slice(2, 5)}` }

const EMPTY_DRAFT = { name: '', category: 'eccipiente', pricePerKg: '', purity: '100' }

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function RecipeImportModal({ macrothemeId, onClose }) {
  const { rawMaterials, addRawMaterial, importRecipeFormula } = useApp()

  const [step,       setStep]      = useState('upload')  // upload | review | done
  const [dragOver,   setDragOver]  = useState(false)
  const [parseError, setError]     = useState(null)
  const [items,      setItems]     = useState([])
  const [formulaName,    setName]  = useState('')
  const [dosiAlGiorno,   setDosi]  = useState(1)
  const fileRef = useRef(null)

  // ── File parsing ─────────────────────────────────────────────────────────────
  async function parseFile(file) {
    setError(null)
    try {
      const XLSX = (await import('xlsx')).default
      const ab   = await file.arrayBuffer()
      const wb   = XLSX.read(ab, { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

      if (!rows.length) { setError('File vuoto o senza righe dati.'); return }

      const headers = Object.keys(rows[0])
      const colIng  = detectCol(headers, ING_KW)  ?? headers[0]
      const colAmt  = detectCol(headers, AMT_KW)  ?? headers[1] ?? null
      const colNote = detectCol(headers, NOTE_KW) ?? null

      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      setName(baseName)

      const built = rows
        .filter(r => String(r[colIng] ?? '').trim())
        .map(r => {
          const name     = String(r[colIng] ?? '').trim()
          const amountMg = colAmt ? parseAmount(r[colAmt]) : 0
          const notes    = colNote ? String(r[colNote] ?? '').trim() : ''
          const match    = fuzzyMatch(name, rawMaterials)
          return {
            id:          uid(),
            name,
            amountMg,
            notes,
            status:      match ? 'matched' : 'unresolved', // matched|unresolved|mapped|new|skipped
            rmId:        match?.id ?? null,
            showRemap:   false,
            showNewForm: false,
            newDraft:    { ...EMPTY_DRAFT, name },
          }
        })

      if (!built.length) {
        setError('Nessuna riga ingrediente trovata. Verifica che il file abbia intestazioni corrette (es. "Ingrediente", "Quantità mg").')
        return
      }
      setItems(built)
      setStep('review')
    } catch {
      setError('Impossibile leggere il file. Usa un formato .xlsx, .xls o .csv valido.')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) parseFile(f)
  }

  // ── Item state helpers ───────────────────────────────────────────────────────
  function patch(id, fields) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...fields } : it))
  }

  function setMapping(id, rmId) {
    patch(id, { status: rmId ? 'mapped' : 'unresolved', rmId: rmId || null, showRemap: false, showNewForm: false })
  }

  function confirmNewRm(id) {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it
      const d = it.newDraft
      if (!d.name.trim() || !String(d.pricePerKg).trim()) return it
      return { ...it, status: 'new', showNewForm: false, showRemap: false }
    }))
  }

  function skipItem(id) {
    patch(id, { status: 'skipped', showRemap: false, showNewForm: false })
  }

  function restoreItem(id) {
    const it = items.find(i => i.id === id)
    if (!it) return
    const match = fuzzyMatch(it.name, rawMaterials)
    patch(id, { status: match ? 'matched' : 'unresolved', rmId: match?.id ?? null, showRemap: false })
  }

  // ── Derived counts ───────────────────────────────────────────────────────────
  const resolvedItems   = items.filter(it => it.status !== 'unresolved' && it.status !== 'skipped')
  const unresolvedItems = items.filter(it => it.status === 'unresolved')
  const includedItems   = items.filter(it => it.status !== 'skipped')
  const allResolved     = items.every(it => it.status !== 'unresolved')
  const totalAmountMg   = includedItems.reduce((s, it) => s + (it.amountMg || 0), 0)

  // ── Create formula ───────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!allResolved || !includedItems.length) return

    // 1. Persist any new raw materials and build id-map
    const newIdMap = new Map()
    for (const it of items) {
      if (it.status !== 'new') continue
      const rm = addRawMaterial({
        name:           it.newDraft.name.trim(),
        category:       it.newDraft.category,
        pricePerKg:     parseFloat(it.newDraft.pricePerKg) || 0,
        purity:         parseFloat(it.newDraft.purity) || 100,
        titration:      100,
        supplier:       '',
        activeNutrient: '',
        maxLimitMg:     0,
        nrvReference:   0,
      })
      newIdMap.set(it.id, rm.id)
    }

    // 2. Build resolved ingredient list
    const resolvedIngredients = includedItems
      .map(it => ({
        rawMaterialId: it.status === 'new' ? newIdMap.get(it.id) : it.rmId,
        amountMg:      it.amountMg,
      }))
      .filter(ri => ri.rawMaterialId)

    // 3. Create formula and navigate to builder
    importRecipeFormula({
      name:                formulaName || 'Ricetta Importata',
      macrothemeId,
      targetWeightMg:      totalAmountMg || 500,
      dosiAlGiorno,
      resolvedIngredients,
    })

    setStep('done')
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-galenic-surface border border-galenic-border rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-galenic-border shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-mono font-semibold text-galenic-primary uppercase tracking-wider">
              Importa Ricetta da Excel
            </h2>
            <div className="flex items-center gap-1 text-[10px] font-mono text-galenic-muted">
              {['upload', 'review'].map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && <ChevronRight size={9} />}
                  <span className={
                    step === s || (step === 'done' && s === 'review')
                      ? 'text-galenic-accent'
                      : ''
                  }>
                    {['1. File', '2. Verifica & Mappa'][i]}
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

          {/* ── STEP 1: Upload ─────────────────────────────────────────────── */}
          {step === 'upload' && (
            <div className="space-y-5">
              <p className="text-xs font-mono text-galenic-muted">
                Carica un file Excel o CSV con la ricetta. Il sistema riconoscerà automaticamente
                le colonne Ingrediente, Quantità e Note, verificherà ogni ingrediente nell'inventario
                e gestirà le materie prime mancanti.
              </p>

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={[
                  'border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-colors select-none',
                  dragOver
                    ? 'border-galenic-accent bg-galenic-accent/5'
                    : 'border-galenic-border hover:border-galenic-accent/50 hover:bg-galenic-elevated/20',
                ].join(' ')}
              >
                <Upload size={30} className="mx-auto mb-3 text-galenic-muted" />
                <p className="text-sm font-mono text-galenic-primary mb-1">Trascina la ricetta qui</p>
                <p className="text-xs font-mono text-galenic-muted">oppure clicca per selezionare — .xlsx · .xls · .csv</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => {
                  const f = e.target.files[0]
                  if (f) parseFile(f)
                  e.target.value = ''
                }}
              />

              {parseError && (
                <div className="flex items-start gap-2 px-3 py-2 bg-galenic-danger/10 border border-galenic-danger/30 rounded-lg text-xs font-mono text-galenic-danger">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />{parseError}
                </div>
              )}

              {/* Format hint */}
              <div className="bg-galenic-elevated/50 border border-galenic-border/50 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-mono font-semibold text-galenic-muted uppercase tracking-wider">Formato atteso</p>
                <div className="overflow-x-auto">
                  <table className="text-[11px] font-mono w-full">
                    <thead>
                      <tr className="border-b border-galenic-border/60">
                        <th className="px-3 py-1.5 text-left text-galenic-accent font-medium">Ingrediente</th>
                        <th className="px-3 py-1.5 text-right text-galenic-accent font-medium">Quantità (mg)</th>
                        <th className="px-3 py-1.5 text-left text-galenic-accent font-medium">Note</th>
                      </tr>
                    </thead>
                    <tbody className="text-galenic-muted">
                      {[
                        ['Maltitolo', '320', 'legante base'],
                        ['Vitamina C', '80',  'principio attivo'],
                        ['Gomma Arabica', '50', 'addensante'],
                        ['Aroma Fragola', '15', 'aromatizzante'],
                      ].map(([n, q, note]) => (
                        <tr key={n} className="border-t border-galenic-border/30">
                          <td className="px-3 py-1">{n}</td>
                          <td className="px-3 py-1 text-right">{q}</td>
                          <td className="px-3 py-1 text-galenic-muted/60 italic">{note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] font-mono text-galenic-muted/60">
                  Le intestazioni possono avere qualsiasi nome — vengono rilevate automaticamente per parole chiave.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Review & Map ──────────────────────────────────────── */}
          {step === 'review' && (
            <div className="space-y-5">

              {/* Status bar */}
              <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
                <span className="flex items-center gap-1.5 text-galenic-ok font-semibold">
                  <CheckCircle2 size={13} />
                  {resolvedItems.length} pronti
                </span>
                {unresolvedItems.length > 0 && (
                  <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                    <HelpCircle size={13} />
                    {unresolvedItems.length} da mappare
                  </span>
                )}
                {items.filter(i => i.status === 'skipped').length > 0 && (
                  <span className="text-galenic-muted/50">
                    {items.filter(i => i.status === 'skipped').length} ignorati
                  </span>
                )}
                <span className="ml-auto text-galenic-muted">
                  Peso totale: <span className="text-galenic-primary font-semibold">
                    {totalAmountMg.toLocaleString('it-IT')} mg
                  </span>
                </span>
              </div>

              {/* Ingredient cards */}
              <div className="space-y-2">
                {items.map(it => (
                  <IngCard
                    key={it.id}
                    item={it}
                    rawMaterials={rawMaterials}
                    onAmountChange={val => patch(it.id, { amountMg: parseAmount(val) })}
                    onMap={rmId => setMapping(it.id, rmId)}
                    onToggleRemap={() => patch(it.id, { showRemap: !it.showRemap, showNewForm: false })}
                    onToggleNewForm={() => patch(it.id, { showNewForm: !it.showNewForm, showRemap: false })}
                    onDraftChange={(field, val) => patch(it.id, { newDraft: { ...it.newDraft, [field]: val } })}
                    onConfirmNew={() => confirmNewRm(it.id)}
                    onSkip={() => skipItem(it.id)}
                    onRestore={() => restoreItem(it.id)}
                  />
                ))}
              </div>

              {/* Formula settings */}
              <div className="border-t border-galenic-border/50 pt-4 space-y-3">
                <p className="text-[10px] font-mono font-semibold text-galenic-muted uppercase tracking-wider">
                  Impostazioni Progetto
                </p>
                <div className="flex items-end gap-4 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <label className="cell-unit block mb-1">Nome Formula</label>
                    <input
                      type="text"
                      className="cell-input w-full"
                      value={formulaName}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome della formula"
                    />
                  </div>
                  <div>
                    <label className="cell-unit block mb-1">Dosi/die</label>
                    <input
                      type="number" min="1" step="1"
                      className="cell-input w-20 text-right"
                      value={dosiAlGiorno}
                      onChange={e => setDosi(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div className="text-xs font-mono text-galenic-muted/70 pb-1.5">
                    Peso target:
                    <span className="text-galenic-primary ml-1 font-semibold">
                      {totalAmountMg.toLocaleString('it-IT')} mg
                    </span>
                    <span className="text-galenic-muted/50 ml-1">/ caramella</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Done ───────────────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <CheckCircle2 size={48} className="text-galenic-ok" />
              <div className="text-center space-y-1">
                <p className="text-sm font-mono font-semibold text-galenic-primary">
                  Progetto creato con successo
                </p>
                <p className="text-xs font-mono text-galenic-muted">
                  <span className="text-galenic-primary font-medium">"{formulaName}"</span>
                  {' '}— {includedItems.length} ingredienti · {totalAmountMg.toLocaleString('it-IT')} mg · stato Draft
                </p>
              </div>
              <p className="text-[10px] font-mono text-galenic-muted/60">
                Puoi chiudere e continuare nel Formulatore.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-galenic-border shrink-0 flex items-center justify-end gap-3">
          {step === 'upload' && (
            <Button variant="ghost" onClick={onClose}>Annulla</Button>
          )}
          {step === 'review' && (
            <>
              <Button variant="ghost" onClick={onClose}>Annulla</Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={!allResolved || !includedItems.length}
              >
                <ArrowRight size={13} className="mr-1.5" />
                Crea Progetto Draft ({includedItems.length} ingredienti)
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button variant="primary" onClick={onClose}>
              Vai al Formulatore
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Single ingredient card ─────────────────────────────────────────────────────
function IngCard({ item, rawMaterials, onAmountChange, onMap, onToggleRemap, onToggleNewForm, onDraftChange, onConfirmNew, onSkip, onRestore }) {
  const resolvedRm = rawMaterials.find(r => r.id === item.rmId)

  const STATUS_ICON = {
    matched:    <CheckCircle2 size={15} className="text-galenic-ok shrink-0" />,
    mapped:     <CheckCircle2 size={15} className="text-galenic-ok shrink-0" />,
    new:        <CheckCircle2 size={15} className="text-blue-400 shrink-0" />,
    unresolved: <HelpCircle   size={15} className="text-yellow-400 shrink-0" />,
    skipped:    <X            size={15} className="text-galenic-muted/30 shrink-0" />,
  }

  const isSkipped    = item.status === 'skipped'
  const isUnresolved = item.status === 'unresolved'
  const isMapped     = item.status === 'matched' || item.status === 'mapped'

  const draftValid = item.newDraft.name.trim() && String(item.newDraft.pricePerKg).trim() && parseFloat(item.newDraft.pricePerKg) > 0

  return (
    <div className={[
      'border rounded-xl transition-colors',
      isSkipped    ? 'border-galenic-border/30 bg-transparent opacity-50' : '',
      isUnresolved ? 'border-yellow-500/40 bg-yellow-500/5'               : '',
      !isSkipped && !isUnresolved ? 'border-galenic-border/70'            : '',
    ].join(' ')}>

      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* Status icon */}
        {STATUS_ICON[item.status] ?? STATUS_ICON.unresolved}

        {/* Name from Excel */}
        <span className={[
          'flex-1 text-xs font-mono truncate min-w-0',
          isSkipped ? 'text-galenic-muted/40 line-through' : 'text-galenic-primary',
        ].join(' ')}>
          {item.name}
        </span>

        {/* Resolution label */}
        {item.status === 'matched' && resolvedRm && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-galenic-ok bg-galenic-ok/10 px-2 py-0.5 rounded-full shrink-0 max-w-[160px]">
            <ArrowRight size={9} />
            <span className="truncate">{resolvedRm.name}</span>
            <button onClick={onToggleRemap} title="Cambia mapping" className="ml-0.5 hover:opacity-60">
              <Edit2 size={9} />
            </button>
          </span>
        )}
        {item.status === 'mapped' && resolvedRm && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-galenic-ok bg-galenic-ok/10 px-2 py-0.5 rounded-full shrink-0 max-w-[160px]">
            <span className="text-[9px]">↦</span>
            <span className="truncate">{resolvedRm.name}</span>
            <button onClick={onToggleRemap} title="Cambia mapping" className="ml-0.5 hover:opacity-60">
              <Edit2 size={9} />
            </button>
          </span>
        )}
        {item.status === 'new' && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full shrink-0">
            <Plus size={9} />
            {item.newDraft.name || 'Nuova RM'}
            <button onClick={onToggleNewForm} title="Modifica" className="ml-0.5 hover:opacity-60">
              <Edit2 size={9} />
            </button>
          </span>
        )}

        {/* Amount input */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="text"
            inputMode="decimal"
            className="cell-input w-16 text-right text-xs"
            defaultValue={item.amountMg || ''}
            placeholder="0"
            onBlur={e => onAmountChange(e.target.value)}
          />
          <span className="cell-unit text-[10px]">mg</span>
        </div>

        {/* Notes pill */}
        {item.notes && (
          <span
            className="hidden lg:block text-[10px] font-mono text-galenic-muted/50 italic shrink-0 max-w-[90px] truncate"
            title={item.notes}
          >
            {item.notes}
          </span>
        )}

        {/* Skip / restore */}
        {!isSkipped ? (
          <button
            onClick={onSkip}
            title="Ignora questo ingrediente"
            className="text-galenic-muted/40 hover:text-galenic-muted transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        ) : (
          <button
            onClick={onRestore}
            className="text-[10px] font-mono text-galenic-accent hover:opacity-75 transition-opacity shrink-0"
          >
            ↩
          </button>
        )}
      </div>

      {/* ── Re-map dropdown (matched/mapped with edit toggled) ────────────── */}
      {(item.status === 'matched' || item.status === 'mapped') && item.showRemap && (
        <div className="px-3 pb-3 pt-0 border-t border-galenic-border/30">
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-mono text-galenic-muted shrink-0">Cambia a:</span>
            <select
              value={item.rmId || ''}
              onChange={e => onMap(e.target.value)}
              className="flex-1 bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-xs px-2 py-1 rounded-md outline-none focus:border-galenic-accent"
              autoFocus
            >
              <option value="">— seleziona materia prima —</option>
              {rawMaterials.map(rm => (
                <option key={rm.id} value={rm.id}>{rm.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Resolution zone (unresolved) ─────────────────────────────────── */}
      {isUnresolved && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-yellow-500/20 pt-2.5">
          <p className="text-[10px] font-mono text-yellow-400 flex items-center gap-1.5">
            <AlertTriangle size={10} className="shrink-0" />
            Materia prima non trovata nell'inventario. Associa o crea:
          </p>

          {/* Option A: map to existing */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-galenic-muted shrink-0 w-14">Associa a:</span>
            <select
              value={item.rmId || ''}
              onChange={e => onMap(e.target.value)}
              className="flex-1 bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-xs px-2 py-1 rounded-md outline-none focus:border-galenic-accent"
            >
              <option value="">— seleziona materia prima esistente —</option>
              {rawMaterials.map(rm => (
                <option key={rm.id} value={rm.id}>{rm.name}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-galenic-border/40" />
            <span className="text-[10px] font-mono text-galenic-muted/50">oppure</span>
            <div className="flex-1 border-t border-galenic-border/40" />
          </div>

          {/* Option B: create new */}
          <button
            onClick={onToggleNewForm}
            className="flex items-center gap-1.5 text-[10px] font-mono text-galenic-accent hover:opacity-80 transition-opacity"
          >
            <Plus size={10} />
            {item.showNewForm ? 'Chiudi form nuova materia prima' : 'Crea nuova materia prima'}
          </button>

          {item.showNewForm && (
            <NewRmForm
              draft={item.newDraft}
              valid={draftValid}
              onUpdate={onDraftChange}
              onConfirm={onConfirmNew}
            />
          )}
        </div>
      )}

      {/* ── New-form in edit mode (status === 'new' with toggle) ─────────── */}
      {item.status === 'new' && item.showNewForm && (
        <div className="px-3 pb-3 border-t border-galenic-border/30 pt-2.5">
          <NewRmForm
            draft={item.newDraft}
            valid={draftValid}
            onUpdate={onDraftChange}
            onConfirm={onConfirmNew}
          />
        </div>
      )}
    </div>
  )
}

// ── Inline new-RM mini-form ────────────────────────────────────────────────────
function NewRmForm({ draft, valid, onUpdate, onConfirm }) {
  return (
    <div className="bg-galenic-elevated/60 border border-galenic-border/60 rounded-lg p-3 space-y-2.5">
      <p className="text-[10px] font-mono text-galenic-muted uppercase tracking-wider">Nuova Materia Prima</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="cell-unit block mb-0.5 text-[10px]">Nome *</label>
          <input
            type="text"
            className="cell-input w-full text-xs"
            value={draft.name}
            onChange={e => onUpdate('name', e.target.value)}
            placeholder="es. Gomma Gellano"
          />
        </div>
        <div>
          <label className="cell-unit block mb-0.5 text-[10px]">Categoria</label>
          <select
            value={draft.category}
            onChange={e => onUpdate('category', e.target.value)}
            className="cell-input w-full text-xs"
          >
            {CATEGORY_OPTS.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="cell-unit block mb-0.5 text-[10px]">Prezzo/kg (€) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="cell-input w-full text-xs"
            value={draft.pricePerKg}
            onChange={e => onUpdate('pricePerKg', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="cell-unit block mb-0.5 text-[10px]">Purezza %</label>
          <input
            type="number"
            min="0"
            max="100"
            className="cell-input w-full text-xs"
            value={draft.purity}
            onChange={e => onUpdate('purity', e.target.value)}
          />
        </div>
      </div>
      <button
        onClick={onConfirm}
        disabled={!valid}
        className={[
          'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all',
          valid
            ? 'bg-galenic-accent text-white hover:opacity-90 cursor-pointer'
            : 'bg-galenic-border/40 text-galenic-muted/50 cursor-not-allowed',
        ].join(' ')}
      >
        <CheckCircle2 size={11} />
        Conferma materia prima
      </button>
    </div>
  )
}
