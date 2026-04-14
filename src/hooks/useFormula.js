import { useState, useEffect, useRef, useMemo } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { computeFormulaResults } from '../utils/formulaCalculations.js'
import { toMg } from '../utils/weightConversions.js'
import { loadUserData, upsertItem, deleteItem } from '../lib/cloudSync.js'

export function useFormula(rawMaterials, packaging, userId = null) {
  const [formulas, setFormulas] = useState(() =>
    loadFromStorage(STORAGE_KEYS.FORMULAS, []),
  )
  const [activeFormula, setActiveFormula] = useState(null)
  const [autoSaving,    setAutoSaving]    = useState(false)

  const autoSaveTimer = useRef(null)

  // ── localStorage sync ─────────────────────────────────────────────────────
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FORMULAS, formulas)
  }, [formulas])

  // ── Cloud sync: load all formulas on login ────────────────────────────────
  useEffect(() => {
    if (!userId) return
    let active = true
    async function loadCloud() {
      const items = await loadUserData('formulas', userId)
      if (!active) return
      if (items.length > 0) {
        setFormulas(items)
        setActiveFormula(null)  // reset any in-memory session
      }
    }
    loadCloud()
    return () => { active = false }
  }, [userId])

  // ── Auto-save active formula to cloud (debounced 2 s) ────────────────────
  // Saves to Supabase AND keeps formulas[] list in sync.
  useEffect(() => {
    if (!activeFormula || !userId) return

    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaving(true)
      const saved = { ...activeFormula, updatedAt: new Date().toISOString() }
      await upsertItem('formulas', userId, saved)
      setFormulas(prev => {
        const exists = prev.find(f => f.id === saved.id)
        if (exists) return prev.map(f => f.id === saved.id ? saved : f)
        return [...prev, saved]
      })
      setAutoSaving(false)
    }, 2000)

    return () => clearTimeout(autoSaveTimer.current)
  }, [activeFormula, userId])

  // ── Derived computed results ───────────────────────────────────────────────
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
    if (userId) upsertItem('formulas', userId, saved)
  }

  function deleteFormula(id) {
    setFormulas(prev => prev.filter(f => f.id !== id))
    if (activeFormula?.id === id) setActiveFormula(null)
    if (userId) deleteItem('formulas', id)
  }

  function replaceFormulas(data) {
    setFormulas(data)
    setActiveFormula(null)
    // Note: bulk upsert handled by importBackup via AppContext; no cloud sync here
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
    clearTimeout(autoSaveTimer.current)
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
    if (userId) upsertItem('formulas', userId, snapshot)
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
    // Formula list
    formulas,
    saveFormula,
    deleteFormula,
    replaceFormulas,
    autoSaving,

    // Active builder session
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
