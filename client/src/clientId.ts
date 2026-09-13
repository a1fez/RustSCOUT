// Идентификатор этого браузера/вкладки для бэка — чтобы каждый пользователь
// видел только своих отслеживаемых игроков (журнал, статусы), а не общий
// реестр на всех. Никакой авторизации это не заменяет — просто разделяет
// анонимных пользователей друг от друга.

const STORAGE_KEY = 'rustscout_client_id';

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

let cached: string | null = null;

export function getClientId(): string {
  if (cached) return cached;

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      cached = existing;
      return cached;
    }
    const created = generateId();
    window.localStorage.setItem(STORAGE_KEY, created);
    cached = created;
    return cached;
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — держим id в памяти
    // на время жизни вкладки, это лучше, чем ничего.
    if (!cached) cached = generateId();
    return cached;
  }
}
