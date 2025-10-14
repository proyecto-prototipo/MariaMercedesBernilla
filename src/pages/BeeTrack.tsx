import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useEffect, useMemo, useState, useRef, ChangeEvent, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { safeGet, safeSet } from '../utils/storage'
import { Client } from '../types/client'
import { Order, ORDER_STATUS_META } from '../types/order'
import { Site } from '../types/site'
import NewOrderModal, { NewOrderPayload } from '../components/NewOrderModal'
import { ensureSampleData, clearSampleDataSeedFlag } from '../data/sampleData'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const DefaultMarker = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultMarker

type Hive = {
  id: string; colmena: string; contratoId: string; lat: number; lng: number;
  umbrales: { tempMax: number; humMin: number }
  seed: { temp: number; hum: number; act: number; bat: number }
  hasDevice?: boolean
}

type Telemetry = { temp: number; hum: number; act: number; bat: number; t: number }

function simulate(prev: Telemetry): Telemetry {
  const rand = (a:number,b:number) => Math.random()*(b-a)+a
  return {
    temp: Math.max(0, prev.temp + rand(-0.8, 0.8)),
    hum: Math.min(100, Math.max(0, prev.hum + rand(-1.5, 1.5))),
    act: Math.max(0, prev.act + rand(-3, 3)),
    bat: Math.max(0, prev.bat - rand(0, 0.2)),
    t: Date.now(),
  }
}

export default function BeeTrack(){
  ensureSampleData()
  const [hives, setHives] = useState<Hive[]>([])
  const [tele, setTele] = useState<Record<string, Telemetry>>({})
  const [alerts, setAlerts] = useState<{timestamp:number; hiveId:string; tipo:string; valor:number}[]>(safeGet('bp360_alerts', []))
  const [hist, setHist] = useState<{ labels: string[]; temp: number[]; hum: number[]; act: number[] }>({ labels: [], temp: [], hum: [], act: [] })
  const [toast, setToast] = useState<string>('')
  const [contract, setContract] = useState<string>('CTR-CP-2025')
  const [contracts, setContracts] = useState<{id:string; cliente:string}[]>([])
  
  const [sites, setSites] = useState<Site[]>(safeGet('bp360_client_sites', [] as Site[]))
  const [openSite, setOpenSite] = useState<Site|null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [clients, setClients] = useState<Client[]>(safeGet('bp360_clients', [] as Client[]))
  const [orders, setOrders] = useState<Order[]>(safeGet('bp360_orders', [] as Order[]))
  const [emailToast, setEmailToast] = useState<string>('')
  const [emailPhase, setEmailPhase] = useState<'hidden'|'enter'|'exit'>('hidden')
  const [emailStage, setEmailStage] = useState<'sending'|'sent'>('sending')
  const [newClientModal, setNewClientModal] = useState(false)
  const [newOrderModal, setNewOrderModal] = useState(false)
  const [orderDetails, setOrderDetails] = useState<Order|null>(null)
  const [orderDraftClientId, setOrderDraftClientId] = useState<string|null>(null)

  const recentOrders = useMemo(() => (
    [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  ), [orders])

  const HIVES_LOCAL_KEY = 'bp360_hives_local'
  type LocalHive = Pick<Hive, 'id'|'colmena'|'contratoId'|'lat'|'lng'|'hasDevice'> & { seed?: Hive['seed']; umbrales?: Hive['umbrales'] }

  function getLocalHives(): LocalHive[] {
    return safeGet(HIVES_LOCAL_KEY, [])
  }

  function setLocalHives(v: LocalHive[]) {
    safeSet(HIVES_LOCAL_KEY, v)
  }

  const handleResetData = () => {
    const keys = [
      'bp360_clients',
      'bp360_orders',
      'bp360_client_sites',
      'bp360_alerts',
      'bp360_hives_local',
      'bp360_site_layouts',
      'bp360_seed_version'
    ]
    keys.forEach(key => localStorage.removeItem(key))
    sessionStorage.removeItem('bp360_new_order_client')
    sessionStorage.removeItem('bp360_open_site')
    clearSampleDataSeedFlag()
    window.location.reload()
  }

  const handleCreateOrder = ({ client, quantity, durationMonths, position, notes }: NewOrderPayload) => {
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`
    const siteId = `SITE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const clientName = `${client.firstName} ${client.lastName}`.trim() || client.firstName || client.lastName || client.id
    const now = new Date()
    const startIso = now.toISOString().slice(0, 10)
    const end = new Date(now)
    end.setMonth(end.getMonth() + durationMonths)
    const endIso = end.toISOString().slice(0, 10)

    const hiveBase = Math.floor(Math.random()*200) + 100
    const newSite: Site = {
      id: siteId,
      name: clientName,
      lat: position.lat,
      lng: position.lng,
      pendingSite: true,
      lockExtras: true,
      contract: { start: startIso, end: endIso },
      hives: Array.from({ length: quantity }, (_, idx) => ({
        id: `C-${String(hiveBase + idx).padStart(3, '0')}`,
        ingreso: startIso
      }))
    }

    setSites(prev => [...prev, newSite])
    setSelectedIds(prev => [...prev, siteId])

    const order: Order = {
      id: orderId,
      clientId: client.id,
      clientName,
      siteId,
      siteName: newSite.name,
      quantity,
      contractMonths: durationMonths,
      status: 'pending-location',
      createdAt: now.toISOString(),
      requestedLat: position.lat,
      requestedLng: position.lng,
      notes: notes?.trim() ? notes : undefined
    }

    setOrders(prev => [order, ...prev])
    setOpenSite(newSite)
    setNewOrderModal(false)
    setOrderDraftClientId(null)
    setToast('Orden creada. Confirma la ubicación en el mini mapa.')
    window.setTimeout(()=>setToast(''), 2600)
  }

  function assignIoT(hiveId: string) {
    // Update local storage entry
    const locals = getLocalHives()
    const idx = locals.findIndex(h => h.id === hiveId)
    if (idx >= 0) {
      locals[idx] = { ...locals[idx], hasDevice: true, seed: locals[idx].seed ?? { temp: 33, hum: 50, act: 60, bat: 95 }, umbrales: locals[idx].umbrales ?? { tempMax: 38, humMin: 30 } }
      setLocalHives([...locals])
    }
    // Update UI state
    setHives(prev => prev.map(h => h.id === hiveId ? { ...h, hasDevice: true } : h))
    setTele(prev => {
      const hive = hives.find(h => h.id === hiveId)
      if (!hive) return prev
      return { ...prev, [hiveId]: { ...hive.seed, t: Date.now() } }
    })
    setToast('Dispositivo IoT asignado')
    setTimeout(()=> setToast(''), 2000)
  }

  function updateHivePosition(hiveId: string, lat: number, lng: number) {
    // update UI state
    setHives(prev => prev.map(h => h.id === hiveId ? { ...h, lat, lng } : h))
    // persist only if it's a local hive
    const locals = getLocalHives()
    const idx = locals.findIndex(h => h.id === hiveId)
    if (idx >= 0) {
      locals[idx] = { ...locals[idx], lat, lng }
      setLocalHives([...locals])
    }
  }

  useEffect(()=>{
    fetch('data/hives.json').then(r=>r.json()).then(json=>{
      const base = (json.hives as Hive[]).filter((h: Hive) => h.contratoId === contract)
      const locals = getLocalHives().filter(h => h.contratoId === contract)
      // default hasDevice true for base items (back-compat)
      const merged: Hive[] = [...base.map(h => ({ ...h, hasDevice: h.hasDevice ?? true })), ...locals.map(h => ({
        id: h.id, colmena: h.colmena, contratoId: h.contratoId, lat: h.lat, lng: h.lng,
        hasDevice: !!h.hasDevice,
        // provide default thresholds and seeds if missing for locals
        umbrales: h.umbrales ?? { tempMax: 38, humMin: 30 },
        seed: h.seed ?? { temp: 33 + Math.random()*2, hum: 50 + Math.random()*5, act: 60 + Math.random()*10, bat: 95 }
      }))]
      setHives(merged)
      const init: Record<string, Telemetry> = {}
      merged.forEach((h: Hive) => {
        if (h.hasDevice) init[h.id] = { ...h.seed, t: Date.now() }
      })
      setTele(init)
    })
  },[contract])

  useEffect(()=>{
    fetch('data/contracts.json').then(r=>r.json()).then(json=>{
      const opts = json.contracts.map((c: any) => ({ id: c.id, cliente: c.cliente }))
      setContracts(opts)
    })
    // Use bundler-aware URL so it works in preview/prod builds
    const base = import.meta.env.BASE_URL || '/'
    fetch(`${base}data/productSites.json`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => {
        const locals = safeGet('bp360_client_sites', [] as Site[]).filter(s => !s.pendingSite)
        setSites([...(json.sites as Site[]), ...locals])
      })
      .catch(() => {
        // fallback for dev environments without public copy
        const sitesUrl = new URL('../../data/productSites.json', import.meta.url)
        fetch(sitesUrl).then(r=>r.json()).then(json=>{
          const locals = safeGet('bp360_client_sites', [] as Site[]).filter(s => !s.pendingSite)
          setSites([...(json.sites as Site[]), ...locals])
        }).catch(()=>{
          const locals = safeGet('bp360_client_sites', [] as Site[]).filter(s => !s.pendingSite)
          setSites(locals)
        })
      })
  },[])

  // If a page asked to open a site (e.g., from Clients order flow), auto-open its mini-mapa
  useEffect(()=>{
    const openId = sessionStorage.getItem('bp360_open_site')
    if (!openId || !sites.length) return
    const s = sites.find(x=>x.id===openId)
    if (s) setOpenSite(s)
    sessionStorage.removeItem('bp360_open_site')
  }, [sites])

  // One-time cleanup: remove any pending (unconfirmed) clients accidentally persisted by older flows
  useEffect(() => {
    const locals = safeGet('bp360_client_sites', [] as Site[])
    const cleaned = locals.filter(s => !s.pendingSite)
    if (cleaned.length !== locals.length) safeSet('bp360_client_sites', cleaned)
  }, [])

  useEffect(() => {
    const pendingClient = sessionStorage.getItem('bp360_new_order_client')
    if (!pendingClient) return
    setOrderDraftClientId(pendingClient)
    setNewOrderModal(true)
    sessionStorage.removeItem('bp360_new_order_client')
  }, [clients])

  useEffect(()=>{
    const id = setInterval(()=>{
      setTele(prev => {
        const out: Record<string, Telemetry> = {}
        for (const k of Object.keys(prev)) out[k] = simulate(prev[k])
        // alerts
        const nowAlerts: any[] = []
        hives.forEach(h => {
          const v = out[h.id]
          if (!h.hasDevice || !v) return
          if (v.temp > h.umbrales.tempMax) nowAlerts.push({timestamp: v.t, hiveId:h.id, tipo:'temp', valor: v.temp})
          if (v.hum < h.umbrales.humMin) nowAlerts.push({timestamp: v.t, hiveId:h.id, tipo:'hum', valor: v.hum})
          if (v.act < 10) nowAlerts.push({timestamp: v.t, hiveId:h.id, tipo:'act', valor: v.act})
        })
        if (nowAlerts.length) {
          setAlerts(a => [...a, ...nowAlerts])
          setToast(`${nowAlerts.length} alerta(s) nuevas`)
          setTimeout(()=> setToast(''), 2500)
        }
        // history for first hive
        const firstWithDevice = hives.find(h => h.hasDevice)?.id
        if (firstWithDevice && out[firstWithDevice]) {
          setHist(h => {
            const ts = new Date(out[firstWithDevice].t)
            const label = ts.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })
            const labels = [...h.labels, label].slice(-60)
            const temp = [...h.temp, out[firstWithDevice].temp].slice(-60)
            const hum = [...h.hum, out[firstWithDevice].hum].slice(-60)
            const act = [...h.act, out[firstWithDevice].act].slice(-60)
            return { labels, temp, hum, act }
          })
        }
        return out
      })
    }, 8000)
    return () => clearInterval(id)
  }, [hives])

  // persist alerts during session
  useEffect(()=>{ safeSet('bp360_alerts', alerts) }, [alerts])
  useEffect(()=>{ safeSet('bp360_orders', orders) }, [orders])

  // Force center to requested coordinates if available, else fallback to first hive
  const requestedCenter = { lat: -12.5405073, lng: -76.7348462 }
  const center = useMemo(()=> ({ lat: requestedCenter.lat, lng: requestedCenter.lng }), [])

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">BeeTrack 360 (simulado)</h1>
          <div className="flex items-center gap-2">
            <select className="border rounded-lg px-3 py-2" value={contract} onChange={e=>setContract(e.target.value)}>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>{c.id} · {c.cliente}</option>
              ))}
            </select>
            <button className="btn btn-outline btn-sm" onClick={handleResetData}>Reiniciar datos</button>
          </div>
        </div>
  <div className={`card overflow-hidden map-shell ${openSite ? 'pointer-events-none' : ''}`}>
          <div className="h-[360px] relative z-0">
            <MapContainer center={[center.lat, center.lng]} zoom={6} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              {hives.map(h => {
                const v = tele[h.id]
                const tempAlert = v && v.temp > h.umbrales.tempMax
                const humAlert = v && v.hum < h.umbrales.humMin
                const color = h.hasDevice ? (tempAlert ? '#EF4444' : humAlert ? '#F59E0B' : '#0FA958') : '#9CA3AF'
                return (
                  <>
                    <CircleMarker key={`${h.id}-c`} center={[h.lat, h.lng]} radius={10} pathOptions={{ color, fillColor: color, fillOpacity: h.hasDevice ? 0.8 : 0.4 }} />
                    <Marker key={h.id} position={[h.lat, h.lng]} draggable={!h.hasDevice} eventHandlers={!h.hasDevice ? { dragend: (e:any)=>{ const ll = e.target.getLatLng(); updateHivePosition(h.id, ll.lat, ll.lng) } } : undefined}>
                      <Popup>
                        <div className="text-sm">
                          <strong>{h.colmena}</strong>
                          {h.hasDevice && v ? (
                            <>
                              <div>T: {v?.temp?.toFixed(1)} °C</div>
                              <div>H: {v?.hum?.toFixed(0)} %</div>
                              <div>Act: {v?.act?.toFixed(0)}</div>
                              <div>Bat: {v?.bat?.toFixed(0)} %</div>
                            </>
                          ) : (
                            <>
                              <div className="text-stone-600">Sin dispositivo IoT (solo GPS)</div>
                              <button className="btn btn-outline btn-sm mt-2" onClick={()=>assignIoT(h.id)}>Asignar IoT</button>
                              <div className="text-xs text-stone-500 mt-1">Consejo: arrastra este punto para reubicarlo</div>
                            </>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )
              })}
        <ClusteredSites sites={(selectedIds && selectedIds.length)? sites.filter(s=>selectedIds.includes(s.id) && !s.pendingSite) : sites.filter(s=>!s.pendingSite)} onOpen={(s)=>setOpenSite(s)} />
            </MapContainer>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Órdenes recientes</h2>
            <button className="btn btn-primary btn-sm" onClick={() => { setOrderDraftClientId(null); setNewOrderModal(true) }}>Nueva orden</button>
          </div>
          {recentOrders.length ? (
            <ul className="space-y-3 text-sm">
              {recentOrders.slice(0, 4).map(order => {
                const status = ORDER_STATUS_META[order.status]
                const confirmed = order.status === 'active' && order.locationConfirmedAt
                return (
                  <li key={order.id} className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate" title={order.siteName}>{order.siteName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                      </div>
                      <button className="btn btn-outline btn-xs" onClick={()=>setOrderDetails(order)}>Ver más detalles</button>
                    </div>
                    <div className="text-xs text-stone-600">{order.clientName} · {order.quantity} panales · {order.contractMonths} meses</div>
                    <div className="text-xs text-stone-500">Creada {formatRelative(order.createdAt)}{confirmed ? ` · Ubicación confirmada ${formatRelative(order.locationConfirmedAt!)}` : ''}</div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">Aún no hay órdenes. Registra la primera con el botón “Nueva orden”.</p>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-2">Temperatura (últimos {hist.labels.length} puntos)</h2>
            <Line data={{
              labels: hist.labels,
              datasets: [{ label: '°C', data: hist.temp, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.2)', tension: 0.3 }]
            }} options={{ responsive: true, plugins: { legend: { display: true } }, scales: { y: { beginAtZero: false } } }} />
          </div>
          <div className="card p-4">
            <h2 className="font-semibold mb-2">Humedad (últimos {hist.labels.length} puntos)</h2>
            <Line data={{
              labels: hist.labels,
              datasets: [{ label: '%', data: hist.hum, borderColor: '#0EA5E9', backgroundColor: 'rgba(14,165,233,0.2)', tension: 0.3 }]
            }} options={{ responsive: true, plugins: { legend: { display: true } }, scales: { y: { beginAtZero: false, max: 100 } } }} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-2">Actividad (últimos {hist.labels.length} puntos)</h2>
            <Line data={{
              labels: hist.labels,
              datasets: [{ label: 'actividad', data: hist.act, borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.2)', tension: 0.3 }]
            }} options={{ responsive: true, plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {hives.map(h => {
            const v = tele[h.id]
            const tempAlert = v && v.temp > h.umbrales.tempMax
            const humAlert = v && v.hum < h.umbrales.humMin
            const badge = h.hasDevice ? (tempAlert ? 'bg-bee-red' : humAlert ? 'bg-bee-amber' : 'bg-bee-green') : 'bg-stone-400'
            return (
              <div key={h.id} className="card p-4 fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{h.colmena}</h3>
                  <span className={`text-xs text-white px-2 py-1 rounded ${badge}`}>{h.hasDevice ? (tempAlert? 'ALTA TEMP' : humAlert ? 'BAJA HUM' : 'OK') : 'GPS'}</span>
                </div>
                <dl className="grid grid-cols-4 text-sm">
                  <div><dt className="text-stone-500">T</dt><dd>{h.hasDevice && v ? `${v.temp.toFixed(1)} °C` : '-'}</dd></div>
                  <div><dt className="text-stone-500">H</dt><dd>{h.hasDevice && v ? `${v.hum.toFixed(0)} %` : '-'}</dd></div>
                  <div><dt className="text-stone-500">Act</dt><dd>{h.hasDevice && v ? v.act.toFixed(0) : '-'}</dd></div>
                  <div><dt className="text-stone-500">Bat</dt><dd>{h.hasDevice && v ? `${v.bat.toFixed(0)} %` : '-'}</dd></div>
                </dl>
              </div>
            )
          })}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Alertas</h2>
          <ul className="text-sm max-h-72 overflow-auto space-y-1">
            {alerts.slice().reverse().map((a, i) => (
              <li key={i} className="flex justify-between">
                <span>{a.hiveId} · {a.tipo}</span>
                <span>{a.valor.toFixed(1)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-end mt-3">
            <button className="btn btn-outline" onClick={()=>{
              const rows = [["timestamp","hiveId","tipo","valor"], ...alerts.map(a => [new Date(a.timestamp).toISOString(), a.hiveId, a.tipo, a.valor.toFixed(2)])]
              const csv = rows.map(r => r.join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'bitacora-alertas.csv'
              a.click()
            }}>Exportar CSV</button>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Clientes y contratos</h2>
            <a href="#/clients" className="text-sm text-bee-green hover:underline">Ver todos</a>
          </div>
          <ClientFilter sites={sites.filter(s=>!s.pendingSite && pctElapsed(s.contract) >= 0.85)} selected={selectedIds} onToggle={(id)=>{
            setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
          }} onNotify={(id)=>{
            const s = sites.find(x=>x.id===id)
            if (!s) return
            // two-stage email toast: sending -> sent
            setEmailStage('sending')
            setEmailToast('')
            setEmailPhase('enter')
            const sendDelay = 1200
            const visibleAfterSent = 1400
            // switch to sent
            window.setTimeout(() => {
              setEmailStage('sent')
              setEmailToast(`Notificación enviada a ${s.name}`)
            }, sendDelay)
            // start exit after showing sent
            window.setTimeout(() => setEmailPhase('exit'), sendDelay + visibleAfterSent)
            window.setTimeout(() => { setEmailPhase('hidden'); setEmailToast('') }, sendDelay + visibleAfterSent + 700)
          }} onRemove={(id)=>{
            setSites(prev => prev.filter(s=>s.id !== id))
            const locals = safeGet('bp360_client_sites', [] as Site[])
            safeSet('bp360_client_sites', locals.filter(s=>s.id !== id))
            setSelectedIds(prev => prev.filter(x=>x!==id))
            // remove layouts for this site
            const LKEY = 'bp360_site_layouts'
            try {
              const layouts = JSON.parse(localStorage.getItem(LKEY)||'{}')
              delete layouts[id]
              localStorage.setItem(LKEY, JSON.stringify(layouts))
            } catch {}
            if (openSite?.id === id) setOpenSite(null)
          }} />
        </div>
        <NewClientCard onCreate={() => setNewClientModal(true)} />
      </aside>
      {newClientModal && (
        <NewClientModal
          onClose={()=>setNewClientModal(false)}
          onSaved={(client)=>{
            setClients(prev => {
              if (prev.some(c => c.id === client.id)) return prev
              return [...prev, client]
            })
            setOrderDraftClientId(client.id)
            setNewOrderModal(true)
          }}
        />
      )}
      {newOrderModal && (
        <NewOrderModal
          clients={clients}
          defaultClientId={orderDraftClientId}
          onClose={()=>{ setNewOrderModal(false); setOrderDraftClientId(null) }}
          onSubmit={handleCreateOrder}
        />
      )}
      {emailPhase !== 'hidden' && (
        <div className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-[3000] bg-white/90 backdrop-blur border border-stone-200 rounded-2xl px-5 py-3 shadow-xl ${emailPhase==='enter'?'toast-enter':'toast-exit'}`}>
          <div className="flex items-center gap-3 text-stone-800">
            {emailStage === 'sending' ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" aria-label="Cargando" />
                <span className="font-medium">Enviando…</span>
              </>
            ) : (
              <>
                <span className="inline-block w-5 h-5 text-green-600">✔</span>
                <span className="font-medium">{emailToast}</span>
              </>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className="toast card fade-in">{toast}</div>
      )}
      {openSite && (
        <MiniMapModal site={openSite} onClose={()=>setOpenSite(null)} onConfirmSite={(id, lat, lng)=>{
          // Persist only now upon confirmation
          const confirmedAt = new Date().toISOString()
          const confirmed = { ...openSite, lat, lng, pendingSite: false }
          setSites(prev => prev.map(s => s.id === id ? confirmed : s))
          const locals = safeGet('bp360_client_sites', [] as Site[])
          const without = locals.filter(s => s.id !== id)
          safeSet('bp360_client_sites', [...without, confirmed])
          setSelectedIds(prev => prev.includes(id) ? prev : [...prev, id])
          setOrders(prev => prev.map(order => order.siteId === id ? ({
            ...order,
            status: 'active',
            locationConfirmedAt: confirmedAt,
            finalLat: lat,
            finalLng: lng
          }) : order))
          setOrderDetails(prev => prev && prev.siteId === id ? ({
            ...prev,
            status: 'active',
            locationConfirmedAt: confirmedAt,
            finalLat: lat,
            finalLng: lng
          }) : prev)
          // Keep modal open but now with confirmed site so user can gestionar panales
          setOpenSite(confirmed)
        }} />
      )}
    </section>
  )
}
function ClusteredSites({ sites, onOpen }: { sites: Site[]; onOpen: (s: Site)=>void }){
  const [tick, setTick] = useState(0)
  const map = useMapEvents({ moveend: () => setTick(x=>x+1), zoomend: () => setTick(x=>x+1) })
  // Grid size shrinks as zoom increases
  const zoom = map.getZoom()
  const cell = Math.max(20, 140 - (zoom*8)) // pixels
  // Project sites to pixel space
  const projected = sites.map(s => ({ s, p: map.project([s.lat, s.lng], zoom) }))
  // Cluster by grid cell
  const buckets = new Map<string, { items: Site[]; center: [number, number] }>()
  for (const { s, p } of projected) {
    const key = `${Math.floor(p.x/cell)}:${Math.floor(p.y/cell)}`
    const b = buckets.get(key)
    if (!b) buckets.set(key, { items: [s], center: [p.x, p.y] })
    else { b.items.push(s); b.center = [(b.center[0]+p.x)/2, (b.center[1]+p.y)/2] }
  }
  const clusters = Array.from(buckets.values()).map(b => ({
    items: b.items,
    latlng: map.unproject(L.point(b.center[0], b.center[1]), zoom)
  }))

  const clusterIcon = (n:number) => {
    // Non-semaphore palette (indigo scale): popularity, not quality
    const colors = ['#c7d2fe','#a5b4fc','#818cf8','#6366f1','#4f46e5','#4338ca','#3730a3']
    const idx = Math.min(colors.length-1, Math.floor((n-1)/2))
    const size = 28 + Math.min(16, n*2)
    const html = `
      <div class="cluster-badge" style="
        width:${size}px;height:${size}px;line-height:${size}px;
        background:${colors[idx]};color:#fff;border-radius:9999px;
        text-align:center;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,0.2);">
        ${n}
      </div>`
    return L.divIcon({ html, className: '', iconSize: [size, size] })
  }
  return (
    <>
      {clusters.map((c, idx) => (
        c.items.length === 1 ? (
          <CircleMarker key={`site-${c.items[0].id}`} center={[c.latlng.lat, c.latlng.lng]} radius={7} pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.7 }}>
            <Popup>
              <SitePopup site={c.items[0]} onOpenMini={(e)=>{e?.domEvent?.stopPropagation?.(); onOpen(c.items[0])}} />
            </Popup>
          </CircleMarker>
        ) : (
          <Marker key={`cluster-${idx}`} position={[c.latlng.lat, c.latlng.lng]} icon={clusterIcon(c.items.length)}>
            <Popup>
              <div className="text-sm min-w-[200px]" onClick={(e)=>e.stopPropagation()}>
                <strong>{c.items.length} ubicaciones</strong>
                <ul className="max-h-36 overflow-auto mt-1 space-y-1">
                  {c.items.map(s => (
                    <li key={s.id} className="flex justify-between items-center gap-2">
                      <span>{s.name}</span>
                      <button className="btn btn-outline btn-sm" onClick={()=>onOpen(s)}>Mini mapa</button>
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </>
  )
}

function pctElapsed(contract?: { start: string; end: string }){
  if (!contract) return 0
  const s = new Date(contract.start).getTime()
  const e = new Date(contract.end).getTime()
  const now = Date.now()
  if (now <= s) return 0
  if (now >= e) return 1
  return (now - s) / (e - s)
}

function remainingTime(contract?: { start: string; end: string }){
  if (!contract) return { days: 0, hours: 0, minutes: 0 }
  const e = new Date(contract.end).getTime()
  let diffMs = Math.max(0, e - Date.now())
  const days = Math.floor(diffMs / (1000*60*60*24))
  diffMs -= days * (1000*60*60*24)
  const hours = Math.floor(diffMs / (1000*60*60))
  diffMs -= hours * (1000*60*60)
  const minutes = Math.floor(diffMs / (1000*60))
  return { days, hours, minutes }
}

function statusColor(p:number){
  // traffic light: green < 0.5, yellow < 0.85, red otherwise
  if (p < 0.5) return 'bg-green-500'
  if (p < 0.85) return 'bg-yellow-500'
  return 'bg-red-500'
}

function ClientFilter({ sites, selected, onToggle, onNotify, onRemove }: { sites: Site[]; selected: string[]; onToggle: (id:string)=>void; onNotify: (id:string)=>void; onRemove: (id:string)=>void }){
  return (
    <ul className="space-y-3 text-sm">
      {sites
        .slice()
        .sort((a,b)=>{
          const pa = pctElapsed(a.contract), pb = pctElapsed(b.contract)
          return pb - pa // show higher percentage first
        })
        .map(s => {
        const p = pctElapsed(s.contract)
        const rem = remainingTime(s.contract)
        const clr = statusColor(p)
        const checked = selected.includes(s.id)
        return (
          <li key={s.id} className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-stone-600" checked={checked} onChange={()=>onToggle(s.id)} />
              <span className="font-medium max-w-[140px] truncate" title={s.name}>{s.name}</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 rounded bg-stone-200 overflow-hidden" title={`Faltan ${rem.days}d ${rem.hours}h ${rem.minutes}m`}>
                <div className={`h-2 ${clr}`} style={{ width: `${Math.round(p*100)}%` }} />
              </div>
              <span className="text-xs text-stone-600">{Math.round(p*100)}%</span>
              <button className="inline-flex items-center rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-50" title="Notificar" onClick={()=>onNotify(s.id)}>
                📧
              </button>
              <button className="inline-flex items-center rounded-md border border-red-300 text-red-700 px-2 py-1 hover:bg-red-50" title="Eliminar" onClick={()=>onRemove(s.id)}>
                Eliminar
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function EnvelopeAnim(){
  return (
    <span className="relative inline-block w-6 h-5">
      <span className="absolute inset-0 rounded border border-stone-400 bg-white"></span>
      <span className="absolute left-0 right-0 top-0 h-1/2 border-b border-stone-400 bg-stone-100 origin-top transition-transform duration-700 ease-out" style={{ transform: 'rotateX(0deg)' }}></span>
      <span className="ml-2">Enviando…</span>
    </span>
  )
}
function daysSince(iso: string){
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (1000*60*60*24))
}

function formatRelative(iso: string){
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return iso
  const diffMs = dt.getTime() - Date.now()
  const absMinutes = Math.round(Math.abs(diffMs) / 60000)
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  if (absMinutes < 60) return rtf.format(Math.round(diffMs / 60000), 'minute')
  const absHours = Math.round(Math.abs(diffMs) / (60000 * 60))
  if (absHours < 24) return rtf.format(Math.round(diffMs / (60000 * 60)), 'hour')
  const days = Math.round(diffMs / (60000 * 60 * 24))
  return rtf.format(days, 'day')
}

function SitePopup({ site, onOpenMini }: { site: { id:string; name:string; lat:number; lng:number; assignedAt?:string; hives:{id:string; ingreso:string}[] }; onOpenMini: (e?: any) => void }){
  return (
    <div className="text-sm min-w-[260px]" onClick={(e)=>e.stopPropagation()}>
      <strong>{site.name}</strong>
      <div className="mt-1">{site.hives.length} panales</div>
      {site.assignedAt && <div className="text-xs text-stone-600">Asignado: {site.assignedAt} · {daysSince(site.assignedAt)}d de actividad</div>}
      <ul className="max-h-36 overflow-auto mt-1 space-y-1">
        {site.hives.map(h => (
          <li key={h.id} className="flex justify-between">
            <span>{h.id}</span>
            <span>{h.ingreso} · {daysSince(h.ingreso)}d</span>
          </li>
        ))}
      </ul>
      <button className="btn btn-outline btn-sm mt-2" onClick={onOpenMini}>Ver mini mapa</button>
    </div>
  )
}

function MiniMapModal({ site, onClose, onConfirmSite }: { site: Site; onClose: () => void; onConfirmSite: (id:string, lat:number, lng:number) => void }){
  // Deterministic positions in circular pattern
  const radius = 0.0006 // ~60m
  const LKEY = 'bp360_site_layouts'
  const layouts = (() => { try { return JSON.parse(localStorage.getItem(LKEY) || '{}') } catch { return {} } })() as Record<string, Record<string, {lat:number; lng:number}>>
  const saved = layouts[site.id] || {}
  const basePositions = site.hives.map((h, idx) => {
    const angle = (idx / site.hives.length) * 2 * Math.PI
    const plat = site.lat + radius * Math.sin(angle)
    const plng = site.lng + radius * Math.cos(angle)
    return { id: h.id, lat: plat, lng: plng }
  })
  // Merge saved positions for base hives and include any extra hives saved that aren't in base
  const baseIds = new Set(basePositions.map(p => p.id))
  const positions = [
    ...basePositions.map(p => saved[p.id] ? { ...p, ...saved[p.id] } : p),
    ...Object.keys(saved)
      .filter(id => !baseIds.has(id))
      .map(id => ({ id, lat: saved[id].lat, lng: saved[id].lng }))
  ]
  useEffect(()=>{
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  },[])
  const [form, setForm] = useState<{name:string,lat:number|null,lng:number|null}>({ name: '', lat: null, lng: null })
  const [hives, setHives] = useState(positions)
  const [pending, setPending] = useState<{name:string,lat:number,lng:number} | null>(null)
  const [confirmToast, setConfirmToast] = useState<string>('')
  const [toastPhase, setToastPhase] = useState<'hidden'|'enter'|'exit'>('hidden')
  const toastTimers = useRef<number[]>([])
  const [sitePreview, setSitePreview] = useState<{lat:number; lng:number} | null>(null)
  // Map click handler to fill lat/lng
  const mapRef = useRef<any>(null)
  const handleMapClick = (e:any) => {
    const { lat, lng } = e.latlng
    if (site.pendingSite) {
      // First choose site location; do not increment counters yet
      setSitePreview({ lat, lng })
      return
    }
    // If this is a newly confirmed CUST site, do not allow adding extra hives (limit to requested)
  if (site.lockExtras) return
    // Suggest next name C-### per site without incrementing yet
    const CKEY = 'bp360_site_counters'
    let nextName = ''
    try {
      const counters = JSON.parse(localStorage.getItem(CKEY) || '{}') as Record<string, number>
      const n = (counters[site.id] ?? 100) + 1
      nextName = `C-${n}`
    } catch {
      nextName = `C-${Math.floor(Math.random()*900)+100}`
    }
    setForm({ name: nextName, lat, lng })
    setPending({ name: nextName, lat, lng })
  }
  useEffect(() => {
    const map = mapRef.current
    if (map) {
      map.on('click', handleMapClick)
      return () => { map.off('click', handleMapClick) }
    }
  }, [mapRef.current])
  // Register new hive
  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'name' ? value : parseFloat(value) }))
  }
  const handleRegister = (e: FormEvent) => {
    e.preventDefault()
    if (form.lat == null || form.lng == null) return
    const newId = form.name.trim() ? form.name.trim() : ('C-' + (Math.floor(Math.random()*900)+100))
    const newHive = { id: newId, lat: form.lat, lng: form.lng }
    setHives(prev => {
      const updated = [...prev, newHive]
      // persist
      const layouts = (() => { try { return JSON.parse(localStorage.getItem(LKEY) || '{}') } catch { return {} } })() as Record<string, any>
      const siteLayout = layouts[site.id] || {}
      siteLayout[newId] = { lat: form.lat, lng: form.lng }
      layouts[site.id] = siteLayout
      try { localStorage.setItem(LKEY, JSON.stringify(layouts)) } catch {}
      return updated
    })
    // increment counter only on confirm
    try {
      const CKEY = 'bp360_site_counters'
      const counters = JSON.parse(localStorage.getItem(CKEY) || '{}') as Record<string, number>
      counters[site.id] = (counters[site.id] ?? 100) + 1
      localStorage.setItem(CKEY, JSON.stringify(counters))
    } catch {}
    setForm({ name: '', lat: null, lng: null })
    setPending(null)
    // Toast enter then exit
    setConfirmToast(`Colmena ${newId} registrada`)
    setToastPhase('enter')
    // clear previous timers
    toastTimers.current.forEach(id => window.clearTimeout(id))
    toastTimers.current = []
    const t1 = window.setTimeout(()=> setToastPhase('exit'), 1800)
    const t2 = window.setTimeout(()=> { setConfirmToast(''); setToastPhase('hidden') }, 1800 + 650)
    toastTimers.current.push(t1, t2)
  }

  const handleDelete = (id:string) => {
    // only remove if it's an extra (not base)
    const layouts = (() => { try { return JSON.parse(localStorage.getItem(LKEY) || '{}') } catch { return {} } })() as Record<string, any>
    const baseIds = new Set(site.hives.map(h => h.id))
    if (baseIds.has(id)) return
    // update state
    setHives(prev => prev.filter(h => h.id !== id))
    // update storage
    const siteLayout = layouts[site.id] || {}
    delete siteLayout[id]
    layouts[site.id] = siteLayout
    try { localStorage.setItem(LKEY, JSON.stringify(layouts)) } catch {}
  }
  return createPortal(
    <div className="modal-overlay bg-black/40 grid place-items-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="card w-[92vw] max-w-2xl p-4 relative z-[10000]" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold truncate max-w-[60%]" title={site.name}>{site.name} · distribución referencial</h3>
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={()=>{
              if (site.pendingSite) {
                // Cancel creation: just close modal without persisting anything
                onClose()
                return
              }
              try {
                const layouts = JSON.parse(localStorage.getItem(LKEY) || '{}') as Record<string, any>
                delete layouts[site.id]
                localStorage.setItem(LKEY, JSON.stringify(layouts))
              } catch {}
              setHives(basePositions)
              setForm({ name: '', lat: null, lng: null })
              setSitePreview(null)
            }}>{site.pendingSite ? 'Cancelar' : 'Reset'}</button>
            <button className="btn btn-outline btn-sm" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        {site.pendingSite ? (
          <div className="mb-2 text-sm text-stone-600">Haz click en el mini mapa para proponer la ubicación del cliente y luego presiona Confirmar.</div>
        ) : (
          !site.id.startsWith('CUST-') && (
            <form className="mb-3" onSubmit={handleRegister}>
              <div className="font-semibold mb-1">Registrar colmena por coordenadas</div>
              <div className="flex gap-2 mb-1">
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="Nombre" className="input input-bordered w-24" />
                <input name="lat" value={form.lat ?? ''} onChange={handleFormChange} placeholder="Latitud" className="input input-bordered w-20" type="number" step="0.0001" />
                <input name="lng" value={form.lng ?? ''} onChange={handleFormChange} placeholder="Longitud" className="input input-bordered w-20" type="number" step="0.0001" />
                <button className="btn btn-primary" type="submit">Registrar</button>
              </div>
              <div className="text-xs text-stone-500">Haz click en el mini mapa para autocompletar nombre/lat/lng y ver un pin de vista previa. Presiona Registrar para confirmar.</div>
            </form>
          )
        )}

        <div className="h-[360px] rounded overflow-hidden">
          <MapContainer ref={mapRef} center={[site.lat, site.lng]} zoom={17} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {!site.pendingSite && (
              <CircleMarker center={[site.lat, site.lng]} radius={8} pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.6 }} />
            )}
            {!site.pendingSite && hives.map(p => (
              <DraggableHive key={p.id} id={p.id} lat={p.lat} lng={p.lng} canDelete={!site.hives.find(h=>h.id===p.id)} onDelete={handleDelete} onDragEnd={(lat:number,lng:number)=>{
                const layouts = (() => { try { return JSON.parse(localStorage.getItem(LKEY) || '{}') } catch { return {} } })() as Record<string, any>
                const siteLayout = layouts[site.id] || {}
                siteLayout[p.id] = { lat, lng }
                layouts[site.id] = siteLayout
                try { localStorage.setItem(LKEY, JSON.stringify(layouts)) } catch {}
              }} />
            ))}
            {site.pendingSite && sitePreview && (
              <CircleMarker center={[sitePreview.lat, sitePreview.lng]} radius={10} pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.6 }} />
            )}
            {!site.pendingSite && pending && (
              <CircleMarker center={[pending.lat, pending.lng]} radius={7} pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.6 }}>
                <Popup>
                  <div className="text-sm">
                    <div>Propuesta: <strong>{pending.name}</strong></div>
                    <div>Lat: {pending.lat.toFixed(5)}, Lng: {pending.lng.toFixed(5)}</div>
                    <div className="text-xs text-stone-600">Confirma con el botón Registrar.</div>
                  </div>
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>
        </div>

        {site.pendingSite && sitePreview && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-stone-600">Propuesta: Lat {sitePreview.lat.toFixed(5)}, Lng {sitePreview.lng.toFixed(5)}</div>
            <button
              className="btn btn-primary"
              onClick={(e)=>{
                e.preventDefault();
                onConfirmSite(site.id, sitePreview.lat, sitePreview.lng);
                setSitePreview(null);
                setConfirmToast('Ubicación confirmada');
                setToastPhase('enter');
                setTimeout(()=>setToastPhase('exit'), 1400);
                setTimeout(()=>setToastPhase('hidden'), 2100);
              }}
            >Confirmar</button>
          </div>
        )}

        {toastPhase !== 'hidden' && (
          <div className={`absolute left-1/2 -translate-x-1/2 bottom-6 bg-green-100 text-green-900 border border-green-300 rounded-2xl px-6 py-4 shadow-xl text-lg ${toastPhase==='enter' ? 'toast-enter' : 'toast-exit'}`}>
            <div className="flex items-center gap-3">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-semibold">{confirmToast}</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// Simple card to trigger navigation to full client registration
function NewClientCard({ onCreate }: { onCreate: () => void }){
  return (
    <div className="card p-4">
      <h2 className="font-semibold mb-2">Nuevo cliente</h2>
      <button className="btn btn-primary" onClick={onCreate}>Crear cliente</button>
      <p className="text-xs text-stone-500 mt-2">Solo datos personales. El contrato y el GPS se asignan después.</p>
    </div>
  )
}

function NewClientModal({ onClose, onSaved }: { onClose: () => void; onSaved: (client: Client) => void }){
  const [form, setForm] = useState<Client>({ id: 'CL-'+Math.random().toString(36).slice(2,8).toUpperCase(), firstName: '', lastName: '' })
  const canSave = !!form.firstName.trim() && !!form.lastName.trim() && (!!form.phone?.trim() || !!form.email?.trim())
  const save = () => {
    if (!canSave) return
    const list = safeGet('bp360_clients', [] as Client[])
    safeSet('bp360_clients', [...list, form])
    onSaved(form)
    onClose()
  }
  return createPortal(
    <div className="modal-overlay bg-black/40 grid place-items-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="card w-[92vw] max-w-xl p-4" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Registrar cliente</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cerrar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs text-stone-600">Nombre</label>
            <input className="input input-bordered w-full" value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">Apellido</label>
            <input className="input input-bordered w-full" value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">DNI</label>
            <input className="input input-bordered w-full" value={form.dni||''} onChange={e=>setForm({...form, dni: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">Celular</label>
            <input className="input input-bordered w-full" value={form.phone||''} onChange={e=>setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">Correo</label>
            <input className="input input-bordered w-full" value={form.email||''} onChange={e=>setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">País</label>
            <input className="input input-bordered w-full" value={form.country||''} onChange={e=>setForm({...form, country: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs text-stone-600">Lugar de nacimiento</label>
            <input className="input input-bordered w-full" value={form.birthplace||''} onChange={e=>setForm({...form, birthplace: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-stone-600">Dirección</label>
            <input className="input input-bordered w-full" value={form.address||''} onChange={e=>setForm({...form, address: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-stone-600">Notas</label>
            <textarea className="input input-bordered w-full h-24" value={form.notes||''} onChange={e=>setForm({...form, notes: e.target.value})} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={save}>Guardar</button>
        </div>
        {!canSave && (
          <p className="text-xs text-red-600 mt-2">Nombre y Apellido son obligatorios. Debe ingresar al menos uno: Celular o Correo.</p>
        )}
      </div>
    </div>,
    document.body
  )
}



function DraggableHive({ id, lat, lng, onDragEnd, canDelete, onDelete }: { id: string; lat:number; lng:number; onDragEnd?: (lat:number,lng:number) => void; canDelete?: boolean; onDelete?: (id:string)=>void }){
  const [pos, setPos] = useState<[number, number]>([lat, lng])
  return (
    <Marker position={pos} draggable eventHandlers={{ dragend: (e:any)=>{
      const m = e.target
      const p = m.getLatLng()
      setPos([p.lat, p.lng])
      onDragEnd?.(p.lat, p.lng)
    }}}>
      <Popup>
        <div className="text-sm">
          <strong>{id}</strong>
          <div>Lat: {pos[0].toFixed(6)}</div>
          <div>Lng: {pos[1].toFixed(6)}</div>
          <div className="text-xs text-stone-600">Arrástrame para simular reubicación</div>
          {canDelete && (
            <button className="mt-2 inline-flex items-center gap-1 rounded-md border border-red-300 text-red-700 hover:bg-red-50 px-2 py-1 text-xs"
              onClick={(e)=>{ e.preventDefault(); onDelete?.(id) }}>
              Eliminar
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
// helper inside component via closure
// Note: This shadowed name is referenced in JSX above through closure; ensure it's defined in component scope.
