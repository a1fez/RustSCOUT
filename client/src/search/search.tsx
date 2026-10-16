import { useState, useRef, useEffect } from 'react';
import { HiArrowNarrowRight } from 'react-icons/hi';
import { IoChevronDown } from 'react-icons/io5';
import { ERROR_MESSAGE } from '../../error';
import { SearchModes, type SearchMode } from './searchModes';
import { LiveStats } from './liveStats';
import './search.css';

// Подсказки в полях для каждого режима поиска
const QUERY_PLACEHOLDER: Record<SearchMode, string> = {
  bm: 'BattleMetrics ID или ссылка на игрока...',
  steam: 'Введите SteamID...',
  nick: 'Никнейм игрока...',
};



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
  errorReason?: string | null;
}

const Search = ({ onSearch, initialServers = [], errorReason = null }: SearchProps) => {
  const [text, setText] = useState('');
  const [server, setServer] = useState('');
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  const [serverList, setServerList] = useState<ServerItem[]>(initialServers);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showError, setShowError] = useState(false);

  // Режим поиска и раскрытие блоков с описанием режимов
  const [mode, setMode] = useState<SearchMode>('steam');
  const [modesInfoOpen, setModesInfoOpen] = useState(false);
  // ВРЕМЕННО: пока бэкенд умеет только Steam + сервер — для других режимов показываем заглушку
  const [modeNotice, setModeNotice] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Загрузка серверов из базы данных
  useEffect(() => {
    async function fetchServers() {
      setIsLoadingServers(true);
      try {
        const response = await fetch('/api/servers');
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

  const handleModeChange = (next: SearchMode) => {
    setMode(next);
    setText('');
    setShowError(false);
    setModeNotice(null);
  };

  const handleSubmit = () => {
    if (mode !== 'steam') {
      setModeNotice(mode === 'bm' ? 'Поиск по BattleMetrics скоро появится' : 'Поиск по никнейму скоро появится');
      return;
    }

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

  // Текст ошибки с бэкенда (matched:false) — приоритетнее локальной валидации полей
  const serverErrorText = errorReason
    ? ERROR_MESSAGE[errorReason] || 'Не удалось найти игрока. Попробуйте ещё раз.'
    : null;

  const hasServerField = mode !== 'bm';
  const errorMessage = showError ? 'Заполните SteamID и сервер' : modeNotice ?? serverErrorText;

  const errorBlock = errorMessage && (
    <div className="errorText" style={{ color: 'red', marginTop: '10px' }}>
      <p>{errorMessage}</p>
    </div>
  );

  return (
    <div className="search">
      <div className="searchBackground" />

      <SearchModes
        mode={mode}
        onChange={handleModeChange}
        infoOpen={modesInfoOpen}
        onToggleInfo={() => setModesInfoOpen((open) => !open)}
      />

      <div className="searchFormCard">
        {/* Основной инпут: SteamID / BM ID / никнейм — зависит от режима */}
        <div className={`inputRow ${showError && isSteamEmpty ? 'inputError' : ''}`}>
          <input
            value={text}
            onChange={(e) => {
              // SteamID — только цифры; BM-ссылку и ник не трогаем
              setText(mode === 'steam' ? e.target.value.replace(/\D/g, '') : e.target.value);
              if (showError) setShowError(false);
              if (modeNotice) setModeNotice(null);
            }}
            type="text"
            className="searchInput"
            placeholder={QUERY_PLACEHOLDER[mode]}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
        </div>

        {/* Инпут Сервера (в режиме BM не нужен) */}
        {hasServerField && (
        <div
          className={`inputRow ${showError && isServerEmpty ? 'inputError' : ''}`}
          ref={dropdownRef}
        >
          <div className="selectInputWrapper">
            <input
              type="text"
              className="searchInput"
              placeholder={
                isLoadingServers
                  ? 'Загрузка серверов...'
                  : mode === 'nick'
                  ? 'Сервер (необязательно)...'
                  : 'Выберите или введите сервер...'
              }
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

          {errorBlock}

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
        )}

        {/* В режиме BM вместо сервера — плашка той же высоты, чтобы форма не прыгала */}
        {!hasServerField && (
          <div className="inputRow">
            <div className="searchInput searchInputGhost">Сервер не нужен — ищем напрямую по BattleMetrics</div>
            {errorBlock}
          </div>
        )}

        {/* Кнопка отправки */}
        <button
          type="button"
          className="searchSubmitButton"
          onClick={handleSubmit}
        >
          <HiArrowNarrowRight className="searchIcon" style={{ color: '#929292' }} />
        </button>
      </div>

      <LiveStats hidden={!!errorMessage} />
    </div>
  );
};

export default Search;