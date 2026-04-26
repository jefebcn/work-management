import React, { useState, useRef, useEffect } from 'react'
import { Menu, Sun, Moon, Plus, ChevronRight, Search, User, LogOut, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const MODULE_LABELS = {
  dashboard:  'Home',
  formulator: 'Progetti',
  inventory:  'Inventario',
}

function ProfileDropdown({ user, cloudEnabled, onClose }) {
  const { signOut } = useAuth()

  async function handleLogout() {
    onClose()
    await signOut()
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-galenic-surface border border-galenic-border rounded-xl shadow-xl z-50 overflow-hidden">
      {/* User info */}
      <div className="px-4 py-3 border-b border-galenic-border bg-galenic-elevated/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-galenic-accent/15 border border-galenic-accent/30 flex items-center justify-center text-galenic-accent font-mono font-bold text-sm uppercase shrink-0">
            {user?.email?.[0] || '?'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-galenic-primary truncate">
              {user?.email || 'Utente locale'}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {cloudEnabled
                ? <><Cloud size={10} className="text-galenic-ok" /><span className="text-xs font-mono text-galenic-ok">Cloud attivo</span></>
                : <><CloudOff size={10} className="text-galenic-muted/60" /><span className="text-xs font-mono text-galenic-muted/60">Solo locale</span></>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="py-1">
        {cloudEnabled && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-mono text-galenic-danger hover:bg-galenic-danger/5 transition-colors"
          >
            <LogOut size={14} />
            Esci dall'account
          </button>
        )}
        {!cloudEnabled && (
          <div className="px-4 py-2.5 text-xs font-mono text-galenic-muted/60 leading-relaxed">
            Aggiungi VITE_SUPABASE_URL e<br />VITE_SUPABASE_ANON_KEY a .env per abilitare il cloud.
          </div>
        )}
      </div>
    </div>
  )
}

export default function TopBar({ onMenuClick, onCommandOpen }) {
  const {
    currentModule, activeFormula,
    macrothemes, newFormula, setCurrentModule,
    saving,
  } = useApp()
  const { user, cloudEnabled } = useAuth()
  const { darkMode, toggleTheme } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

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
                isLast ? 'text-galenic-primary font-medium' : 'text-galenic-muted',
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
        {/* Saving indicator */}
        {saving && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-galenic-muted/70">
            <Loader2 size={11} className="animate-spin" />
            Salvataggio…
          </div>
        )}

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

        {/* Profile button */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className={[
              'w-8 h-8 flex items-center justify-center rounded-full border transition-all',
              profileOpen
                ? 'border-galenic-accent bg-galenic-accent/10 text-galenic-accent'
                : 'border-galenic-border text-galenic-muted hover:border-galenic-accent/50 hover:text-galenic-primary hover:bg-galenic-elevated',
            ].join(' ')}
            title="Profilo e impostazioni"
          >
            {user
              ? <span className="text-xs font-mono font-bold uppercase leading-none">{user.email?.[0]}</span>
              : <User size={14} />
            }
          </button>

          {profileOpen && (
            <ProfileDropdown
              user={user}
              cloudEnabled={cloudEnabled}
              onClose={() => setProfileOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  )
}
