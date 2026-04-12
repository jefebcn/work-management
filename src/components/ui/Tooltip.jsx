import React, { useState } from 'react'

export default function Tooltip({ children, content, position = 'top' }) {
  const [visible, setVisible] = useState(false)

  const posClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <span
          className={`absolute z-50 pointer-events-none ${posClasses[position] || posClasses.top}`}
        >
          <span className="bg-galenic-elevated border border-galenic-border text-galenic-primary text-xs font-mono px-3 py-2 whitespace-nowrap shadow-lg block">
            {content}
          </span>
        </span>
      )}
    </span>
  )
}
