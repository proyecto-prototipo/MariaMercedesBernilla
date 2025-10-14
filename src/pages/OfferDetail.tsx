import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type Listing = {
  id: string; apicultorId: string; titulo: string; cultivos: string[]; region: string;
  precioPorColmena: number; ventanaServicio: { desde: string; hasta: string };
  fuerza: string; estadoSanitario: string; rating: number; fotos: string[]; capacidadColmenas: number
}

export default function OfferDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const [item, setItem] = useState<Listing|undefined>()
  const [colmenas, setColmenas] = useState(50)
  const [cultivoSel, setCultivoSel] = useState('')
  const [superficie, setSuperficie] = useState<number | ''>('')
  const [recomendado, setRecomendado] = useState<number | null>(null)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  useEffect(() => {
    fetch('data/listings.json').then(r=>r.json()).then(json => {
      const f = json.listings.find((l: Listing) => l.id === id)
      setItem(f)
      setCultivoSel(f?.cultivos?.[0] || '')
    })
  }, [id])

  useEffect(()=>{
    if (!cultivoSel || !superficie) { setRecomendado(null); return }
    fetch('data/products.json').then(r=>r.json()).then(json => {
      const p = json.products.find((x: any) => x.cultivo === cultivoSel)
      if (p) {
        const sugerida = Math.ceil((p.recomendado || 0) * Number(superficie))
        setRecomendado(sugerida)
        if (sugerida > 0) setColmenas(sugerida)
      } else {
        setRecomendado(null)
      }
    })
  }, [cultivoSel, superficie])

  if (!item) return <div className="max-w-3xl mx-auto p-6">Cargando…</div>

  const total = colmenas * item.precioPorColmena
  const canCheckout = desde && hasta && colmenas>0

  const goCheckout = () => {
    sessionStorage.setItem('bp360_checkout', JSON.stringify({
      ofertaId: item.id,
      titulo: item.titulo,
      region: item.region,
      apicultorId: item.apicultorId,
      colmenas,
      fechas:{desde, hasta},
      precioUnitario: item.precioPorColmena,
      total,
      cultivo: cultivoSel,
      superficieHa: superficie || undefined,
      recomendado: recomendado || undefined
    }))
    nav('/checkout')
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="aspect-video bg-stone-100 rounded-2xl mb-4" />
        <h1 className="text-2xl font-semibold mb-2">{item.titulo}</h1>
        <p className="text-sm text-stone-600 mb-4">{item.region} · {item.cultivos.join(', ')} · ⭐ {item.rating}</p>
        <div className="prose max-w-none text-sm">
          <p>Fuerza: {item.fuerza}. Estado sanitario: {item.estadoSanitario}. Ventana: {item.ventanaServicio.desde} → {item.ventanaServicio.hasta}.</p>
          <p>SLA y políticas sanitarias simuladas para el MVP.</p>
        </div>
      </div>
      <aside className="card p-4 h-fit sticky top-20">
        <p className="font-semibold mb-2">S/ {item.precioPorColmena} por colmena</p>
        <label className="block text-sm mb-1">Cultivo</label>
        <select className="w-full border rounded-lg px-3 py-2 mb-3" value={cultivoSel} onChange={e=>setCultivoSel(e.target.value)}>
          {item.cultivos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="block text-sm mb-1">Superficie (ha)</label>
        <input type="number" min={0} className="w-full border rounded-lg px-3 py-2 mb-1" value={superficie} onChange={e=>setSuperficie(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} />
        {recomendado !== null && (
          <p className="text-xs text-stone-600 mb-2">Sugerencia para {cultivoSel}: <strong>{recomendado}</strong> colmenas</p>
        )}
        <label className="block text-sm mb-1">Colmenas</label>
        <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 mb-3" value={colmenas} onChange={e=>setColmenas(Math.max(1, Number(e.target.value)))} />
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-sm mb-1">Desde</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={desde} onChange={e=>setDesde(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Hasta</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={hasta} onChange={e=>setHasta(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between mb-3 text-sm">
          <span>Total</span>
          <strong>S/ {total.toFixed(2)}</strong>
        </div>
        <button className="btn btn-primary w-full" onClick={goCheckout} disabled={!canCheckout}>Solicitar colmenas</button>
      </aside>
    </section>
  )
}
