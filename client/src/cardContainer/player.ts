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
  reputation: number;     // Числовая репутация
  bansCount: number;      // Количество банов
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
}