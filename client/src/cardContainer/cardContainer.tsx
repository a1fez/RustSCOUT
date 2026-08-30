import { useState, useEffect } from 'react';
import type { PlayerData } from './player';
import './cardContainer.css';
import './modalMenuInfo.css';

interface CardContainerProps {
  steamId: string;
}

const CardContainer = ({ steamId }: CardContainerProps) => {
  const [cards, setCards] = useState<PlayerData[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);

  // Состояния для модального окна
  const [activeTab, setActiveTab] = useState<'main' | 'servers' | 'names'>('main');
  const [copied, setCopied] = useState<boolean>(false);
  const [nameSearch, setNameSearch] = useState<string>('');

  useEffect(() => {
    if (!steamId) return;

    const isAlreadyAdded = cards.some((card) => card.steamId === steamId);
    if (isAlreadyAdded) return;

    setIsAddingCard(true);

    fetch(`http://localhost:5001/api/player/${steamId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Не удалось загрузить данные');
        return res.json();
      })
      .then((playerData: PlayerData) => {
        setCards((prevCards) => [...prevCards, playerData]);
        setIsAddingCard(false);
      })
      .catch((err) => {
        console.error('Ошибка добавления карточки:', err);
        setIsAddingCard(false);
      });
  }, [steamId, cards]);

  const handleDeleteCard = (steamIdToDelete: string) => {
    setCards((prevCards) => prevCards.filter((card) => card.steamId !== steamIdToDelete));
  };

  const handleCopySteamId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id && id !== 'Не привязан') {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredNicknames = (selectedPlayer?.nicknames || []).filter((name) =>
    name.toLowerCase().includes(nameSearch.toLowerCase())
  );

  return (
    <>
      <div className="cardWrapper">
        <div className="cardContainer">
          {/* Скелетон-заглушка во время загрузки новой карточки */}
          {isAddingCard && (
            <div className="card skeletonCard">
              <div className="cardImage skeletonImage skeletonShimmer" />
              <div className="cardInfo skeletonInfo">
                <div className="skeletonLine skeletonName skeletonShimmer" />
                <div className="skeletonLine skeletonStatus skeletonShimmer" />
              </div>
            </div>
          )}

          {/* Список добавленных карточек */}
          {cards.map((player) => (
            <div
  key={player.steamId}
  className="card"
  onClick={() => {
    setSelectedPlayer(player);
    setActiveTab('main');
    setNameSearch('');
  }}
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
</div>
          ))}
        </div>
      </div>

      {/* Модальное окно */}
      {selectedPlayer && (
        <div className="modalOverlay" onClick={() => setSelectedPlayer(null)}>
          <div className="modalMenu" onClick={(e) => e.stopPropagation()}>
            <button className="exitButton" onClick={() => setSelectedPlayer(null)}>
              ✕
            </button>

            {/* Шапка: Steam профиль */}
            <div className="steamInfo">
              <div className="playerImg">
                {selectedPlayer.steam?.avatarfull ? (
                  <img
                    src={selectedPlayer.steam.avatarfull}
                    alt={selectedPlayer.steam.personaname}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="avatarPlaceholder">👤</div>
                )}
              </div>
              <div className="playerDetails">
                <p className="playerName">
                  {selectedPlayer.steam?.personaname || 'Профиль не найден'}
                </p>
                <div className="statusContainer">
                  <span
                    className="statusDot"
                    style={{
                      backgroundColor: selectedPlayer.isOnline
                        ? '#4caf50'
                        : selectedPlayer.steam?.personastate === 1
                        ? '#38bdf8'
                        : '#888',
                    }}
                  ></span>
                  <span className="statusLabel">
                    {selectedPlayer.isOnline
                      ? 'В игре (Rust)'
                      : selectedPlayer.steam?.personastate === 1
                      ? 'В сети (Steam)'
                      : 'Не в сети'}
                  </span>
                </div>
                <div className="playerSteamId">
                  <code>{selectedPlayer.steamId}</code>
                  {selectedPlayer.steamId !== 'Не привязан' && (
                    <button
                      className="copyBtn"
                      onClick={(e) => handleCopySteamId(selectedPlayer.steamId, e)}
                      title="Копировать SteamID"
                    >
                      {copied ? (
                        <span className="copySuccess">✓</span>
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
            {selectedPlayer.currentServer && (
              <div className="currentServerBanner">
                <p className="bannerLabel">ИГРАЕТ СЕЙЧАС</p>
                <p className="bannerServerName">{selectedPlayer.currentServer.name}</p>
                {selectedPlayer.currentServer.ip && (
                  <p className="bannerServerIp">{selectedPlayer.currentServer.ip}</p>
                )}
              </div>
            )}

            {/* Вкладки переключения контента */}
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
                СЕРВЕРА ({selectedPlayer.servers?.length || 0})
              </button>
              <button
                className={`tabBtn ${activeTab === 'names' ? 'active' : ''}`}
                onClick={() => setActiveTab('names')}
              >
                НИКНЕЙМЫ ({selectedPlayer.nicknames?.length || 0})
              </button>
            </div>

            {/* Обертка с фиксированной высотой, чтобы окно не прыгало при переключении */}
            <div className="tabContentWrapper">
              {/* Вкладка 1: Обзор BattleMetrics */}
              {activeTab === 'main' && (
                <div className="battleMetricsInfo tabPane">
                  <div className="sectionHeader">
                    <span className="sectionLabel">BATTLEMETRICS</span>
                    <div className="sectionDivider"></div>
                  </div>

                  <div className="statGrid">
                    <div className="statTile">
                      <p className="label">Наиграно</p>
                      <p className="value">
                        {selectedPlayer.battleMetrics?.playtime
                          ? `${selectedPlayer.battleMetrics.playtime} ч.`
                          : '-'}
                      </p>
                    </div>
                    <div className="statTile">
                      <p className="label">Сессий</p>
                      <p className="value">{selectedPlayer.battleMetrics?.sessions ?? '-'}</p>
                    </div>
                    <div className="statTile">
                      <p className="label">Первый визит</p>
                      <p className="value">{selectedPlayer.battleMetrics?.firstSeen ?? '-'}</p>
                    </div>
                    <div className="statTile">
                      <p className="label">Репутация</p>
                      <p className="value warning">
                        {selectedPlayer.battleMetrics?.reputation ?? '-'}
                      </p>
                    </div>
                    <div className="statTile">
                      <p className="label">Последний визит</p>
                      <p className="value">{selectedPlayer.battleMetrics?.lastSeen ?? '-'}</p>
                    </div>
                    <div className="statTile">
                      <p className="label">Баны</p>
                      <p className="value danger">
                        {selectedPlayer.battleMetrics?.bansCount ?? '-'}
                      </p>
                    </div>
                  </div>

                  <div className="actions">
                    {selectedPlayer.steamId !== 'Не привязан' && (
                      <a
                        className="actionBtn primary"
                        href={
                          selectedPlayer.steam?.profileurl ||
                          `https://steamcommunity.com/profiles/${selectedPlayer.steamId}`
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
                        selectedPlayer.bmId
                          ? `https://www.battlemetrics.com/players/${selectedPlayer.bmId}`
                          : `https://www.battlemetrics.com/rcon/players?filter[search]=${selectedPlayer.steamId}`
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
                        handleDeleteCard(selectedPlayer.steamId);
                        setSelectedPlayer(null);
                      }}
                    >
                      Удалить карточку
                    </button>
                  </div>
                </div>
              )}

              {/* Вкладка 2: Последние сервера */}
              {activeTab === 'servers' && (
                <div className="tabContentList tabPane">
                  {selectedPlayer.servers && selectedPlayer.servers.length > 0 ? (
                    selectedPlayer.servers.slice(0, 10).map((srv, idx) => (
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
      )}
    </>
  );
};

export default CardContainer;