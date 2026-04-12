import React, { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { exportFormulaToExcel } from '../../utils/exportFormula.js'

const MODES = [
  {
    key: 'full',
    label: 'Scheda Completa',
    sublabel: 'RISERVATO',
    desc: 'Tutte le materie prime con nomi, fornitori, mg esatti, purezza, titolo e prezzi. Contrassegnata RISERVATO — solo per uso interno.',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: 'border-galenic-warning/40 bg-galenic-warning/5',
    activeColor: 'border-galenic-warning/60 bg-galenic-warning/10 text-galenic-warning',
    badgeColor: 'bg-galenic-warning/15 text-galenic-warning border-galenic-warning/30',
  },
  {
    key: 'public',
    label: 'Scheda Pubblica',
    sublabel: 'Anonimizzata',
    desc: 'Ingredienti codificati (ING-01, ING-02…), quantità in fasce percentuali, senza prezzi né fornitori. Sicura per condivisione con terzi.',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    color: 'border-galenic-accent/30 bg-galenic-accent/5',
    activeColor: 'border-galenic-accent/50 bg-galenic-accent/10 text-galenic-accent',
    badgeColor: 'bg-galenic-accent/10 text-galenic-accent border-galenic-accent/20',
  },
]

export default function ExportModal({ isOpen, onClose }) {
  const { activeFormula, computed, rawMaterials, packaging } = useApp()
  const [mode, setMode] = useState('full')
  const [exporting, setExporting] = useState(false)

  if (!activeFormula || !computed) return null

  const ingCount  = computed.rows.length
  const nutCount  = computed.rows.filter(r => {
    const rm = rawMaterials.find(m => m.id === r.rawMaterialId)
    return rm && rm.nrvReference > 0
  }).length

  async function handleExport() {
    setExporting(true)
    try {
      exportFormulaToExcel(activeFormula, computed, rawMaterials, packaging, mode)
    } finally {
      setExporting(false)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Esporta Formula" width="max-w-lg">
      <div className="space-y-5">

        {/* Formula summary pill */}
        <div className="bg-galenic-elevated border border-galenic-border/60 rounded-lg px-4 py-3 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-galenic-accent/10 border border-galenic-accent/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-galenic-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-galenic-primary truncate">{activeFormula.name}</div>
            <div className="text-xs font-mono text-galenic-muted mt-0.5">
              {activeFormula.type} · {activeFormula.targetWeightMg} mg ·{' '}
              {ingCount} ingredienti{nutCount > 0 ? ` · ${nutCount} nutrienti con VNR` : ''}
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-md border font-medium shrink-0 ${
            activeFormula.status === 'finalized'
              ? 'bg-galenic-ok/10 text-galenic-ok border-galenic-ok/20'
              : 'bg-galenic-muted/10 text-galenic-muted border-galenic-border'
          }`}>
            {activeFormula.status === 'finalized' ? 'Finalizzata' : 'Bozza'}
          </span>
        </div>

        {/* Mode selector */}
        <div className="space-y-2">
          <div className="text-xs text-galenic-muted font-mono uppercase tracking-wide">
            Tipo di Scheda
          </div>
          {MODES.map(m => {
            const isActive = mode === m.key
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={[
                  'w-full text-left rounded-xl border p-4 transition-all duration-150',
                  isActive ? m.activeColor : m.color + ' hover:border-opacity-60',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${isActive ? m.badgeColor : 'bg-galenic-elevated border-galenic-border text-galenic-muted'}`}>
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-galenic-primary">{m.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${isActive ? m.badgeColor : 'bg-galenic-elevated border-galenic-border text-galenic-muted'}`}>
                        {m.sublabel}
                      </span>
                    </div>
                    <p className="text-xs text-galenic-muted mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${isActive ? 'border-current' : 'border-galenic-border'}`}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Sheet preview */}
        <div className="bg-galenic-elevated/60 rounded-lg p-3 space-y-1.5">
          <div className="text-xs font-mono text-galenic-muted uppercase tracking-wide mb-2">Fogli inclusi</div>
          {mode === 'full' ? (
            <>
              <SheetRow label="Prodotto" desc="Nome, tipo, peso, dosi, date" />
              <SheetRow label="Ingredienti" desc="Tutte le materie prime con mg, %, purezza, titolo, fornitore" sensitive />
              <SheetRow label="Profilo Nutrizionale" desc="Apporto/die, VNR%, limiti di legge" />
              <SheetRow label="Analisi Costi" desc="Costo per materia prima, costo massa/kg, costo unità finale" sensitive />
            </>
          ) : (
            <>
              <SheetRow label="Prodotto" desc="Nome, tipo, peso, dosi" />
              <SheetRow label="Composizione" desc="ING-01…ING-XX, categoria, fascia % (es. 5–15%)" />
              {nutCount > 0 && <SheetRow label="Apporto Nutrizionale" desc="Nutriente, apporto/die, VNR% — dati pubblici" />}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-galenic-border/60">
          <Button variant="ghost" size="sm" onClick={onClose}>Annulla</Button>
          <Button variant="primary" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Generazione…' : 'Scarica .xlsx'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function SheetRow({ label, desc, sensitive }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className={`font-mono shrink-0 mt-0.5 ${sensitive ? 'text-galenic-warning' : 'text-galenic-accent'}`}>
        {sensitive ? '⚠' : '·'}
      </span>
      <div>
        <span className="font-medium text-galenic-primary">{label}</span>
        <span className="text-galenic-muted"> — {desc}</span>
      </div>
    </div>
  )
}
