import React, { useState } from 'react'

export default function WarningBanner({ warnings }) {
  const [dismissed, setDismissed] = useState(false)

  if (!warnings || warnings.length === 0 || dismissed) return null

  return (
    <div className="bg-galenic-danger bg-opacity-10 border border-galenic-danger border-opacity-40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <svg
            width="16"
            height="16"
            className="text-galenic-danger flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <div className="text-xs font-mono font-semibold text-galenic-danger uppercase tracking-wide mb-1.5">
              Avvisi Formula ({warnings.length})
            </div>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs font-mono text-galenic-danger opacity-90">
                  • {w.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-galenic-danger opacity-60 hover:opacity-100 transition-opacity font-mono text-lg leading-none flex-shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  )
}
