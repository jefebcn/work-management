import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useInventory } from '../hooks/useInventory.js'
import { usePackaging } from '../hooks/usePackaging.js'
import { useFormula } from '../hooks/useFormula.js'
import { useMacrothemes } from '../hooks/useMacrothemes.js'
import { useAuth } from './AuthContext.jsx'
import { dbLoadBriefingRequests } from '../lib/db.js'
import { supabase } from '../lib/supabase.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user, cloudEnabled } = useAuth()
  const [currentModule, setCurrentModule] = useState('dashboard')
  const [newBriefingsCount, setNewBriefingsCount] = useState(0)

  // ── Toast notifications ────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Load completed briefings count + subscribe to Realtime for badge
  useEffect(() => {
    if (!user?.id || !cloudEnabled || !supabase) return
    let cancelled = false
    dbLoadBriefingRequests(user.id).then(rows => {
      if (!cancelled) setNewBriefingsCount(rows.filter(r => r.status === 'completed').length)
    })
    const channel = supabase
      .channel(`briefing_cnt_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'briefing_requests',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new.status === 'completed' && payload.old.status === 'pending') {
          setNewBriefingsCount(prev => prev + 1)
        }
      })
      .subscribe()
    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [user?.id, cloudEnabled])

  function decrementNewBriefingsCount() {
    setNewBriefingsCount(prev => Math.max(0, prev - 1))
  }

  const inventory       = useInventory(user)
  const packagingStore  = usePackaging(user)
  const macrothemeStore = useMacrothemes(user)
  const formulaStore    = useFormula(
    inventory.rawMaterials,
    packagingStore.packaging,
    macrothemeStore.macrothemes,
    user,
    addToast,
  )

  function importBackup({ rawMaterials, packaging, formulas }) {
    inventory.replaceRawMaterials(rawMaterials)
    packagingStore.replacePackaging(packaging)
    formulaStore.replaceFormulas(formulas)
  }

  const value = {
    // Module routing
    currentModule,
    setCurrentModule,

    // Inventory
    rawMaterials:       inventory.rawMaterials,
    addRawMaterial:     inventory.addRawMaterial,
    updateRawMaterial:  inventory.updateRawMaterial,
    deleteRawMaterial:  inventory.deleteRawMaterial,

    // Packaging
    packaging:          packagingStore.packaging,
    addPackaging:       packagingStore.addPackaging,
    updatePackaging:    packagingStore.updatePackaging,
    deletePackaging:    packagingStore.deletePackaging,

    // Formula list
    formulas:           formulaStore.formulas,
    saveFormula:        formulaStore.saveFormula,
    deleteFormula:      formulaStore.deleteFormula,
    lastSaved:          formulaStore.lastSaved,
    saving:             formulaStore.saving,
    draftRecovery:      formulaStore.draftRecovery,
    restoreDraft:       formulaStore.restoreDraft,
    discardDraft:       formulaStore.discardDraft,

    // Active builder session
    activeFormula:           formulaStore.activeFormula,
    computed:                formulaStore.computed,
    newFormula:              formulaStore.newFormula,
    openFormula:             formulaStore.openFormula,
    resetActiveFormula:      formulaStore.resetActiveFormula,
    setFormulaField:         formulaStore.setFormulaField,
    setTargetWeight:         formulaStore.setTargetWeight,
    addIngredient:           formulaStore.addIngredient,
    addFillerIngredient:     formulaStore.addFillerIngredient,
    addAntiCakingIngredient: formulaStore.addAntiCakingIngredient,
    removeIngredient:        formulaStore.removeIngredient,
    setIngredientAmount:     formulaStore.setIngredientAmount,
    setIngredientPercent:    formulaStore.setIngredientPercent,
    setIngredientActive:     formulaStore.setIngredientActive,
    setIngredientFiller:     formulaStore.setIngredientFiller,
    setPackagingId:          formulaStore.setPackagingId,
    createSnapshot:          formulaStore.createSnapshot,
    setMacrothemeForFormula: formulaStore.setMacrothemeForFormula,
    importBriefing:          formulaStore.importBriefing,

    // Soft Coating
    updateSoftCoating:          formulaStore.updateSoftCoating,
    addCoatingLayer:            formulaStore.addCoatingLayer,
    removeCoatingLayer:         formulaStore.removeCoatingLayer,
    updateCoatingLayer:         formulaStore.updateCoatingLayer,
    setIngredientCoatingLayer:  formulaStore.setIngredientCoatingLayer,
    importFastLabPrototype:     formulaStore.importFastLabPrototype,
    importRecipeFormula:        formulaStore.importRecipeFormula,

    // Macrothemes
    macrothemes:        macrothemeStore.macrothemes,
    addMacrotheme:      macrothemeStore.addMacrotheme,
    updateMacrotheme:   macrothemeStore.updateMacrotheme,
    deleteMacrotheme:   macrothemeStore.deleteMacrotheme,

    // Briefing badge
    newBriefingsCount,
    decrementNewBriefingsCount,

    // Toast notifications
    toasts,
    addToast,
    removeToast,

    // Backup / restore
    importBackup,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
