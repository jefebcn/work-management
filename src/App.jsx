import React, { useState } from 'react'
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

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ThemeProvider>
  )
}
