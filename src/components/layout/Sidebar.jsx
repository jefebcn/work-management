import React from 'react'
import { useApp } from '../../context/AppContext.jsx'

const NAV_ITEMS = [
  {
    id: 'inventory',
    label: 'Inventario',
    sublabel: 'Materie Prime & Pack',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    id: 'formulator',
    label: 'Formulatore',
    sublabel: 'Crea & Calcola',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H5.612c-1.444 0-2.414-1.798-1.414-2.798L5 14.5" />
      </svg>
    ),
  },
  {
    id: 'claims',
    label: 'Claim',
    sublabel: 'Vitamine · Minerali · Bot.',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const { currentModule, setCurrentModule, formulas } = useApp()

  function navigate(id) {
    setCurrentModule(id)
    onClose()
  }

  return (
    <aside className={[
      'fixed left-0 top-0 bottom-0 w-56 flex flex-col z-30',
      'bg-galenic-surface border-r border-galenic-border/60',
      'transition-transform duration-200 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ].join(' ')}>

      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-galenic-border/60">
        <div className="flex items-center gap-3">
          {/* Icon badge with glow */}
          <div className="w-8 h-8 bg-galenic-accent/10 border border-galenic-accent/30 rounded-lg flex items-center justify-center shadow-glow-sm shrink-0">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-galenic-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-galenic-primary tracking-wide">
              Galenic-OS
            </div>
            <div className="text-xs font-mono text-galenic-muted">v0.2.0</div>
            <div className="text-xs italic text-galenic-muted/50 leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              by elia conti
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = currentModule === item.id
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-galenic-accent/10 border border-galenic-accent/25 text-galenic-accent shadow-glow-sm'
                  : 'text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/60 border border-transparent',
              ].join(' ')}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{item.label}</div>
                <div className="text-xs text-galenic-muted truncate opacity-60">{item.sublabel}</div>
              </div>
              {item.id === 'formulator' && formulas.length > 0 && (
                <span className="ml-auto bg-galenic-accent/20 text-galenic-accent text-xs px-1.5 py-0.5 font-mono rounded-md">
                  {formulas.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-galenic-border/60">
        <div className="text-xs text-galenic-muted/40 font-mono">
          Pharmaceutical Formulator
        </div>
      </div>
    </aside>
  )
}
