import React, { useRef, useState } from 'react'
import {
  LayoutDashboard, Package, FlaskConical,
  Download, Upload, HardDrive,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { downloadBackup, parseBackup, mergeBackup } from '../../utils/backupRestore.js'

const NAV_ITEMS = [
  {
    id:       'dashboard',
    label:    'Home',
    sublabel: 'Dashboard',
    icon:     <LayoutDashboard size={17} strokeWidth={1.7} />,
  },
  {
    id:       'formulator',
    label:    'Progetti',
    sublabel: 'Formule & Versioni',
    icon:     <FlaskConical size={17} strokeWidth={1.7} />,
  },
  {
    id:       'inventory',
    label:    'Inventario',
    sublabel: 'Materie Prime & Pack',
    icon:     <Package size={17} strokeWidth={1.7} />,
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const {
    currentModule, setCurrentModule,
    formulas, rawMaterials, packaging, importBackup, lastSaved,
  } = useApp()
  const fileInputRef = useRef(null)
  const [feedback, setFeedback] = useState(null)

  function navigate(id) {
    setCurrentModule(id)
    onClose()
  }

  function handleDownload() { downloadBackup() }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = parseBackup(ev.target.result)
      if (!result.ok) {
        setFeedback({ type: 'err', msg: result.error })
        setTimeout(() => setFeedback(null), 4000)
        return
      }
      const merged = mergeBackup(result.data, { rawMaterials, packaging, formulas })
      importBackup(merged)
      const { added } = merged
      setFeedback({
        type: 'ok',
        msg: `+${added.rawMaterials} mat. +${added.packaging} pack. +${added.formulas} formule`,
      })
      setTimeout(() => setFeedback(null), 4000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <aside className={[
      'fixed left-0 top-0 bottom-0 w-56 flex flex-col z-30',
      'bg-galenic-surface border-r border-galenic-border/60',
      'transition-transform duration-200 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ].join(' ')}>

      {/* Brand */}
      <div className="px-4 py-4 border-b border-galenic-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-galenic-accent/10 border border-galenic-accent/30 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <FlaskConical size={15} className="text-galenic-accent" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-galenic-primary tracking-tight truncate">
              Galenic-OS
            </div>
            <div className="text-xs font-mono text-galenic-muted truncate">v0.3.0</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = currentModule === item.id
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-md transition-all duration-150',
                isActive
                  ? 'bg-galenic-accent/12 text-galenic-accent font-medium'
                  : 'text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/50',
              ].join(' ')}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm leading-tight truncate">{item.label}</div>
                <div className="text-xs text-galenic-muted/60 truncate leading-tight mt-0.5">
                  {item.sublabel}
                </div>
              </div>
              {item.id === 'formulator' && formulas.length > 0 && (
                <span className={[
                  'text-xs font-mono px-1.5 py-0.5 rounded-md tabular-nums',
                  isActive ? 'bg-galenic-accent/20 text-galenic-accent' : 'bg-galenic-elevated text-galenic-muted',
                ].join(' ')}>
                  {formulas.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-galenic-border/60 space-y-2">
        {feedback && (
          <div className={`text-xs font-mono px-2 py-1.5 rounded-md leading-snug ${
            feedback.type === 'ok'
              ? 'bg-galenic-ok/10 text-galenic-ok'
              : 'bg-galenic-danger/10 text-galenic-danger'
          }`}>
            {feedback.msg}
          </div>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={handleDownload}
            title="Esporta backup (.json)"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-mono text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/60 border border-galenic-border/40 transition-all"
          >
            <Download size={11} />
            Backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importa backup"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-mono text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/60 border border-galenic-border/40 transition-all"
          >
            <Upload size={11} />
            Importa
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-galenic-muted/50 px-1">
          <HardDrive size={9} className={lastSaved ? 'text-galenic-ok/70' : 'text-galenic-muted/30'} />
          <span className="truncate">
            {lastSaved
              ? `Salvato · ${lastSaved.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
              : 'Dati locali'}
          </span>
        </div>
      </div>
    </aside>
  )
}
