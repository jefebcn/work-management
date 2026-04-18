import React from 'react'

const variantClasses = {
  warning: 'bg-galenic-danger/15 text-galenic-danger border border-galenic-danger/30',
  ok:      'bg-galenic-ok/15 text-galenic-ok border border-galenic-ok/30',
  neutral: 'bg-galenic-elevated text-galenic-muted border border-galenic-border',
  accent:  'bg-galenic-accent/15 text-galenic-accent border border-galenic-accent/30',
  caution: 'bg-galenic-warning/15 text-galenic-warning border border-galenic-warning/30',
}

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded-md',
        variantClasses[variant] || variantClasses.neutral,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
