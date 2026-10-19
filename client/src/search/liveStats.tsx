import { useEffect, useState } from 'react';
import './liveStats.css';

const API = '';
const REFRESH_MS = 60_000; // раз в минуту перезапрашиваем сводку

interface LiveStatsData {
  servers: number;
  players: number;
  updatedAt: number | null; // ms
}

const formatNumber = (n: number) => n.toLocaleString('ru-RU');

const formatAgo = (sec: number) => (sec < 60 ? `${sec} с назад` : `${Math.floor(sec / 60)} мин назад`);

interface LiveStatsProps {
  hidden?: boolean; // на месте строки показывается ошибка поиска — не перекрываем её
}

export const LiveStats = ({ hidden = false }: LiveStatsProps) => {
  const [stats, setStats] = useState<LiveStatsData | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Загружаем сводку сразу и потом раз в минуту
  useEffect(() => {
    const controller = new AbortController();
    const load = () =>
      fetch(`${API}/api/live-stats`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setStats(json.data);
        })
        .catch(() => {}); // статистика не критична — при ошибке оставляем прошлые цифры

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, []);

  // Тикаем раз в секунду, чтобы «обновлено N с назад» шло вживую
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Пока данных нет — держим место пустым, чтобы форма не прыгала
  const isEmpty = !stats || stats.servers === 0;
  const secAgo = stats?.updatedAt ? Math.max(0, Math.round((now - stats.updatedAt) / 1000)) : null;

  return (
    <div
      className={`liveStats ${hidden || isEmpty ? 'isHidden' : ''}`}
      aria-label="Что сейчас обрабатывает RustScout"
    >
      <span className="liveStatsDot" />
      <span className="liveStatsItem">
        <b>{formatNumber(stats?.servers ?? 0)}</b> серверов в опросе
      </span>
      <span className="liveStatsSep" />
      <span className="liveStatsItem">
        <b>{formatNumber(stats?.players ?? 0)}</b> игроков онлайн
      </span>
      {secAgo !== null && (
        <>
          <span className="liveStatsSep liveStatsSepWide" />
          <span className="liveStatsUpdated">обновлено {formatAgo(secAgo)}</span>
        </>
      )}
    </div>
  );
};