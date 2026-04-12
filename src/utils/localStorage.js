export function loadFromStorage(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultValue
    return JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // storage full or unavailable — fail silently
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
