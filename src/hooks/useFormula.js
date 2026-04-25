import { useState, useEffect, useMemo, useRef } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { computeFormulaResults } from '../utils/formulaCalculations.js'
import { toMg } from '../utils/weightConversions.js'
import { migrateAllFormulas, nextVersionLabel } from '../utils/formulaMigration.js'
import { suggestMacrothemeId } from '../utils/macrothemeAutoSuggest.js'

export function useFormula(rawMaterials, packaging, macrothemes = []) {
  const [formulas, setFormulas] = useState(() =>
    loadFromStorage(STORAGE_KEYS.FORMULAS, []),
  )
  const [activeFormula, setActiveFormula] = useState(null)
  const [lastSaved,     setLastSaved]     = useState(null)
  const migratedRef = useRef(false)

  // One-shot migrazione al primo render quando macrothemes sono caricati
  useEffect(() => {
    if (migratedRef.current || !macrothemes.length) return
    setFormulas(prev => migrateAllFormulas(prev, macrothemes))
    migratedRef.current = true
  }, [macrothemes])

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

  function newFormula(opts = {}) {
    const now = new Date().toISOString()
    const id = generateId('frm')
    const initialType = opts.type || 'Compresse'
    setActiveFormula({
      id,
      name: opts.name || 'Nuova Formula',
      type: initialType,
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
      // Sistema versioni esteso
      productGroupId: id,
      versionLabel:   'v1.0',
      versionNote:    '',
      // Auto-categorizzazione macrotheme
      macrothemeId:   opts.macrothemeId || suggestMacrothemeId(initialType, macrothemes),
      // Back-compat
      version:  1,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  /** Cambia il macrotheme di una formula salvata */
  function setMacrothemeForFormula(formulaId, macrothemeId) {
    setFormulas(prev =>
      prev.map(f =>
        f.id === formulaId
          ? { ...f, macrothemeId, updatedAt: new Date().toISOString() }
          : f,
      ),
    )
    // Aggiorna anche la sessione attiva se è la formula corrente
    setActiveFormula(prev =>
      prev?.id === formulaId ? { ...prev, macrothemeId } : prev,
    )
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

  /**
   * Crea uno snapshot (nuova versione) della formula attiva.
   * @param {string} note - Nota descrittiva opzionale (es. "+10% Caffeina")
   */
  function createSnapshot(note = '') {
    if (!activeFormula) return null
    saveFormula(activeFormula)

    // Family-id: gruppo prodotto unifica tutte le versioni
    const familyId = activeFormula.productGroupId
                  || activeFormula.parentId
                  || activeFormula.id

    // Trova la versione più alta nella famiglia per generare la prossima label
    const allVersions = [...formulas, activeFormula]
      .filter(f =>
        f.id === familyId ||
        f.parentId === familyId ||
        f.productGroupId === familyId,
      )

    // Determina la prossima version label (es. v1.2 → v1.3)
    const maxLabel = allVersions
      .map(f => f.versionLabel)
      .filter(Boolean)
      .sort()
      .pop() || activeFormula.versionLabel || 'v1.0'

    const newLabel = nextVersionLabel(maxLabel)
    const maxVer   = Math.max(1, ...allVersions.map(f => f.version || 1))

    const now      = new Date().toISOString()
    const snapshot = {
      ...activeFormula,
      id:             generateId('frm'),
      version:        maxVer + 1,
      parentId:       familyId,
      productGroupId: familyId,
      versionLabel:   newLabel,
      versionNote:    (note || '').trim(),
      status:         'draft',
      createdAt:      now,
      updatedAt:      now,
    }
    setFormulas(prev => [...prev, snapshot])
    setActiveFormula(snapshot)
    return snapshot
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
    setMacrothemeForFormula,
  }
}
