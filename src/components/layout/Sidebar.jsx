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
    id: 'stability',
    label: 'Stabilità & Costi',
    sublabel: 'Analisi & Prezzi',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { currentModule, setCurrentModule, formulas } = useApp()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-galenic-surface border-r border-galenic-border flex flex-col z-30">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-galenic-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-galenic-accent flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-galenic-base">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-mono font-semibold text-galenic-primary tracking-wide">
              Galenic-OS
            </div>
            <div className="text-xs font-mono text-galenic-muted">v0.1.0</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = currentModule === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentModule(item.id)}
              className={[
                'w-full flex items-center gap-3 px-3 py-3 text-left transition-all duration-150',
                isActive
                  ? 'bg-galenic-accent bg-opacity-10 border-l-2 border-galenic-accent text-galenic-accent'
                  : 'text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated border-l-2 border-transparent',
              ].join(' ')}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-mono font-medium truncate">{item.label}</div>
                <div className="text-xs font-mono text-galenic-muted truncate opacity-70">{item.sublabel}</div>
              </div>
              {item.id === 'formulator' && formulas.length > 0 && (
                <span className="ml-auto bg-galenic-accent bg-opacity-20 text-galenic-accent text-xs px-1.5 py-0.5 font-mono">
                  {formulas.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-galenic-border">
        <div className="text-xs font-mono text-galenic-muted opacity-50">
          Pharmaceutical Formulator
        </div>
      </div>
    </aside>
  )
}
