import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Table from '../ui/Table.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import { fromMg } from '../../utils/weightConversions.js'

const TYPE_COLORS = {
  Compresse: 'accent',
  Capsule:   'ok',
  Polveri:   'caution',
  Liquidi:   'neutral',
}

export default function FormulaList() {
  const { formulas, openFormula, deleteFormula, newFormula } = useApp()

  const columns = [
    {
      key: 'name',
      label: 'Nome Formula',
      render: row => (
        <span className="text-galenic-primary font-medium">{row.name}</span>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      render: row => (
        <Badge variant={TYPE_COLORS[row.type] || 'neutral'}>{row.type}</Badge>
      ),
    },
    {
      key: 'targetWeightMg',
      label: 'Peso Target',
      className: 'tabular-nums',
      render: row => {
        const unit = row.targetWeightUnit || 'mg'
        const val  = fromMg(row.targetWeightMg, unit)
        return (
          <span className="text-galenic-primary">
            {val.toFixed(unit === 'mg' ? 0 : 3)} {unit}
          </span>
        )
      },
    },
    {
      key: 'ingredients',
      label: 'Ingredienti',
      className: 'text-center',
      headerClassName: 'text-center',
      render: row => (
        <span className="text-galenic-muted">{row.ingredients?.length ?? 0}</span>
      ),
    },
    {
      key: 'status',
      label: 'Stato',
      render: row => (
        <Badge variant={row.status === 'finalized' ? 'ok' : 'neutral'}>
          {row.status === 'finalized' ? 'Finalizzata' : 'Bozza'}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Aggiornata',
      render: row => (
        <span className="text-galenic-muted text-xs">
          {new Date(row.updatedAt).toLocaleDateString('it-IT')}
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
          <Button size="sm" variant="primary" onClick={() => openFormula(row)}>
            Apri
          </Button>
          <Button size="sm" variant="danger" onClick={() => deleteFormula(row.id)}>
            Elimina
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-mono font-semibold text-galenic-primary uppercase tracking-widest">
            Formule Salvate
          </h2>
          <p className="text-xs font-mono text-galenic-muted mt-0.5">
            {formulas.length} {formulas.length === 1 ? 'formula' : 'formule'}
          </p>
        </div>
        <Button variant="primary" onClick={newFormula}>
          + Nuova Formula
        </Button>
      </div>

      <div className="bg-galenic-surface border border-galenic-border">
        <Table
          columns={columns}
          rows={formulas}
          emptyMessage="Nessuna formula salvata. Crea la tua prima formula."
        />
      </div>
    </div>
  )
}
