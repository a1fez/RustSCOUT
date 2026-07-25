import { useState, useEffect } from 'react';

import './cardContainer.css';

interface CardContainerProps {
    steamId: string;
}

const CardContainer = ({ steamId }: CardContainerProps) => { // Стим айди, передача значения из Search в CardContainer
    // Массив карточек 
    const [cards, setCards] = useState<string[]>([]);

    useEffect(() => {
        if (steamId) {
            setCards((prevCards) => [...prevCards, steamId]);
        }
    }, [steamId]);


    return (
        <>
            <div className="cardContainer">
                {cards.map((steamId, index) => (
                    <div key={index} className="card">
                        <h3 style={{ color: 'white'}}>SteamID: {steamId}</h3>
                    </div>
                ))}
            </div>
        </>
    )
}

export default CardContainer;