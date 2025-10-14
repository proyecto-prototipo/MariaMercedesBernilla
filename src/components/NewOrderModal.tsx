import { useEffect, useState, ChangeEvent } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Client } from '../types/client'

export type NewOrderPayload = {
  client: Client
  quantity: number
  durationMonths: number
  position: { lat: number; lng: number }
  notes?: string
}

type Props = {
  clients: Client[]
  defaultClientId: string | null
  onClose: () => void
  onSubmit: (payload: NewOrderPayload) => void
  initialPosition?: { lat: number; lng: number }
}

export default function NewOrderModal({ clients, defaultClientId, onClose, onSubmit, initialPosition }: Props) {
  const initialClientId = defaultClientId && clients.some(c => c.id === defaultClientId)
    ? defaultClientId
    : (clients[0]?.id ?? '')

  const [form, setForm] = useState<{ clientId: string; quantity: number; months: number; lat: number | null; lng: number | null; notes: string }>(() => ({
    clientId: initialClientId,
    quantity: 10,
    months: 12,
    lat: initialPosition?.lat ?? null,
    lng: initialPosition?.lng ?? null,
    notes: ''
  }))

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    if (!defaultClientId) return
    if (clients.some(c => c.id === defaultClientId)) {
      setForm(f => ({ ...f, clientId: defaultClientId }))
    }
  }, [defaultClientId, clients])

  const hasClients = clients.length > 0
  const selectedClient = clients.find(c => c.id === form.clientId)
  const canSubmit = !!selectedClient && form.quantity > 0 && form.months > 0 && form.lat != null && form.lng != null
  const mapCenter: [number, number] = form.lat != null && form.lng != null
    ? [form.lat, form.lng]
    : [-12.0464, -77.0428]

  const handleMapPick = (lat: number, lng: number) => {
    setForm(f => ({ ...f, lat, lng }))
  }

  const handleLatLngChange = (field: 'lat' | 'lng') => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm(f => ({ ...f, [field]: value === '' ? null : parseFloat(value) }))
  }

  const handleSubmit = () => {
    if (!canSubmit || !selectedClient || form.lat == null || form.lng == null) return
    onSubmit({
      client: selectedClient,
      quantity: form.quantity,
      durationMonths: form.months,
      position: { lat: form.lat, lng: form.lng },
      notes: form.notes.trim() ? form.notes : undefined
    })
  }

  return (
    <div className="modal-overlay bg-black/40 grid place-items-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="card w-[94vw] max-w-3xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-lg">Nueva orden</h2>
            <p className="text-xs text-stone-500">Selecciona cliente, alcance y marca la coordenada solicitada.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cerrar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-stone-600 mb-1">Cliente</label>
              <select
                className="input input-bordered w-full"
                value={form.clientId}
                onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                disabled={!hasClients}
              >
                {!hasClients && <option value="">Registra un cliente primero</option>}
                {clients.map(c => {
                  const label = `${c.firstName} ${c.lastName}`.trim() || c.firstName || c.lastName || c.id
                  return <option key={c.id} value={c.id}>{label}</option>
                })}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-600 mb-1">Cantidad panales</label>
                <input
                  type="number"
                  min={1}
                  className="input input-bordered w-full"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: Math.max(0, Number.parseInt(e.target.value, 10) || 0) }))}
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Duración (meses)</label>
                <input
                  type="number"
                  min={1}
                  className="input input-bordered w-full"
                  value={form.months}
                  onChange={e => setForm(f => ({ ...f, months: Math.max(0, Number.parseInt(e.target.value, 10) || 0) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-600 mb-1">Latitud</label>
                <input className="input input-bordered w-full" type="number" step="0.0001" value={form.lat ?? ''} onChange={handleLatLngChange('lat')} />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Longitud</label>
                <input className="input input-bordered w-full" type="number" step="0.0001" value={form.lng ?? ''} onChange={handleLatLngChange('lng')} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1">Notas internas</label>
              <textarea className="input input-bordered w-full h-24" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Condiciones especiales, anexos, etc." />
            </div>
            <div className="text-xs text-stone-500">Haz click en el mini mapa para proponer las coordenadas. Puedes afinar manualmente los valores.</div>
          </div>
          <div className="h-[280px] md:h-full">
            <div className="h-full rounded overflow-hidden border border-stone-200">
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                <LocationSelector onPick={handleMapPick} />
                {form.lat != null && form.lng != null && (
                  <CircleMarker center={[form.lat, form.lng]} radius={9} pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.6 }} />
                )}
              </MapContainer>
            </div>
            <div className="mt-2 text-xs text-stone-600">
              {form.lat != null && form.lng != null ? (
                <>Coordenada seleccionada: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</>
              ) : (
                <>Sin coordenada. Marca un punto para continuar.</>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit}>Registrar orden</button>
        </div>
        {!canSubmit && hasClients && (
          <p className="text-xs text-amber-600 mt-2">Selecciona un punto en el mapa y completa los datos obligatorios.</p>
        )}
        {!hasClients && (
          <p className="text-xs text-amber-600 mt-2">Registra un cliente antes de crear la orden.</p>
        )}
      </div>
    </div>
  )
}

function LocationSelector({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}
