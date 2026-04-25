/**
 * Encode/decode briefing data to/from a URL-safe base64 string.
 * Compact payload keys keep the code short.
 */

const REQUIRED_FIELDS = ['n', 't', 'm']

export function encodeBriefing(data) {
  const payload = {
    n:  data.name              || '',
    c:  data.clientName        || '',
    t:  data.type              || 'Compresse',
    m:  data.macrothemeId      || '',
    f:  data.format            || '',
    p:  data.packagingRequested|| '',
    tp: data.targetPrice       ?? null,
    b:  data.briefingNotes     || '',
    ts: new Date().toISOString(),
  }
  const json = JSON.stringify(payload)
  // btoa → url-safe (replace +/= characters)
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function decodeBriefing(code) {
  try {
    // Restore standard base64 padding
    const safe = code.replace(/-/g, '+').replace(/_/g, '/')
    const padded = safe + '='.repeat((4 - safe.length % 4) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function validateBriefing(data) {
  const errors = []
  if (!data.name?.trim())         errors.push('Nome Prodotto obbligatorio')
  if (!data.type)                 errors.push('Forma Farmaceutica obbligatoria')
  if (!data.macrothemeId)         errors.push('Macrotema obbligatorio')
  return errors
}
