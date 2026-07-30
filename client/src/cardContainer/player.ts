// Данные, которые приходят из Steam API
export interface SteamInfo {
  personaname: string;
  avatarfull: string;
  profileurl: string;
  personastate: number; // 0 = Offline, 1 = Online
}

// Данные, которые придут из BattleMetrics API
export interface BattleMetricsInfo {
  playtime: number;       // Часов наиграно
  sessions: number;       // Кол-во сессий
  firstSeen: string;      // Первый визит
  lastSeen: string;       // Последний визит
  reputation: number;     // Репутация
  bansCount: number;      // Количество банов
}

// ЕДИНЫЙ ОБЪЕКТ ИГРОКА (Всё вместе)
export interface PlayerData {
  steamId: string;
  steam: SteamInfo | null;
  battleMetrics: BattleMetricsInfo | null;
}