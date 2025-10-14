import { useEffect, useMemo, useState } from 'react'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

export default function Metrics(){
  const [contracts, setContracts] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(()=>{
    Promise.all([
      fetch('data/contracts.json').then(r=>r.json()),
    ]).then(([c])=>{
      setContracts(c.contracts)
    })
    const a = JSON.parse(localStorage.getItem('bp360_alerts') || '[]')
    setAlerts(a)
  },[])

  const hours = Array.from({length:24}, (_,i)=> i)
  const conversions = hours.map(()=> Math.floor(Math.random()*5))
  const convLabels = hours.map(h=> `${h}:00`)

  const alertsByContract = useMemo(()=>{
    const map: Record<string, number> = {}
    alerts.forEach(a => map[a.hiveId?.split('-')[1] ? 'CTR-CP-2025' : 'CTR-CP-2025'] = (map['CTR-CP-2025']||0)+1) // simple demo mapping
    return contracts.map(c => ({ id: c.id, n: map[c.id] || Math.floor(Math.random()*10) }))
  }, [contracts, alerts])

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Métricas (demo)</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Conversiones simuladas (24h)</h2>
          <Line data={{ labels: convLabels, datasets: [{ label: 'Cotizaciones', data: conversions, borderColor: '#0FA958', backgroundColor: 'rgba(15,169,88,0.2)', tension: 0.3 }] }} options={{ responsive:true, plugins:{ legend:{ display: true } } }} />
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Alertas por contrato (demo)</h2>
          <Bar data={{ labels: alertsByContract.map(a=>a.id), datasets: [{ label: 'Alertas', data: alertsByContract.map(a=>a.n), backgroundColor: '#F59E0B' }] }} options={{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }} />
        </div>
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Distribución de roles simulada</h2>
        <Doughnut data={{ labels: ['Invitados', 'Agricultores', 'Apicultores'], datasets: [{ data: [60, 25, 15], backgroundColor: ['#D1D5DB','#60A5FA','#F6C445'] }] }} options={{ responsive:true }} />
      </div>
    </section>
  )
}
