import React, { createContext, useContext, useState } from 'react'
import { useInventory } from '../hooks/useInventory.js'
import { usePackaging } from '../hooks/usePackaging.js'
import { useFormula } from '../hooks/useFormula.js'
import { useAuth } from './AuthContext.jsx'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [currentModule, setCurrentModule] = useState('inventory')

  const inventory      = useInventory(userId)
  const packagingStore = usePackaging(userId)
  const formulaStore   = useFormula(inventory.rawMaterials, packagingStore.packaging, userId)

  function importBackup({ rawMaterials, packaging, formulas }) {
    inventory.replaceRawMaterials(rawMaterials)
    packagingStore.replacePackaging(packaging)
    formulaStore.replaceFormulas(formulas)
  }

  const value = {
    // Module routing
    currentModule,
    setCurrentModule,

    // Auth (exposed for convenience, e.g. Sidebar)
    user,

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
    autoSaving:         formulaStore.autoSaving,

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
    setIngredientFiller:     formulaStore.setIngredientFiller,
    setPackagingId:          formulaStore.setPackagingId,
    createSnapshot:          formulaStore.createSnapshot,

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
