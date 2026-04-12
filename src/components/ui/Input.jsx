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
        <label htmlFor={inputId} className="text-xs text-galenic-muted font-mono uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'bg-galenic-elevated border text-galenic-primary font-mono text-sm',
          'px-3 py-2 outline-none transition-colors',
          'placeholder:text-galenic-muted',
          error
            ? 'border-galenic-danger focus:border-galenic-danger'
            : 'border-galenic-border focus:border-galenic-accent',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <span className="text-xs text-galenic-danger font-mono">{error}</span>}
      {hint && !error && <span className="text-xs text-galenic-muted font-mono">{hint}</span>}
    </div>
  )
}
