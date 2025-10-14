import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Contract = { id:string; cliente:string; ubicacion:string; colmenas:number; precioUnitario:number; montoTotal:number; fecha:string }

export default function Contracts(){
  const [data, setData] = useState<Contract[]>([])
  const nav = useNavigate()
  useEffect(()=>{
    fetch('data/contracts.json').then(r=>r.json()).then(json=>setData(json.contracts))
  },[])

  const cloneToCheckout = (c: Contract) => {
    sessionStorage.setItem('bp360_checkout', JSON.stringify({
      ofertaId: c.id,
      titulo: `Plantilla de ${c.cliente}`,
      apicultorId: 'N/A',
      region: c.ubicacion,
      colmenas: c.colmenas,
      fechas: { desde: c.fecha, hasta: c.fecha },
      precioUnitario: c.precioUnitario,
      total: c.montoTotal,
    }))
    nav('/checkout')
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Contratos demo</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {data.map(c => (
          <article key={c.id} className="card p-4">
            <h3 className="font-semibold mb-1">{c.cliente}</h3>
            <p className="text-sm text-stone-600 mb-3">{c.ubicacion} · {c.fecha}</p>
            <dl className="grid grid-cols-2 text-sm mb-3">
              <dt>Colmenas</dt><dd>{c.colmenas}</dd>
              <dt>Precio unitario</dt><dd>S/ {c.precioUnitario}</dd>
              <dt>Total</dt><dd className="font-semibold">S/ {c.montoTotal}</dd>
            </dl>
            <button className="btn btn-primary" onClick={()=>cloneToCheckout(c)}>Usar como plantilla</button>
          </article>
        ))}
      </div>
    </section>
  )
}
