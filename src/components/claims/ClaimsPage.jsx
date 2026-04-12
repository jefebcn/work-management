import React, { useState } from 'react'
import { CLAIMS } from '../../data/claims.js'

const TABS = [
  { key: 'tutti',     label: 'Tutti' },
  { key: 'vitamina',  label: 'Vitamine' },
  { key: 'minerale',  label: 'Minerali' },
  { key: 'botanical', label: 'Botanicals' },
]

function categoryStyle(cat) {
  if (cat === 'vitamina') return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
  if (cat === 'minerale') return 'bg-galenic-ok/10 text-galenic-ok border-galenic-ok/20'
  return 'bg-purple-400/10 text-purple-400 border-purple-400/20'
}

function categoryLabel(cat) {
  if (cat === 'vitamina') return 'Vitamina'
  if (cat === 'minerale') return 'Minerale'
  return 'Botanical'
}

export default function ClaimsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('tutti')

  const filtered = CLAIMS.filter(item => {
    const matchCat = activeCategory === 'tutti' || item.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      (item.italianName || '').toLowerCase().includes(q) ||
      item.claims.some(c => c.toLowerCase().includes(q))
    return matchCat && matchSearch
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-galenic-primary">Claim Salute Autorizzati</h1>
        <p className="text-xs text-galenic-muted mt-0.5">
          Reg. UE 432/2012 · Min. Salute IT Allegato 1 (2022)
        </p>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Cerca per nome o claim..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-galenic-elevated border border-galenic-border rounded-lg px-3 py-2 text-sm font-mono text-galenic-primary placeholder:text-galenic-muted/50 outline-none focus:border-galenic-accent focus:shadow-glow-sm flex-1 transition-colors"
        />
        <div className="flex gap-1 overflow-x-auto shrink-0">
          {TABS.map(tab => {
            const isActive = activeCategory === tab.key
            const count = tab.key === 'tutti'
              ? CLAIMS.length
              : CLAIMS.filter(c => c.category === tab.key).length
            return (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={[
                  'px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap border transition-all',
                  isActive
                    ? 'border-galenic-accent/30 bg-galenic-accent/10 text-galenic-accent'
                    : 'border-galenic-border text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated',
                ].join(' ')}
              >
                {tab.label}
                <span className="ml-1.5 font-mono opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-galenic-muted font-mono">
        {filtered.length} risultati
        {search && <span className="opacity-60"> per "{search}"</span>}
      </div>

      {/* Card grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((item, i) => (
            <div key={i} className="bg-galenic-surface border border-galenic-border rounded-xl p-4 space-y-3">
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-galenic-primary leading-snug">{item.name}</div>
                  {item.italianName && (
                    <div className="text-xs text-galenic-muted mt-0.5 font-mono truncate">{item.italianName}</div>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-md border font-medium shrink-0 ${categoryStyle(item.category)}`}>
                  {categoryLabel(item.category)}
                </span>
              </div>

              {/* Claims list */}
              <ul className="space-y-1.5">
                {item.claims.map((claim, j) => (
                  <li key={j} className="flex gap-2 text-xs text-galenic-muted">
                    <span className="text-galenic-accent mt-0.5 shrink-0 leading-none">·</span>
                    <span className="leading-relaxed">{claim}</span>
                  </li>
                ))}
              </ul>

              {/* Source footer */}
              <div className="text-xs font-mono text-galenic-muted/40 pt-2 border-t border-galenic-border/50">
                {item.source}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-galenic-muted">
          <div className="text-sm">Nessun claim trovato</div>
          {search && (
            <div className="text-xs mt-1 opacity-60 font-mono">"{search}"</div>
          )}
        </div>
      )}
    </div>
  )
}
