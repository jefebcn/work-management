import React from 'react'

export default function BrixInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-galenic-muted font-mono uppercase tracking-wide">
        Gradi Brix (°Bx)
      </label>
      <input
        type="number"
        step="0.1"
        min="0"
        max="100"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="es. 12.5"
        className="w-full bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-sm px-3 py-2 outline-none focus:border-galenic-accent transition-colors placeholder:text-galenic-muted"
      />
      <span className="text-xs text-galenic-muted font-mono">
        Concentrazione zuccheri (% p/p)
      </span>
    </div>
  )
}
