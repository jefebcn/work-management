import React from 'react'
import { Package, FlaskConical, ShieldCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

const NAV_ITEMS = [
  {
    id: 'inventory',
    label: 'Inventario',
    sublabel: 'Materie Prime & Pack',
    icon: <Package size={18} strokeWidth={1.5} />,
  },
  {
    id: 'formulator',
    label: 'Formulatore',
    sublabel: 'Crea & Calcola',
    icon: <FlaskConical size={18} strokeWidth={1.5} />,
  },
  {
    id: 'claims',
    label: 'Claim',
    sublabel: 'Vitamine · Minerali · Bot.',
    icon: <ShieldCheck size={18} strokeWidth={1.5} />,
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
          <div className="w-8 h-8 bg-galenic-accent/10 border border-galenic-accent/30 rounded-lg flex items-center justify-center shadow-glow-sm shrink-0">
            <FlaskConical size={15} className="text-galenic-accent" strokeWidth={2.5} />
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
