import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { STATUS_OPTIONS, getStatusMeta } from '../../utils/statusLifecycle.js'

/**
 * Pill di stato (HubSpot-style).
 *
 * Props:
 *   status:     string - 'draft'|'rd'|'ready'|'archived'
 *   editable:   boolean - se true mostra chevron e apre dropdown al click
 *   onChange:   (newStatus: string) => void - chiamato al click di un'opzione
 *   size:       'xs'|'sm' - default 'sm'
 */
export default function StatusBadge({ status, editable = false, onChange, size = 'sm' }) {
  const meta = getStatusMeta(status)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Chiudi dropdown su click esterno
  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const sizeCls = size === 'xs'
    ? 'text-xs px-1.5 py-0.5 gap-1'
    : 'text-xs px-2 py-1 gap-1.5'

  if (!editable) {
    return (
      <span className={`inline-flex items-center font-mono font-medium border rounded-full ${sizeCls} ${meta.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
    )
  }

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={`inline-flex items-center font-mono font-medium border rounded-full hover:opacity-80 transition-opacity ${sizeCls} ${meta.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
        <ChevronDown size={9} className="opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-[160px] bg-galenic-surface border border-galenic-border rounded-lg shadow-lg overflow-hidden">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={(e) => {
                e.stopPropagation()
                onChange?.(opt.key)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-mono hover:bg-galenic-elevated transition-colors"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.dot} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-galenic-primary">{opt.label}</div>
                <div className="text-xs text-galenic-muted/60 truncate">{opt.desc}</div>
              </div>
              {status === opt.key && <Check size={10} className="text-galenic-accent shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
