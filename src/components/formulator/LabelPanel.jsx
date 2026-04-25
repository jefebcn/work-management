import React, { useMemo } from 'react'
import { Tag, CheckCircle, AlertTriangle, FileText } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

/**
 * Generates EU Reg 1924/2006 nutrition claim suggestions based on
 * computed NRV percentages and raw material data.
 */
function buildClaims(computedRows, rawMaterials) {
  const claims = []
  for (const row of computedRows) {
    const rm = rawMaterials.find(r => r.id === row.rawMaterialId)
    if (!rm || !rm.activeNutrient || rm.activeNutrient.toLowerCase() === 'eccipiente') continue

    if (row.nrvPercent !== null) {
      if (row.nrvPercent >= 30) {
        claims.push({
          id: `high_${row.rowId}`,
          text: `Elevato contenuto di ${rm.activeNutrient}`,
          legal: 'Reg. (UE) n. 1924/2006 – Allegato',
          badge: 'high',
          nrvPct: row.nrvPercent,
          ingredient: rm.name,
        })
      } else if (row.nrvPercent >= 15) {
        claims.push({
          id: `source_${row.rowId}`,
          text: `Fonte di ${rm.activeNutrient}`,
          legal: 'Reg. (UE) n. 1924/2006 – Allegato',
          badge: 'source',
          nrvPct: row.nrvPercent,
          ingredient: rm.name,
        })
      }
    } else {
      // No NRV reference — botanical/other, show presence claim
      claims.push({
        id: `pres_${row.rowId}`,
        text: `Contiene ${rm.name}`,
        legal: rm.titration < 100 ? `Titolato al ${rm.titration}% in ${rm.activeNutrient}` : null,
        badge: 'presence',
        nrvPct: null,
        ingredient: rm.name,
      })
    }
  }
  return claims
}

const BADGE_STYLES = {
  high:     'bg-galenic-ok/10 text-galenic-ok border border-galenic-ok/20',
  source:   'bg-galenic-accent/10 text-galenic-accent border border-galenic-accent/20',
  presence: 'bg-galenic-elevated text-galenic-muted border border-galenic-border',
}
const BADGE_LABELS = {
  high:     '≥ 30% VNR',
  source:   '≥ 15% VNR',
  presence: 'Presenza',
}

export default function LabelPanel() {
  const { computed, rawMaterials, activeFormula, setFormulaField } = useApp()

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

  if (claims.length === 0) {
    return (
      <div className="bg-galenic-surface border border-galenic-border rounded-xl px-5 py-10 text-center">
        <Tag size={22} className="text-galenic-muted/30 mx-auto mb-3" />
        <div className="text-xs font-mono text-galenic-muted/60">
          Aggiungi ingredienti con nutriente attivo e VNR impostato<br />
          per visualizzare i claim nutrizionali abilitati.
        </div>
      </div>
    )
  }

  const selectedCount = claims.filter(c => selectedClaims.includes(c.id)).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-galenic-surface border border-galenic-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-galenic-border bg-galenic-elevated/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={13} className="text-galenic-accent" />
            <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
              Claim Nutrizionali
            </h3>
            <span className="text-xs font-mono text-galenic-muted/60">
              Reg. (UE) 1924/2006
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-galenic-muted">
              {selectedCount}/{claims.length} selezionati
            </span>
            <button
              onClick={toggleAll}
              className="text-xs font-mono text-galenic-accent hover:opacity-80 transition-opacity"
            >
              {selectedCount === claims.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-galenic-border/60">
          {claims.map(claim => {
            const isSelected = selectedClaims.includes(claim.id)
            return (
              <label
                key={claim.id}
                className={[
                  'flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-galenic-accent/4'
                    : 'hover:bg-galenic-elevated/40',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleClaim(claim.id)}
                  className="mt-0.5 accent-galenic-accent shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-md shrink-0 ${BADGE_STYLES[claim.badge]}`}>
                      {BADGE_LABELS[claim.badge]}
                    </span>
                    {claim.nrvPct !== null && (
                      <span className="text-xs font-mono text-galenic-muted/60">
                        ({claim.nrvPct.toFixed(1)}% VNR/dose)
                      </span>
                    )}
                  </div>
                  <div className={`text-sm font-medium mt-1 ${isSelected ? 'text-galenic-primary' : 'text-galenic-primary/80'}`}>
                    {claim.text}
                  </div>
                  <div className="text-xs font-mono text-galenic-muted/60 mt-0.5">
                    {claim.ingredient}
                    {claim.legal && ` · ${claim.legal}`}
                  </div>
                </div>
                {isSelected && <CheckCircle size={14} className="text-galenic-ok shrink-0 mt-0.5" />}
              </label>
            )
          })}
        </div>
      </div>

      {/* Selected claims preview */}
      {selectedCount > 0 && (
        <div className="bg-galenic-surface border border-galenic-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-galenic-border bg-galenic-elevated/50 flex items-center gap-2">
            <FileText size={13} className="text-galenic-accent" />
            <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest">
              Testo Etichetta Generato
            </h3>
          </div>
          <div className="px-5 py-4">
            <div className="bg-galenic-elevated/60 border border-galenic-border/60 rounded-lg px-4 py-3 text-sm text-galenic-primary leading-relaxed font-sans">
              {claims
                .filter(c => selectedClaims.includes(c.id))
                .map(c => c.text)
                .join('. ')
                .concat('.')}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-galenic-muted/60">
              <AlertTriangle size={10} />
              Verificare conformità al Reg. (UE) 1924/2006 con il proprio consulente normativo.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
