import React, { useState, useEffect } from 'react'
import { Copy, Check, ChevronRight, FileText, AlertTriangle } from 'lucide-react'
import { MINISTRY_BOTANICALS, filterBotanicalsByQuery } from '../../data/ministryBotanicals.js'

const DECREE_URL = 'https://www.salute.gov.it/imgs/C_17_pagineAree_4953_listaFile_itemName_3_file.pdf'

export default function BotanicalsTab() {
  const [search,          setSearch]          = useState('')
  const [selectedId,      setSelectedId]      = useState(null)
  const [selectedPart,    setSelectedPart]    = useState(null)  // partCode string
  const [deRatio,         setDeRatio]         = useState('')
  const [titlePct,        setTitlePct]        = useState('')
  const [extractMg,       setExtractMg]       = useState('')
  const [selectedClaims,  setSelectedClaims]  = useState([])
  const [copied,          setCopied]          = useState(false)

  const filteredPlants = filterBotanicalsByQuery(search)
  const plant = MINISTRY_BOTANICALS.find(b => b.id === selectedId)
  const part  = plant?.parts.find(p => p.partCode === selectedPart)

  // When plant changes: reset part + claim selection + pre-fill D:E and titration
  useEffect(() => {
    setSelectedPart(plant?.parts?.[0]?.partCode ?? null)
    setSelectedClaims([])
    setDeRatio(plant ? String(plant.typicalDE) : '')
    setTitlePct(plant ? String(plant.typicalTitle) : '')
    setExtractMg('')
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  // When part changes: reset claim selection
  useEffect(() => {
    setSelectedClaims([])
  }, [selectedPart])

  // Derived calculations
  const de              = parseFloat(deRatio) || plant?.typicalDE || 1
  const tPct            = parseFloat(titlePct) || plant?.typicalTitle || 0
  const extractMgNum    = parseFloat(extractMg) || 0
  const dryEquivalentMg = extractMgNum > 0 ? extractMgNum * de : null
  const markerMg        = extractMgNum > 0 && tPct > 0 ? extractMgNum * (tPct / 100) : null

  function toggleClaim(claim) {
    setSelectedClaims(prev =>
      prev.includes(claim) ? prev.filter(c => c !== claim) : [...prev, claim],
    )
  }

  function selectAll() {
    setSelectedClaims(part?.claims ?? [])
  }

  function deselectAll() {
    setSelectedClaims([])
  }

  // Build label draft text
  function buildDraft() {
    const lines = []
    selectedClaims.forEach(c => lines.push(`• ${c}`))
    if (lines.length > 0 && part?.prescriptions?.length > 0) {
      lines.push('')
      lines.push('── Avvertenze ──────────────────────')
      part.prescriptions.forEach(p => lines.push(`⚠ ${p}`))
    }
    if (extractMgNum > 0 && plant && part) {
      lines.push('')
      const titleStr = tPct > 0 ? ` titolato al ${tPct}% in ${plant.activeMarker}` : ''
      const eqStr    = dryEquivalentMg ? `, equivalente a ${dryEquivalentMg.toFixed(0)} mg di pianta secca` : ''
      lines.push(`Estratto secco di ${plant.commonName} (${part.partLabel})${titleStr} — ${extractMgNum} mg${eqStr}.`)
    }
    return lines.join('\n')
  }

  async function handleCopy() {
    const text = buildDraft()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const hasDraft = selectedClaims.length > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_300px] gap-4 min-h-[520px]">

      {/* ── LEFT: Plant list ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Cerca pianta..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-xs font-mono text-galenic-primary placeholder:text-galenic-muted/50 outline-none focus:border-galenic-accent transition-colors"
        />
        <div className="overflow-y-auto max-h-[480px] space-y-1 pr-0.5">
          {filteredPlants.length === 0 && (
            <div className="text-xs text-galenic-muted font-mono py-4 text-center opacity-60">
              Nessuna pianta trovata
            </div>
          )}
          {filteredPlants.map(b => {
            const isActive = b.id === selectedId
            return (
              <button
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className={[
                  'w-full text-left px-3 py-2.5 rounded-lg border transition-all',
                  isActive
                    ? 'border-galenic-accent/40 bg-galenic-accent/10'
                    : 'border-transparent hover:border-galenic-border hover:bg-galenic-elevated/60',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-semibold leading-snug ${isActive ? 'text-galenic-accent' : 'text-galenic-primary'}`}>
                    {b.commonName}
                  </span>
                  {isActive && <ChevronRight size={12} className="text-galenic-accent shrink-0" />}
                </div>
                <div className="text-xs font-mono text-galenic-muted/60 italic truncate leading-snug mt-0.5">
                  {b.latinName}
                </div>
                {b.belfritId && (
                  <div className="mt-1">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-galenic-elevated border border-galenic-border/60 text-galenic-muted/60">
                      {b.belfritId}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── MIDDLE: Plant detail ─────────────────────────────────────────── */}
      {!plant ? (
        <div className="flex items-center justify-center text-xs text-galenic-muted/40 font-mono md:col-span-2 border border-dashed border-galenic-border rounded-xl">
          Seleziona una pianta dall'elenco
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {/* Plant header */}
            <div className="bg-galenic-surface border border-galenic-border rounded-xl px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-galenic-primary leading-snug">{plant.commonName}</h3>
                  <div className="text-xs font-mono text-galenic-muted italic mt-0.5">{plant.latinName}</div>
                  <div className="text-xs font-mono text-galenic-muted/60 mt-0.5">{plant.family}</div>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  {plant.belfritId && (
                    <div className="text-xs font-mono px-2 py-0.5 rounded bg-galenic-elevated border border-galenic-border text-galenic-muted">
                      {plant.belfritId}
                    </div>
                  )}
                  <div className="text-xs font-mono text-galenic-muted/50">{plant.decreeRef}</div>
                </div>
              </div>
            </div>

            {/* Part selector */}
            {plant.parts.length > 1 && (
              <div>
                <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider mb-1.5">
                  Parte vegetale
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plant.parts.map(p => (
                    <button
                      key={p.partCode}
                      onClick={() => setSelectedPart(p.partCode)}
                      className={[
                        'px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                        selectedPart === p.partCode
                          ? 'border-galenic-accent/40 bg-galenic-accent/10 text-galenic-accent'
                          : 'border-galenic-border text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated',
                      ].join(' ')}
                    >
                      {p.partLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* D:E Calculator */}
            <div className="bg-galenic-surface border border-galenic-border rounded-xl px-4 py-3 space-y-3">
              <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider">
                Calcolo D:E e titolazione
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-mono text-galenic-muted block mb-1">
                    Rapporto D:E
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={deRatio}
                    onChange={e => setDeRatio(e.target.value)}
                    placeholder={String(plant.typicalDE)}
                    className="w-full bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-xs px-2 py-1.5 outline-none focus:border-galenic-accent transition-colors rounded-lg text-right"
                  />
                  <div className="text-xs font-mono text-galenic-muted/40 mt-0.5 text-right">
                    tipico: {plant.typicalDE}:1
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-galenic-muted block mb-1">
                    Titolo %
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={titlePct}
                      onChange={e => setTitlePct(e.target.value)}
                      placeholder={String(plant.typicalTitle)}
                      className="flex-1 bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-xs px-2 py-1.5 outline-none focus:border-galenic-accent transition-colors rounded-lg text-right"
                    />
                    <span className="text-xs font-mono text-galenic-muted">%</span>
                  </div>
                  <div className="text-xs font-mono text-galenic-muted/40 mt-0.5 text-right">
                    {plant.activeMarker}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-galenic-muted block mb-1">
                    Dose estratto
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={extractMg}
                      onChange={e => setExtractMg(e.target.value)}
                      placeholder="mg"
                      className="flex-1 bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-xs px-2 py-1.5 outline-none focus:border-galenic-accent transition-colors rounded-lg text-right"
                    />
                    <span className="text-xs font-mono text-galenic-muted">mg</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              {extractMgNum > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-galenic-border">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-galenic-muted">Equivalente pianta secca</span>
                    <span className="text-galenic-accent font-semibold tabular-nums">
                      {dryEquivalentMg?.toFixed(0)} mg
                    </span>
                  </div>
                  {markerMg !== null && (
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-galenic-muted">{plant.activeMarker} apportati</span>
                      <span className="text-galenic-primary font-semibold tabular-nums">
                        {markerMg.toFixed(2)} mg
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Claims checklist */}
            {part && (
              <div className="bg-galenic-surface border border-galenic-border rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider">
                    Claim autorizzati — {part.partLabel}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs font-mono text-galenic-accent hover:opacity-80 transition-opacity"
                    >
                      Tutti
                    </button>
                    <span className="text-galenic-border">·</span>
                    <button
                      onClick={deselectAll}
                      className="text-xs font-mono text-galenic-muted hover:text-galenic-primary transition-colors"
                    >
                      Nessuno
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {part.claims.map((claim, i) => (
                    <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedClaims.includes(claim)}
                        onChange={() => toggleClaim(claim)}
                        className="mt-0.5 shrink-0 accent-galenic-accent"
                      />
                      <span className="text-xs font-mono text-galenic-muted group-hover:text-galenic-primary transition-colors leading-relaxed">
                        {claim}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Mandatory prescriptions */}
            {part && part.prescriptions.length > 0 && (
              <div className="bg-galenic-warning/5 border border-galenic-warning/30 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-galenic-warning uppercase tracking-wider">
                  <AlertTriangle size={12} />
                  Avvertenze obbligatorie — {part.partLabel}
                </div>
                <ul className="space-y-1">
                  {part.prescriptions.map((p, i) => (
                    <li key={i} className="flex gap-2 text-xs font-mono text-galenic-muted/80">
                      <span className="text-galenic-warning/60 shrink-0 mt-0.5">⚠</span>
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decree reference */}
            <div className="flex items-center gap-2">
              <a
                href={DECREE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono text-galenic-accent hover:opacity-80 transition-opacity"
              >
                <FileText size={12} />
                {plant.decreeRef} — Testo ufficiale (PDF)
              </a>
            </div>
          </div>

          {/* ── RIGHT: Label draft ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-mono text-galenic-muted uppercase tracking-wider">
              Bozza Etichetta
            </div>

            {!hasDraft ? (
              <div className="flex-1 flex items-center justify-center border border-dashed border-galenic-border rounded-xl text-xs text-galenic-muted/40 font-mono p-4 text-center min-h-[200px]">
                Seleziona almeno un claim per generare la bozza
              </div>
            ) : (
              <div className="flex flex-col gap-2 flex-1">
                <div className="bg-galenic-elevated border border-galenic-border rounded-xl p-3 flex-1 overflow-y-auto min-h-[200px]">
                  {/* Selected claims */}
                  <div className="space-y-1.5 mb-3">
                    {selectedClaims.map((claim, i) => (
                      <div key={i} className="flex gap-2 text-xs font-mono text-galenic-primary leading-relaxed">
                        <span className="text-galenic-accent shrink-0">•</span>
                        <span>{claim}</span>
                      </div>
                    ))}
                  </div>

                  {/* Prescriptions */}
                  {part?.prescriptions?.length > 0 && (
                    <>
                      <div className="border-t border-galenic-border/60 my-2" />
                      <div className="text-xs font-mono text-galenic-warning/70 uppercase tracking-wider mb-1.5">
                        Avvertenze
                      </div>
                      <div className="space-y-1">
                        {part.prescriptions.map((p, i) => (
                          <div key={i} className="flex gap-2 text-xs font-mono text-galenic-muted/70 leading-relaxed">
                            <span className="text-galenic-warning/60 shrink-0">⚠</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Extract declaration line */}
                  {extractMgNum > 0 && plant && part && (
                    <>
                      <div className="border-t border-galenic-border/60 my-2" />
                      <div className="text-xs font-mono text-galenic-muted/70 italic leading-relaxed">
                        Estratto secco di {plant.commonName} ({part.partLabel})
                        {tPct > 0 && ` titolato al ${tPct}% in ${plant.activeMarker}`}
                        {' '}— {extractMgNum} mg
                        {dryEquivalentMg && `, equiv. a ${dryEquivalentMg.toFixed(0)} mg di pianta secca`}.
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleCopy}
                  className={[
                    'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono border transition-all',
                    copied
                      ? 'border-galenic-ok/40 bg-galenic-ok/10 text-galenic-ok'
                      : 'border-galenic-accent/30 bg-galenic-accent/10 text-galenic-accent hover:opacity-80',
                  ].join(' ')}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copiato!' : 'Copia bozza'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
