import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { StatsDashboard } from './pages/stats/statsDashboard.tsx'

// Приватный дашборд метрик. Открывается ТОЛЬКО по этому секретному хэшу и нигде
// не линкуется. Смени строку на свою и никому не показывай.
// Пример: http://localhost:5173/#rs-metrics-2f9c1a
const STATS_HASH = '#rs-metrics-2f9c1a'

const isStatsRoute = window.location.hash === STATS_HASH

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isStatsRoute ? <StatsDashboard /> : <App />}
  </StrictMode>,
)
