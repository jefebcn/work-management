import React from 'react'

export default function Input({
  label,
  error,
  hint,
  id,
  className = '',
  containerClassName = '',
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs text-galenic-muted uppercase tracking-wide font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'bg-galenic-elevated border text-galenic-primary font-mono text-sm',
          'px-3 py-2 rounded-lg outline-none transition-colors',
          'placeholder:text-galenic-muted/50',
          error
            ? 'border-galenic-danger focus:border-galenic-danger focus:galenic-glow'
            : 'border-galenic-border focus:border-galenic-accent focus:shadow-glow-sm',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <span className="text-xs text-galenic-danger">{error}</span>}
      {hint && !error && <span className="text-xs text-galenic-muted">{hint}</span>}
    </div>
  )
}
