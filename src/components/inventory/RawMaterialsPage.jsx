import React, { useState } from 'react'
import { Upload } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import RawMaterialsTable from './RawMaterialsTable.jsx'
import RawMaterialForm from './RawMaterialForm.jsx'
import BulkImportModal from './BulkImportModal.jsx'

export default function RawMaterialsPage() {
  const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBulkImport, setShowBulkImport] = useState(false)

  // Filter raw materials by search query
  const q = searchQuery.toLowerCase().trim()
  const filtered = q
    ? rawMaterials.filter(
        rm =>
          rm.name.toLowerCase().includes(q) ||
          (rm.supplier && rm.supplier.toLowerCase().includes(q)) ||
          (rm.activeNutrient && rm.activeNutrient.toLowerCase().includes(q))
      )
    : rawMaterials

  function handleAdd() {
    setEditingMaterial(null)
    setModalOpen(true)
  }

  function handleEdit(material) {
    setEditingMaterial(material)
    setModalOpen(true)
  }

  function handleSubmit(data) {
    if (editingMaterial) {
      updateRawMaterial(editingMaterial.id, data)
    } else {
      addRawMaterial(data)
    }
    setModalOpen(false)
    setEditingMaterial(null)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingMaterial(null)
  }

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-mono font-semibold text-galenic-primary uppercase tracking-widest">
            Materie Prime
          </h2>
          <p className="text-xs font-mono text-galenic-muted mt-0.5">
            {filtered.length === rawMaterials.length
              ? `${rawMaterials.length} ${rawMaterials.length === 1 ? 'voce' : 'voci'} nel database`
              : `${filtered.length} di ${rawMaterials.length} voci`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-galenic-muted pointer-events-none">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome, fornitore, nutriente..."
              className="bg-galenic-elevated border border-galenic-border text-galenic-primary font-mono text-sm pl-8 pr-8 py-2 outline-none focus:border-galenic-accent transition-colors placeholder:text-galenic-muted w-72"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-galenic-muted hover:text-galenic-primary transition-colors font-mono text-base leading-none"
              >
                ×
              </button>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={() => setShowBulkImport(true)}>
            <Upload size={13} className="mr-1.5" />
            Importa Excel/CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            + Aggiungi Materia Prima
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-galenic-surface border border-galenic-border rounded-xl">
        <RawMaterialsTable
          rawMaterials={filtered}
          onEdit={handleEdit}
          onDelete={deleteRawMaterial}
        />
      </div>

      {/* No results message */}
      {filtered.length === 0 && q && (
        <p className="text-xs font-mono text-galenic-muted mt-3 text-center">
          Nessun risultato per "{searchQuery}"
        </p>
      )}

      {/* Bulk import modal */}
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} />}

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editingMaterial ? 'Modifica Materia Prima' : 'Nuova Materia Prima'}
      >
        <RawMaterialForm
          initial={editingMaterial}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </Modal>
    </section>
  )
}
