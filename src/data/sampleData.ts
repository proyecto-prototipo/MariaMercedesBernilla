import { Client } from '../types/client'
import { Order } from '../types/order'
import { Site } from '../types/site'
import { safeGet, safeSet } from '../utils/storage'

export const SAMPLE_CLIENTS: Client[] = [
  {
    id: 'CL-ANA-RIOS',
    firstName: 'Ana',
    lastName: 'Ríos',
    dni: '45872136',
    phone: '+51 987 654 321',
    email: 'ana.rios@example.com',
    country: 'Perú',
    birthplace: 'Chimbote',
    address: 'Av. Buenos Aires 123, Chimbote, Áncash',
    notes: 'Cliente interesado en productos orgánicos.'
  },
  {
    id: 'CL-JORGE-SALAZAR',
    firstName: 'Jorge',
    lastName: 'Salazar',
    dni: '40321547',
    phone: '+51 976 543 210',
    email: 'jorge.salazar@example.com',
    country: 'Perú',
    birthplace: 'Nuevo Chimbote',
    address: 'Jr. Libertad 456, Nuevo Chimbote',
    notes: 'Prefiere contacto por correo electrónico.'
  },
  {
    id: 'CL-LUCIA-FERNANDEZ',
    firstName: 'Lucía',
    lastName: 'Fernández',
    dni: '72548963',
    phone: '+51 964 321 789',
    email: 'lucia.fernandez@example.com',
    country: 'Perú',
    birthplace: 'Huancayo',
    address: 'Av. Ferrocarril 890, Huancayo, Junín',
    notes: 'Solicita recibir información sobre promociones mensuales.'
  },
  {
    id: 'CL-RICARDO-CARDENAS',
    firstName: 'Ricardo',
    lastName: 'Cárdenas',
    dni: '60124587',
    phone: '+51 912 876 543',
    email: 'ricardo.cardenas@example.com',
    country: 'Perú',
    birthplace: 'El Tambo',
    address: 'Jr. Real 230, El Tambo, Junín',
    notes: 'Interesado en servicios de instalación técnica.'
  },
  {
    id: 'CL-MONICA-TORRES',
    firstName: 'Mónica',
    lastName: 'Torres',
    dni: '48965321',
    phone: '+51 931 234 567',
    email: 'monica.torres@example.com',
    country: 'Perú',
    birthplace: 'Cusco',
    address: 'Calle San Blas 345, Cusco',
    notes: 'Cliente frecuente, participa en programas de fidelidad.'
  }
]

export const SAMPLE_SITES: Site[] = [
  {
    id: 'SITE-ANA-RIOS',
    name: 'Ana Ríos',
    lat: -8.982229,
    lng: -78.580573,
    assignedAt: '2025-09-30',
    contract: { start: '2025-09-30', end: '2026-09-30' },
    pendingSite: false,
    lockExtras: true,
    hives: [
      { id: 'AR-001', ingreso: '2025-09-30' },
      { id: 'AR-002', ingreso: '2025-10-02' },
      { id: 'AR-003', ingreso: '2025-10-05' },
      { id: 'AR-004', ingreso: '2025-10-08' }
    ]
  },
  {
    id: 'SITE-JORGE-SALAZAR',
    name: 'Jorge Salazar',
    lat: -9.109975,
    lng: -78.489408,
    assignedAt: '2025-01-02',
    contract: { start: '2025-01-02', end: '2025-12-31' },
    pendingSite: false,
    lockExtras: true,
    hives: [
      { id: 'JS-001', ingreso: '2025-01-02' },
      { id: 'JS-002', ingreso: '2025-01-04' },
      { id: 'JS-003', ingreso: '2025-01-06' }
    ]
  },
  {
    id: 'SITE-LUCIA-FERNANDEZ',
    name: 'Lucía Fernández',
    lat: -12.031801,
    lng: -75.207971,
    assignedAt: '2025-03-05',
    contract: { start: '2025-03-05', end: '2026-03-04' },
    pendingSite: false,
    lockExtras: true,
    hives: [
      { id: 'LF-001', ingreso: '2025-03-05' },
      { id: 'LF-002', ingreso: '2025-03-07' },
      { id: 'LF-003', ingreso: '2025-03-09' },
      { id: 'LF-004', ingreso: '2025-03-11' }
    ]
  },
  {
    id: 'SITE-RICARDO-CARDENAS',
    name: 'Ricardo Cárdenas',
    lat: -12.143929,
    lng: -75.154774,
    assignedAt: '2025-02-09',
    contract: { start: '2025-02-09', end: '2026-02-08' },
    pendingSite: false,
    lockExtras: true,
    hives: [
      { id: 'RC-001', ingreso: '2025-02-09' },
      { id: 'RC-002', ingreso: '2025-02-11' },
      { id: 'RC-003', ingreso: '2025-02-13' }
    ]
  },
  {
    id: 'SITE-MONICA-TORRES',
    name: 'Mónica Torres',
    lat: -12.627439,
    lng: -72.383829,
    assignedAt: '2025-08-12',
    contract: { start: '2025-08-12', end: '2026-08-12' },
    pendingSite: false,
    lockExtras: true,
    hives: [
      { id: 'MT-001', ingreso: '2025-08-12' },
      { id: 'MT-002', ingreso: '2025-08-14' },
      { id: 'MT-003', ingreso: '2025-08-16' },
      { id: 'MT-004', ingreso: '2025-08-18' }
    ]
  }
]

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ORD-SEED-ANA',
    clientId: 'CL-ANA-RIOS',
    clientName: 'Ana Ríos',
    siteId: 'SITE-ANA-RIOS',
    siteName: 'Ana Ríos',
    quantity: 4,
    contractMonths: 12,
    status: 'active',
    createdAt: '2025-09-30T12:00:00.000Z',
    requestedLat: -8.982229,
    requestedLng: -78.580573,
    locationConfirmedAt: '2025-09-30T12:00:00.000Z',
    finalLat: -8.982229,
    finalLng: -78.580573,
    notes: 'Solicitud registrada el 30/09/2025. Cliente interesado en productos orgánicos.'
  },
  {
    id: 'ORD-SEED-JORGE',
    clientId: 'CL-JORGE-SALAZAR',
    clientName: 'Jorge Salazar',
    siteId: 'SITE-JORGE-SALAZAR',
    siteName: 'Jorge Salazar',
    quantity: 3,
    contractMonths: 12,
    status: 'active',
    createdAt: '2025-01-02T14:00:00.000Z',
    requestedLat: -9.109975,
    requestedLng: -78.489408,
    locationConfirmedAt: '2025-01-02T14:00:00.000Z',
    finalLat: -9.109975,
    finalLng: -78.489408,
    notes: 'Solicitud registrada el 02/01/2025. Prefiere contacto por correo.'
  },
  {
    id: 'ORD-SEED-LUCIA',
    clientId: 'CL-LUCIA-FERNANDEZ',
    clientName: 'Lucía Fernández',
    siteId: 'SITE-LUCIA-FERNANDEZ',
    siteName: 'Lucía Fernández',
    quantity: 4,
    contractMonths: 12,
    status: 'active',
    createdAt: '2025-03-05T15:00:00.000Z',
    requestedLat: -12.031801,
    requestedLng: -75.207971,
    locationConfirmedAt: '2025-03-05T15:00:00.000Z',
    finalLat: -12.031801,
    finalLng: -75.207971,
    notes: 'Solicitud registrada el 05/03/2025. Enviar promociones mensuales.'
  },
  {
    id: 'ORD-SEED-RICARDO',
    clientId: 'CL-RICARDO-CARDENAS',
    clientName: 'Ricardo Cárdenas',
    siteId: 'SITE-RICARDO-CARDENAS',
    siteName: 'Ricardo Cárdenas',
    quantity: 3,
    contractMonths: 12,
    status: 'active',
    createdAt: '2025-02-09T16:00:00.000Z',
    requestedLat: -12.143929,
    requestedLng: -75.154774,
    locationConfirmedAt: '2025-02-09T16:00:00.000Z',
    finalLat: -12.143929,
    finalLng: -75.154774,
    notes: 'Solicitud registrada el 09/02/2025. Requiere instalación técnica.'
  },
  {
    id: 'ORD-SEED-MONICA',
    clientId: 'CL-MONICA-TORRES',
    clientName: 'Mónica Torres',
    siteId: 'SITE-MONICA-TORRES',
    siteName: 'Mónica Torres',
    quantity: 4,
    contractMonths: 12,
    status: 'active',
    createdAt: '2025-08-12T13:00:00.000Z',
    requestedLat: -12.627439,
    requestedLng: -72.383829,
    locationConfirmedAt: '2025-08-12T13:00:00.000Z',
    finalLat: -12.627439,
    finalLng: -72.383829,
    notes: 'Solicitud registrada el 12/08/2025. Cliente frecuente con programa de fidelidad.'
  }
]

const SEED_VERSION_KEY = 'bp360_seed_version'
const SEED_VERSION = '2025-10-14-clients-v1'

export function ensureSampleData() {
  if (typeof window === 'undefined') return
  const currentVersion = window.localStorage.getItem(SEED_VERSION_KEY)
  if (currentVersion === SEED_VERSION) return

  const storedClients = safeGet('bp360_clients', [] as Client[])
  const storedOrders = safeGet('bp360_orders', [] as Order[])
  const storedSites = safeGet('bp360_client_sites', [] as Site[])

  if (!storedClients.length && !storedOrders.length && !storedSites.length) {
    safeSet('bp360_clients', SAMPLE_CLIENTS)
    safeSet('bp360_orders', SAMPLE_ORDERS)
    safeSet('bp360_client_sites', SAMPLE_SITES)
  }

  window.localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)
}

export function clearSampleDataSeedFlag() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SEED_VERSION_KEY)
}
