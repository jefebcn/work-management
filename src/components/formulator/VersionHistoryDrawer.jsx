import React from 'react'
import { X, History, GitCompare, ExternalLink, Trash2, Folder } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge.jsx'

/**
 * Slide-over panel destra che mostra la cronologia versioni di un gruppo prodotto.
 * Stile HubSpot (timeline activity).
 *
 * Props:
 *   group: { groupId, latest, versions: [...] } | null
 *   compareSelection: array di formula IDs
 *   onToggleCompare, onClose, onOpen, onDelete, onCompareSelected
 *   macrothemes: per visualizzare nome macrotema
 */
export default function VersionHistoryDrawer({
  group, compareSelection, onToggleCompare,
  onClose, onOpen, onDelete, onCompareSelected, macrothemes,
}) {
  if (!group) return null

  const macro = macrothemes?.find(m => m.id === group.latest.macrothemeId)
  const selectedInGroup = group.versions.filter(v => compareSelection.includes(v.id)).length

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-galenic-surface border-l border-galenic-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="px-5 py-4 border-b border-galenic-border shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-mono text-galenic-muted/60 mb-1">
                <History size={11} />
                Cronologia versioni
              </div>
              <h3 className="text-base font-semibold text-galenic-primary truncate">
                {group.latest.name}
              </h3>
              {macro && (
                <div className="flex items-center gap-1 text-xs font-mono text-galenic-muted/60 mt-1">
                  <Folder size={10} />
                  {macro.name}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-all shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-galenic-border/60">
            <div className="text-xs font-mono text-galenic-muted/70">
              {group.versions.length} {group.versions.length === 1 ? 'versione' : 'versioni'}
            </div>
            {selectedInGroup === 2 && (
              <button
                onClick={onCompareSelected}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-galenic-accent text-galenic-surface hover:opacity-90 transition-opacity"
              >
                <GitCompare size={10} />
                Confronta
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3 top-3 bottom-3 w-px bg-galenic-border/60" />

            <div className="space-y-3">
              {group.versions.map((v, idx) => {
                const isSelected = compareSelection.includes(v.id)
                const isLatest = idx === 0
                return (
                  <div key={v.id} className="relative pl-8">
                    {/* Dot */}
                    <div className={[
                      'absolute left-1.5 top-3 w-3 h-3 rounded-full border-2',
                      isLatest
                        ? 'bg-galenic-accent border-galenic-accent shadow-glow-sm'
                        : 'bg-galenic-surface border-galenic-border',
                    ].join(' ')} />

                    {/* Card */}
                    <div className={[
                      'rounded-lg border p-3 transition-all',
                      isSelected
                        ? 'border-galenic-accent/40 bg-galenic-accent/5'
                        : 'border-galenic-border bg-galenic-elevated/30',
                    ].join(' ')}>

                      {/* Top row: checkbox + version + status */}
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleCompare(v.id)}
                          className="accent-galenic-accent shrink-0"
                          title="Seleziona per confronto"
                        />
                        <span className="text-sm font-semibold text-galenic-accent">
                          {v.versionLabel || `v${v.version}`}
                        </span>
                        {isLatest && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-galenic-accent/10 text-galenic-accent border border-galenic-accent/20">
                            ultima
                          </span>
                        )}
                        <div className="ml-auto">
                          <StatusBadge status={v.status} size="xs" />
                        </div>
                      </div>

                      {/* Note */}
                      {v.versionNote ? (
                        <p className="text-xs font-mono text-galenic-primary/90 italic mb-2 leading-snug">
                          "{v.versionNote}"
                        </p>
                      ) : (
                        <p className="text-xs font-mono text-galenic-muted/40 italic mb-2">
                          — nessuna nota —
                        </p>
                      )}

                      {/* Date */}
                      <div className="text-xs font-mono text-galenic-muted/60 mb-2">
                        {new Date(v.updatedAt).toLocaleString('it-IT', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 pt-2 border-t border-galenic-border/40">
                        <button
                          onClick={() => onOpen(v)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs font-medium text-galenic-accent hover:bg-galenic-accent/10 transition-colors"
                        >
                          <ExternalLink size={10} />
                          Apri
                        </button>
                        <button
                          onClick={() => onDelete(v.id)}
                          title="Elimina"
                          className="flex items-center justify-center px-2 py-1 rounded text-galenic-muted hover:text-galenic-danger hover:bg-galenic-danger/10 transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
