import React from 'react'

/**
 * Generic table component.
 * @param {Array<{key, label, render, className}>} columns
 * @param {Array<object>} rows
 * @param {string} emptyMessage
 * @param {function} getRowClassName — optional fn(row) => className string
 */
export default function Table({
  columns = [],
  rows = [],
  emptyMessage = 'No data.',
  getRowClassName,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono border-collapse">
        <thead>
          <tr className="bg-galenic-elevated border-b border-galenic-border">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs text-galenic-muted uppercase tracking-wider whitespace-nowrap ${col.headerClassName || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-galenic-muted text-xs"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={row.id || row.rowId || idx}
                className={[
                  'border-b border-galenic-border transition-colors',
                  'hover:bg-galenic-elevated hover:bg-opacity-50',
                  getRowClassName ? getRowClassName(row) : '',
                ].join(' ')}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-galenic-primary tabular-nums ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
