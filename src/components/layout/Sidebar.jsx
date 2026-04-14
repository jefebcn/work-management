import React, { useRef, useState } from 'react'
import { Package, FlaskConical, ShieldCheck, Download, Upload, LogOut, Cloud, Loader } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { downloadBackup, parseBackup, mergeBackup } from '../../utils/backupRestore.js'

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
  const { currentModule, setCurrentModule, formulas, rawMaterials, packaging, importBackup, autoSaving } = useApp()
  const { user, signOut } = useAuth()

  const fileInputRef = useRef(null)
  const [feedback,   setFeedback]   = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  function navigate(id) {
    setCurrentModule(id)
    onClose()
  }

  function handleDownload() {
    downloadBackup()
  }

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

  async function handleSignOut() {
    setLoggingOut(true)
    try { await signOut() } catch { /* ignore */ }
    setLoggingOut(false)
  }

  // Avatar letter: first char of email
  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? '?'

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
      <div className="px-4 py-4 border-t border-galenic-border/60 space-y-2">

        {/* Auto-save indicator */}
        {autoSaving && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-galenic-muted/60 px-1">
            <Loader size={10} className="animate-spin" />
            Salvataggio cloud…
          </div>
        )}

        {/* Feedback message */}
        {feedback && (
          <div className={`text-xs font-mono px-2 py-1.5 rounded-md leading-snug ${
            feedback.type === 'ok'
              ? 'bg-galenic-ok/10 text-galenic-ok'
              : 'bg-galenic-danger/10 text-galenic-danger'
          }`}>
            {feedback.msg}
          </div>
        )}

        {/* Backup / Restore */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            title="Scarica backup (.json)"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/60 border border-galenic-border/50 transition-all"
          >
            <Download size={12} />
            Backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Ripristina da backup"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated/60 border border-galenic-border/50 transition-all"
          >
            <Upload size={12} />
            Ripristina
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-2 pt-1">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-galenic-accent/20 border border-galenic-accent/30 flex items-center justify-center text-xs font-bold text-galenic-accent shrink-0">
              {avatarLetter}
            </div>
            {/* Email */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-galenic-primary truncate leading-snug">
                {user.email}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Cloud size={9} className="text-galenic-ok shrink-0" />
                <span className="text-xs font-mono text-galenic-muted/50">sincronizzato</span>
              </div>
            </div>
            {/* Logout */}
            <button
              onClick={handleSignOut}
              disabled={loggingOut}
              title="Esci"
              className="shrink-0 p-1.5 rounded-lg text-galenic-muted hover:text-galenic-danger hover:bg-galenic-danger/10 transition-all disabled:opacity-40"
            >
              {loggingOut
                ? <Loader size={13} className="animate-spin" />
                : <LogOut size={13} />
              }
            </button>
          </div>
        )}

        <div className="text-xs text-galenic-muted/30 font-mono">
          Pharmaceutical Formulator
        </div>
      </div>
    </aside>
  )
}
