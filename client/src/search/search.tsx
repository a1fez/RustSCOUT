import { useState, useRef, useEffect } from 'react';
import { HiArrowNarrowRight } from 'react-icons/hi';
import { IoChevronDown } from 'react-icons/io5';
import './search.css';

interface ServerItem {
  id: string;
  name: string;
  players?: number;
  maxPlayers?: number;
  ip?: string;
  port?: number;
}

interface SearchProps {
  onSearch: (steamId: string, serverIdOrName: string) => void;
  initialServers?: ServerItem[];
}

const Search = ({ onSearch, initialServers = [] }: SearchProps) => {
  const [text, setText] = useState('');
  const [server, setServer] = useState('');
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  const [serverList, setServerList] = useState<ServerItem[]>(initialServers);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showError, setShowError] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Загрузка серверов из базы данных
  useEffect(() => {
    async function fetchServers() {
      setIsLoadingServers(true);
      try {
        const response = await fetch('http://localhost:5001/api/servers');
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setServerList(result.data);
        }
      } catch (error) {
        console.error('Ошибка загрузки серверов из БД:', error);
      } finally {
        setIsLoadingServers(false);
      }
    }

    fetchServers();
  }, []);

  // Фильтрация серверов по поисковому запросу
  const filteredServers = serverList.filter((srv) =>
    srv.name.toLowerCase().includes(server.toLowerCase())
  );

  // Закрытие выпадающего списка при клике вне компонента
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
    const cleanSteam = text.trim();
    const cleanServer = server.trim();

    if (!cleanSteam || !cleanServer) {
      setShowError(true);
      return;
    }
    setShowError(false);

    // Если ID не сохранен напрямую, ищем сервер в списке по полному совпадению названия
    let targetServerId = selectedServerId;
    if (!targetServerId) {
      const foundMatch = serverList.find(
        (s) => s.name.toLowerCase() === cleanServer.toLowerCase()
      );
      if (foundMatch) {
        targetServerId = String(foundMatch.id);
      }
    }

    // Передаем точный числовой ID (или в крайнем случае имя)
    onSearch(cleanSteam, targetServerId || cleanServer);
  };

  const handleSelectServer = (srv: ServerItem) => {
    setServer(srv.name);
    setSelectedServerId(String(srv.id));
    setIsOpen(false);
    if (showError) setShowError(false);
  };

  const isSteamEmpty = !text.trim();
  const isServerEmpty = !server.trim();

  return (
    <div className="search">
      <div className="searchBackground" />
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
            placeholder="Введите SteamID..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
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
              placeholder={isLoadingServers ? 'Загрузка серверов...' : 'Выберите или введите сервер...'}
              value={server}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setServer(e.target.value);
                setSelectedServerId(null);
                setIsOpen(true);
                if (showError) setShowError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
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
              {isLoadingServers ? (
                <div className="dropdownNoResults">Загрузка данных из БД...</div>
              ) : filteredServers.length > 0 ? (
                filteredServers.map((srv) => (
                  <div
                    key={srv.id}
                    className={`dropdownItem ${server === srv.name ? 'selected' : ''}`}
                    onClick={() => handleSelectServer(srv)}
                  >
                    <span>{srv.name}</span>
                    {typeof srv.players === 'number' && (
                      <span style={{ opacity: 0.6, fontSize: '0.85em', marginLeft: '8px' }}>
                        ({srv.players}/{srv.maxPlayers ?? '?'})
                      </span>
                    )}
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