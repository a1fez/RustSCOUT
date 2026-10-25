import React, { useState, useEffect } from "react";
import{ cardKey, type PlayerData, type ActivityDay } from "./player";
import type { NotifEvent } from "../notifications/notification";
import { TrackJournal } from "../tracking/trackJournal";
import { LuInfo }  from "react-icons/lu";
import { PlayerAvatar } from "../playerAvatar/playerAvatar";
import { CustomTooltip } from "./customToolTip";
import { ActivityHeatmap } from "./activityHeatmap";
import { fetchActivity } from "./activityApi";
import { useLang } from "../i18n/LanguageContext";
import "./modalMenuInfo.css";


interface PlayerModalProps {
    player: PlayerData;
    onClose: () => void;
    onDelete: (steamId: string) => void;
    isTracking: boolean;
    trackingTimer: number;
    /** Полная длительность окна отслеживания (сек) — от неё считается кольцо/подпись. */
    trackTotalSeconds?: number;
    onToggleTracking: (player: PlayerData) => void;
    trackEvents?: NotifEvent[];
}

const RING_CIRCUMFERENCE = 94.25; // 2πr при r=15

export const PlayerModal: React.FC<PlayerModalProps> = ({
    player,
    onClose,
    onDelete,
    isTracking,
    trackingTimer,
    trackTotalSeconds = 300,
    onToggleTracking,
    trackEvents = [],
}) => {
    const { t } = useLang();
    const [activeTab, setActiveTab] = useState<'main' | 'activity' | 'servers' | 'names'>('main');
    const [copied, setCopied] = useState<boolean>(false);
    const [nameSearch, setNameSearch] = useState<string>('');
    const [activity, setActivity] = useState<ActivityDay[] | null>(player.activity ?? null)
    const [activityStatus, setActivityStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    // Доля оставшегося времени в [0..1]. Без клэмпа кольцо «прокручивалось»
    // много раз, когда знаменатель (был захардкожен 300с) не совпадал с реальным окном.
    const totalSec = trackTotalSeconds > 0 ? trackTotalSeconds : 1;
    const trackRatio = Math.max(0, Math.min(1, trackingTimer / totalSec));
    const ringOffset = isTracking
        ? RING_CIRCUMFERENCE * (1 - trackRatio)
        : RING_CIRCUMFERENCE;
    const trackWindowLabel = t('playerModal.trackWindowMin', {
        n: totalSec % 60 === 0 ? totalSec / 60 : Math.round(totalSec / 60),
    });

    useEffect(() => {
        if (activeTab !== 'activity' || activity || !player.bmId) return;
        
        const controller = new AbortController();
        setActivityStatus('loading');
        fetchActivity(player.bmId, controller.signal)
            .then((days) => {
                setActivity(days);
                setActivityStatus('idle');
            })
            .catch((err) => {
                if (err.name !== 'AbortError') setActivityStatus('error');
            })
        return () => controller.abort();
    }, [activeTab, activity, player.bmId]);

    
    const handleCopySteamId = (e: React.MouseEvent) => {
        e.stopPropagation();
         if (player.steamId){
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

        <div className="modalBody">
        {/* Шапка: Steam профиль */}
        <div className="steamInfo">
          <div className="playerImg">
            <PlayerAvatar src={player.steam?.avatarfull} alt={player.steam?.personaname} />
          </div>
          <div className="playerDetails">
            <p className="playerName">
              {player.steam?.personaname || player.bmName || t('playerModal.profileNotFound')}
            </p>
            <div className="statusContainer">
              <span
                className="statusDot"
                style={{
                  backgroundColor: player.isOnline
                    ? '#22c55e'
                    : player.steam?.personastate === 1
                    ? '#38bdf8'
                    : '#888',
                }}
              ></span>
              <span className="statusLabel">
                {player.isOnline
                  ? t('playerModal.statusInGame')
                  : player.steam?.personastate === 1
                  ? t('playerModal.statusOnlineSteam')
                  : t('playerModal.statusOffline')}
              </span>
            </div>
            <div className="playerSteamId">
              <code>{player.steamId ?? t('playerModal.notLinked')}</code>
              {player.steamId && (
                <button
                  className="copyBtn"
                  onClick={handleCopySteamId}
                  title={t('playerModal.copySteamIdTitle')}
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
            <p className="bannerLabel">{t('playerModal.playingNow')}</p>
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
            {t('playerModal.tabs.overview')}
          </button>
          <button
            className={`tabBtn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            {t('playerModal.tabs.activity')}
          </button>
          <button
            className={`tabBtn ${activeTab === 'servers' ? 'active' : ''}`}
            onClick={() => setActiveTab('servers')}
          >
            {t('playerModal.tabs.servers')} ({player.servers?.length || 0})
          </button>
          <button
            className={`tabBtn ${activeTab === 'names' ? 'active' : ''}`}
            onClick={() => setActiveTab('names')}
          >
            {t('playerModal.tabs.names')} ({player.nicknames?.length || 0})
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
                  <p className="label">
                    {t('playerModal.playtimeLabel')}

                    <span className="infoWrapper">
                      <LuInfo size={14} />
                      <CustomTooltip text={t('playerModal.playtimeTooltip')} />
                    </span>
                  </p>
                  <p className="value">
                    {player.battleMetrics?.playtime
                      ? t('playerModal.hoursShort', { n: player.battleMetrics.playtime })
                      : '-'}
                  </p>
                </div>
                <div className="statTile">
                  <p className="label">{t('playerModal.firstSeenLabel')}</p>
                  <p className="value">{player.battleMetrics?.firstSeen ?? '-'}</p>
                </div>
              </div>

              {/* Кнопка отслеживания с круговым SVG таймером */}
              <div className="trackContainer">
                <button
                  className={`trackBtn ${isTracking ? 'trackingActive' : ''}`}
                  onClick={() => onToggleTracking(player)}
                >
                  <span className={`trackDot ${isTracking ? 'dotActive' : ''}`}></span>
                  <span className="trackText">
                    {isTracking
                      ? t('playerModal.trackingLabel', { time: formatTimer(trackingTimer) })
                      : t('playerModal.trackPlayerLabel', { window: trackWindowLabel })}
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
                          strokeDasharray: RING_CIRCUMFERENCE,
                          strokeDashoffset: ringOffset,
                        }}
                      />
                    </svg>
                  </div>
                </button>

                {isTracking && (
                  <p className="trackHint">
                    {player.hasLeftInitialServer
                      ? t('playerModal.leftInitialServer')
                      : player.isOnline
                      ? t('playerModal.onTrackedServer')
                      : t('playerModal.notOnlineNow')}
                  </p>
                )}
              </div>

              {/* Действия */}
              <div className="actions">
                {player.steamId && (
                  <a
                    className="actionBtn primary"
                    href={
                      player.steam?.profileurl ||
                      `https://steamcommunity.com/profiles/${player.steamId}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('playerModal.steamProfileBtn')}
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
                    onDelete(cardKey(player));
                    onClose();
                  }}
                >
                  {t('playerModal.deleteCard')}
                </button>
              </div>
            </div>
          )}

          {/* Вкладка: Активность по часам за неделю */}
          {activeTab === 'activity' && (
            <div className="tabPane activityPane">
              {activityStatus === 'loading' ? (
                <p className="emptyText">{t('playerModal.activityLoading')}</p>
              ) : activityStatus === 'error' ? (
                <p className="emptyText">{t('playerModal.activityError')}</p>
              ) : activity && activity.length > 0 ? (
                <ActivityHeatmap days={activity} />
              ) : (
                <p className="emptyText">{t('playerModal.activityEmpty')}</p>
              )}
            </div>
          )}

          {/* Вкладка 2: Сервера */}
          {activeTab === 'servers' && (
            <div className="tabPane serversPane">
              <p className="serversTabHeading">{t('playerModal.serversTabHeading')}</p>
              <div className="tabContentList">
                {player.servers && player.servers.length > 0 ? (
                  player.servers.slice(0, 10).map((srv, idx) => (
                    <div key={idx} className="listItem">
                      <span className="listItemTitle" title={srv.name}>
                        {srv.name}
                      </span>
                      <span className="listItemSub">
                        {t('playerModal.hoursAndLastSeen', {
                          n: Math.round(srv.timePlayedSeconds / 3600),
                          lastSeen: srv.lastSeen,
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="emptyText">{t('playerModal.noServerData')}</p>
                )}
              </div>
            </div>
          )}

          {/* Вкладка 3: Никнеймы */}
          {activeTab === 'names' && (
            <div className="tabContentList tabPane">
              <input
                type="text"
                className="nameSearchInput"
                placeholder={t('playerModal.nicknameSearchPlaceholder')}
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
                  <p className="emptyText">{t('playerModal.noNicknamesFound')}</p>
                )}
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Правая колонка: отслеживание этого игрока */}
        <aside className="modalJournalPane">
          <div className={`modalTrackStatus ${isTracking ? 'isTracking' : ''}`}>
            <div className="modalTrackStatusRow">
              <span
                className="modalTrackStatusDot"
                style={{
                  background: !isTracking
                    ? '#52525b'
                    : player.hasLeftInitialServer
                    ? '#eab308'
                    : player.isOnline
                    ? '#22c55e'
                    : '#ef4444',
                }}
              />
              <span className="modalTrackStatusLabel">
                {isTracking
                  ? t('playerModal.trackingStatus', { time: formatTimer(trackingTimer) })
                  : t('playerModal.notTracking')}
              </span>
            </div>
            <p className="modalTrackStatusHint">
              {!isTracking
                ? t('playerModal.trackHintEnable')
                : player.hasLeftInitialServer
                ? t('playerModal.leftInitialServer')
                : player.isOnline
                ? t('playerModal.onTrackedServer')
                : t('playerModal.notOnlineNow')}
            </p>
          </div>

          <TrackJournal
            events={trackEvents}
            className="inModal"
            title={t('playerModal.journalTitle')}
            emptyHint={t('playerModal.journalEmptyHint')}
          />
        </aside>
      </div>
    </div>
  );
};

