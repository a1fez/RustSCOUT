import { useState, useRef, useEffect } from 'react';
import { HiArrowNarrowRight } from 'react-icons/hi';


import { IoChevronDown } from 'react-icons/io5';



import './search.css';

interface SearchProps {
    onSearch: (steamId: string, server: string) => void;
    servers?: string[];
}



const Search = ({ 
    onSearch, 
    servers = ['Server #1', 'Server #2', 'Server #3', 'RUST Main', 'RUST Monday', 'CS2 Official'] 
}: SearchProps) => {
    const [text, setText] = useState('');
    const [server, setServer] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    

    const [showError, setShowError] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Фильтрация серверов по введённому тексту (без учёта регистра)
    const filteredServers = servers.filter((srv) =>
        srv.toLowerCase().includes(server.toLowerCase())
    );

    // Закрываем меню при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if (isSteamEmpty || isServerEmpty) {
            setShowError(true);
            return;
        }
        setShowError(false);

        onSearch(text.trim(), server.trim());
    };

    const handleSelectServer = (srv: string) => {
        setServer(srv);
        setIsOpen(false); // Закрываем список после выбора
        if (showError) {
            setShowError(false); // Скрываем ошибку, если SteamID уже введён
        }
    };

    const isSteamEmpty = !text.trim();
    const isServerEmpty = !server.trim();


    return (
        <div className="search">
            <div className="searchFormCard">
                {/* Инпут SteamID */}
                <div className={`inputRow ${showError && isSteamEmpty ? 'inputError' : ''}`}>
                    <input 
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value.replace(/\D/g, ''));
                            if (showError) setShowError(false);
                        }} 
                        type="text" 
                        className="searchInput" 
                        placeholder={"Введите SteamID..."} 
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} 
                    />
                </div>

                {/* Инпут Сервера */}
                <div 
                    className={`inputRow ${showError && isServerEmpty ? 'inputError' : ''}`} 
                    ref={dropdownRef}
                >
                    <div className="selectInputWrapper">
                        <input
                            type="text"
                            className="searchInput"
                            placeholder={"Выберите или введите сервер..."}
                            value={server}
                            onFocus={() => setIsOpen(true)}
                            onChange={(e) => {
                                setServer(e.target.value);
                                setIsOpen(true);
                                if (showError) setShowError(false);
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                        />
                        <IoChevronDown 
                            className={`chevronIcon ${isOpen ? 'rotate' : ''}`}
                            onClick={() => setIsOpen(!isOpen)} 
                        />

                    </div>
                    
                    {showError && (
                    <div className="errorText" style={{ color: 'red', marginTop: '10px' }}>
                    <p>Пожалуйста, заполните все поля</p>
                    </div>
                    )}
                    {isOpen && (
                        <div className="dropdownMenu">
                            {filteredServers.length > 0 ? (
                                filteredServers.map((srv, index) => (
                                    <div 
                                        key={index} 
                                        className={`dropdownItem ${server === srv ? 'selected' : ''}`}
                                        onClick={() => handleSelectServer(srv)}
                                    >
                                        {srv}
                                    </div>
                                ))
                            ) : (
                                <div className="dropdownNoResults">
                                    Сервер не найден (можно продолжить ввод)
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Кнопка отправки */}
                <button 
                    type="button" 
                    className="searchSubmitButton" 
                    onClick={handleSubmit}
                >
                    <HiArrowNarrowRight className="searchIcon" style={{ color: '#929292' }} />
                </button>
                
            </div>
            
        </div>
    );
};

export default Search;