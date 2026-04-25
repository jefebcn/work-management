import React, { createContext, useContext, useState } from 'react'
import { useInventory } from '../hooks/useInventory.js'
import { usePackaging } from '../hooks/usePackaging.js'
import { useFormula } from '../hooks/useFormula.js'
import { useMacrothemes } from '../hooks/useMacrothemes.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentModule, setCurrentModule] = useState('dashboard')

  const inventory       = useInventory()
  const packagingStore  = usePackaging()
  const macrothemeStore = useMacrothemes()
  const formulaStore    = useFormula(
    inventory.rawMaterials,
    packagingStore.packaging,
    macrothemeStore.macrothemes,
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
    setMacrothemeForFormula: formulaStore.setMacrothemeForFormula,

    // Macrothemes
    macrothemes:        macrothemeStore.macrothemes,
    addMacrotheme:      macrothemeStore.addMacrotheme,
    updateMacrotheme:   macrothemeStore.updateMacrotheme,
    deleteMacrotheme:   macrothemeStore.deleteMacrotheme,

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
