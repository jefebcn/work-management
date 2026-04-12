import React from 'react'

const variantClasses = {
  primary: 'bg-galenic-accent text-galenic-base border border-galenic-accent hover:bg-opacity-85 shadow-glow-sm hover:shadow-glow font-semibold',
  ghost:   'bg-transparent text-galenic-primary border border-galenic-border hover:border-galenic-accent hover:text-galenic-accent',
  danger:  'bg-transparent text-galenic-danger border border-galenic-danger/60 hover:bg-galenic-danger/10',
  subtle:  'bg-galenic-elevated text-galenic-primary border border-galenic-border hover:border-galenic-accent hover:text-galenic-accent',
}

const sizeClasses = {
  sm: 'px-3 py-1 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-lg',
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
        'inline-flex items-center gap-2 font-medium',
        'transition-all duration-150 cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
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
