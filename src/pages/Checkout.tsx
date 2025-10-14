import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateOrderPDF } from '../utils/pdf'
import { useRoleStore } from '../store/roleStore'

export default function Checkout(){
  const nav = useNavigate()
  const { name } = useRoleStore()
  const [data, setData] = useState<any>(null)
  const [done, setDone] = useState(false)

  useEffect(()=>{
    const raw = sessionStorage.getItem('bp360_checkout')
    if (!raw) return nav('/market')
    setData(JSON.parse(raw))
  }, [nav])

  if (!data) return null

  const confirm = () => {
    generateOrderPDF({
      ofertaId: data.ofertaId,
      titulo: data.titulo,
      apicultor: data.apicultorId,
      fechas: data.fechas,
      region: data.region,
      colmenas: data.colmenas,
      precioUnitario: data.precioUnitario,
      total: data.total,
      cultivo: data.cultivo,
      superficieHa: data.superficieHa,
      recomendado: data.recomendado,
      comprador: name || 'Invitado'
    })
    // save to farmer history
    const key = 'bp360_farmer_history'
    const hist = JSON.parse(localStorage.getItem(key) || '[]')
    hist.push({
      id: `SO-${Date.now()}`,
      ofertaId: data.ofertaId,
      titulo: data.titulo,
      region: data.region,
      fechas: data.fechas,
      colmenas: data.colmenas,
      precioUnitario: data.precioUnitario,
      total: data.total,
      cultivo: data.cultivo,
      superficieHa: data.superficieHa,
      recomendado: data.recomendado,
      comprador: name || 'Invitado',
      ts: Date.now(),
    })
    localStorage.setItem(key, JSON.stringify(hist))
    sessionStorage.removeItem('bp360_checkout')
    setDone(true)
  }

  if (done) return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="card p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">¡Solicitud confirmada!</h1>
        <p className="text-stone-600 mb-4">Se descargó un PDF con el resumen de la orden (simulado).</p>
        <button className="btn btn-primary" onClick={()=>nav('/market')}>Volver al marketplace</button>
      </div>
    </div>
  )

  return (
    <section className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Checkout (simulado)</h1>
      <div className="card p-6">
        <dl className="grid grid-cols-2 gap-2 text-sm mb-4">
          <dt className="text-stone-600">Oferta</dt><dd>{data.titulo} ({data.ofertaId})</dd>
          <dt className="text-stone-600">Región</dt><dd>{data.region}</dd>
          <dt className="text-stone-600">Fechas</dt><dd>{data.fechas.desde} → {data.fechas.hasta}</dd>
          {data.cultivo && (<><dt className="text-stone-600">Cultivo</dt><dd>{data.cultivo}</dd></>)}
          {data.superficieHa && (<><dt className="text-stone-600">Superficie</dt><dd>{data.superficieHa} ha</dd></>)}
          {data.recomendado && (<><dt className="text-stone-600">Sugerido</dt><dd>{data.recomendado} colmenas</dd></>)}
          <dt className="text-stone-600">Colmenas</dt><dd>{data.colmenas}</dd>
          <dt className="text-stone-600">Precio unitario</dt><dd>S/ {data.precioUnitario}</dd>
          <dt className="text-stone-600">Total</dt><dd className="font-semibold">S/ {data.total}</dd>
        </dl>
        <div className="flex justify-end gap-2">
          <button className="btn btn-outline" onClick={()=>nav(-1)}>Atrás</button>
          <button className="btn btn-primary" onClick={confirm}>Confirmar y descargar PDF</button>
        </div>
      </div>
    </section>
  )
}
