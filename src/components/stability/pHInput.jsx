import React, { useState } from 'react'
import { validatePH } from '../../utils/validators.js'

export default function PHInput({ value, onChange }) {
  const [touched, setTouched] = useState(false)
  const error = touched ? validatePH(value) : null

  // Visual indicator for pH range
  let rangeColor = 'text-galenic-muted'
  let rangeLabel = ''
  if (value !== '' && value !== null) {
    const n = parseFloat(value)
    if (!isNaN(n)) {
      if (n < 3.5) { rangeColor = 'text-galenic-danger'; rangeLabel = 'Troppo acido' }
      else if (n > 4.5) { rangeColor = 'text-galenic-danger'; rangeLabel = 'Troppo basico' }
      else { rangeColor = 'text-galenic-ok'; rangeLabel = 'Nel range' }
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-galenic-muted font-mono uppercase tracking-wide">
        pH — Range valido: 3.5 – 4.5
      </label>
      <div className="relative">
        <input
          type="number"
          step="0.01"
          min="0"
          max="14"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="es. 4.0"
          className={[
            'w-full bg-galenic-elevated border text-galenic-primary font-mono text-sm',
            'px-3 py-2 outline-none transition-colors pr-24',
            'placeholder:text-galenic-muted',
            error
              ? 'border-galenic-danger focus:border-galenic-danger'
              : 'border-galenic-border focus:border-galenic-accent',
          ].join(' ')}
        />
        {rangeLabel && (
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono ${rangeColor}`}>
            {rangeLabel}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-galenic-danger font-mono">{error}</span>}
      {/* pH scale bar */}
      {value !== '' && !isNaN(parseFloat(value)) && (
        <div className="mt-1 h-1 bg-galenic-elevated overflow-hidden relative">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-galenic-danger via-galenic-ok to-galenic-danger"
            style={{ width: `${(parseFloat(value) / 14) * 100}%` }}
          />
          {/* Range markers */}
          <div className="absolute top-0 h-full w-px bg-galenic-ok opacity-60" style={{ left: `${(3.5 / 14) * 100}%` }} />
          <div className="absolute top-0 h-full w-px bg-galenic-ok opacity-60" style={{ left: `${(4.5 / 14) * 100}%` }} />
        </div>
      )}
    </div>
  )
}
