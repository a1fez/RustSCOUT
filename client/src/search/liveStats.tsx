import './liveStats.css';

// ВРЕМЕННО: цифры-заглушки для визуала. Дальше — свой эндпоинт
// (число серверов в опросе скрапера + игроков в Redis), опрос раз в 30–60 с.
const MOCK_STATS = { servers: 300, players: 63418, updatedSecAgo: 12 };

const formatNumber = (n: number) => n.toLocaleString('ru-RU');

interface LiveStatsProps {
  hidden?: boolean; // на месте строки показывается ошибка поиска — не перекрываем её
}

export const LiveStats = ({ hidden = false }: LiveStatsProps) => (
  <div className={`liveStats ${hidden ? 'isHidden' : ''}`} aria-label="Что сейчас обрабатывает RustScout">
    <span className="liveStatsDot" />
    <span className="liveStatsItem">
      <b>{formatNumber(MOCK_STATS.servers)}</b> серверов в опросе
    </span>
    <span className="liveStatsSep" />
    <span className="liveStatsItem">
      <b>{formatNumber(MOCK_STATS.players)}</b> игроков онлайн
    </span>
    <span className="liveStatsSep liveStatsSepWide" />
    <span className="liveStatsUpdated">обновлено {MOCK_STATS.updatedSecAgo} с назад</span>
  </div>
);
