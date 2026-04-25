/**
 * Suggerisce il macrotheme corretto per una formula in base alla sua forma.
 * Cerca un macrotheme `auto` con `formType === formulaType`.
 * Se non trovato, restituisce il primo macrotheme disponibile (fallback).
 */
export function suggestMacrothemeId(formulaType, macrothemes) {
  if (!formulaType || !macrothemes?.length) return null
  const auto = macrothemes.find(m => m.kind === 'auto' && m.formType === formulaType)
  return auto?.id ?? macrothemes[0]?.id ?? null
}
