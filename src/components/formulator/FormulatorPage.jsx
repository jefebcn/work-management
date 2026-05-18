import React, { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import MacrothemeSidebar from './MacrothemeSidebar.jsx'
import FormulaList from './FormulaList.jsx'
import FormulaBuilder from './FormulaBuilder.jsx'

export default function FormulatorPage() {
  const { activeFormula, macrothemes } = useApp()
  const [selectedMacroId, setSelectedMacroId] = useState(() => macrothemes[0]?.id ?? null)

  // Keep selection valid as macrothemes change (e.g. after cloud sync)
  useEffect(() => {
    if (!macrothemes.length) return
    if (!selectedMacroId || !macrothemes.find(m => m.id === selectedMacroId)) {
      setSelectedMacroId(macrothemes[0].id)
    }
  }, [macrothemes])

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 items-start">

      {/* Persistent macrotheme sidebar — always visible */}
      <MacrothemeSidebar
        selectedMacroId={selectedMacroId}
        onSelect={setSelectedMacroId}
      />

      {/* Main content area */}
      <div className="min-w-0">
        {activeFormula
          ? <FormulaBuilder />
          : <FormulaList selectedMacroId={selectedMacroId} />
        }
      </div>

    </div>
  )
}
