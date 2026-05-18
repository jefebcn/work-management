import React, { useState, useEffect } from 'react'
import { RefreshCcw, X } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import MacrothemeSidebar from './MacrothemeSidebar.jsx'
import FormulaList from './FormulaList.jsx'
import FormulaBuilder from './FormulaBuilder.jsx'

export default function FormulatorPage() {
  const { activeFormula, macrothemes, draftRecovery, restoreDraft, discardDraft } = useApp()
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

      {/* Draft recovery banner — spans full width */}
      {draftRecovery && (
        <div className="md:col-span-2 flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono">
          <RefreshCcw size={13} className="text-amber-400 shrink-0" />
          <span className="text-galenic-primary flex-1 min-w-0">
            Ho trovato una bozza non salvata —{' '}
            <span className="font-semibold">"{draftRecovery.name}"</span>
            {' '}· {new Date(draftRecovery.updatedAt).toLocaleString('it-IT')}
          </span>
          <button
            onClick={restoreDraft}
            className="text-galenic-accent font-semibold hover:opacity-80 transition-opacity shrink-0"
          >
            Ripristina
          </button>
          <button
            onClick={discardDraft}
            className="text-galenic-muted hover:text-galenic-primary transition-colors shrink-0 ml-1"
          >
            <X size={13} />
          </button>
        </div>
      )}

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
