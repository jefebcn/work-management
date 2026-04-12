import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Tooltip from '../ui/Tooltip.jsx'

export default function FillerToggle({ rowId, isFiller }) {
  const { setIngredientFiller } = useApp()

  return (
    <Tooltip content="Segna come riempitivo: il peso verrà calcolato automaticamente">
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isFiller}
          onChange={() => setIngredientFiller(rowId)}
          className="sr-only"
        />
        <span
          className={[
            'w-4 h-4 border flex items-center justify-center transition-colors',
            isFiller
              ? 'bg-galenic-accent border-galenic-accent'
              : 'bg-galenic-elevated border-galenic-border',
          ].join(' ')}
        >
          {isFiller && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#0d0f14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className={`text-xs font-mono ${isFiller ? 'text-galenic-accent' : 'text-galenic-muted'}`}>
          Fill
        </span>
      </label>
    </Tooltip>
  )
}
