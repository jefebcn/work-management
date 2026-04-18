import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { AppProvider, useApp } from './context/AppContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import Sidebar from './components/layout/Sidebar.jsx'
import TopBar from './components/layout/TopBar.jsx'
import PageWrapper from './components/layout/PageWrapper.jsx'
import AuthPage from './components/auth/AuthPage.jsx'
import RawMaterialsPage from './components/inventory/RawMaterialsPage.jsx'
import PackagingPage from './components/inventory/PackagingPage.jsx'
import FormulatorPage from './components/formulator/FormulatorPage.jsx'
import { FlaskConical } from 'lucide-react'

// ── Setup guard ───────────────────────────────────────────────────────────────
function ConfigurationRequired() {
  return (
    <div className="min-h-screen bg-galenic-base flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-galenic-surface border border-galenic-border rounded-2xl p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-galenic-accent/10 border border-galenic-accent/30 rounded-2xl mb-2">
          <FlaskConical size={26} className="text-galenic-accent" strokeWidth={2} />
        </div>
        <h1 className="text-lg font-semibold text-galenic-primary">Configurazione richiesta</h1>
        <p className="text-sm text-galenic-muted leading-relaxed">
          Crea un file <code className="bg-galenic-elevated px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> nella
          radice del progetto con le credenziali Supabase:
        </p>
        <pre className="text-left bg-galenic-elevated border border-galenic-border rounded-lg p-4 text-xs font-mono text-galenic-primary whitespace-pre-wrap">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="text-xs text-galenic-muted/60">
          Ottieni le chiavi da: <span className="font-mono">supabase.com/dashboard → Settings → API</span>
        </p>
        <p className="text-xs text-galenic-muted/60">
          Poi esegui lo schema SQL da <code className="font-mono">supabase/schema.sql</code> nel SQL Editor del tuo progetto.
        </p>
      </div>
    </div>
  )
}

// ── Loading screen ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-galenic-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-galenic-border border-t-galenic-accent rounded-full animate-spin" />
        <div className="text-xs font-mono text-galenic-muted">Caricamento...</div>
      </div>
    </div>
  )
}

// ── Main app shell (requires auth) ────────────────────────────────────────────
function AppShell() {
  const { currentModule } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-galenic-base flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col md:ml-56 min-h-screen min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <PageWrapper>
          {currentModule === 'inventory' && (
            <div className="space-y-8">
              <RawMaterialsPage />
              <PackagingPage />
            </div>
          )}
          {currentModule === 'formulator' && <FormulatorPage />}
        </PageWrapper>
      </div>
    </div>
  )
}

// ── Auth guard: shows login page when not authenticated ───────────────────────
function AppRoot() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user)   return <AuthPage />

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  if (!isSupabaseConfigured) return (
    <ThemeProvider>
      <ConfigurationRequired />
    </ThemeProvider>
  )

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </ThemeProvider>
  )
}
