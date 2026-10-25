import { useState, useRef, useEffect } from 'react';
import { HiArrowNarrowRight } from 'react-icons/hi';
import { IoChevronDown } from 'react-icons/io5';
import { LuServer } from 'react-icons/lu';
import { SearchModes, type SearchMode } from './searchModes';
import { LiveStats } from './liveStats';
import { useNickSuggest, NICK_MIN_LENGTH, type NickCandidate } from './useNickSuggest';
import { useLang } from '../i18n/LanguageContext';
import './search.css';

// Подсвечиваем в нике ту часть, что совпала с запросом
const highlightMatch = (name: string, query: string) => {
  const pos = name.toLowerCase().indexOf(query.trim().toLowerCase());
  if (pos === -1 || !query.trim()) return name;
  const end = pos + query.trim().length;
  return (
    <>
      {name.slice(0, pos)}
      <mark className="nickMatch">{name.slice(pos, end)}</mark>
      {name.slice(end)}
    </>
  );
};

const parseBmId = (input: string): string | null => {
  const value = input.trim();
  if (/^\d{1,18}$/.test(value)) return value;
  const match = value.match(/battlemetrics\.com\/players\/(\d{1,18})/i);
  return match ? match[1] : null;
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
  onSearch: (steamId: string, serverIdOrName: string, serverName?: string) => void;
  onSearchBm: (bmId: string, nick?: string) => void;
  initialServers?: ServerItem[];
  errorReason?: string | null;
  isSearching?: boolean;
}

const Search = ({ onSearch, onSearchBm, initialServers = [], errorReason = null, isSearching = false}: SearchProps) => {
  const { t, tf } = useLang();
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
  // Подсказка под формой: неверный BM ID, слишком короткий ник и т.п.
  const [modeNotice, setModeNotice] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Подсказки по нику: список кандидатов под основным инпутом
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const queryRowRef = useRef<HTMLDivElement>(null);
  const nick = useNickSuggest(text, mode === 'nick');

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
      if (queryRowRef.current && !queryRowRef.current.contains(event.target as Node)) {
        setSuggestOpen(false);
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
    setSuggestOpen(false);
    setFormRaised(false);
  };

  // Клик по кандидату = точный поиск по его BM ID
  const pickCandidate = (candidate: NickCandidate) => {
    if (isSearching) return;
    setText(candidate.name);
    setSuggestOpen(false);
    onSearchBm(candidate.bmId, candidate.name);
  };

  const handleSubmit = () => {
    if(isSearching) return;
    if (mode === 'bm') {
      const bmId = parseBmId(text);
      if (!bmId) {
        setModeNotice(t('search.noticeBmRequired'));
        return;
      }
      onSearchBm(bmId);
      return;
    }
    if (mode === 'nick') {
      if (text.trim().length < NICK_MIN_LENGTH) {
        setModeNotice(t('search.noticeNickMinLength', { count: NICK_MIN_LENGTH }));
        return;
      }
      const candidate = nick.results[highlight] ?? nick.results[0];
      if (candidate) pickCandidate(candidate);
      else setSuggestOpen(true);
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
    onSearch(cleanSteam, targetServerId || cleanServer, cleanServer);
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
    ? tf(`errors.${errorReason}`, t('errors.generic'))
    : null;

  const hasServerField = mode === 'steam';
  const showSuggest = mode === 'nick' && suggestOpen && nick.status !== 'idle';

  // Пока размытие плавно гаснет, форма должна оставаться поверх него — иначе она
  // на 0.25с окажется под размытием. Поднимаем форму сразу при открытии,
  // а опускаем, только когда закончилась анимация исчезновения (onTransitionEnd).
  const [formRaised, setFormRaised] = useState(false);
  const [prevShowSuggest, setPrevShowSuggest] = useState(showSuggest);
  if (showSuggest !== prevShowSuggest) {
    setPrevShowSuggest(showSuggest);
    if (showSuggest) setFormRaised(true);
  }
  const errorMessage = showError ? t('search.fillFields') : modeNotice ?? serverErrorText;

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

      {/* Фокус-режим: пока открыты подсказки по нику, всё вокруг размыто и затемнено */}
      {mode === 'nick' && (
        <div
          className={`searchFocusOverlay ${showSuggest ? 'isVisible' : ''}`}
          aria-hidden="true"
          onTransitionEnd={(e) => {
            if (e.propertyName === 'opacity' && !showSuggest) setFormRaised(false);
          }}
        />
      )}

      <div className={`searchFormCard ${showSuggest || formRaised ? 'isFocused' : ''}`}>
        {/* Основной инпут: SteamID / BM ID / никнейм — зависит от режима */}
        <div className={`inputRow ${showError && isSteamEmpty ? 'inputError' : ''}`} ref={queryRowRef}>
          <input
            value={text}
            onChange={(e) => {
              // SteamID — только цифры; BM-ссылку и ник не трогаем
              setText(mode === 'steam' ? e.target.value.replace(/\D/g, '') : e.target.value);
              if (showError) setShowError(false);
              if (modeNotice) setModeNotice(null);
              setSuggestOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setSuggestOpen(true)}
            type="text"
            className="searchInput"
            placeholder={t(`search.placeholder.${mode}`)}
            role={mode === 'nick' ? 'combobox' : undefined}
            aria-expanded={mode === 'nick' ? showSuggest : undefined}
            onKeyDown={(e) => {
              if (showSuggest && nick.results.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlight((i) => (i + 1) % nick.results.length);
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlight((i) => (i - 1 + nick.results.length) % nick.results.length);
                  return;
                }
              }
              if (e.key === 'Escape') setSuggestOpen(false);
              if (e.key === 'Enter') handleSubmit();
            }}
          />

          {showSuggest && (
            <div className="dropdownMenu nickSuggest" role="listbox">
              {nick.status === 'error' ? (
                <div className="dropdownNoResults">
                  {tf(`errors.${nick.errorReason ?? ''}`, t('search.nickSearchUnavailable'))}
                </div>
              ) : nick.results.length === 0 ? (
                <div className="dropdownNoResults">
                  {nick.status === 'loading' ? t('search.searching') : t('search.noOnlineWithNick')}
                </div>
              ) : (
                // Две колонки: лучшие совпадения идут сверху вниз по левой, потом по правой.
                // Один игрок — растягиваем на всю ширину, чтобы не висел половинкой
                <div
                  className={`nickGrid ${nick.results.length === 1 ? 'isSingle' : ''}`}
                  style={{ '--nick-rows': Math.ceil(nick.results.length / 2) } as React.CSSProperties}
                >
                {nick.results.map((c, i) => (
                  <div
                    key={c.bmId}
                    role="option"
                    aria-selected={i === highlight}
                    className={`dropdownItem nickItem ${i === highlight ? 'selected' : ''}`}
                    onMouseEnter={() => setHighlight(i)}
                    // mousedown, а не click: иначе инпут теряет фокус раньше клика
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickCandidate(c);
                    }}
                  >
                    <span
                      className={`nickDot ${c.isOnline ? 'isOnline' : ''}`}
                      title={c.isOnline ? t('search.online') : t('search.onlineRecently')}
                    />
                    <span className="nickText">
                      <span className="nickName">{highlightMatch(c.name, text)}</span>
                      <span className="nickServer">
                        <LuServer className="nickServerIcon" aria-hidden="true" />
                        <span className="nickServerName">{c.serverName ?? t('search.unknownServer', { id: c.serverId ?? '?' })}</span>
                      </span>
                    </span>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}
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
              placeholder={isLoadingServers ? t('search.serverPlaceholderLoading') : t('search.serverPlaceholderDefault')}
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
                <div className="dropdownNoResults">{t('search.loadingDbData')}</div>
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
                  {t('search.serverNotFound')}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* В режимах BM и ника вместо сервера — плашка той же высоты, чтобы форма не прыгала */}
        {!hasServerField && (
          <div className="inputRow">
            <div className="searchInput searchInputGhost">
              {mode === 'bm'
                ? t('search.noServerNeededBm')
                : t('search.noServerNeededNick')}
            </div>
            {errorBlock}
          </div>
        )}

        {/* Кнопка отправки */}
        <button
          type="button"
          className="searchSubmitButton"
          onClick={handleSubmit}
          disabled={isSearching}
        >
          <HiArrowNarrowRight className="searchIcon" style={{ color: '#929292' }} />
        </button>
      </div>

      <LiveStats hidden={!!errorMessage} />
    </div>
  );
};

export default Search;