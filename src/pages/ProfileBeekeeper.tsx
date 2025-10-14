import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { safeGet, safeSet } from '../utils/storage'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Review = { id:string; apicultorId:string; autor:string; rating:number; comentario:string; fecha:string }

export default function ProfileBeekeeper(){
  const { id } = useParams()
  const [seed, setSeed] = useState<Review[]>([])
  const [form, setForm] = useState({ autor:'', rating: 5, comentario:'' })

  const locals = safeGet<Review[]>('bp360_reviews_local', [])

  useEffect(()=>{
    fetch('data/reviews.json').then(r=>r.json()).then(json=> setSeed(json.reviews))
  },[])

  const reviews = useMemo(()=>{
    const base = (seed || []).filter(r => r.apicultorId === id)
    const extra = (locals || []).filter(r => r.apicultorId === id)
    return [...base, ...extra]
  }, [seed, locals, id])

  const avg = useMemo(()=> reviews.length? (reviews.reduce((s,r)=> s + r.rating, 0) / reviews.length).toFixed(2) : '—', [reviews])
  const hist = useMemo(()=>{
    const buckets = [0,0,0,0,0]
    reviews.forEach(r => { const i = Math.max(1, Math.min(5, Math.round(r.rating))) - 1; buckets[i] += 1 })
    return buckets
  }, [reviews])

  const submit = () => {
    if (!id) return
    if (!form.autor || form.comentario.length < 3) return alert('Completa autor y comentario')
    const entry: Review = {
      id: `R-${Date.now()}`,
      apicultorId: id,
      autor: form.autor,
      rating: Number(form.rating),
      comentario: form.comentario,
      fecha: new Date().toISOString().slice(0,10)
    }
    const next = [entry, ...locals]
    safeSet('bp360_reviews_local', next)
    setForm({ autor:'', rating: 5, comentario:'' })
    alert('Gracias por tu reseña (guardada en LocalStorage).')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-semibold mb-2">Apicultor {id}</h1>
        <p className="text-stone-700 mb-4">Promedio: <strong>{avg}</strong> · {reviews.length} reseñas</p>
        <div className="card p-4 mb-4">
          <h3 className="font-semibold mb-2">Distribución de ratings</h3>
          <Bar data={{
            labels: ['1','2','3','4','5'],
            datasets: [{ label: 'N reseñas', data: hist, backgroundColor: '#F6C445' }]
          }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
        </div>
        <ul className="space-y-3">
          {reviews.map(r => (
            <li key={r.id} className="card p-3 text-sm">
              <div className="flex justify-between">
                <strong>{r.autor}</strong>
                <span>⭐ {r.rating}</span>
              </div>
              <p className="text-stone-700 mt-1">{r.comentario}</p>
              <span className="text-stone-500">{r.fecha}</span>
            </li>
          ))}
        </ul>
      </div>
      <aside className="card p-4 h-fit">
        <h2 className="font-semibold mb-3">Agregar reseña</h2>
        <input className="border rounded px-3 py-2 w-full mb-2" placeholder="Tu nombre" value={form.autor} onChange={e=>setForm({...form, autor:e.target.value})} />
        <select className="border rounded px-3 py-2 w-full mb-2" value={form.rating} onChange={e=>setForm({...form, rating: Number(e.target.value)})}>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <textarea className="border rounded px-3 py-2 w-full mb-3" rows={4} placeholder="Comentario" value={form.comentario} onChange={e=>setForm({...form, comentario:e.target.value})} />
        <button className="btn btn-primary w-full" onClick={submit}>Enviar</button>
      </aside>
    </div>
  )
}
