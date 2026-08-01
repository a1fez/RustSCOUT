import { useState } from 'react';
import { HiArrowNarrowRight } from "react-icons/hi";
import './search.css';
import { BiFontSize } from 'react-icons/bi';

interface SearchProps {
    onSearch: (text: string) => void;
}

const Search = ({ onSearch }: SearchProps) => {
    const [text, setText] = useState('');
    const [server, setServer] = useState('');
    
    const servers = [
  'Rustoria.eu - Main',
  'Rustoria.eu - Medium',
  'Rustafied.com - Main',
  'Rustafied.com - US Medium',
  'Bloo Lagoon 1.5x',
  'Stealther 2x',
  'Vital Rust 10x'
];
    
    
    
    const handleSubmit = () => {
        const trimmed = text.trim();
        
        // Валидация SteamID64
        if (trimmed.length !== 17 || !trimmed.startsWith('7')) {
            alert('Это не SteamID_64. Он должен состоять из 17 цифр и начинаться с 7... Пример: 76561198000000000');
            return;
        }

        onSearch(trimmed);
        setText('');
    };

    return (
        <div className="search">
            <div className="searchContainer">
                <input 
                    value={text}
                    onChange={(e) => setText(e.target.value.replace(/\D/g, ''))} // Разрешаем только цифры
                    type="text" 
                    className="searchInput" 
                    placeholder="Введите SteamID..." 
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} 
                />

                <button type="button" className="searchButton" 
                onClick={handleSubmit}
                
                
                >
                    <HiArrowNarrowRight className="searchIcon"/>
                </button>

                <input
                    className='searchInput'
                    placeholder='Выберите сервер...'
                    value={server}
                    onChange={(e) => {setServer(e.target.value)}}
                    list='server-list'
                    
                ></input>
                <datalist id="server-list">
                    {servers.map((srv,index) => (
                        <option key={index} value={srv}/>
                    ))}
                </datalist>
            </div>
        </div>
    );
};

export default Search;