# BeePoliniza 360 (SPA)

Prototipo front‑end (React + Vite + Tailwind) compatible con GitHub Pages que demuestra:

- PolinizaYa (Marketplace) con filtros y checkout simulado (PDF)
- BeeTrack 360 con IoT simulado (Leaflet + alertas + gráficos placeholder)
- Perfiles, contratos demo (Cerro Prieto), y administración ligera con LocalStorage

## Requisitos

- Node.js 18+

## Desarrollo

```powershell
npm install
npm run dev
```

Abrir http://localhost:5173/#/

## Build y deploy (Pages)

- Edita `vite.config.ts` y define `base: "/<nombre-repo>/"` para Pages.
- Usa HashRouter (ya configurado) para evitar 404.
- Build:

```powershell
npm run build
npm run preview
```

- Publica `dist/` en `gh-pages` o configura GitHub Actions (pendiente en este repo).

## Datos y persistencia

- JSON estáticos en `/data/*`
- Estado temporal en LocalStorage (`bp360_*`) y SessionStorage para checkout.

## Licencias

- Mapas: OpenStreetMap/Leaflet, librerías MIT/OSS.

## TODO (MVP+)

- Gráficas con Chart.js y buffer de 60 puntos.
- Reputación: promedio + histograma, nueva reseña a LocalStorage.
- Métricas de demo y SEO básico (sitemap, og:url).
