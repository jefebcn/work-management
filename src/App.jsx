import React from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import TopBar from './components/layout/TopBar.jsx'
import PageWrapper from './components/layout/PageWrapper.jsx'
import RawMaterialsPage from './components/inventory/RawMaterialsPage.jsx'
import PackagingPage from './components/inventory/PackagingPage.jsx'
import FormulatorPage from './components/formulator/FormulatorPage.jsx'
import StabilityPage from './components/stability/StabilityPage.jsx'

function AppShell() {
  const { currentModule } = useApp()

  return (
    <div className="min-h-screen bg-galenic-base flex">
      <Sidebar />

      {/* Main content area — offset by sidebar width */}
      <div className="flex-1 flex flex-col ml-56 min-h-screen">
        <TopBar />
        <PageWrapper>
          {currentModule === 'inventory' && (
            <div className="space-y-8">
              <RawMaterialsPage />
              <PackagingPage />
            </div>
          )}
          {currentModule === 'formulator' && <FormulatorPage />}
          {currentModule === 'stability' && <StabilityPage />}
        </PageWrapper>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
