// Данные из профиля Steam
export interface SteamInfo {
  personaname: string;
  avatarfull: string;
  profileurl: string;
  personastate: number; // 0 = Offline, 1 = Online
}

// Статистика из BattleMetrics
export interface BattleMetricsInfo {
  playtime: number;       // Часов наиграно
  sessions: number;       // Количество зафиксированных сессий
  firstSeen: string;      // Дата первого визита
  lastSeen: string;       // Дата последнего визита
  identifier: string[];
}

// Информация об отдельном сервере в истории игрока
export interface ServerHistoryItem {
  serverId: string;
  name: string;
  timePlayedSeconds: number;
  lastSeen: string;
}

// Информация о текущем активном сервере (если игрок онлайн)
export interface CurrentServerInfo {
  id?: string;
  name: string;
  ip?: string;
}

// Основной интерфейс игрока для карточки и модального окна
export interface PlayerData {
  steamId: string;
  bmId?: string;
  isOnline?: boolean;
  steam: SteamInfo | null;
  battleMetrics: BattleMetricsInfo | null;
  currentServer?: CurrentServerInfo | null;
  servers?: ServerHistoryItem[];
  nicknames?: string[];
  activity?: ActivityDay[];           // последние 7 дней, от старых к новым

  // Отслеживание
  initialServerId?: string | null;   // сервер, с которого началось отслеживание
  hasLeftInitialServer?: boolean;     // игрок ушёл с исходного сервера (обновляется опросом)
}

// Активность игрока за день: hours[0..23] — минуты онлайна в этом часу (0..60)
export interface ActivityDay {
  date: string;     // ISO-дата дня, 'YYYY-MM-DD' (локальное время)
  hours: number[];  // ровно 24 значения
}
