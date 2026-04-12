import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

export default function Modal({ isOpen, onClose, title, children, width = 'max-w-2xl' }) {
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-70"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`relative z-10 bg-galenic-surface border border-galenic-border w-full ${width} mx-4 max-h-[90vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-galenic-border">
          <h2 className="text-sm font-mono font-semibold text-galenic-primary uppercase tracking-widest">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-galenic-muted hover:text-galenic-primary transition-colors font-mono text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
