import React from 'react'

export default function PageWrapper({ children }) {
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="w-full px-4 py-4 md:px-6 md:py-6">
        {children}
      </div>
    </main>
  )
}
