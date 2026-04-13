import { useState, useEffect, useMemo } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { computeFormulaResults } from '../utils/formulaCalculations.js'
import { toMg } from '../utils/weightConversions.js'

export function useFormula(rawMaterials, packaging) {
  // Persisted list of all saved formulas
  const [formulas, setFormulas] = useState(() =>
    loadFromStorage(STORAGE_KEYS.FORMULAS, [])
  )

  // Active formula being edited (not persisted until saveFormula is called)
  const [activeFormula, setActiveFormula] = useState(null)

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FORMULAS, formulas)
  }, [formulas])

  // Derived computed results — recalculated on every change
  const computed = useMemo(
    () => computeFormulaResults(activeFormula, rawMaterials, packaging),
    [activeFormula, rawMaterials, packaging]
  )

  // ── Formula list management ────────────────────────────────────────────────

  function saveFormula(formula) {
    setFormulas(prev => {
      const exists = prev.find(f => f.id === formula.id)
      if (exists) {
        return prev.map(f =>
          f.id === formula.id
            ? { ...formula, updatedAt: new Date().toISOString() }
            : f
        )
      }
      return [...prev, { ...formula, updatedAt: new Date().toISOString() }]
    })
  }

  function deleteFormula(id) {
    setFormulas(prev => prev.filter(f => f.id !== id))
    if (activeFormula?.id === id) setActiveFormula(null)
  }

  function replaceFormulas(data) {
    setFormulas(data)
    setActiveFormula(null)
  }

  // ── Active formula session ─────────────────────────────────────────────────

  function newFormula() {
    const now = new Date().toISOString()
    setActiveFormula({
      id: generateId('frm'),
      name: 'Nuova Formula',
      type: 'Compresse',
      targetWeightMg: 500,
      targetWeightUnit: 'mg',
      ingredients: [],
      packagingId: null,
      qtyPerPackMg: 0,
      qtyPerPackUnit: 'g',
      dosiAlGiorno: 1,
      pH: null,
      brix: null,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
  }

  function openFormula(formula) {
    setActiveFormula({ ...formula })
  }

  function resetActiveFormula() {
    setActiveFormula(null)
  }

  function setFormulaField(field, value) {
    setActiveFormula(prev => {
      if (!prev) return prev
      const update = { ...prev, [field]: value }

      // When target weight changes, also update canonical mg
      if (field === 'targetWeightDisplayValue') {
        update.targetWeightMg = toMg(value, prev.targetWeightUnit)
        delete update.targetWeightDisplayValue
        return update
      }
      if (field === 'targetWeightUnit') {
        // Re-convert display value to mg when unit changes
        const currentDisplay = prev.targetWeightMg
          ? prev.targetWeightMg
          : 0
        update.targetWeightMg = toMg(currentDisplay, value)
      }

      return update
    })
  }

  function setTargetWeight(displayValue, unit) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return {
        ...prev,
        targetWeightMg: toMg(displayValue, unit),
        targetWeightUnit: unit,
      }
    })
  }

  // ── Ingredient management ──────────────────────────────────────────────────

  function addIngredient(rawMaterialId) {
    setActiveFormula(prev => {
      if (!prev) return prev
      // Prevent duplicates
      if (prev.ingredients.find(i => i.rawMaterialId === rawMaterialId)) return prev
      const newRow = {
        rowId: generateId('row'),
        rawMaterialId,
        amountMg: 0,
        isFiller: false,
      }
      return { ...prev, ingredients: [...prev.ingredients, newRow] }
    })
  }

  function removeIngredient(rowId) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return {
        ...prev,
        ingredients: prev.ingredients.filter(i => i.rowId !== rowId),
      }
    })
  }

  function setIngredientAmount(rowId, amountMg) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return {
        ...prev,
        ingredients: prev.ingredients.map(i =>
          i.rowId === rowId ? { ...i, amountMg: parseFloat(amountMg) || 0 } : i
        ),
      }
    })
  }

  function setIngredientFiller(rowId) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return {
        ...prev,
        ingredients: prev.ingredients.map(i => ({
          ...i,
          isFiller: i.rowId === rowId ? !i.isFiller : false,
        })),
      }
    })
  }

  function setPackagingId(packagingId) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return { ...prev, packagingId }
    })
  }

  return {
    // Formula list
    formulas,
    saveFormula,
    deleteFormula,
    replaceFormulas,

    // Active builder session
    activeFormula,
    computed,
    newFormula,
    openFormula,
    resetActiveFormula,
    setFormulaField,
    setTargetWeight,
    addIngredient,
    removeIngredient,
    setIngredientAmount,
    setIngredientFiller,
    setPackagingId,
  }
}
