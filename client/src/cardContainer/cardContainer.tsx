import { useState, useEffect } from 'react';
import type { PlayerData } from './player';
import './cardContainer.css';
import './modalMenuInfo.css';

interface CardContainerProps {
  steamId: string;
}

const CardContainer = ({ steamId }: CardContainerProps) => {
// Храним МАССИВ ОБЪЕКТОВ игроков (PlayerData[])
  const [cards, setCards] = useState<PlayerData[]>([]);

// Храним ВЕСЬ объект выбранного игрока для модалки, а не только ID
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);

  // Состояние загрузки новой карточки
const [isAddingCard, setIsAddingCard] = useState<boolean>(false);




// Загружаем данные игрока СРАЗУ при получении steamId из поиска
  useEffect(() => {
    if (!steamId) return;

    // Проверяем: если игрок с таким ID уже есть в списке — ничего не делаем
    const isAlreadyAdded = cards.some((card) => card.steamId === steamId);
    if (isAlreadyAdded) return;

    setIsAddingCard(true);

    // Запрос к бэкенду за полными данными игрока
    fetch(`http://localhost:5001/api/player/${steamId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Не удалось загрузить данные');
        return res.json();
      })
      .then((playerData: PlayerData) => {
        // Добавляем полностью загруженный объект игрока в массив cards
        setCards((prevCards) => [...prevCards, playerData]);
        setIsAddingCard(false);
      })
      .catch((err) => {
        console.error('Ошибка добавления карточки:', err);
        setIsAddingCard(false);
      });
  }, [steamId]);
  
  const handleDeleteCard = (steamIdToDelete: string) => {
  setCards((prevCards) => prevCards.filter((card) => card.steamId !== steamIdToDelete));
}
  
  return (
    <>
      <div className='cardWrapper'>
        <div className="cardContainer">
          {/* Если идет запрос новой карточки — покажем надпись */}
          {isAddingCard && <p style={{ color: '#aaa' }}>Поиск игрока...</p>}

          {/* Бегаем по массиву ОБЪЕКТОВ карточек */}
          {cards.map((player) => (
            <div 
              key={player.steamId} 
              className="card" 
              onClick={() => setSelectedPlayer(player)} // Передаем весь объект игрока при клике
            >
              <div className="cardImage">
                {/* Если есть аватарка — выводим ее, иначе серая заглушка */}
                {player.steam?.avatarfull ? (
                  <img 
                    src={player.steam.avatarfull} 
                    alt={player.steam.personaname} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: "8px" }} 
                  />
                ) : (
                  <div style={{ background: '#2a2a2a', width: '100%', height: '100%' }} />
                )}
              </div>
              
              <div className="cardInfo">
                <h3 style={{ color: 'white' }}>
                  {player.steam?.personaname || `ID: ${player.steamId}`}
                </h3>

                <div>
                  <span 
                    className='statusDot'
                    style={{ 
                      backgroundColor: player.steam?.personastate === 1 ? '#4caf50' : '#888' 
                    }}
                  ></span>
                  <span className='statusLabel'>
                    {player.steam?.personastate === 1 ? 'В сети' : 'Не в сети'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно (открывается мгновенно, т.к. данные уже есть в selectedPlayer) */}
      {selectedPlayer && (
        <div className='modalOverlay' onClick={() => setSelectedPlayer(null)}>
          <div
            className='modalMenu'
            onClick={(e) => e.stopPropagation()}
          >
            <button className='exitButton' onClick={() => setSelectedPlayer(null)}>✕</button>

            {/* Блок Steam */}
            <div className='steamInfo'>
              <div className='playerImg'>
                {selectedPlayer.steam?.avatarfull && (
                  <img 
                    src={selectedPlayer.steam.avatarfull} 
                    alt={selectedPlayer.steam.personaname} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', }} 
                  />
                )}
              </div>
              <div>
                <p className='playerName'>
                  {selectedPlayer.steam?.personaname || 'Профиль не найден'}
                </p>
                <div>
                  <span 
                    className='statusDot'
                    style={{ 
                      backgroundColor: selectedPlayer.steam?.personastate === 1 ? '#4caf50' : '#888' 
                    }}
                  ></span>
                  <span className='statusLabel'>
                    {selectedPlayer.steam?.personastate === 1 ? 'В сети' : 'Не в сети'}
                  </span>
                </div>
                <div className='playerSteamId'>
                  <code>{selectedPlayer.steamId}</code>
                  <button 
                    className='copyBtn' 
                    onClick={() => navigator.clipboard.writeText(selectedPlayer.steamId)} 
                    title="Копировать"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Блок BattleMetrics */}
            <div className='battleMetricsInfo'>
              <div>
                <p className='sectionLabel'>BattleMetrics</p>
                <div className='statGrid'>
                  <div className='statTile'>
                    <p className='label'>Наиграно</p>
                    <p className='value'>
                      {selectedPlayer.battleMetrics?.playtime ? `${selectedPlayer.battleMetrics.playtime} ч.` : '-'}
                    </p>
                  </div>
                  <div className='statTile'>
                    <p className='label'>Сессий</p>
                    <p className='value'>{selectedPlayer.battleMetrics?.sessions ?? '-'}</p>
                  </div>
                  <div className='statTile'>
                    <p className='label'>Первый визит</p>
                    <p className='value'>{selectedPlayer.battleMetrics?.firstSeen ?? '-'}</p>
                  </div>
                  <div className='statTile warn'>
                    <p className='label'>Репутация</p>
                    <p className='value'>{selectedPlayer.battleMetrics?.reputation ?? '-'}</p>
                  </div>
                  <div className='statTile'>
                    <p className='label'>Последний визит</p>
                    <p className='value'>{selectedPlayer.battleMetrics?.lastSeen ?? '-'}</p>
                  </div>
                  <div className='statTile danger'>
                    <p className='label'>Баны</p>
                    <p className='value'>{selectedPlayer.battleMetrics?.bansCount ?? '-'}</p>
                  </div>
                </div>
              </div>

              <div className='actions'>
                <a 
                  className='actionBtn primary' 
                  href={selectedPlayer.steam?.profileurl || `https://steamcommunity.com/profiles/${selectedPlayer.steamId}`} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  Профиль Steam
                </a>
                <a 
                  className='actionBtn' 
                  href={`https://www.battlemetrics.com/rcon/players?filter[search]=${selectedPlayer.steamId}`} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  BattleMetrics ↗
                </a>

                <button className='deleteCard' 
                  onClick={ (e) => {
                    e.stopPropagation();
                    handleDeleteCard((selectedPlayer.steamId));
                    setSelectedPlayer(null);
                  }}
                > 
                Удалить карточку</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CardContainer;