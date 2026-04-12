import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import PackagingTable from './PackagingTable.jsx'
import PackagingForm from './PackagingForm.jsx'

export default function PackagingPage() {
  const { packaging, addPackaging, updatePackaging, deletePackaging } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  function handleAdd() {
    setEditingItem(null)
    setModalOpen(true)
  }

  function handleEdit(item) {
    setEditingItem(item)
    setModalOpen(true)
  }

  function handleSubmit(data) {
    if (editingItem) {
      updatePackaging(editingItem.id, data)
    } else {
      addPackaging(data)
    }
    setModalOpen(false)
    setEditingItem(null)
  }

  function handleClose() {
    setModalOpen(false)
    setEditingItem(null)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-mono font-semibold text-galenic-primary uppercase tracking-widest">
            Packaging
          </h2>
          <p className="text-xs font-mono text-galenic-muted mt-0.5">
            {packaging.length} {packaging.length === 1 ? 'opzione' : 'opzioni'} di confezionamento
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          + Aggiungi Packaging
        </Button>
      </div>

      <div className="bg-galenic-surface border border-galenic-border rounded-xl">
        <PackagingTable
          packaging={packaging}
          onEdit={handleEdit}
          onDelete={deletePackaging}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editingItem ? 'Modifica Packaging' : 'Nuovo Packaging'}
        width="max-w-lg"
      >
        <PackagingForm
          initial={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </Modal>
    </section>
  )
}
