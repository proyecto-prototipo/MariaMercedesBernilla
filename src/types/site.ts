export type Site = {
  id: string
  name: string
  lat: number
  lng: number
  assignedAt?: string
  contract?: { start: string; end: string }
  pendingSite?: boolean
  lockExtras?: boolean
  hives: { id: string; ingreso: string }[]
}
