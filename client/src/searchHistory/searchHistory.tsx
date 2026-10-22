import { LuHistory, LuRotateCw, LuX } from 'react-icons/lu';
import type { SearchMode } from '../search/searchModes';
import { PlayerAvatar } from '../playerAvatar/playerAvatar';
import './searchHistory.css';

export interface SearchHistoryItem {
  id: string;
  mode: SearchMode;
  query: string;              // что вводили: SteamID, BM ID или ник
  bmId?: string | null;       // для повтора поиска по нику — ищем сразу по BM ID
  serverId?: string | null;   // для повтора Steam-поиска — сервер, который выбирали
  serverName: string | null;
  found: boolean;
  playerName: string | null;  // имя найденного игрока
  avatar: string | null;
  searchedAt: number;         // ms
}

const MODE_LABEL: Record<SearchMode, string> = { bm: 'BM', steam: 'STEAM', nick: 'НИК' };

const timeAgo = (ms: number) => {
  const min = Math.round((Date.now() - ms) / 60_000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.round(h / 24)} д назад`;
};

interface SearchHistoryProps {
  isLoggedIn?: boolean;
  items: SearchHistoryItem[];
  onRepeat: (item: SearchHistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const SearchHistory = ({ isLoggedIn = false, items, onRepeat, onRemove, onClear }: SearchHistoryProps) => (
  <section className="historyWrapper">
    <div className="history">
      <header className="historyHeader">
        <span className="historyTitle">
          <LuHistory /> ИСТОРИЯ ПОИСКА
          <span className="historyCount">{items.length}</span>
        </span>
        <button type="button" className="historyClearBtn" disabled={items.length === 0} onClick={onClear}>
          Очистить
        </button>
      </header>

      {items.length === 0 ? (
        <div className="historyEmpty">
          <p>Здесь появятся игроки, которых вы искали</p>
        </div>
      ) : (
        <ul className="historyList">
          {items.map((item) => (
            <li key={item.id} className={`historyRow ${item.found ? '' : 'notFound'}`}>
              <div className="historyAvatar">
                <PlayerAvatar src={item.avatar} />
              </div>

              <div className="historyMain">
                <span className="historyName">{item.playerName ?? 'Не найден'}</span>
                <span className="historyQuery">
                  <span className={`historyMode mode-${item.mode}`}>{MODE_LABEL[item.mode]}</span>
                  <code>{item.query}</code>
                </span>
              </div>

              <span className="historyServer" title={item.serverName ?? undefined}>
                {item.serverName ?? '—'}
              </span>

              <span className={`historyStatus ${item.found ? 'ok' : 'fail'}`}>
                {item.found ? 'Найден' : 'Не найден'}
              </span>

              <span className="historyTime">{timeAgo(item.searchedAt)}</span>

              <div className="historyActions">
                <button type="button" className="historyIconBtn" title="Искать снова" onClick={() => onRepeat(item)}>
                  <LuRotateCw />
                </button>
                <button type="button" className="historyIconBtn danger" title="Убрать из истории" onClick={() => onRemove(item.id)}>
                  <LuX />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isLoggedIn && (
        <p className="historyHint">
          История хранится только в этом браузере. Войдите через Steam, чтобы она была на всех устройствах.
        </p>
      )}
    </div>
  </section>
);
