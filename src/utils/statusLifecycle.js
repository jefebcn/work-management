/**
 * Status lifecycle (HubSpot-style).
 * Sostituisce il vecchio binario draft|finalized con 4 stati colorati.
 */
export const STATUS_OPTIONS = [
  {
    key:    'draft',
    label:  'Draft',
    desc:   'Bozza appena iniziata',
    color:  'text-galenic-muted bg-galenic-elevated border-galenic-border',
    dot:    'bg-galenic-muted/60',
  },
  {
    key:    'rd',
    label:  'R&D',
    desc:   'In bilanciamento o test',
    color:  'text-blue-300 bg-blue-500/10 border-blue-500/30',
    dot:    'bg-blue-400',
  },
  {
    key:    'ready',
    label:  'Ready',
    desc:   'Pronta per produzione',
    color:  'text-galenic-ok bg-galenic-ok/10 border-galenic-ok/30',
    dot:    'bg-galenic-ok',
  },
  {
    key:    'archived',
    label:  'Archived',
    desc:   'Versione archiviata o sospesa',
    color:  'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
    dot:    'bg-yellow-400',
  },
]

export const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.key, s]))

/**
 * Migra il vecchio status binario al nuovo lifecycle.
 *  'finalized' → 'ready'
 *  altro/null  → 'draft'
 */
export function migrateStatus(oldStatus) {
  if (oldStatus === 'finalized' || oldStatus === 'ready') return 'ready'
  if (oldStatus === 'rd' || oldStatus === 'archived')     return oldStatus
  return 'draft'
}

export function getStatusMeta(status) {
  return STATUS_MAP[status] || STATUS_MAP.draft
}
