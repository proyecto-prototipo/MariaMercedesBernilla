export default function Footer() {
  return (
    <footer className="border-t mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-stone-600 flex flex-col md:flex-row items-center justify-between gap-2">
        <p>
          BeePoliniza 360 · Demo educativa. Sin datos personales reales.
        </p>
        <nav className="flex gap-4">
          <a href="#/faq" className="hover:underline">FAQ</a>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:underline">© OSM</a>
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:underline">GitHub Pages</a>
        </nav>
      </div>
    </footer>
  )
}
