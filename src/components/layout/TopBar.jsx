import React from 'react'
import { useApp } from '../../context/AppContext.jsx'

const MODULE_TITLES = {
  inventory:  { title: 'Inventario', sub: 'Gestione Materie Prime & Packaging' },
  formulator: { title: 'Formulatore', sub: 'Creazione & Calcolo Formule' },
  stability:  { title: 'Stabilità & Costi', sub: 'Analisi Parametri & Riepilogo Economico' },
}

export default function TopBar({ onMenuClick }) {
  const { currentModule, activeFormula } = useApp()
  const meta = MODULE_TITLES[currentModule] || MODULE_TITLES.inventory

  return (
    <header className="h-14 bg-galenic-surface border-b border-galenic-border flex items-center px-4 gap-3 shrink-0">

      {/* Hamburger — mobile only */}
      <button
        className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8 shrink-0 text-galenic-muted hover:text-galenic-primary"
        onClick={onMenuClick}
        aria-label="Apri menu"
      >
        <span className="block w-5 h-px bg-current" />
        <span className="block w-5 h-px bg-current" />
        <span className="block w-5 h-px bg-current" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs font-mono text-galenic-muted flex-wrap">
          <span className="text-galenic-accent uppercase tracking-widest font-medium">
            {meta.title}
          </span>
          {activeFormula && currentModule === 'formulator' && (
            <>
              <span className="text-galenic-border">›</span>
              <span className="text-galenic-primary truncate max-w-32">{activeFormula.name}</span>
              <span className="bg-galenic-elevated border border-galenic-border px-1.5 py-0.5 text-galenic-muted uppercase text-xs">
                {activeFormula.type}
              </span>
            </>
          )}
        </div>
        <div className="text-xs text-galenic-muted font-mono opacity-60 mt-0.5 truncate hidden sm:block">
          {meta.sub}
        </div>
      </div>

      {/* System info */}
      <div className="flex items-center gap-3 text-xs font-mono text-galenic-muted shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-galenic-ok inline-block" />
          <span className="opacity-60 hidden sm:inline">Sistema Attivo</span>
        </div>
        <div className="opacity-40 hidden md:block">
          {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </header>
  )
}
