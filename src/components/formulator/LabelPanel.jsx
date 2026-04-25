import React, { useMemo } from 'react'
import { Tag, CheckCircle, AlertTriangle, FileText, Copy } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

function buildClaims(computedRows, rawMaterials) {
  const claims = []
  for (const row of computedRows) {
    const rm = rawMaterials.find(r => r.id === row.rawMaterialId)
    if (!rm || !rm.activeNutrient || rm.activeNutrient.toLowerCase() === 'eccipiente') continue

    if (row.nrvPercent !== null) {
      if (row.nrvPercent >= 30) {
        claims.push({
          id:         `high_${row.rowId}`,
          text:       `Elevato contenuto di ${rm.activeNutrient}`,
          legal:      'Reg. (UE) n. 1924/2006',
          badge:      'high',
          badgeLabel: '≥ 30% VNR',
          nrvPct:     row.nrvPercent,
          ingredient: rm.name,
        })
      } else if (row.nrvPercent >= 15) {
        claims.push({
          id:         `source_${row.rowId}`,
          text:       `Fonte di ${rm.activeNutrient}`,
          legal:      'Reg. (UE) n. 1924/2006',
          badge:      'source',
          badgeLabel: '≥ 15% VNR',
          nrvPct:     row.nrvPercent,
          ingredient: rm.name,
        })
      }
    } else {
      claims.push({
        id:         `pres_${row.rowId}`,
        text:       `Contiene ${rm.name}`,
        legal:      rm.titration > 0 && rm.titration < 100
                      ? `Titolato al ${rm.titration}% in ${rm.activeNutrient}`
                      : null,
        badge:      'presence',
        badgeLabel: 'Presenza',
        nrvPct:     null,
        ingredient: rm.name,
      })
    }
  }
  return claims
}

const CARD_STYLES = {
  high: {
    border:  'border-galenic-ok/30 hover:border-galenic-ok/60',
    badge:   'bg-galenic-ok/10 text-galenic-ok border border-galenic-ok/25',
    selected: 'border-galenic-ok/60 bg-galenic-ok/5',
    check:   'text-galenic-ok',
  },
  source: {
    border:  'border-galenic-accent/25 hover:border-galenic-accent/50',
    badge:   'bg-galenic-accent/10 text-galenic-accent border border-galenic-accent/20',
    selected: 'border-galenic-accent/50 bg-galenic-accent/4',
    check:   'text-galenic-accent',
  },
  presence: {
    border:  'border-galenic-border hover:border-galenic-border/80',
    badge:   'bg-galenic-elevated text-galenic-muted border border-galenic-border',
    selected: 'border-galenic-border bg-galenic-elevated/60',
    check:   'text-galenic-muted',
  },
}

export default function LabelPanel() {
  const { computed, rawMaterials, activeFormula, setFormulaField } = useApp()
  const [copied, setCopied] = React.useState(false)

  const claims = useMemo(
    () => buildClaims(computed?.rows || [], rawMaterials),
    [computed?.rows, rawMaterials],
  )

  const selectedClaims = activeFormula?.selectedClaims || []

  function toggleClaim(id) {
    const next = selectedClaims.includes(id)
      ? selectedClaims.filter(c => c !== id)
      : [...selectedClaims, id]
    setFormulaField('selectedClaims', next)
  }

  function toggleAll() {
    const allIds = claims.map(c => c.id)
    const allSelected = allIds.every(id => selectedClaims.includes(id))
    setFormulaField('selectedClaims', allSelected ? [] : allIds)
  }

  const labelText = claims
    .filter(c => selectedClaims.includes(c.id))
    .map(c => c.text)
    .join('. ')
    .concat(selectedClaims.length > 0 ? '.' : '')

  function handleCopy() {
    if (!labelText) return
    navigator.clipboard.writeText(labelText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  if (claims.length === 0) {
    return (
      <div className="bg-galenic-surface border border-galenic-border rounded-xl px-5 py-12 text-center">
        <Tag size={22} className="text-galenic-muted/25 mx-auto mb-3" />
        <div className="text-xs font-mono text-galenic-muted/55 leading-relaxed">
          Aggiungi ingredienti con nutriente attivo e VNR impostato<br />
          per visualizzare i claim nutrizionali abilitati.
        </div>
      </div>
    )
  }

  const selectedCount = claims.filter(c => selectedClaims.includes(c.id)).length

  return (
    <div className="space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={13} className="text-galenic-accent" />
          <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
            Claim Nutrizionali
          </h3>
          <span className="text-xs font-mono text-galenic-muted/50">
            Reg. (UE) 1924/2006
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-galenic-muted/60">
            {selectedCount}/{claims.length}
          </span>
          <button
            onClick={toggleAll}
            className="text-xs font-mono text-galenic-accent hover:opacity-75 transition-opacity"
          >
            {selectedCount === claims.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
          </button>
        </div>
      </div>

      {/* Claim cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {claims.map(claim => {
          const isSelected = selectedClaims.includes(claim.id)
          const styles = CARD_STYLES[claim.badge]

          return (
            <label
              key={claim.id}
              className={[
                'relative flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer',
                'transition-all duration-150',
                isSelected ? styles.selected : `border-galenic-border/60 bg-galenic-surface ${styles.border}`,
              ].join(' ')}
            >
              {/* Checkbox top-right */}
              <div className="absolute top-3.5 right-3.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleClaim(claim.id)}
                  className="accent-galenic-accent w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Badge */}
              <div className="flex items-center gap-2 pr-6">
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md font-medium ${styles.badge}`}>
                  {claim.badgeLabel}
                </span>
                {claim.nrvPct !== null && (
                  <span className="text-xs font-mono text-galenic-muted/50 tabular-nums">
                    {claim.nrvPct.toFixed(0)}% VNR
                  </span>
                )}
              </div>

              {/* Claim text */}
              <div className={`text-sm font-medium leading-snug pr-6 ${isSelected ? 'text-galenic-primary' : 'text-galenic-primary/80'}`}>
                {claim.text}
              </div>

              {/* Ingredient + legal footer */}
              <div className="mt-auto space-y-0.5">
                <div className="text-xs font-mono text-galenic-muted/60 truncate">
                  {claim.ingredient}
                </div>
                {claim.legal && (
                  <div className="text-xs font-mono text-galenic-muted/40">
                    {claim.legal}
                  </div>
                )}
              </div>

              {/* Selected checkmark overlay */}
              {isSelected && (
                <CheckCircle size={14} className={`absolute bottom-3 right-3 ${styles.check}`} />
              )}
            </label>
          )
        })}
      </div>

      {/* Generated label text preview */}
      {selectedCount > 0 && (
        <div className="bg-galenic-surface border border-galenic-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-galenic-border bg-galenic-elevated/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-galenic-accent" />
              <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
                Testo Etichetta
              </h3>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${copied ? 'text-galenic-ok' : 'text-galenic-muted hover:text-galenic-accent'}`}
            >
              {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
              {copied ? 'Copiato!' : 'Copia'}
            </button>
          </div>
          <div className="px-5 py-4">
            <div className="bg-galenic-elevated/60 border border-galenic-border/50 rounded-lg px-4 py-3 text-sm text-galenic-primary leading-relaxed font-sans">
              {labelText}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-galenic-muted/50">
              <AlertTriangle size={10} />
              Verificare la conformità con il proprio consulente normativo.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
