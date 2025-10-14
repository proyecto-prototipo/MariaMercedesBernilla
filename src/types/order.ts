export type OrderStatus = 'pending-location' | 'active'

export type Order = {
  id: string
  clientId: string
  clientName: string
  siteId: string
  siteName: string
  quantity: number
  contractMonths: number
  status: OrderStatus
  createdAt: string
  requestedLat: number
  requestedLng: number
  locationConfirmedAt?: string
  finalLat?: number
  finalLng?: number
  notes?: string
}

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  'pending-location': { label: 'Pendiente de ubicación', className: 'bg-amber-100 text-amber-700' },
  'active': { label: 'Activa', className: 'bg-green-100 text-green-700' }
}
