import { useState, useEffect, useMemo } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { computeFormulaResults } from '../utils/formulaCalculations.js'
import { toMg } from '../utils/weightConversions.js'

export function useFormula(rawMaterials, packaging) {
  const [formulas, setFormulas] = useState(() =>
    loadFromStorage(STORAGE_KEYS.FORMULAS, []),
  )
  const [activeFormula, setActiveFormula] = useState(null)
  const [lastSaved,     setLastSaved]     = useState(null)

  // Persist to localStorage and track last-saved timestamp
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FORMULAS, formulas)
    if (formulas.length > 0) setLastSaved(new Date())
  }, [formulas])

  // Derived computed results — recalculated on every active-formula change
  const computed = useMemo(
    () => computeFormulaResults(activeFormula, rawMaterials, packaging),
    [activeFormula, rawMaterials, packaging],
  )

  // ── Formula list management ────────────────────────────────────────────────

  function saveFormula(formula) {
    const saved = { ...formula, updatedAt: new Date().toISOString() }
    setFormulas(prev => {
      const exists = prev.find(f => f.id === saved.id)
      return exists
        ? prev.map(f => f.id === saved.id ? saved : f)
        : [...prev, saved]
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
      batchSize: 1000,
      markupPercent: 0,
      version: 1,
      parentId: null,
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

      if (field === 'targetWeightDisplayValue') {
        update.targetWeightMg = toMg(value, prev.targetWeightUnit)
        delete update.targetWeightDisplayValue
        return update
      }
      if (field === 'targetWeightUnit') {
        update.targetWeightMg = toMg(prev.targetWeightMg, value)
      }

      return update
    })
  }

  function setTargetWeight(displayValue, unit) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return { ...prev, targetWeightMg: toMg(displayValue, unit), targetWeightUnit: unit }
    })
  }

  // ── Ingredient management ──────────────────────────────────────────────────

  function addIngredient(rawMaterialId) {
    setActiveFormula(prev => {
      if (!prev) return prev
      if (prev.ingredients.find(i => i.rawMaterialId === rawMaterialId)) return prev
      return {
        ...prev,
        ingredients: [
          ...prev.ingredients,
          { rowId: generateId('row'), rawMaterialId, amountMg: 0, isFiller: false, antiCakingPercent: 0 },
        ],
      }
    })
  }

  function addFillerIngredient(rawMaterialId) {
    setActiveFormula(prev => {
      if (!prev) return prev
      const existing = prev.ingredients.find(i => i.rawMaterialId === rawMaterialId)
      if (existing) {
        return {
          ...prev,
          ingredients: prev.ingredients.map(i => ({ ...i, isFiller: i.rowId === existing.rowId })),
        }
      }
      return {
        ...prev,
        ingredients: [
          ...prev.ingredients.map(i => ({ ...i, isFiller: false })),
          { rowId: generateId('row'), rawMaterialId, amountMg: 0, isFiller: true, antiCakingPercent: 0 },
        ],
      }
    })
  }

  function addAntiCakingIngredient(rawMaterialId, antiCakingPercent) {
    setActiveFormula(prev => {
      if (!prev) return prev
      const existing = prev.ingredients.find(i => i.rawMaterialId === rawMaterialId)
      if (existing) {
        return {
          ...prev,
          ingredients: prev.ingredients.map(i =>
            i.rowId === existing.rowId ? { ...i, antiCakingPercent } : i,
          ),
        }
      }
      return {
        ...prev,
        ingredients: [
          ...prev.ingredients,
          {
            rowId: generateId('row'),
            rawMaterialId,
            amountMg: prev.targetWeightMg * (antiCakingPercent / 100),
            isFiller: false,
            antiCakingPercent,
          },
        ],
      }
    })
  }

  function createSnapshot() {
    if (!activeFormula) return
    saveFormula(activeFormula)

    const familyId    = activeFormula.parentId || activeFormula.id
    const allVersions = [...formulas, activeFormula]
      .filter(f => f.id === familyId || f.parentId === familyId)
    const maxVer      = Math.max(1, ...allVersions.map(f => f.version || 1))

    const now      = new Date().toISOString()
    const snapshot = {
      ...activeFormula,
      id:        generateId('frm'),
      version:   maxVer + 1,
      parentId:  familyId,
      status:    'draft',
      createdAt: now,
      updatedAt: now,
    }
    setFormulas(prev => [...prev, snapshot])
    setActiveFormula(snapshot)
  }

  function removeIngredient(rowId) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return { ...prev, ingredients: prev.ingredients.filter(i => i.rowId !== rowId) }
    })
  }

  function setIngredientAmount(rowId, amountMg) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return {
        ...prev,
        ingredients: prev.ingredients.map(i =>
          i.rowId === rowId ? { ...i, amountMg: parseFloat(amountMg) || 0 } : i,
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
    formulas,
    saveFormula,
    deleteFormula,
    replaceFormulas,
    lastSaved,

    activeFormula,
    computed,
    newFormula,
    openFormula,
    resetActiveFormula,
    setFormulaField,
    setTargetWeight,
    addIngredient,
    addFillerIngredient,
    addAntiCakingIngredient,
    removeIngredient,
    setIngredientAmount,
    setIngredientFiller,
    setPackagingId,
    createSnapshot,
  }
}
