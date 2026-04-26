/**
 * Thin data-access layer over Supabase.
 * Each table has: id (text PK), user_id (uuid), data (jsonb), updated_at.
 * The full app object is stored in `data`; `id` is duplicated as a column for
 * indexed lookups and RLS.
 */
import { supabase } from './supabase.js'

// Returns array of app objects (the `data` column), empty array on error / no cloud
export async function dbLoadAll(table, userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase
    .from(table)
    .select('data')
    .eq('user_id', userId)
    .order('updated_at', { ascending: true })

  if (error) { console.error(`dbLoadAll(${table}):`, error.message); return null }
  return (data || []).map(row => row.data)
}

// Upsert one item. Returns true on success.
export async function dbUpsert(table, userId, item) {
  if (!supabase || !userId || !item?.id) return false
  const { error } = await supabase
    .from(table)
    .upsert(
      { id: item.id, user_id: userId, data: item, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
  if (error) console.error(`dbUpsert(${table}):`, error.message)
  return !error
}

// Upsert many items in one call. Returns true on success.
export async function dbUpsertMany(table, userId, items) {
  if (!supabase || !userId || !items?.length) return false
  const now = new Date().toISOString()
  const rows = items.map(item => ({
    id: item.id,
    user_id: userId,
    data: item,
    updated_at: now,
  }))
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) console.error(`dbUpsertMany(${table}):`, error.message)
  return !error
}

// Delete one item by id.
export async function dbDelete(table, userId, id) {
  if (!supabase || !userId || !id) return false
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) console.error(`dbDelete(${table}):`, error.message)
  return !error
}

// ── Briefing Requests ────────────────────────────────────────────

export async function dbCreateBriefingRequest(userId, id, preset = {}) {
  if (!supabase || !userId) return false
  const { error } = await supabase.from('briefing_requests').insert({
    id, user_id: userId, status: 'pending', preset,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  })
  if (error) console.error('dbCreateBriefingRequest:', error.message)
  return !error
}

export async function dbLoadBriefingRequests(userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from('briefing_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('dbLoadBriefingRequests:', error.message); return [] }
  return data || []
}

export async function dbGetBriefingById(id) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('briefing_requests')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single()
  if (error) return null
  return data
}

export async function dbSubmitBriefing(id, formData) {
  if (!supabase) return false
  const { error } = await supabase
    .from('briefing_requests')
    .update({ status: 'completed', form_data: formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
  if (error) { console.error('dbSubmitBriefing:', error.message); return false }
  return true
}

export async function dbDeleteBriefingRequest(id, userId) {
  if (!supabase || !userId) return false
  const { error } = await supabase
    .from('briefing_requests')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) console.error('dbDeleteBriefingRequest:', error.message)
  return !error
}
