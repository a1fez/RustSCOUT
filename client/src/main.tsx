import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { StatsDashboard } from './pages/stats/statsDashboard.tsx'

// Приватный дашборд метрик. Открывается ТОЛЬКО по этому секретному хэшу и нигде
// не линкуется. Смени строку на свою и никому не показывай.
// Пример: http://localhost:5173/#rs-metrics-2f9c1a
const STATS_HASH = '#rs-metrics-2f9c1a'

const isStatsRoute = window.location.hash === STATS_HASH

// Песочница модалки игрока на моках — только в `npm run dev`.
// import.meta.env.DEV в прод-сборке = false, и Vite выкидывает этот чанк целиком.
// http://localhost:5173/#modal-sandbox
const ModalSandbox = import.meta.env.DEV
  ? lazy(() => import('./dev/modalSandbox').then((m) => ({ default: m.ModalSandbox })))
  : null
const isSandboxRoute = ModalSandbox !== null && window.location.hash === '#modal-sandbox'

// Маршрут выбирается один раз при загрузке — при ручной смене хэша перезагружаем страницу
window.addEventListener('hashchange', () => window.location.reload())

const page = isStatsRoute
  ? <StatsDashboard />
  : isSandboxRoute && ModalSandbox
  ? <Suspense fallback={null}><ModalSandbox /></Suspense>
  : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {page}
  </StrictMode>,
)
