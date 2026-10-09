// Моковые игроки для песочницы модалки (#modal-sandbox). В прод-сборку не попадают.
import type { ActivityDay, PlayerData } from "../cardContainer/player";

// Детерминированный ГПСЧ — моки одинаковые при каждой перезагрузке
const rng = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
};

const isoDay = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 7 дней активности: вечерний прайм, по выходным ещё и днём. */
export function mockActivity(seed = 42): ActivityDay[] {
    const rand = rng(seed);
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
        const weekend = date.getDay() === 0 || date.getDay() === 6;
        const hours = Array.from({ length: 24 }, (_, h) => {
            const evening = h >= 18 && h <= 23;
            const night = h <= 2;
            const day = weekend && h >= 12 && h < 18;
            const chance = evening ? 0.85 : night ? 0.5 : day ? 0.6 : 0.05;
            return rand() < chance ? Math.round(10 + rand() * 50) : 0;
        });
        return { date: isoDay(date), hours };
    });
}

const base: PlayerData = {
    steamId: '76561198000000001',
    bmId: '123456789',
    isOnline: true,
    steam: {
        personaname: 'Mock Raider',
        avatarfull: '',
        profileurl: 'https://steamcommunity.com/profiles/76561198000000001',
        personastate: 1,
    },
    battleMetrics: {
        playtime: 1843,
        sessions: 412,
        firstSeen: '14.03.2021',
        lastSeen: '08.10.2026',
        identifier: [],
    },
    currentServer: { id: '1', name: 'Rusty Moose |US Main|', ip: '192.0.2.10:28015' },
    servers: [
        { serverId: '1', name: 'Rusty Moose |US Main|', timePlayedSeconds: 900 * 3600, lastSeen: '08.10.2026' },
        { serverId: '2', name: 'Rustafied.com - EU Medium', timePlayedSeconds: 420 * 3600, lastSeen: '01.10.2026' },
        { serverId: '3', name: 'Reddit.com/r/PlayRust - EU Monthly', timePlayedSeconds: 120 * 3600, lastSeen: '12.09.2026' },
    ],
    nicknames: ['Mock Raider', 'raider_2021', 'xX_Raid_Xx', 'kirill'],
    initialServerId: '1',
    hasLeftInitialServer: false,
    activity: mockActivity(),
};

export const MOCK_PLAYERS: Record<string, PlayerData> = {
    'В игре': base,
    'Оффлайн': {
        ...base,
        steamId: '76561198000000002',
        isOnline: false,
        currentServer: null,
        steam: { ...base.steam!, personaname: 'Sleeper', personastate: 0 },
        activity: mockActivity(7),
    },
    'Без данных': {
        ...base,
        steamId: '76561198000000003',
        isOnline: false,
        currentServer: null,
        steam: null,
        battleMetrics: null,
        servers: [],
        nicknames: [],
        activity: [],
    },
};
