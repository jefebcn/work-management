/**
 * Macrotemi auto-creati alla prima apertura.
 * Sono "auto" perché legati alla forma farmaceutica.
 * Non eliminabili — rappresentano le 5 categorie base.
 */
export const SEED_MACROTHEMES = [
  {
    id: 'macro-auto-compresse',
    name: 'Compresse',
    kind: 'auto',
    formType: 'Compresse',
    icon: 'Pill',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'macro-auto-capsule',
    name: 'Capsule',
    kind: 'auto',
    formType: 'Capsule',
    icon: 'Capsule',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'macro-auto-polveri',
    name: 'Polveri',
    kind: 'auto',
    formType: 'Polveri',
    icon: 'Wheat',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'macro-auto-liquidi',
    name: 'Liquidi',
    kind: 'auto',
    formType: 'Liquidi',
    icon: 'Droplet',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'macro-auto-caramelle',
    name: 'Caramelle',
    kind: 'auto',
    formType: 'Caramelle',
    icon: 'Candy',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]
