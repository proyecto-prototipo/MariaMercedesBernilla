import { Link } from 'react-router-dom'

export default function NotFound(){
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-stone-600 mb-6">Página no encontrada.</p>
      <Link className="btn btn-primary" to="/">Ir al inicio</Link>
    </div>
  )
}
