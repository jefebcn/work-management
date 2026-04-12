/**
 * Returns an error string or null if valid.
 * pH valid range for pharmaceutical liquids: 3.5 – 4.5
 */
export function validatePH(value) {
  if (value === '' || value === null || value === undefined) return null // optional field
  const n = parseFloat(value)
  if (isNaN(n)) return 'pH must be a number'
  if (n < 3.5 || n > 4.5) return 'pH must be between 3.5 and 4.5'
  return null
}

/**
 * Returns an error string or null if valid.
 */
export function validatePositiveNumber(value, fieldName = 'Value') {
  if (value === '' || value === null || value === undefined) return `${fieldName} is required`
  const n = parseFloat(value)
  if (isNaN(n)) return `${fieldName} must be a number`
  if (n < 0) return `${fieldName} must be positive`
  return null
}

/**
 * Returns an error string or null if valid.
 * Percent range 0–100.
 */
export function validatePercent(value, fieldName = 'Value') {
  const base = validatePositiveNumber(value, fieldName)
  if (base) return base
  const n = parseFloat(value)
  if (n > 100) return `${fieldName} must be ≤ 100`
  return null
}

/**
 * Returns an error string or null if valid.
 */
export function validateRequired(value, fieldName = 'Field') {
  if (value === '' || value === null || value === undefined) return `${fieldName} is required`
  if (typeof value === 'string' && value.trim() === '') return `${fieldName} is required`
  return null
}
