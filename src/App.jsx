import React, { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import TopBar from './components/layout/TopBar.jsx'
import PageWrapper from './components/layout/PageWrapper.jsx'
import DashboardPage from './components/dashboard/DashboardPage.jsx'
import RawMaterialsPage from './components/inventory/RawMaterialsPage.jsx'
import PackagingPage from './components/inventory/PackagingPage.jsx'
import FormulatorPage from './components/formulator/FormulatorPage.jsx'
import BriefingPage from './components/briefing/BriefingPage.jsx'

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
          {currentModule === 'dashboard' && <DashboardPage />}
          {currentModule === 'inventory' && (
            <div className="space-y-8">
              <RawMaterialsPage />
              <PackagingPage />
            </div>
          )}
          {currentModule === 'formulator' && <FormulatorPage />}
          {currentModule === 'briefing'   && <BriefingPage />}
        </PageWrapper>
      </div>
    </div>
  )
}

// Minimal shell for ?mode=commercial — solo BriefingPage, niente sidebar né nav
function CommercialShell() {
  return (
    <div className="min-h-screen bg-galenic-base">
      <div className="h-12 border-b border-galenic-border/60 bg-galenic-surface flex items-center px-6 gap-3 shrink-0">
        <div className="w-7 h-7 bg-galenic-accent/10 border border-galenic-accent/30 rounded-lg flex items-center justify-center">
          <FlaskConical size={14} className="text-galenic-accent" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold text-galenic-primary">Galenic-OS</span>
        <span className="text-xs font-mono text-galenic-muted px-2 py-0.5 rounded-md bg-galenic-elevated border border-galenic-border">
          Briefing Commerciale
        </span>
      </div>
      <div className="px-4 py-8">
        <BriefingPage commercialMode />
      </div>
    </div>
  )
}

const COMMERCIAL_MODE = new URLSearchParams(window.location.search).get('mode') === 'commercial'

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        {COMMERCIAL_MODE ? <CommercialShell /> : <AppShell />}
      </AppProvider>
    </ThemeProvider>
  )
}
