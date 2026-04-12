import React, { useState } from 'react'

export default function WarningBanner({ warnings }) {
  const [dismissed, setDismissed] = useState(false)

  if (!warnings || warnings.length === 0 || dismissed) return null

  return (
    <div className="bg-galenic-warning/8 border border-galenic-warning/30 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-galenic-warning/15 border border-galenic-warning/30 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="14" height="14" className="text-galenic-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-galenic-warning uppercase tracking-wide mb-1.5">
              Avvisi Formula ({warnings.length})
            </div>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs font-mono text-galenic-warning/80">
                  · {w.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-galenic-warning/50 hover:text-galenic-warning transition-colors text-lg leading-none flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-galenic-warning/10"
        >
          ×
        </button>
      </div>
    </div>
  )
}
