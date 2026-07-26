import { useState, useEffect } from 'react';

import './cardContainer.css';

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
                <div className='modalOverlay'>
                    <div className='modalMenu'>
                        
                        <button className='' onClick={() => setSelectedSteamId(null)}>X</button>
                        <h1>Игрок со стим айди: {selectedSteamId}</h1>
                        
                    </div>
                </div>
                
            )}
        </>
    )
}

export default CardContainer;