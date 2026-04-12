import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import RawMaterialsTable from './RawMaterialsTable.jsx'
import RawMaterialForm from './RawMaterialForm.jsx'

export default function RawMaterialsPage() {
  const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)

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
            {rawMaterials.length} {rawMaterials.length === 1 ? 'voce' : 'voci'} nel database
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          + Aggiungi Materia Prima
        </Button>
      </div>

      {/* Table */}
      <div className="bg-galenic-surface border border-galenic-border">
        <RawMaterialsTable
          rawMaterials={rawMaterials}
          onEdit={handleEdit}
          onDelete={deleteRawMaterial}
        />
      </div>

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
