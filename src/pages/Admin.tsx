import { useState } from 'react'
import { safeGet, safeSet } from '../utils/storage'
import { useRoleStore } from '../store/roleStore'

type Listing = {
  id: string
  apicultorId: string
  titulo: string
  cultivos: string[]
  region: string
  precioPorColmena: number
  ventanaServicio: { desde: string; hasta: string }
  fuerza: string
  estadoSanitario: string
  rating: number
  fotos: string[]
  capacidadColmenas: number
}

export default function Admin(){
  const { role, name } = useRoleStore()
  const [form, setForm] = useState<Listing>({
    id: `L-${Date.now()}`,
    apicultorId: name || 'A-LOCAL',
    titulo: '',
    cultivos: [],
    region: '',
    precioPorColmena: 100,
    ventanaServicio: { desde: '', hasta: '' },
    fuerza: 'estándar',
    estadoSanitario: 'sano',
    rating: 5,
    fotos: [],
    capacidadColmenas: 50,
  })

  const listings = safeGet<Listing[]>('bp360_listings_local', [])

  const publish = () => {
    if (role !== 'Apicultor') return alert('Solo apicultores pueden publicar (demo).')
    if (!form.titulo || !form.region || !form.ventanaServicio.desde || !form.ventanaServicio.hasta) {
      return alert('Completa título, región y fechas')
    }
    const next = [form, ...listings]
    safeSet('bp360_listings_local', next)
    alert('Publicada en catálogo (LocalStorage).')
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(listings, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'listings-local.json'
    a.click()
  }

  const importJSON = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const arr = JSON.parse(String(reader.result))
        safeSet('bp360_listings_local', arr)
        alert('Importado con éxito')
      } catch { alert('Archivo inválido') }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Administración (demo)</h1>
      <div className="card p-4 mb-6">
        <h2 className="font-semibold mb-3">Nueva oferta</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Título" value={form.titulo} onChange={e=>setForm({...form, titulo:e.target.value})} />
          <input className="border rounded px-3 py-2" placeholder="Región" value={form.region} onChange={e=>setForm({...form, region:e.target.value})} />
          <input className="border rounded px-3 py-2" placeholder="Cultivos (coma)" value={form.cultivos.join(',')} onChange={e=>setForm({...form, cultivos: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
          <input type="number" className="border rounded px-3 py-2" placeholder="Precio por colmena" value={form.precioPorColmena} onChange={e=>setForm({...form, precioPorColmena:Number(e.target.value)})} />
          <input type="date" className="border rounded px-3 py-2" value={form.ventanaServicio.desde} onChange={e=>setForm({...form, ventanaServicio:{...form.ventanaServicio, desde:e.target.value}})} />
          <input type="date" className="border rounded px-3 py-2" value={form.ventanaServicio.hasta} onChange={e=>setForm({...form, ventanaServicio:{...form.ventanaServicio, hasta:e.target.value}})} />
          <select className="border rounded px-3 py-2" value={form.fuerza} onChange={e=>setForm({...form, fuerza: e.target.value})}>
            <option value="estándar">estándar</option>
            <option value="fuerte">fuerte</option>
          </select>
          <input type="number" className="border rounded px-3 py-2" placeholder="Capacidad" value={form.capacidadColmenas} onChange={e=>setForm({...form, capacidadColmenas:Number(e.target.value)})} />
        </div>
        <div className="flex justify-end mt-4">
          <button className="btn btn-primary" onClick={publish} aria-label="Publicar oferta">Publicar</button>
        </div>
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Import/Export</h2>
        <div className="flex gap-3 items-center">
          <button className="btn btn-outline" onClick={exportJSON}>Exportar JSON</button>
          <label className="btn btn-outline">
            Importar JSON
            <input type="file" accept="application/json" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) importJSON(f)}} />
          </label>
        </div>
      </div>
    </div>
  )
}
