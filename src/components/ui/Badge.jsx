import React from 'react'

const variantClasses = {
  warning: 'bg-galenic-danger bg-opacity-15 text-galenic-danger border border-galenic-danger border-opacity-30',
  ok:      'bg-galenic-ok bg-opacity-15 text-galenic-ok border border-galenic-ok border-opacity-30',
  neutral: 'bg-galenic-elevated text-galenic-muted border border-galenic-border',
  accent:  'bg-galenic-accent bg-opacity-15 text-galenic-accent border border-galenic-accent border-opacity-30',
  caution: 'bg-galenic-warning bg-opacity-15 text-galenic-warning border border-galenic-warning border-opacity-30',
}

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium',
        variantClasses[variant] || variantClasses.neutral,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
