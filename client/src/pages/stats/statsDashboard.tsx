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

const fmt = (n: number) => n.toLocaleString('en-US');

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
        setState({ phase: 'error', message: 'Invalid token' });
        return;
      }
      if (!res.ok) {
        setState({ phase: 'error', message: `Server error (${res.status})` });
        return;
      }
      const json = await res.json();
      if (!json?.success) {
        setState({ phase: 'error', message: json?.error || 'Invalid response' });
        return;
      }
      setState({ phase: 'ok', data: json.data as StatsData });
    } catch {
      setState({ phase: 'error', message: 'Network unavailable' });
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
          <h1 className="statsGateTitle">RUSTSCOUT · METRICS</h1>
          <p className="statsGateHint">Token-gated access. Enter the STATS_TOKEN.</p>
          <input
            className="statsGateInput"
            type="password"
            placeholder="token"
            value={input}
            autoFocus
            onChange={(e) => setInput(e.target.value)}
          />
          {state.phase === 'error' && <p className="statsGateError">{state.message}</p>}
          <button className="statsGateBtn" type="submit">
            Open
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
        <span className="statsBrand">RUSTSCOUT · METRICS</span>
        <div className="statsHeaderRight">
          {state.phase === 'ok' && (
            <span className="statsUpdated">
              updated {new Date(state.data.generatedAt).toLocaleTimeString('en-US')}
            </span>
          )}
          <button className="statsLogout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {state.phase === 'loading' && <p className="statsMsg">Loading…</p>}
      {state.phase === 'error' && <p className="statsMsg statsMsgErr">{state.message}</p>}

      {state.phase === 'ok' && (
        <>
          <div className="statsCards">
            <div className="statsCard accent">
              <span className="statsCardLabel">Active now</span>
              <span className="statsCardValue">{fmt(state.data.active)}</span>
              <span className="statsCardSub">
                over the last {state.data.activeWindowMinutes} min
              </span>
            </div>
            <div className="statsCard">
              <span className="statsCardLabel">Visitors today</span>
              <span className="statsCardValue">{fmt(state.data.today.uniqueVisitors)}</span>
              <span className="statsCardSub">unique (approx.)</span>
            </div>
            <div className="statsCard">
              <span className="statsCardLabel">Player lookups today</span>
              <span className="statsCardValue">{fmt(state.data.today.playerLookups)}</span>
              <span className="statsCardSub">search by SteamID</span>
            </div>
          </div>

          <div className="statsTableWrap">
            <div className="statsTableTitle">Last 7 days</div>
            <table className="statsTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Visitors</th>
                  <th>Player lookups</th>
                  <th className="statsBarCol" />
                </tr>
              </thead>
              <tbody>
                {state.data.last7days.map((d, i) => (
                  <tr key={d.date} className={i === 0 ? 'statsRowToday' : ''}>
                    <td>{d.date}{i === 0 ? ' · today' : ''}</td>
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
            A visitor is counted by a hash of IP + User-Agent: people behind the same
            router get merged, switching networks can split them into two. Numbers are approximate.
          </p>
        </>
      )}
    </div>
  );
};

export default StatsDashboard;
