import { useState, useEffect, useMemo, useRef } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/localStorage.js'
import { STORAGE_KEYS } from '../utils/storageKeys.js'
import { generateId } from '../utils/idGenerator.js'
import { computeFormulaResults } from '../utils/formulaCalculations.js'
import { toMg } from '../utils/weightConversions.js'
import { migrateAllFormulas, nextVersionLabel } from '../utils/formulaMigration.js'
import { suggestMacrothemeId } from '../utils/macrothemeAutoSuggest.js'
import { dbLoadAll, dbUpsert, dbDelete, dbUpsertMany } from '../lib/db.js'
import { DEFAULT_SOFT_COATING, SYRUP_TEMPLATES } from '../utils/softCoatingCalculations.js'

export function useFormula(rawMaterials, packaging, macrothemes = [], user = null) {
  const [formulas, setFormulas] = useState(() =>
    loadFromStorage(STORAGE_KEYS.FORMULAS, []),
  )
  const [activeFormula, setActiveFormula] = useState(null)
  const [lastSaved,     setLastSaved]     = useState(null)
  const [saving,        setSaving]        = useState(false)
  const migratedRef = useRef(false)

  // One-shot migration at first render when macrothemes are loaded
  useEffect(() => {
    if (migratedRef.current || !macrothemes.length) return
    setFormulas(prev => migrateAllFormulas(prev, macrothemes))
    migratedRef.current = true
  }, [macrothemes])

  // On login: load formulas from cloud
  useEffect(() => {
    if (!user) return
    dbLoadAll('formulas', user.id).then(rows => {
      if (rows === null) return
      if (rows.length > 0) {
        const migrated = migrateAllFormulas(rows, macrothemes)
        setFormulas(migrated)
        saveToStorage(STORAGE_KEYS.FORMULAS, migrated)
      } else {
        // First login — push any existing local formulas up
        const local = loadFromStorage(STORAGE_KEYS.FORMULAS, [])
        if (local.length > 0) {
          const migrated = migrateAllFormulas(local, macrothemes)
          setFormulas(migrated)
          dbUpsertMany('formulas', user.id, migrated)
        }
      }
    })
  }, [user?.id])

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

  async function saveFormula(formula) {
    const saved = { ...formula, updatedAt: new Date().toISOString() }
    setFormulas(prev => {
      const exists = prev.find(f => f.id === saved.id)
      return exists
        ? prev.map(f => f.id === saved.id ? saved : f)
        : [...prev, saved]
    })
    if (user) {
      setSaving(true)
      await dbUpsert('formulas', user.id, saved)
      setSaving(false)
    }
    setLastSaved(new Date())
  }

  function deleteFormula(id) {
    setFormulas(prev => prev.filter(f => f.id !== id))
    if (activeFormula?.id === id) setActiveFormula(null)
    if (user) dbDelete('formulas', user.id, id)
  }

  function replaceFormulas(data) {
    setFormulas(data)
    setActiveFormula(null)
    if (user) dbUpsertMany('formulas', user.id, data)
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
      productGroupId: id,
      versionLabel:   'v1.0',
      versionNote:    '',
      macrothemeId:   opts.macrothemeId || suggestMacrothemeId(initialType, macrothemes),
      clientName:         opts.clientName         || '',
      targetPrice:        opts.targetPrice         ?? null,
      format:             opts.format             || '',
      packagingRequested: opts.packagingRequested || '',
      briefingNotes:      opts.briefingNotes      || '',
      briefingCode:       opts.briefingCode       || '',
      selectedClaims: [],
      softCoating:    initialType === 'Sistemi Gommosi e Coated'
        ? { ...DEFAULT_SOFT_COATING, enabled: true }
        : null,
      version:  1,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  function importBriefing(decoded, rawCode = '') {
    const now = new Date().toISOString()
    const id  = generateId('frm')
    const initialType   = decoded.t || 'Compresse'
    const macrothemeId  = decoded.m || suggestMacrothemeId(initialType, macrothemes)
    const formula = {
      id,
      name:            decoded.n || 'Progetto da Briefing',
      type:            initialType,
      targetWeightMg:  500,
      targetWeightUnit: 'mg',
      ingredients:     [],
      packagingId:     null,
      qtyPerPackMg:    0,
      qtyPerPackUnit:  'g',
      dosiAlGiorno:    1,
      pH:              null,
      brix:            null,
      status:          'draft',
      batchSize:       1000,
      markupPercent:   0,
      productGroupId:  id,
      versionLabel:    'v1.0',
      versionNote:     '',
      macrothemeId,
      clientName:         decoded.c  || '',
      targetPrice:        decoded.tp ?? null,
      format:             decoded.f  || '',
      packagingRequested: decoded.p  || '',
      briefingNotes:      decoded.b  || '',
      briefingCode:       rawCode,
      briefingLocked: {
        type:        !!decoded.t,
        targetPrice: decoded.tp != null,
      },
      selectedClaims: [],
      version:  1,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    }
    setFormulas(prev => [...prev, formula])
    setActiveFormula(formula)
    if (user) dbUpsert('formulas', user.id, formula)
    return formula
  }

  function setMacrothemeForFormula(formulaId, macrothemeId) {
    setFormulas(prev =>
      prev.map(f => {
        if (f.id !== formulaId) return f
        const updated = { ...f, macrothemeId, updatedAt: new Date().toISOString() }
        if (user) dbUpsert('formulas', user.id, updated)
        return updated
      }),
    )
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
          { rowId: generateId('row'), rawMaterialId, amountMg: 0, isFiller: false, antiCakingPercent: 0, coatingLayerId: null },
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
          { rowId: generateId('row'), rawMaterialId, amountMg: 0, isFiller: true, antiCakingPercent: 0, coatingLayerId: null },
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
            coatingLayerId: null,
          },
        ],
      }
    })
  }

  function createSnapshot(note = '') {
    if (!activeFormula) return null
    saveFormula(activeFormula)

    const familyId = activeFormula.productGroupId
                  || activeFormula.parentId
                  || activeFormula.id

    const allVersions = [...formulas, activeFormula]
      .filter(f =>
        f.id === familyId ||
        f.parentId === familyId ||
        f.productGroupId === familyId,
      )

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
    if (user) dbUpsert('formulas', user.id, snapshot)
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

  // Triple-sync: derive amountMg from % of target weight
  function setIngredientPercent(rowId, percent) {
    setActiveFormula(prev => {
      if (!prev) return prev
      const tw = prev.targetWeightMg || 0
      const pct = parseFloat(percent) || 0
      const newAmount = tw > 0 ? (tw * pct) / 100 : 0
      return {
        ...prev,
        ingredients: prev.ingredients.map(i =>
          i.rowId === rowId ? { ...i, amountMg: newAmount } : i,
        ),
      }
    })
  }

  // Triple-sync: derive amountMg from desired active nutrient (per dose)
  // Uses the raw material's purity × titration to back-calculate weight.
  function setIngredientActive(rowId, activeMg) {
    setActiveFormula(prev => {
      if (!prev) return prev
      const ing = prev.ingredients.find(i => i.rowId === rowId)
      if (!ing) return prev
      const rm = rawMaterials.find(r => r.id === ing.rawMaterialId)
      if (!rm) return prev
      const factor = ((rm.purity || 100) / 100) * ((rm.titration || 100) / 100)
      if (factor <= 0) return prev
      const newAmount = (parseFloat(activeMg) || 0) / factor
      return {
        ...prev,
        ingredients: prev.ingredients.map(i =>
          i.rowId === rowId ? { ...i, amountMg: newAmount } : i,
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

  // ── Soft Coating management ────────────────────────────────────────────────

  function updateSoftCoating(fields) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return {
        ...prev,
        softCoating: { ...(prev.softCoating || DEFAULT_SOFT_COATING), ...fields },
      }
    })
  }

  function addCoatingLayer(type = 'coating') {
    setActiveFormula(prev => {
      if (!prev) return prev
      const sc     = prev.softCoating || DEFAULT_SOFT_COATING
      const layers = sc.layers || []
      const count  = layers.filter(l => l.type === type).length + 1
      const tmpl   = SYRUP_TEMPLATES.maltitolo_gomma
      const newLayer = {
        id:   generateId('layer'),
        name: type === 'finishing' ? 'Finishing' : `Coating ${count}`,
        type,
        syrupTemplate:            'maltitolo_gomma',
        targetWeightGainPct:      type === 'finishing' ? 5 : 10,
        processLossOverdosagePct: 7.5,
        ingredients: [
          // Template binder + thickener (4:1 ratio)
          ...tmpl.ingredients.map(i => ({
            ...i,
            id: generateId('li'),
            rawMaterialId: null,
          })),
          // Empty Color slot
          {
            id: generateId('li'),
            name: '',
            role: 'colorante',
            pctInDryFormula:   0,
            dryResiduePercent: 100,
            isActive: false,
            rawMaterialId: null,
            colorHex: null,
          },
          // Empty Aroma slot
          {
            id: generateId('li'),
            name: '',
            role: 'aromatizzante',
            pctInDryFormula:   0,
            dryResiduePercent: 100,
            isActive: false,
            rawMaterialId: null,
          },
        ],
      }
      return { ...prev, softCoating: { ...sc, layers: [...layers, newLayer] } }
    })
  }

  function setIngredientCoatingLayer(rowId, layerId) {
    setActiveFormula(prev => {
      if (!prev) return prev
      return {
        ...prev,
        ingredients: prev.ingredients.map(i =>
          i.rowId === rowId ? { ...i, coatingLayerId: layerId || null } : i,
        ),
      }
    })
  }

  // Converts a Fast Lab prototype into a full Soft-Coating layer atomically.
  // actives = [{ rowId, amountMg }] — each active's desired coating amount.
  function importFastLabPrototype({ coreWeightMg, finalWeightMg, actives }) {
    setActiveFormula(prev => {
      if (!prev) return prev
      const sc         = prev.softCoating || DEFAULT_SOFT_COATING
      const layerId    = generateId('layer')
      const wgPct      = coreWeightMg > 0
        ? Math.max(0, (finalWeightMg - coreWeightMg) / coreWeightMg * 100)
        : 0
      const newLayer = {
        id:                       layerId,
        name:                     'Strato Coating',
        type:                     'coating',
        syrupTemplate:            'custom',
        targetWeightGainPct:      wgPct,
        processLossOverdosagePct: 7.5,
        ingredients: [
          { id: generateId('li'), name: '', role: 'legante',       pctInDryFormula: 0, dryResiduePercent: 100, isActive: false, rawMaterialId: null },
          { id: generateId('li'), name: '', role: 'addensante',    pctInDryFormula: 0, dryResiduePercent: 100, isActive: false, rawMaterialId: null },
          { id: generateId('li'), name: '', role: 'colorante',     pctInDryFormula: 0, dryResiduePercent: 100, isActive: false, rawMaterialId: null, colorHex: null },
          { id: generateId('li'), name: '', role: 'aromatizzante', pctInDryFormula: 0, dryResiduePercent: 100, isActive: false, rawMaterialId: null },
        ],
      }
      const activeMap = new Map(actives.map(a => [a.rowId, a.amountMg]))
      const updatedIngredients = (prev.ingredients || []).map(ing =>
        activeMap.has(ing.rowId)
          ? { ...ing, coatingLayerId: layerId, amountMg: activeMap.get(ing.rowId) }
          : ing,
      )
      return {
        ...prev,
        targetWeightMg: coreWeightMg,
        softCoating:    { ...sc, enabled: true, layers: [...(sc.layers || []), newLayer] },
        ingredients:    updatedIngredients,
      }
    })
  }

  function removeCoatingLayer(layerId) {
    setActiveFormula(prev => {
      if (!prev) return prev
      const sc = prev.softCoating || DEFAULT_SOFT_COATING
      return {
        ...prev,
        softCoating: { ...sc, layers: (sc.layers || []).filter(l => l.id !== layerId) },
      }
    })
  }

  function updateCoatingLayer(layerId, fields) {
    setActiveFormula(prev => {
      if (!prev) return prev
      const sc = prev.softCoating || DEFAULT_SOFT_COATING
      return {
        ...prev,
        softCoating: {
          ...sc,
          layers: (sc.layers || []).map(l => l.id === layerId ? { ...l, ...fields } : l),
        },
      }
    })
  }

  return {
    formulas,
    saveFormula,
    deleteFormula,
    replaceFormulas,
    lastSaved,
    saving,

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
    setIngredientPercent,
    setIngredientActive,
    setIngredientFiller,
    setPackagingId,
    createSnapshot,
    setMacrothemeForFormula,
    importBriefing,

    // Soft Coating
    updateSoftCoating,
    addCoatingLayer,
    removeCoatingLayer,
    updateCoatingLayer,
    setIngredientCoatingLayer,
    importFastLabPrototype,
  }
}
