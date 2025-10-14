export default function FAQ(){
  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Ayuda / FAQ</h1>
      <div className="space-y-3 text-sm">
        <details className="card p-4">
          <summary className="font-medium cursor-pointer">¿Qué es BeePoliniza 360?</summary>
          <p className="mt-2 text-stone-700">Un prototipo de marketplace de polinización y tablero de monitoreo simulado.</p>
        </details>
        <details className="card p-4">
          <summary className="font-medium cursor-pointer">¿Hay pagos o contratos reales?</summary>
          <p className="mt-2 text-stone-700">No, todo es demostrativo. La orden PDF carece de validez contractual.</p>
        </details>
      </div>
    </section>
  )
}
