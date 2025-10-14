import { useEffect, useMemo, useState } from 'react'
import { safeGet } from '../utils/storage'
import { Link } from 'react-router-dom'

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

export default function Marketplace() {
  const [data, setData] = useState<Listing[]>([])
  const [cultivo, setCultivo] = useState('')
  const [region, setRegion] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [order, setOrder] = useState<'precio'|'rating'>('precio')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [fuerza, setFuerza] = useState('')
  const [sanidad, setSanidad] = useState('')

  useEffect(() => {
    fetch('data/listings.json').then(r=>r.json()).then(json=>{
      const locals: Listing[] = safeGet<Listing[]>('bp360_listings_local', [])
      setData([...(json.listings as Listing[]), ...locals])
    })
  }, [])

  const filtered = useMemo(() => {
    let r = data
    if (cultivo) r = r.filter(l => l.cultivos.includes(cultivo))
    if (region) r = r.filter(l => l.region === region)
    if (min) r = r.filter(l => l.precioPorColmena >= Number(min))
    if (max) r = r.filter(l => l.precioPorColmena <= Number(max))
    if (fuerza) r = r.filter(l => l.fuerza === fuerza)
    if (sanidad) r = r.filter(l => l.estadoSanitario === sanidad)
    if (desde || hasta) {
      const inRange = (lv:{desde:string; hasta:string}) => {
        const sd = desde ? new Date(desde) : null
        const sh = hasta ? new Date(hasta) : null
        const ld = new Date(lv.desde)
        const lh = new Date(lv.hasta)
        const afterStart = sd ? lh >= sd : true
        const beforeEnd = sh ? ld <= sh : true
        return afterStart && beforeEnd
      }
      r = r.filter(l => inRange(l.ventanaServicio))
    }
    if (order === 'precio') r = [...r].sort((a,b)=> a.precioPorColmena - b.precioPorColmena)
    if (order === 'rating') r = [...r].sort((a,b)=> b.rating - a.rating)
    return r
  }, [data, cultivo, region, min, max, fuerza, sanidad, desde, hasta, order])

  const regions = useMemo(() => Array.from(new Set(data.map(d=>d.region))), [data])
  const cultivos = useMemo(() => Array.from(new Set(data.flatMap(d=>d.cultivos))), [data])

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Marketplace · PolinizaYa</h1>
      <div className="card p-4 mb-6 grid md:grid-cols-6 gap-3">
        <select className="border rounded-lg px-3 py-2" value={cultivo} onChange={e=>setCultivo(e.target.value)} aria-label="Cultivo">
          <option value="">Cultivo</option>
          {cultivos.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2" value={region} onChange={e=>setRegion(e.target.value)} aria-label="Región">
          <option value="">Región</option>
          {regions.map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
        <input className="border rounded-lg px-3 py-2" placeholder="Precio min" value={min} onChange={e=>setMin(e.target.value)} />
        <input className="border rounded-lg px-3 py-2" placeholder="Precio max" value={max} onChange={e=>setMax(e.target.value)} />
        <select className="border rounded-lg px-3 py-2" value={order} onChange={e=>setOrder(e.target.value as any)} aria-label="Ordenar">
          <option value="precio">Ordenar por precio</option>
          <option value="rating">Ordenar por rating</option>
        </select>
        <div className="hidden md:flex items-center justify-end text-sm text-stone-500">{filtered.length} resultados</div>
      </div>
      <div className="card p-4 mb-6 grid md:grid-cols-6 gap-3">
        <input type="date" className="border rounded-lg px-3 py-2" value={desde} onChange={e=>setDesde(e.target.value)} aria-label="Desde" />
        <input type="date" className="border rounded-lg px-3 py-2" value={hasta} onChange={e=>setHasta(e.target.value)} aria-label="Hasta" />
        <select className="border rounded-lg px-3 py-2" value={fuerza} onChange={e=>setFuerza(e.target.value)} aria-label="Fuerza">
          <option value="">Fuerza</option>
          <option value="estándar">estándar</option>
          <option value="fuerte">fuerte</option>
        </select>
        <select className="border rounded-lg px-3 py-2" value={sanidad} onChange={e=>setSanidad(e.target.value)} aria-label="Estado sanitario">
          <option value="">Sanidad</option>
          <option value="sano">sano</option>
          <option value="observación">observación</option>
        </select>
        <div className="md:col-span-2 flex gap-2">
          <button className="btn btn-outline" onClick={()=>{ setCultivo(''); setRegion(''); setMin(''); setMax(''); setDesde(''); setHasta(''); setFuerza(''); setSanidad(''); }}>Limpiar</button>
        </div>
      </div>
      <p className="text-sm text-stone-600 mb-3">Resultados: {filtered.length}</p>
      <div className="grid md:grid-cols-3 gap-4">
        {filtered.map(l => (
          <article key={l.id} className="card overflow-hidden transition-transform hover:scale-[1.01]">
            <div className="aspect-video bg-stone-100" aria-label="foto" />
            <div className="p-4">
              <h3 className="font-semibold mb-1">{l.titulo}</h3>
              <p className="text-sm text-stone-600 mb-2">{l.region} · {l.cultivos.join(', ')}</p>
              <p className="font-medium">S/ {l.precioPorColmena} por colmena</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm">⭐ {l.rating}</span>
                <Link to={`/offer/${l.id}`} className="btn btn-primary">Ver oferta</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
