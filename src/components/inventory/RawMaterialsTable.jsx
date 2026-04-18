import React, { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import Table from '../ui/Table.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Tooltip from '../ui/Tooltip.jsx'

export default function RawMaterialsTable({ rawMaterials, onEdit, onDelete }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const columns = [
    {
      key: 'id',
      label: 'ID',
      className: 'text-galenic-muted text-xs',
      render: row => (
        <Tooltip content={row.id}>
          <span className="font-mono text-xs text-galenic-muted cursor-help">
            {row.id.slice(-8)}
          </span>
        </Tooltip>
      ),
    },
    {
      key: 'name',
      label: 'Nome',
      render: row => (
        <div>
          <div className="font-medium text-galenic-primary text-sm">{row.name}</div>
          {row.supplier && (
            <div className="text-xs text-galenic-muted mt-0.5">{row.supplier}</div>
          )}
        </div>
      ),
    },
    {
      key: 'activeNutrient',
      label: 'Nutriente',
      render: row =>
        row.activeNutrient ? (
          <Badge variant="accent">{row.activeNutrient}</Badge>
        ) : (
          <span className="text-galenic-muted text-xs">Eccipiente</span>
        ),
    },
    {
      key: 'pricePerKg',
      label: 'Prezzo/kg',
      className: 'tabular-nums text-right',
      headerClassName: 'text-right',
      render: row => (
        <span className="text-galenic-primary">
          € {Number(row.pricePerKg).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'purity',
      label: 'Purezza',
      className: 'tabular-nums text-center',
      headerClassName: 'text-center',
      render: row => (
        <span className="text-galenic-primary">{Number(row.purity).toFixed(1)}%</span>
      ),
    },
    {
      key: 'titration',
      label: 'Titol.',
      className: 'tabular-nums text-center',
      headerClassName: 'text-center',
      render: row => (
        <span className="text-galenic-primary">{Number(row.titration).toFixed(1)}%</span>
      ),
    },
    {
      key: 'titrationIn',
      label: 'Titolato in',
      className: 'text-center',
      headerClassName: 'text-center',
      render: row =>
        row.activeNutrient ? (
          <span className="text-galenic-primary text-xs font-mono">{row.activeNutrient}</span>
        ) : (
          <span className="text-galenic-muted text-xs">—</span>
        ),
    },
    {
      key: 'maxLimitMg',
      label: 'Limite Max',
      className: 'tabular-nums text-center',
      headerClassName: 'text-center',
      render: row =>
        row.maxLimitMg > 0 ? (
          <span className="text-galenic-warning">{Number(row.maxLimitMg).toFixed(2)} mg</span>
        ) : (
          <span className="text-galenic-muted text-xs">N/L</span>
        ),
    },
    {
      key: 'nrvReference',
      label: 'VNR Rif.',
      className: 'tabular-nums text-center',
      headerClassName: 'text-center',
      render: row =>
        row.nrvReference > 0 ? (
          <span className="text-galenic-primary">{Number(row.nrvReference).toFixed(4)} mg</span>
        ) : (
          <span className="text-galenic-muted text-xs">N/D</span>
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
              <button
                onClick={() => { onDelete(row.id); setConfirmDeleteId(null) }}
                className="w-6 h-6 flex items-center justify-center rounded text-galenic-ok hover:bg-galenic-ok/10 transition-all"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="w-6 h-6 flex items-center justify-center rounded text-galenic-muted hover:text-galenic-primary hover:bg-galenic-elevated transition-all"
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(row)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-galenic-muted hover:text-galenic-accent hover:bg-galenic-accent/10 transition-all"
                title="Modifica"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setConfirmDeleteId(row.id)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-galenic-muted hover:text-galenic-danger hover:bg-galenic-danger/10 transition-all"
                title="Elimina"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      rows={rawMaterials}
      emptyMessage="Nessuna materia prima. Aggiungi la prima voce."
    />
  )
}
