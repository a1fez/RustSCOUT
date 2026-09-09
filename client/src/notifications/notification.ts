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

export const NOTIF_META: Record<NotifType, { label: string; color: string; glyph: string }> = {
  left:     { label: 'ПОКИНУЛ',     color: '#ef4444', glyph: '⏻' },
  switched: { label: 'СМЕНА',       color: '#f59e0b', glyph: '⇄' },
  returned: { label: 'ВОЗВРАЩЕНИЕ', color: '#22c55e', glyph: '⟲' },
  online:   { label: 'ОНЛАЙН',      color: '#22c55e', glyph: '▲' },
  offline:  { label: 'ОФЛАЙН',      color: '#71717a', glyph: '▼' },
  update:   { label: 'ОБНОВЛЕНИЕ',  color: '#8b5cf6', glyph: '✦' },
};

// События, которые сопровождаются звуком.
export const SOUND_TYPES: ReadonlySet<NotifType> = new Set<NotifType>([
  'left', 'switched', 'returned', 'online', 'offline',
]);

export function formatRelativeTime(ts: number, now: number = Date.now()): string {
  const sec = Math.max(0, Math.floor((now - ts) / 1000));
  if (sec < 10) return 'только что';
  if (sec < 60) return `${sec} сек назад`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  return `${Math.floor(hr / 24)} дн назад`;
}

export function makeNotifId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
