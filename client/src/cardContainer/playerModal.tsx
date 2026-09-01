import React, { useState } from "react";
import type { PlayerData } from "./player";
import "./modalMenuInfo.css";


interface PlayerModalProps {        
    player: PlayerData;
    onClose: () => void;
    onDelete: (steamId: string) => void;
    isTracking: boolean;
    trackingTimer: number;
    onToggleTracking: (steamId: string) => void;
}


export const PlayerModal: React.FC<PlayerModalProps> = ({
    player,
    onClose,
    onDelete,
    isTracking,
    trackingTimer,
    onToggleTracking,
}) => {
    const [activeTab, setActiveTab] = useState<'main' | 'servers' | 'names'>('main');
    const [copied, setCopied] = useState<boolean>(false);
    const [nameSearch, setNameSearch] = useState<string>('');

    const handleCopySteamId = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (player.steamId && player.steamId !== 'Не привязан') {
            navigator.clipboard.writeText(player.steamId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const filteredNicknames = (player.nicknames || []).filter((name) =>
        name.toLowerCase().includes(nameSearch.toLowerCase())
    );

    return (

    <div className="modalOverlay" onClick={onClose}>
      <div className="modalMenu" onClick={(e) => e.stopPropagation()}>
        <button className="exitButton" onClick={onClose}>
          ✕
        </button>

        {/* Шапка: Steam профиль */}
        <div className="steamInfo">
          <div className="playerImg">
            {player.steam?.avatarfull ? (
              <img
                src={player.steam.avatarfull}
                alt={player.steam.personaname}
              />
            ) : (
              <div className="avatarPlaceholder">👤</div>
            )}
          </div>
          <div className="playerDetails">
            <p className="playerName">
              {player.steam?.personaname || 'Профиль не найден'}
            </p>
            <div className="statusContainer">
              <span
                className="statusDot"
                style={{
                  backgroundColor: player.isOnline
                    ? '#4caf50'
                    : player.steam?.personastate === 1
                    ? '#38bdf8'
                    : '#888',
                }}
              ></span>
              <span className="statusLabel">
                {player.isOnline
                  ? 'В ИГРЕ (RUST)'
                  : player.steam?.personastate === 1
                  ? 'В СЕТИ (STEAM)'
                  : 'НЕ В СЕТИ'}
              </span>
            </div>
            <div className="playerSteamId">
              <code>{player.steamId}</code>
              {player.steamId !== 'Не привязан' && (
                <button
                  className="copyBtn"
                  onClick={handleCopySteamId}
                  title="Копировать SteamID"
                >
                  {copied ? (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Баннер активного сервера */}
        {player.currentServer && (
          <div className="currentServerBanner">
            <p className="bannerLabel">ИГРАЕТ СЕЙЧАС</p>
            <p className="bannerServerName">{player.currentServer.name}</p>
            {player.currentServer.ip && (
              <p className="bannerServerIp">{player.currentServer.ip}</p>
            )}
          </div>
        )}

        {/* Вкладки */}
        <div className="modalTabs">
          <button
            className={`tabBtn ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            ОБЗОР
          </button>
          <button
            className={`tabBtn ${activeTab === 'servers' ? 'active' : ''}`}
            onClick={() => setActiveTab('servers')}
          >
            СЕРВЕРА ({player.servers?.length || 0})
          </button>
          <button
            className={`tabBtn ${activeTab === 'names' ? 'active' : ''}`}
            onClick={() => setActiveTab('names')}
          >
            НИКНЕЙМЫ ({player.nicknames?.length || 0})
          </button>
        </div>

        {/* Контейнер с фиксированной высотой */}
        <div className="tabContentWrapper">
          {/* Вкладка 1: Обзор BattleMetrics */}
          {activeTab === 'main' && (
            <div className="battleMetricsInfo tabPane">
              <div className="sectionHeader">
                <span className="sectionLabel">BATTLEMETRICS</span>
                <div className="sectionDivider"></div>
              </div>

              {/* 2 плашки статистики */}
              <div className="statGridTwo">
                <div className="statTile">
                  <p className="label">Наиграно</p>
                  <p className="value">
                    {player.battleMetrics?.playtime
                      ? `${player.battleMetrics.playtime} ч.`
                      : '-'}
                  </p>
                </div>
                <div className="statTile">
                  <p className="label">Первый визит</p>
                  <p className="value">{player.battleMetrics?.firstSeen ?? '-'}</p>
                </div>
              </div>

              {/* Кнопка отслеживания с круговым SVG таймером */}
              <div className="trackContainer">
                <button
                  className={`trackBtn ${isTracking ? 'trackingActive' : ''}`}
                  onClick={() => onToggleTracking(player.steamId)}
                >
                  <span className={`trackDot ${isTracking ? 'dotActive' : ''}`}></span>
                  <span className="trackText">
                    {isTracking
                      ? `Отслеживание: ${formatTimer(trackingTimer)}`
                      : 'Отслеживать игрока (5 мин)'}
                  </span>

                  <div className="circularTimer">
                    <svg className="timerSvg" viewBox="0 0 36 36">
                      <circle
                        className="timerCircleBg"
                        cx="18"
                        cy="18"
                        r="15"
                      />
                      <circle
                        className={`timerCircleProgress ${isTracking ? 'progressActive' : ''}`}
                        cx="18"
                        cy="18"
                        r="15"
                        style={{
                          strokeDasharray: 94.25,
                          strokeDashoffset: isTracking
                            ? 94.25 * (1 - trackingTimer / 300)
                            : 94.25,
                        }}
                      />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Действия */}
              <div className="actions">
                {player.steamId !== 'Не привязан' && (
                  <a
                    className="actionBtn primary"
                    href={
                      player.steam?.profileurl ||
                      `https://steamcommunity.com/profiles/${player.steamId}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Профиль Steam
                  </a>
                )}
                <a
                  className="actionBtn secondary"
                  href={
                    player.bmId
                      ? `https://www.battlemetrics.com/players/${player.bmId}`
                      : `https://www.battlemetrics.com/rcon/players?filter[search]=${player.steamId}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  BattleMetrics ↗
                </a>

                <button
                  className="deleteCard"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(player.steamId);
                    onClose();
                  }}
                >
                  Удалить карточку
                </button>
              </div>
            </div>
          )}

          {/* Вкладка 2: Сервера */}
          {activeTab === 'servers' && (
            <div className="tabContentList tabPane">
              {player.servers && player.servers.length > 0 ? (
                player.servers.slice(0, 10).map((srv, idx) => (
                  <div key={idx} className="listItem">
                    <span className="listItemTitle" title={srv.name}>
                      {srv.name}
                    </span>
                    <span className="listItemSub">
                      {Math.round(srv.timePlayedSeconds / 3600)} ч. • {srv.lastSeen}
                    </span>
                  </div>
                ))
              ) : (
                <p className="emptyText">Нет данных о серверах</p>
              )}
            </div>
          )}

          {/* Вкладка 3: Никнеймы */}
          {activeTab === 'names' && (
            <div className="tabContentList tabPane">
              <input
                type="text"
                className="nameSearchInput"
                placeholder="Поиск по никнеймам..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
              <div className="namesScrollContainer">
                {filteredNicknames.length > 0 ? (
                  filteredNicknames.map((name, idx) => (
                    <div key={idx} className="nameChip" title={name}>
                      {name}
                    </div>
                  ))
                ) : (
                  <p className="emptyText">Никнеймы не найдены</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

