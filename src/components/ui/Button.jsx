import React from 'react'

const variantClasses = {
  primary: 'bg-galenic-accent text-galenic-base hover:bg-opacity-90 border border-galenic-accent',
  ghost:   'bg-transparent text-galenic-primary border border-galenic-border hover:border-galenic-accent hover:text-galenic-accent',
  danger:  'bg-transparent text-galenic-danger border border-galenic-danger hover:bg-galenic-danger hover:text-galenic-base',
  subtle:  'bg-galenic-elevated text-galenic-primary border border-galenic-border hover:border-galenic-accent',
}

const sizeClasses = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-2 font-mono font-medium',
        'transition-all duration-150 cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
