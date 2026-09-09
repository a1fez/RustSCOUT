import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "./navbar/navbar";
import CardContainer from "./cardContainer/cardContainer";
import Search from "./search/search";
import './main.css';
import { Roadmap } from "./pages/roadmap/roadmap";
import type { PlayerData } from "./cardContainer/player";
import { MainPage } from "./pages/main/mainPage";
import type { NotifEvent, NotifInput } from "./notifications/notification";
import { makeNotifId, SOUND_TYPES } from "./notifications/notification";
import { primeAudio, playAlert } from "./sound/alert";
import { ContactsSection } from "./contacts/contactsSection";

export interface SearchData {
  steamId: string;
  serverId: string;
  timestamp: number;
}

const API = '';
const TRACK_SECONDS = 6000;      // окно отслеживания (совпадает с TTL на бэке через durationMs)
const STATUS_POLL_MS = 10000;    // бэк отслеживает игроков каждые 10с
const MAX_EVENTS = 100;

// Последний известный статус игрока — чтобы ловить переходы между опросами.
interface StatusSnapshot {
  serverId: string | null;
  serverName: string | null; // имя serverId на момент снимка (бэк резолвит его в /status)
  online: boolean;
}

// Системные оповещения / обновления (отдельно от журнала отслеживания).
const SYSTEM_NOTIFICATIONS: NotifEvent[] = [
  {
    id: 'sys-journal-panel',
    type: 'update',
    steamId: '',
    player: 'RustScout',
    message: 'Журнал отслеживания теперь на странице поиска — правая колонка.',
    serverFrom: null,
    serverTo: null,
    timestamp: Date.parse('2026-09-06T00:00:00'),
    read: false,
  },
];

function requestUntrack(steamId: string) {
  fetch(`${API}/api/untrack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steamId }),
  }).catch(() => {});
}

const App = () => {

  const [cards, setCards] = useState<PlayerData[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, number>>({});

  const [searchQuery, setSearchQuery] = useState<SearchData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('search');

  // Журнал отслеживания (правая колонка)
  const [trackEvents, setTrackEvents] = useState<NotifEvent[]>([]);
  // Системные оповещения (иконка в навбаре)
  const [systemNotifications, setSystemNotifications] = useState<NotifEvent[]>(SYSTEM_NOTIFICATIONS);

  const serverNamesRef = useRef<Record<string, string>>({});
  const prevStatusRef = useRef<Record<string, StatusSnapshot>>({});

  const serverName = useCallback((id: string | null | undefined): string => {
    if (!id) return 'неизвестный сервер';
    return serverNamesRef.current[String(id)] || `сервер ${id}`;
  }, []);

  const addTrackEvent = useCallback((input: NotifInput) => {
    setTrackEvents((prev) =>
      [{ ...input, id: makeNotifId(), timestamp: Date.now(), read: false }, ...prev].slice(0, MAX_EVENTS)
    );
  }, []);

  const clearTrackEvents = useCallback(() => setTrackEvents([]), []);

  const clearSystemNotifications = useCallback(() => setSystemNotifications([]), []);
  const markSystemRead = useCallback(() => {
    setSystemNotifications((prev) =>
      prev.some((n) => !n.read) ? prev.map((n) => ({ ...n, read: true })) : prev
    );
  }, []);

  // Карта id сервера -> имя (для читаемых записей журнала)
  useEffect(() => {
    fetch(`${API}/api/servers`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.success && Array.isArray(j.data)) {
          const map: Record<string, string> = {};
          for (const s of j.data) map[String(s.id)] = s.name;
          serverNamesRef.current = map;
        }
      })
      .catch(() => {});
  }, []);

  // Обратный отсчёт отслеживания — работает всегда, независимо от открытой страницы
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTrackingMap((prevMap) => {
        if (!Object.values(prevMap).some((s) => s > 0)) return prevMap;
        const updated: Record<string, number> = {};
        for (const [id, seconds] of Object.entries(prevMap)) {
          if (seconds > 1) updated[id] = seconds - 1;
          else requestUntrack(id); // истёк — снимаем на бэке и убираем из карты
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Опрос статуса отслеживаемых игроков + детект переходов — тоже всегда
  const trackedKey = Object.keys(trackingMap).sort().join(',');
  useEffect(() => {
    if (!trackedKey) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${API}/api/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (cancelled || !json.success || !Array.isArray(json.data)) return;

        const rows = json.data as any[];
        const bySteam: Record<string, any> = {};
        rows.forEach((s) => { bySteam[s.steamId] = s; });

        // Бэк теперь резолвит имена серверов сам — подмешиваем их в карту,
        // чтобы serverName() отдавал имя и для серверов вне топ-списка.
        for (const s of rows) {
          if (s.currentServerId && s.currentServerName)
            serverNamesRef.current[String(s.currentServerId)] = s.currentServerName;
          if (s.initialServerId && s.initialServerName)
            serverNamesRef.current[String(s.initialServerId)] = s.initialServerName;
          if (s.serverId && s.serverName)
            serverNamesRef.current[String(s.serverId)] = s.serverName;
        }

        const events: NotifInput[] = [];
        for (const s of rows) {
          const key = String(s.steamId);
          const nowServer: string | null = s.currentServerId ? String(s.currentServerId) : null;
          const nowServerName: string | null = s.currentServerName || null;
          const nowOnline = Boolean(s.isOnline);
          const initialServer: string | null = s.initialServerId ? String(s.initialServerId) : null;
          const backHome = Boolean(nowServer && initialServer && nowServer === initialServer);
          const prev = prevStatusRef.current[key];
          const who = s.personaname || key;
          // Имя прошлого сервера: снимок надёжнее карты (её могли не успеть заполнить).
          const fromName = prev?.serverName || serverName(prev?.serverId);

          const toName = nowServerName || serverName(nowServer);

          if (prev) {
            if (prev.serverId && nowServer && prev.serverId !== nowServer) {
              // Смена сервера. Если это возврат на исходный — отдельное событие.
              events.push(
                backHome
                  ? {
                      type: 'returned', steamId: key, player: who,
                      serverFrom: fromName, serverTo: toName,
                      message: `вернулся на исходный сервер — ${toName}`,
                    }
                  : {
                      type: 'switched', steamId: key, player: who,
                      serverFrom: fromName, serverTo: toName,
                      message: `сменил сервер: ${fromName} → ${toName}`,
                    }
              );
            } else if (prev.serverId && !nowServer) {
              events.push({
                type: 'left', steamId: key, player: who,
                serverFrom: fromName, serverTo: null,
                message: `покинул ${fromName}`,
              });
            } else if (!prev.online && nowOnline && nowServer) {
              const initialName = s.initialServerName || serverName(initialServer);
              events.push(
                backHome
                  ? {
                      type: 'returned', steamId: key, player: who,
                      serverFrom: null, serverTo: toName,
                      message: `вернулся на исходный сервер — ${toName}`,
                    }
                  : initialServer
                  ? {
                      // Вернулся в игру, но НЕ на отслеживаемый сервер — это по сути
                      // смена сервера, так пользователю понятнее, чем «снова в игре».
                      type: 'switched', steamId: key, player: who,
                      serverFrom: initialName, serverTo: toName,
                      message: `снова в игре, сменил сервер: ${initialName} → ${toName}`,
                    }
                  : {
                      type: 'online', steamId: key, player: who,
                      serverFrom: null, serverTo: toName,
                      message: `снова в игре — ${toName}`,
                    }
              );
            }
          }
          prevStatusRef.current[key] = {
            serverId: nowServer,
            serverName: nowServer ? toName : null,
            online: nowOnline,
          };
        }

        if (cancelled) return;

        events.forEach(addTrackEvent);
        if (events.some((e) => SOUND_TYPES.has(e.type))) playAlert();

        setCards((prev) =>
          prev.map((card) => {
            const s = bySteam[card.steamId];
            if (!s) return card;

            let currentServer = card.currentServer ?? null;
            if (s.currentServerId) {
              const newId = String(s.currentServerId);
              const sameServer = card.currentServer?.id === newId;
              currentServer = {
                id: newId,
                // при смене сервера подставляем актуальное имя, ip старого сервера не тащим
                name: sameServer && card.currentServer?.name
                  ? card.currentServer.name
                  : serverName(newId),
                ip: sameServer ? card.currentServer?.ip : undefined,
              };
            } else {
              currentServer = null;
            }

            return {
              ...card,
              isOnline: s.isOnline,
              hasLeftInitialServer: s.hasLeftInitialServer,
              currentServer,
            };
          })
        );
      } catch {
        /* сеть моргнула — пропускаем цикл */
      }
    };

    poll();
    const id = window.setInterval(poll, STATUS_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [trackedKey, serverName, addTrackEvent]);

  const toggleTracking = useCallback(async (player: PlayerData) => {
    const steamId = player.steamId;
    if (!steamId || steamId === 'Не привязан') return;

    if ((trackingMap[steamId] || 0) > 0) {
      setTrackingMap((prev) => {
        const next = { ...prev };
        delete next[steamId];
        return next;
      });
      delete prevStatusRef.current[steamId];
      requestUntrack(steamId);
      return;
    }

    primeAudio(); // разблокировка звука в рамках клика

    const serverId = player.initialServerId || player.currentServer?.id || '';
    if (!serverId) {
      console.error('Отслеживание: неизвестен сервер игрока');
      return;
    }

    try {
      const res = await fetch(`${API}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steamId,
          bmId: player.bmId,
          personaname: player.steam?.personaname,
          serverId,
          durationMs: TRACK_SECONDS * 1000,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        console.error('Не удалось начать отслеживание:', json.error);
        return;
      }
      setTrackingMap((prev) => ({ ...prev, [steamId]: TRACK_SECONDS }));
    } catch (err) {
      console.error('Ошибка запроса отслеживания:', err);
    }
  }, [trackingMap]);

  const deleteCard = useCallback((steamId: string) => {
    setCards((prev) => prev.filter((c) => c.steamId !== steamId));
    // Снимаем с отслеживания только этого игрока — таймеры остальных не трогаем
    setTrackingMap((prev) => {
      if (!(steamId in prev)) return prev;
      const next = { ...prev };
      delete next[steamId];
      return next;
    });
    delete prevStatusRef.current[steamId];
    requestUntrack(steamId);
  }, []);

  const handleSearch = (steamId: string, serverIdOrName: string) => {
    if (!steamId) return;
    setSearchError(null);
    setSearchQuery({
      steamId: steamId.trim(),
      serverId: serverIdOrName ? serverIdOrName.trim() : '',
      timestamp: Date.now(),
    });
  };

  return (
    <>
      <Navbar
        onOpenRoadmap={() => setCurrentPage('roadmap')}
        onSelectTab={(tab) => setCurrentPage(tab.toLocaleLowerCase())}
        notifications={systemNotifications}
        onClearNotifications={clearSystemNotifications}
        onMarkAllRead={markSystemRead}
      />

      {currentPage === 'search' && (
        <>
          <Search onSearch={handleSearch} errorReason={searchError} />
          <CardContainer
            searchQuery={searchQuery}
            cards={cards}
            setCards={setCards}
            trackingMap={trackingMap}
            setSearchQuery={setSearchQuery}
            setSearchError={setSearchError}
            onToggleTracking={toggleTracking}
            onDeleteCard={deleteCard}
            trackEvents={trackEvents}
            onClearTrackEvents={clearTrackEvents}
          />
          <ContactsSection />
        </>
      )}

      {currentPage === 'roadmap' && (
        <Roadmap onBack={() => setCurrentPage('search')} />
      )}

      {currentPage === 'info' && (
        <div className="infoContainer">
          <h1>ИНФОРМАЦИЯ</h1>
          <p>Здесь будет отображаться информация о проекте.</p>
        </div>
      )}

      {currentPage === 'main' && (
        <MainPage />
      )}
    </>
  );
};

export default App;
