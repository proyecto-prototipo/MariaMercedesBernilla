import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
          BeePoliniza 360
        </h1>
        <p className="text-stone-700 mb-6">
          Marketplace para polinización agrícola y BeeTrack 360 con monitoreo IoT simulado.
          100% front‑end, listo para GitHub Pages.
        </p>
        <div className="flex gap-3">
          <Link to="/market" className="btn btn-primary">Explorar ofertas</Link>
          <Link to="/beetrack" className="btn btn-outline">Ver BeeTrack 360</Link>
        </div>
      </div>
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="font-semibold mb-2">Marketplace (PolinizaYa)</h2>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li>Agricultores alquilan colmenas por hectárea.</li>
            <li>Apicultores ofertan disponibilidad con precios transparentes.</li>
            <li>Sistema de reputación y reseñas.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Gestión inteligente de colmenas (BeeTrack 360)</h2>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li>Sensores IoT: temperatura, humedad y actividad.</li>
            <li>Trazabilidad y monitoreo en tiempo real.</li>
            <li>Garantía de calidad en la polinización (umbrales y alertas).</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Flujos clave</h2>
          <ol className="list-decimal ml-5 text-sm space-y-1">
            <li>Cotizar por hectárea y generar PDF.</li>
            <li>Publicar oferta (rol: Apicultor) con precios visibles.</li>
            <li>Monitoreo, trazabilidad y alertas simuladas.</li>
          </ol>
        </div>
      </div>
    </section>
  )
}
