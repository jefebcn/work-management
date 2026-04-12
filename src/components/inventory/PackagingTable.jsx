import React, { useState } from 'react'
import Table from '../ui/Table.jsx'
import Button from '../ui/Button.jsx'

export default function PackagingTable({ packaging, onEdit, onDelete }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: row => (
        <span className="font-mono text-xs text-galenic-muted">{row.id.slice(-8)}</span>
      ),
    },
    {
      key: 'description',
      label: 'Descrizione',
      render: row => (
        <span className="text-galenic-primary text-sm font-medium">{row.description}</span>
      ),
    },
    {
      key: 'unitCost',
      label: 'Costo Unitario',
      className: 'tabular-nums text-right',
      headerClassName: 'text-right',
      render: row => (
        <span className="text-galenic-accent font-medium">
          € {Number(row.unitCost).toFixed(3)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Azioni',
      headerClassName: 'text-right',
      className: 'text-right',
      render: row => (
        <div className="flex items-center justify-end gap-2">
          {confirmDeleteId === row.id ? (
            <>
              <span className="text-xs text-galenic-danger font-mono">Confermi?</span>
              <Button size="sm" variant="danger" onClick={() => { onDelete(row.id); setConfirmDeleteId(null) }}>
                Sì
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                No
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="subtle" onClick={() => onEdit(row)}>
                Modifica
              </Button>
              <Button size="sm" variant="danger" onClick={() => setConfirmDeleteId(row.id)}>
                Elimina
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      rows={packaging}
      emptyMessage="Nessun packaging configurato."
    />
  )
}
