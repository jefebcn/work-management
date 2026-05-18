import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react'

const ICONS = {
  success: <CheckCircle size={14} />,
  error:   <AlertTriangle size={14} />,
  info:    <Info size={14} />,
}

const STYLES = {
  success: 'bg-galenic-ok/10 border-galenic-ok/30 text-galenic-ok',
  error:   'bg-galenic-danger/10 border-galenic-danger/30 text-galenic-danger',
  info:    'bg-galenic-elevated border-galenic-border text-galenic-primary',
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation on mount
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-mono',
        'transition-all duration-300 pointer-events-auto',
        STYLES[toast.type] || STYLES.info,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      <span className="shrink-0 mt-px">{ICONS[toast.type] || ICONS.info}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-px"
      >
        <X size={11} />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}
