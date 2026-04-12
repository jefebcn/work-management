import React from 'react'

export default function Select({
  label,
  error,
  options = [],
  placeholder,
  id,
  className = '',
  containerClassName = '',
  value,
  onChange,
  ...props
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs text-galenic-muted font-mono uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value ?? ''}
        onChange={onChange}
        className={[
          'bg-galenic-elevated border text-galenic-primary font-mono text-sm',
          'px-3 py-2 outline-none transition-colors cursor-pointer',
          'appearance-none',
          error
            ? 'border-galenic-danger focus:border-galenic-danger'
            : 'border-galenic-border focus:border-galenic-accent',
          className,
        ].join(' ')}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-galenic-danger font-mono">{error}</span>}
    </div>
  )
}
