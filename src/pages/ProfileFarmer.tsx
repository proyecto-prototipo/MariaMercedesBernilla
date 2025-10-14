import { useEffect, useMemo, useState } from 'react'

type Order = { id:string; ofertaId:string; titulo:string; region:string; fechas:{desde:string; hasta:string}; colmenas:number; precioUnitario:number; total:number; comprador:string; ts:number }

export default function ProfileFarmer(){
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(()=>{
    const raw = localStorage.getItem('bp360_farmer_history')
    setOrders(raw ? JSON.parse(raw) : [])
  },[])

  const total = useMemo(()=> orders.reduce((s,o)=> s + (o.total||0), 0), [orders])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Perfil de Agricultor</h1>
      <div className="card p-4">
        <div className="grid md:grid-cols-3 text-sm">
          <div><div className="text-stone-500">Solicitudes</div><div className="font-semibold">{orders.length}</div></div>
          <div><div className="text-stone-500">Colmenas</div><div className="font-semibold">{orders.reduce((s,o)=> s + (o.colmenas||0), 0)}</div></div>
          <div><div className="text-stone-500">Total</div><div className="font-semibold">S/ {total}</div></div>
        </div>
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Historial</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-stone-500">
              <tr><th>Fecha</th><th>Oferta</th><th>Región</th><th>Colmenas</th><th>Total</th></tr>
            </thead>
            <tbody>
              {orders.slice().reverse().map(o => (
                <tr key={o.id} className="border-t">
                  <td>{new Date(o.ts).toLocaleDateString()}</td>
                  <td>{o.titulo}</td>
                  <td>{o.region}</td>
                  <td>{o.colmenas}</td>
                  <td>S/ {o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
