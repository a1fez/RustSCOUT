import { useCallback, useEffect, useState } from 'react';
import './statsDashboard.css';

const API = '';
const TOKEN_KEY = 'rs_stats_token';
const REFRESH_MS = 15000;

interface DayStat {
  date: string;
  playerLookups: number;
  uniqueVisitors: number;
}

interface StatsData {
  active: number;
  activeWindowMinutes: number;
  today: { playerLookups: number; uniqueVisitors: number };
  last7days: DayStat[];
  generatedAt: string;
}

type LoadState =
  | { phase: 'need-token' | 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ok'; data: StatsData };

const fmt = (n: number) => n.toLocaleString('ru-RU');

export const StatsDashboard = () => {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || '');
  const [input, setInput] = useState('');
  const [state, setState] = useState<LoadState>(
    token ? { phase: 'loading' } : { phase: 'need-token' }
  );

  const load = useCallback(async (tk: string, silent = false) => {
    if (!silent) setState({ phase: 'loading' });
    try {
      const res = await fetch(`${API}/api/stats?token=${encodeURIComponent(tk)}`, {
        cache: 'no-store',
      });
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
        setState({ phase: 'error', message: 'Неверный токен' });
        return;
      }
      if (!res.ok) {
        setState({ phase: 'error', message: `Ошибка сервера (${res.status})` });
        return;
      }
      const json = await res.json();
      if (!json?.success) {
        setState({ phase: 'error', message: json?.error || 'Некорректный ответ' });
        return;
      }
      setState({ phase: 'ok', data: json.data as StatsData });
    } catch {
      setState({ phase: 'error', message: 'Сеть недоступна' });
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    load(token);
    const id = window.setInterval(() => load(token, true), REFRESH_MS);
    return () => clearInterval(id);
  }, [token, load]);

  const submitToken = (e: React.FormEvent) => {
    e.preventDefault();
    const tk = input.trim();
    if (!tk) return;
    localStorage.setItem(TOKEN_KEY, tk);
    setToken(tk);
    setInput('');
    setState({ phase: 'loading' });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setState({ phase: 'need-token' });
  };

  if (!token || state.phase === 'need-token' || (state.phase === 'error' && !token)) {
    return (
      <div className="statsGate">
        <form className="statsGateBox" onSubmit={submitToken}>
          <h1 className="statsGateTitle">RUSTSCOUT · МЕТРИКИ</h1>
          <p className="statsGateHint">Доступ по токену. Введите STATS_TOKEN.</p>
          <input
            className="statsGateInput"
            type="password"
            placeholder="токен"
            value={input}
            autoFocus
            onChange={(e) => setInput(e.target.value)}
          />
          {state.phase === 'error' && <p className="statsGateError">{state.message}</p>}
          <button className="statsGateBtn" type="submit">
            Открыть
          </button>
        </form>
      </div>
    );
  }

  const maxReq = state.phase === 'ok'
    ? Math.max(1, ...state.data.last7days.map((d) => d.playerLookups))
    : 1;

  return (
    <div className="statsWrap">
      <header className="statsHeader">
        <span className="statsBrand">RUSTSCOUT · МЕТРИКИ</span>
        <div className="statsHeaderRight">
          {state.phase === 'ok' && (
            <span className="statsUpdated">
              обновлено {new Date(state.data.generatedAt).toLocaleTimeString('ru-RU')}
            </span>
          )}
          <button className="statsLogout" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>

      {state.phase === 'loading' && <p className="statsMsg">Загрузка…</p>}
      {state.phase === 'error' && <p className="statsMsg statsMsgErr">{state.message}</p>}

      {state.phase === 'ok' && (
        <>
          <div className="statsCards">
            <div className="statsCard accent">
              <span className="statsCardLabel">Активны сейчас</span>
              <span className="statsCardValue">{fmt(state.data.active)}</span>
              <span className="statsCardSub">
                за последние {state.data.activeWindowMinutes} мин
              </span>
            </div>
            <div className="statsCard">
              <span className="statsCardLabel">Посетителей сегодня</span>
              <span className="statsCardValue">{fmt(state.data.today.uniqueVisitors)}</span>
              <span className="statsCardSub">уникальных (прибл.)</span>
            </div>
            <div className="statsCard">
              <span className="statsCardLabel">Запросов игрока сегодня</span>
              <span className="statsCardValue">{fmt(state.data.today.playerLookups)}</span>
              <span className="statsCardSub">поиск по SteamID</span>
            </div>
          </div>

          <div className="statsTableWrap">
            <div className="statsTableTitle">Последние 7 дней</div>
            <table className="statsTable">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Посетители</th>
                  <th>Запросы игрока</th>
                  <th className="statsBarCol" />
                </tr>
              </thead>
              <tbody>
                {state.data.last7days.map((d, i) => (
                  <tr key={d.date} className={i === 0 ? 'statsRowToday' : ''}>
                    <td>{d.date}{i === 0 ? ' · сегодня' : ''}</td>
                    <td>{fmt(d.uniqueVisitors)}</td>
                    <td>{fmt(d.playerLookups)}</td>
                    <td className="statsBarCol">
                      <span
                        className="statsBar"
                        style={{ width: `${(d.playerLookups / maxReq) * 100}%` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="statsFootnote">
            Посетитель считается по хэшу IP + User-Agent: за одним роутером люди
            склеиваются, при смене сети — раздваиваются. Цифры ориентировочные.
          </p>
        </>
      )}
    </div>
  );
};

export default StatsDashboard;
