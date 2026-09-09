import { useState, useEffect } from 'react';
import type { PlayerData } from './player';
import { PlayerModal } from './playerModal';
import { TrackJournal } from '../tracking/trackJournal';
import type { NotifEvent } from '../notifications/notification';
import './cardContainer.css';

const API = '';
const TRACK_SECONDS = 6000; // для кольцевого прогресса на карточке
const MAX_CARDS = 20;       // максимум карточек одновременно

export interface SearchData {
  steamId: string;
  serverId: string;
  timestamp: number;
}

interface CardContainerProps {
  searchQuery: SearchData | null;
  cards: PlayerData[];
  setCards: React.Dispatch<React.SetStateAction<PlayerData[]>>;
  trackingMap: Record<string, number>;
  setSearchQuery: React.Dispatch<React.SetStateAction<SearchData | null>>;
  setSearchError: React.Dispatch<React.SetStateAction<string | null>>;
  onToggleTracking: (player: PlayerData) => void;
  onDeleteCard: (steamId: string) => void;
  trackEvents: NotifEvent[];
  onClearTrackEvents: () => void;
}

const CardContainer = ({
  searchQuery,
  cards,
  setCards,
  trackingMap,
  setSearchQuery,
  setSearchError,
  onToggleTracking,
  onDeleteCard,
  trackEvents,
  onClearTrackEvents,
}: CardContainerProps) => {

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Запрос данных игрока по SteamID + выбранному серверу
  useEffect(() => {
    if (!searchQuery?.steamId) return;

    const { steamId, serverId } = searchQuery;

    const existingPlayer = cards.find((card) => card.steamId === steamId);
    if (existingPlayer) {
      setSelectedPlayer(existingPlayer);
      setSearchQuery(null);
      return;
    }

    // Лимит карточек
    if (cards.length >= MAX_CARDS) {
      setSearchError('card_limit');
      setSearchQuery(null);
      return;
    }

    setIsAddingCard(true);
    setSearchError(null);

    const hasServer = serverId && serverId !== 'undefined' && serverId.trim() !== '';
    const queryUrl = hasServer
      ? `${API}/api/player/${steamId}?server=${encodeURIComponent(serverId.trim())}`
      : `${API}/api/player/${steamId}`;

    fetch(queryUrl)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.matched === false) {
          throw new Error(data.reason || 'unknown_error');
        }
        return data as PlayerData;
      })
      .then((playerData: PlayerData) => {
        const searchedId = hasServer && /^\d+$/.test(serverId.trim()) ? serverId.trim() : null;
        const enriched: PlayerData = {
          ...playerData,
          initialServerId: searchedId || playerData.currentServer?.id || null,
        };
        setCards((prevCards) => [enriched, ...prevCards]);
        setIsAddingCard(false);
        setSearchQuery(null);
      })
      .catch((err: Error) => {
        console.error('Ошибка добавления карточки:', err.message);
        setSearchError(err.message);
        setIsAddingCard(false);
        setSearchQuery(null);
      });
  }, [searchQuery]);

  // Модалка должна показывать свежие данные (текущий сервер обновляется опросом),
  // поэтому берём актуальную карточку из cards, а не замороженный selectedPlayer.
  const activePlayer = selectedPlayer
    ? cards.find((c) => c.steamId === selectedPlayer.steamId) ?? selectedPlayer
    : null;

  const cardCount = cards.length + (isAddingCard ? 1 : 0);

  return (
    <>
      <div className="cardWrapper">
        <div className="cardLayout">
          <div className="cardMain">
            <div className="cardContainer">
          <span
            className={`cardCount ${cardCount >= MAX_CARDS ? 'full' : ''}`}
            title="Карточек добавлено"
          >
            {cardCount}/{MAX_CARDS}
          </span>

          {isAddingCard && (
            <div className="card skeletonCard">
              <div className="cardImage skeletonImage skeletonShimmer" />
              <div className="cardInfo skeletonInfo">
                <div className="skeletonLine skeletonName skeletonShimmer" />
                <div className="skeletonLine skeletonStatus skeletonShimmer" />
              </div>
            </div>
          )}

          {cards.map((player) => {
            const playerTimer = trackingMap[player.steamId] || 0;
            const isTracked = playerTimer > 0;

            // Кружок в левом верхнем углу: зелёный — на сервере, жёлтый — сменил
            // сервер, красный — оффлайн.
            const statusColor = !player.isOnline
              ? '#ef4444'
              : player.hasLeftInitialServer
              ? '#eab308'
              : '#22c55e';

            return (
              <div
                key={player.steamId}
                className="card"
                onClick={() => setSelectedPlayer(player)}
              >
                <span
                  className="cardStatusCorner"
                  title={
                    !player.isOnline
                      ? 'Оффлайн'
                      : player.hasLeftInitialServer
                      ? 'Сменил сервер'
                      : 'На сервере'
                  }
                  style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
                />

                <div className="cardImage">
                  {player.steam?.avatarfull ? (
                    <img src={player.steam.avatarfull} alt={player.steam.personaname} />
                  ) : (
                    <div className="avatarPlaceholder">👤</div>
                  )}
                </div>

                <div className="cardInfo">
                  <p className="cardPlayerName">
                    {player.steam?.personaname || `ID: ${player.steamId}`}
                  </p>

                  <div className="cardStatusRow">
                    <span
                      className="cardStatusDot"
                      style={{
                        backgroundColor: player.isOnline
                          ? '#22c55e'
                          : player.steam?.personastate === 1
                          ? '#38bdf8'
                          : '#64748b',
                      }}
                    ></span>
                    <span className="cardStatusLabel">
                      {player.isOnline
                        ? 'В ИГРЕ (RUST)'
                        : player.steam?.personastate === 1
                        ? 'В СЕТИ (STEAM)'
                        : 'НЕ В СЕТИ'}
                    </span>
                  </div>
                </div>

                {isTracked && (
                  <div className="cardCircularTimer" title={`Отслеживание: ${formatTimer(playerTimer)}`}>
                    <svg className="cardTimerSvg" viewBox="0 0 36 36">
                      <circle className="cardCircleBg" cx="18" cy="18" r="15" />
                      <circle
                        className="cardCircleProgress"
                        cx="18"
                        cy="18"
                        r="15"
                        style={{
                          strokeDasharray: 94.25,
                          strokeDashoffset: 94.25 * (1 - playerTimer / TRACK_SECONDS),
                        }}
                      />
                    </svg>
                    <span className="cardTimerText">{formatTimer(playerTimer)}</span>
                  </div>
                )}
              </div>
            );
          })}

          {!isAddingCard && cards.length === 0 && (
            <p className="cardEmpty">Найдите игрока через поиск выше — карточка появится здесь.</p>
          )}
            </div>
          </div>

          <aside className="cardJournal">
            <TrackJournal events={trackEvents} onClear={onClearTrackEvents} />
          </aside>
        </div>
      </div>

      {activePlayer && (
        <PlayerModal
          player={activePlayer}
          onClose={() => setSelectedPlayer(null)}
          onDelete={(steamId) => { onDeleteCard(steamId); setSelectedPlayer(null); }}
          isTracking={(trackingMap[activePlayer.steamId] || 0) > 0}
          trackingTimer={trackingMap[activePlayer.steamId] || 0}
          trackTotalSeconds={TRACK_SECONDS}
          onToggleTracking={onToggleTracking}
          trackEvents={trackEvents.filter((e) => e.steamId === activePlayer.steamId)}
        />
      )}
    </>
  );
};

export default CardContainer;
