export function generateId(prefix = '') {
  const uuid = crypto.randomUUID()
  return prefix ? `${prefix}_${uuid}` : uuid
}
