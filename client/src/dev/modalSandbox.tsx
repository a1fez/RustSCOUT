// Песочница модалки игрока: http://localhost:5173/#modal-sandbox (только `npm run dev`).
// Никаких запросов к бэку — все колбэки локальные.
import { useEffect, useState } from "react";
import { PlayerModal } from "../cardContainer/playerModal";
import type { NotifEvent } from "../notifications/notification";
import { MOCK_PLAYERS } from "./mockPlayers";
import "../main.css";

const TRACK_SECONDS = 300;

const MOCK_EVENTS: NotifEvent[] = [
    {
        id: 'mock-1', type: 'switched', steamId: '76561198000000001', player: 'Mock Raider',
        message: 'сменил сервер: Rustafied.com - EU Medium → Rusty Moose |US Main|',
        serverFrom: 'Rustafied.com - EU Medium', serverTo: 'Rusty Moose |US Main|',
        timestamp: Date.now() - 5 * 60_000, read: false,
    },
];

export const ModalSandbox = () => {
    const names = Object.keys(MOCK_PLAYERS);
    const [current, setCurrent] = useState(names[0]);
    const [open, setOpen] = useState(true);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (timer <= 0) return;
        const id = window.setTimeout(() => setTimer((t) => t - 1), 1000);
        return () => clearTimeout(id);
    }, [timer]);

    const player = MOCK_PLAYERS[current];

    return (
        <div style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 1001 }}>
            {names.map((name) => (
                <button key={name} onClick={() => { setCurrent(name); setOpen(true); }} disabled={name === current && open}>
                    {name}
                </button>
            ))}

            {open && (
                <PlayerModal
                    key={current}
                    player={player}
                    onClose={() => setOpen(false)}
                    onDelete={(id) => console.log('[sandbox] delete', id)}
                    isTracking={timer > 0}
                    trackingTimer={timer}
                    trackTotalSeconds={TRACK_SECONDS}
                    onToggleTracking={() => setTimer((t) => (t > 0 ? 0 : TRACK_SECONDS))}
                    trackEvents={MOCK_EVENTS.filter((e) => e.steamId === player.steamId)}
                />
            )}
        </div>
    );
};
