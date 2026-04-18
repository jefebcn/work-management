/**
 * cloudSync.js — Generic Supabase CRUD helpers.
 *
 * Each table has the same shape:
 *   { id TEXT PK, user_id UUID, data JSONB, created_at, updated_at }
 *
 * The full item object is stored inside `data` (JSONB), so the schema
 * is schema-agnostic — any shape of rawMaterial / packaging / formula works.
 */
import { supabase } from './supabase.js'

/**
 * Load all items for a user from a Supabase table.
 * Returns array of item objects (extracted from `data` column).
 */
export async function loadUserData(tableName, userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from(tableName)
    .select('data')
    .eq('user_id', userId)
  if (error) {
    console.error(`[cloudSync] loadUserData(${tableName}):`, error.message)
    return []
  }
  return data.map(row => row.data)
}

/**
 * Upsert (create-or-update) a single item in a Supabase table.
 * Uses the item's `.id` as the primary key.
 * Fire-and-forget: errors are logged but not thrown.
 */
export async function upsertItem(tableName, userId, item) {
  if (!supabase || !userId || !item?.id) return
  const { error } = await supabase
    .from(tableName)
    .upsert(
      { id: item.id, user_id: userId, data: item },
      { onConflict: 'id' },
    )
  if (error) {
    console.error(`[cloudSync] upsertItem(${tableName}, ${item.id}):`, error.message)
  }
}

/**
 * Delete a single item by its ID from a Supabase table.
 * Fire-and-forget.
 */
export async function deleteItem(tableName, itemId) {
  if (!supabase || !itemId) return
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', itemId)
  if (error) {
    console.error(`[cloudSync] deleteItem(${tableName}, ${itemId}):`, error.message)
  }
}

/**
 * Bulk-upsert an array of items.
 * Used for backup restore and first-login seed upload.
 */
export async function bulkUpsert(tableName, userId, items) {
  if (!supabase || !userId || !items?.length) return
  const rows = items.map(item => ({ id: item.id, user_id: userId, data: item }))
  const { error } = await supabase
    .from(tableName)
    .upsert(rows, { onConflict: 'id' })
  if (error) {
    console.error(`[cloudSync] bulkUpsert(${tableName}):`, error.message)
  }
}
