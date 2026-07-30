import { useState, useEffect } from 'react';
import type { PlayerData } from './player';
import './cardContainer.css';
import './modalMenuInfo.css';

interface CardContainerProps {
  steamId: string;
}

const CardContainer = ({ steamId }: CardContainerProps) => {
  // Массив сохраненных SteamID
  const [cards, setCards] = useState<string[]>([]);

  // Открытый SteamID для модального окна
  const [selectedSteamId, setSelectedSteamId] = useState<string | null>(null);

  // Единый объект данных игрока (Steam + BattleMetrics)
  const [player, setPlayer] = useState<PlayerData | null>(null);

  // Состояние загрузки данных с бэкенда
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Добавление нового SteamID в список карточек
  useEffect(() => {
    if (steamId && !cards.includes(steamId)) {
      setCards((prevCards) => [...prevCards, steamId]);
    }
  }, [steamId]);

  // 2. Получение данных игрока с бэкенда при открытии модального окна
  useEffect(() => {
    if (!selectedSteamId) {
      setPlayer(null); // Очищаем данные при закрытии модалки
      return;
    }

    setLoading(true);

    fetch(`http://localhost:5001/api/player/${selectedSteamId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка загрузки данных');
        return res.json();
      })
      .then((data: PlayerData) => {
        setPlayer(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка при запросе игрока:', err);
        setLoading(false);
      });
  }, [selectedSteamId]);

  return (
    <>
      <div className='cardWrapper'>
        <div className="cardContainer">
          {cards.map((id) => (
            <div 
              key={id} 
              className="card" 
              onClick={() => setSelectedSteamId(id)}
            >
              <div className="cardImage"></div>
              <div className="cardInfo">
                <h3 style={{ color: 'white' }}>SteamID: {id}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно */}
      {selectedSteamId && (
        <div className='modalOverlay' onClick={() => setSelectedSteamId(null)}>
          <div
            className='modalMenu'
            onClick={(e) => e.stopPropagation()}
          >
            <button className='exitButton' onClick={() => setSelectedSteamId(null)}>✕</button>

            {/* Блок Steam */}
            <div className='steamInfo'>
              <div className='playerImg'>
                {player?.steam?.avatarfull && (
                <img 
                  src={player.steam.avatarfull} 
                  alt={player.steam.personaname} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              )}
              </div>
              <div>
                <p className='playerName'>
                  {loading ? 'Загрузка...' : player?.steam?.personaname || 'Игрок не найден'}
                </p>
                <div>
                  <span 
                    className='statusDot'
                    style={{ 
                      backgroundColor: player?.steam?.personastate === 1 ? '#4caf50' : '#888' 
                    }}
                  ></span>
                  <span className='statusLabel'>
                    {player?.steam?.personastate === 1 ? 'В сети' : 'Не в сети'}
                  </span>
                </div>
                <div className='playerSteamId'>
                  <code>{selectedSteamId}</code>
                  <button 
                    className='copyBtn' 
                    onClick={() => navigator.clipboard.writeText(selectedSteamId)} 
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
                      {player?.battleMetrics?.playtime ? `${player.battleMetrics.playtime} ч.` : '-'}
                    </p>
                  </div>
                  <div className='statTile'>
                    <p className='label'>Сессий</p>
                    <p className='value'>{player?.battleMetrics?.sessions ?? '-'}</p>
                  </div>
                  <div className='statTile'>
                    <p className='label'>Первый визит</p>
                    <p className='value'>{player?.battleMetrics?.firstSeen ?? '-'}</p>
                  </div>
                  <div className='statTile warn'>
                    <p className='label'>Репутация</p>
                    <p className='value'>{player?.battleMetrics?.reputation ?? '-'}</p>
                  </div>
                  <div className='statTile'>
                    <p className='label'>Последний визит</p>
                    <p className='value'>{player?.battleMetrics?.lastSeen ?? '-'}</p>
                  </div>
                  <div className='statTile danger'>
                    <p className='label'>Баны</p>
                    <p className='value'>{player?.battleMetrics?.bansCount ?? '-'}</p>
                  </div>
                </div>
              </div>

              <div className='actions'>
                <a 
                  className='actionBtn primary' 
                  href={player?.steam?.profileurl || `https://steamcommunity.com/profiles/${selectedSteamId}`} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  Профиль Steam
                </a>
                <a 
                  className='actionBtn' 
                  href={`https://www.battlemetrics.com/rcon/players?filter[search]=${selectedSteamId}`} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  BattleMetrics ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CardContainer;