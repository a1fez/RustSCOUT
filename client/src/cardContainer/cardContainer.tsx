import { useState, useEffect } from 'react';
import type { PlayerData } from './player';
import { PlayerModal } from './playerModal';
import './cardContainer.css';

// ==========================================
// [МЕТКА 1]: Интерфейс объекта поискового запроса
// ==========================================
export interface SearchData {
  steamId: string;
  serverId: string;
  timestamp: number;
}

// ==========================================
// [МЕТКА 2]: Обновленный интерфейс пропсов компонента
// ==========================================
interface CardContainerProps {
  searchQuery: SearchData | null;
}

const CardContainer = ({ searchQuery }: CardContainerProps) => {
  const [cards, setCards] = useState<PlayerData[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);

  // Хранилище фоновых таймеров отслеживания: { [steamId]: оставшиеся_секунды }
  const [trackingMap, setTrackingMap] = useState<Record<string, number>>({});

  // Глобальный фоновый таймер
  useEffect(() => {
    const interval: number = window.setInterval(() => {
      setTrackingMap((prevMap) => {
        const hasActiveTimers = Object.values(prevMap).some((seconds) => seconds > 0);
        if (!hasActiveTimers) return prevMap;

        const updated: Record<string, number> = {};
        for (const [id, seconds] of Object.entries(prevMap)) {
          if (seconds > 1) {
            updated[id] = seconds - 1;
          }
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTracking = (targetSteamId: string) => {
    if (!targetSteamId || targetSteamId === 'Не привязан') return;

    setTrackingMap((prev) => {
      const next = { ...prev };
      if (next[targetSteamId]) {
        delete next[targetSteamId];
      } else {
        next[targetSteamId] = 300;
      }
      return next;
    });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // =========================================================================
  // [МЕТКА 3]: Запрос данных игрока с передачей SteamID и выбранного сервера
  // =========================================================================
  useEffect(() => {
    if (!searchQuery?.steamId) return;

    const { steamId, serverId } = searchQuery;

    // Если игрок уже есть в списке — открываем его окно и не дублируем карточку
    const existingPlayer = cards.find((card) => card.steamId === steamId);
    if (existingPlayer) {
      setSelectedPlayer(existingPlayer);
      return;
    }

    setIsAddingCard(true);

    // Формируем URL с query-параметром выбранного сервера
    const hasServer = serverId && serverId !== 'undefined' && serverId.trim() !== '';
    const queryUrl = hasServer
      ? `http://localhost:5001/api/player/${steamId}?server=${encodeURIComponent(serverId.trim())}`
      : `http://localhost:5001/api/player/${steamId}`;

    fetch(queryUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Не удалось загрузить данные');
        return res.json();
      })
      .then((playerData: PlayerData) => {
        setCards((prevCards) => [playerData, ...prevCards]);
        setIsAddingCard(false);
      })
      .catch((err) => {
        console.error('Ошибка добавления карточки:', err);
        setIsAddingCard(false);
      });
  }, [searchQuery]);

  const handleDeleteCard = (steamIdToDelete: string) => {
    setCards((prevCards) => prevCards.filter((card) => card.steamId !== steamIdToDelete));
    setTrackingMap((prev) => {
      const next = { ...prev };
      delete next[steamIdToDelete];
      return next;
    });
  };

  return (
    <>
      <div className="cardWrapper">
        <div className="cardContainer">
          {/* Скелетон во время поиска */}
          {isAddingCard && (
            <div className="card skeletonCard">
              <div className="cardImage skeletonImage skeletonShimmer" />
              <div className="cardInfo skeletonInfo">
                <div className="skeletonLine skeletonName skeletonShimmer" />
                <div className="skeletonLine skeletonStatus skeletonShimmer" />
              </div>
            </div>
          )}

          {/* Карточки игроков */}
          {cards.map((player) => {
            const playerTimer = trackingMap[player.steamId] || 0;
            const isTracked = playerTimer > 0;

            return (
              <div
                key={player.steamId}
                className="card"
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="cardImage">
                  {player.steam?.avatarfull ? (
                    <img
                      src={player.steam.avatarfull}
                      alt={player.steam.personaname}
                    />
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

                {/* Круговой таймер на карточке */}
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
                          strokeDashoffset: 94.25 * (1 - playerTimer / 300),
                        }}
                      />
                    </svg>
                    <span className="cardTimerText">{formatTimer(playerTimer)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Вынесенное модальное окно */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onDelete={handleDeleteCard}
          isTracking={(trackingMap[selectedPlayer.steamId] || 0) > 0}
          trackingTimer={trackingMap[selectedPlayer.steamId] || 0}
          onToggleTracking={toggleTracking}
        />
      )}
    </>
  );
};

export default CardContainer;