import { useState, useEffect } from 'react';

import './cardContainer.css';
import './modalMenuInfo.css'


interface CardContainerProps {
    steamId: string;
}

const CardContainer = ({ steamId }: CardContainerProps) => { // Стим айди, передача значения из Search в CardContainer
    // Массив карточек 
    const [cards, setCards] = useState<string[]>([]);

    const [selectedSteamId, setSelectedSteamId] = useState<string | null>(null);

    
    useEffect(() => {
       
        if (steamId && !cards.includes(steamId)) {
            setCards((prevCards) => [...prevCards, steamId]);
            
        }
        
    }, [steamId]);


    return (
        <>
            <div className='cardWrapper'>
                <div className="cardContainer">
                    {cards.map((steamId, index, ) => (
                        <div key={index} className="card" onClick={() => setSelectedSteamId(steamId)}>
                            <div className="cardImage"></div>
                            
                            <div className="cardInfo">
                                <h3 style={{ color: 'white'}}>SteamID: {steamId}</h3>
                            </div>
                            
                        </div>
                        
                    ))}
                </div>
            </div>

            {selectedSteamId && (
  <div className='modalOverlay' onClick={() => setSelectedSteamId(null)}>
    <div
      className='modalMenu'
      style={{  }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className='exitButton' onClick={() => setSelectedSteamId(null)}>✕</button>

      <div className='steamInfo'>
        <div className='playerImg'>
          <img src="" alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
        <div>
          <p className='playerName'>Загрузка...</p>
          <div>
            <span className='statusDot'></span>
            <span className='statusLabel'>'В сети' : 'Не в сети'</span>
          </div>
          <div className='playerSteamId'>
            <code>{selectedSteamId}</code>
            <button className='copyBtn' onClick={() => navigator.clipboard.writeText(selectedSteamId)} title="Копировать">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className='battleMetricsInfo'>
        <div>
          <p className='sectionLabel'>BattleMetrics</p>
          <div className='statGrid'>
            <div className='statTile'><p className='label'>Наиграно</p><p className='value'></p></div>
            <div className='statTile'><p className='label'>Сессий</p><p className='value'></p></div>
            <div className='statTile'><p className='label'>Первый визит</p><p className='value'></p></div>
            <div className='statTile warn'><p className='label'>Репутация</p><p className='value'></p></div>
            <div className='statTile'><p className='label'>Последний визит</p><p className='value'></p></div>
            <div className='statTile danger'><p className='label'>Баны</p><p className='value'></p></div>
          </div>
        </div>

        <div className='actions'>
          <a className='actionBtn primary' href={`https://steamcommunity.com/profiles/${selectedSteamId}`} target="_blank" rel="noreferrer">Профиль Steam</a>
          <a className='actionBtn' href={`https://www.battlemetrics.com/rcon/players?filter[search]=${selectedSteamId}`} target="_blank" rel="noreferrer">BattleMetrics ↗</a>
        </div>
      </div>
    </div>
  </div>
)}
        </>
    )
}

export default CardContainer;