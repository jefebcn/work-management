/**
 * Convert a value in any unit to milligrams (canonical internal unit).
 * @param {number} value
 * @param {'mg'|'g'|'kg'} unit
 * @returns {number} value in mg
 */
export function toMg(value, unit) {
  const n = parseFloat(value) || 0
  if (unit === 'mg') return n
  if (unit === 'g')  return n * 1_000
  if (unit === 'kg') return n * 1_000_000
  return n
}

/**
 * Convert milligrams to a display unit.
 * @param {number} valueMg
 * @param {'mg'|'g'|'kg'} unit
 * @returns {number}
 */
export function fromMg(valueMg, unit) {
  if (unit === 'mg') return valueMg
  if (unit === 'g')  return valueMg / 1_000
  if (unit === 'kg') return valueMg / 1_000_000
  return valueMg
}

/**
 * Format a mg value as a human-friendly string in the most appropriate unit.
 * @param {number} valueMg
 * @returns {string} e.g. "500 mg", "1.5 g", "0.5 kg"
 */
export function formatWeight(valueMg) {
  if (valueMg >= 1_000_000) return `${(valueMg / 1_000_000).toFixed(3)} kg`
  if (valueMg >= 1_000)     return `${(valueMg / 1_000).toFixed(3)} g`
  return `${valueMg.toFixed(1)} mg`
}
