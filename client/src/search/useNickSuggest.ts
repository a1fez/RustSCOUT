import { useEffect, useState } from 'react';

export const NICK_MIN_LENGTH = 3; // столько же проверяет сервер (MIN_QUERY_LENGTH)
const DEBOUNCE_MS = 300;          // ждём паузу в наборе, чтобы не слать запрос на каждую букву

export interface NickCandidate {
  bmId: string;
  name: string;
  serverId: string | null;
  serverName: string | null;
  isOnline: boolean;
}

type SuggestStatus = 'idle' | 'loading' | 'done' | 'error';

interface SuggestState {
  results: NickCandidate[];
  status: SuggestStatus;
  errorReason: string | null;
}

const IDLE: SuggestState = { results: [], status: 'idle', errorReason: null };

// Подсказки игроков по нику из индекса онлайна (GET /api/players/search).
// Пока запрос в пути, показываем прошлый список — так он не мигает при наборе.
export function useNickSuggest(query: string, enabled: boolean): SuggestState {
  const [state, setState] = useState<SuggestState>(IDLE);
  const q = query.trim();
  const active = enabled && q.length >= NICK_MIN_LENGTH;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setState((prev) => ({ ...prev, status: 'loading' }));
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setState({ results: [], status: 'error', errorReason: json.reason ?? json.error ?? 'search_failed' });
          return;
        }
        setState({ results: json.data, status: 'done', errorReason: null });
      } catch (err) {
        // Отменили сами (ввели следующую букву) — это не ошибка
        if ((err as Error).name === 'AbortError') return;
        setState({ results: [], status: 'error', errorReason: 'search_failed' });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, active]);

  return active ? state : IDLE;
}
