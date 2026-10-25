// Журнал событий отслеживания игроков.

export type NotifType = 'left' | 'switched' | 'returned' | 'online' | 'offline' | 'update';

export interface NotifEvent {
  id: string;
  type: NotifType;
  steamId: string;
  player: string;                 // ник или steamId
  message: string;
  serverFrom?: string | null;
  serverTo?: string | null;
  timestamp: number;
  read: boolean;
}

// То, что передаётся в addNotification (id/timestamp/read проставляются в App).
export type NotifInput = Omit<NotifEvent, 'id' | 'timestamp' | 'read'>;

// label раньше лежал тут захардкоженным по-русски — теперь переводится через
// t(`notifTypes.${type}`) в месте использования (navbar.tsx, trackJournal.tsx,
// userProfile.tsx), а здесь остаётся только то, что не зависит от языка.
export const NOTIF_META: Record<NotifType, { color: string; glyph: string }> = {
  left:     { color: '#ef4444', glyph: '⏻' },
  switched: { color: '#f59e0b', glyph: '⇄' },
  returned: { color: '#22c55e', glyph: '⟲' },
  online:   { color: '#22c55e', glyph: '▲' },
  offline:  { color: '#71717a', glyph: '▼' },
  update:   { color: '#8b5cf6', glyph: '✦' },
};

// События, которые сопровождаются звуком.
export const SOUND_TYPES: ReadonlySet<NotifType> = new Set<NotifType>([
  'left', 'switched', 'returned', 'online', 'offline',
]);

// t передаётся снаружи (из useLang() в компоненте) — этот модуль сам не React-хук,
// и напрямую вызывать useLang() тут нельзя.
export function formatRelativeTime(
  ts: number,
  t: (path: string, params?: Record<string, string | number>) => string,
  now: number = Date.now(),
): string {
  const sec = Math.max(0, Math.floor((now - ts) / 1000));
  if (sec < 10) return t('time.justNow');
  if (sec < 60) return t('time.secAgo', { n: sec });
  const min = Math.floor(sec / 60);
  if (min < 60) return t('time.minAgo', { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t('time.hourAgo', { n: hr });
  return t('time.dayAgo', { n: Math.floor(hr / 24) });
}

export function makeNotifId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
