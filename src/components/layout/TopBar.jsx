import React from 'react'
import { Menu, Sun, Moon, Plus, ChevronRight, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const MODULE_LABELS = {
  dashboard:  'Home',
  formulator: 'Progetti',
  inventory:  'Inventario',
}

export default function TopBar({ onMenuClick, onCommandOpen }) {
  const {
    currentModule, activeFormula,
    macrothemes, newFormula, setCurrentModule,
  } = useApp()
  const { darkMode, toggleTheme } = useTheme()

  // Breadcrumbs dinamiche
  const breadcrumbs = []
  breadcrumbs.push({ label: MODULE_LABELS[currentModule] || 'Home' })

  if (currentModule === 'formulator' && activeFormula) {
    const macro = macrothemes.find(m => m.id === activeFormula.macrothemeId)
    if (macro) breadcrumbs.push({ label: macro.name })
    breadcrumbs.push({
      label: activeFormula.name,
      version: activeFormula.versionLabel || `v${activeFormula.version || 1}`,
    })
  }

  function handleQuickCreate() {
    setCurrentModule('formulator')
    newFormula()
  }

  return (
    <header className="h-14 bg-galenic-surface/95 backdrop-blur-sm border-b border-galenic-border/60 flex items-center px-4 gap-3 shrink-0 sticky top-0 z-20">

      {/* Hamburger — mobile */}
      <button
        className="md:hidden flex items-center justify-center w-8 h-8 text-galenic-muted hover:text-galenic-primary transition-colors rounded-md hover:bg-galenic-elevated"
        onClick={onMenuClick}
        aria-label="Apri menu"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumbs */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm overflow-hidden">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1
          return (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} className="text-galenic-border shrink-0" />}
              <span className={[
                'truncate',
                isLast
                  ? 'text-galenic-primary font-medium'
                  : 'text-galenic-muted',
              ].join(' ')}>
                {crumb.label}
              </span>
              {crumb.version && (
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-galenic-accent/10 text-galenic-accent border border-galenic-accent/20 shrink-0">
                  {crumb.version}
                </span>
              )}
            </React.Fragment>
          )
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Cmd+K search trigger */}
        <button
          onClick={onCommandOpen}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-galenic-muted/70 bg-galenic-elevated/60 border border-galenic-border/60 hover:border-galenic-accent/30 hover:text-galenic-primary transition-all"
          title="Ricerca rapida (⌘K)"
        >
          <Search size={12} />
          Cerca…
          <kbd className="text-galenic-muted/50 text-xs">⌘K</kbd>
        </button>

        {/* Quick create */}
        <button
          onClick={handleQuickCreate}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-galenic-accent text-galenic-surface hover:opacity-90 transition-opacity shadow-sm"
          title="Crea nuova formula"
        >
          <Plus size={13} />
          Nuova
        </button>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-galenic-muted hover:text-galenic-accent hover:bg-galenic-elevated transition-all"
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-galenic-muted/60 pl-2 border-l border-galenic-border/40 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-galenic-ok inline-block" />
          {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
        </div>
      </div>
    </header>
  )
}
