import React from 'react'

export default function PageWrapper({ children }) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {children}
      </div>
    </main>
  )
}
