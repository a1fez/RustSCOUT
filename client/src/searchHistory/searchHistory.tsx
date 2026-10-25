import { LuHistory, LuRotateCw, LuX } from 'react-icons/lu';
import type { SearchMode } from '../search/searchModes';
import { PlayerAvatar } from '../playerAvatar/playerAvatar';
import { useLang } from '../i18n/LanguageContext';
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

interface SearchHistoryProps {
  isLoggedIn?: boolean;
  items: SearchHistoryItem[];
  onRepeat: (item: SearchHistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const SearchHistory = ({ isLoggedIn = false, items, onRepeat, onRemove, onClear }: SearchHistoryProps) => {
  const { t } = useLang();

  // bm/steam уже на английском, не завязаны на язык — только 'ник' переводится.
  const modeLabel: Record<SearchMode, string> = { bm: 'BM', steam: 'STEAM', nick: t('searchHistory.modeNick') };

  const timeAgo = (ms: number) => {
    const min = Math.round((Date.now() - ms) / 60_000);
    if (min < 1) return t('time.justNow');
    if (min < 60) return t('time.minAgo', { n: min });
    const h = Math.round(min / 60);
    if (h < 24) return t('time.hourAgo', { n: h });
    return t('time.dayAgo', { n: Math.round(h / 24) });
  };

  return (
    <section className="historyWrapper">
      <div className="history">
        <header className="historyHeader">
          <span className="historyTitle">
            <LuHistory /> {t('searchHistory.title')}
            <span className="historyCount">{items.length}</span>
          </span>
          <button type="button" className="historyClearBtn" disabled={items.length === 0} onClick={onClear}>
            {t('searchHistory.clear')}
          </button>
        </header>

        {items.length === 0 ? (
          <div className="historyEmpty">
            <p>{t('searchHistory.emptyHint')}</p>
          </div>
        ) : (
          <ul className="historyList">
            {items.map((item) => (
              <li key={item.id} className={`historyRow ${item.found ? '' : 'notFound'}`}>
                <div className="historyAvatar">
                  <PlayerAvatar src={item.avatar} />
                </div>

                <div className="historyMain">
                  <span className="historyName">{item.playerName ?? t('searchHistory.notFoundName')}</span>
                  <span className="historyQuery">
                    <span className={`historyMode mode-${item.mode}`}>{modeLabel[item.mode]}</span>
                    <code>{item.query}</code>
                  </span>
                </div>

                <span className="historyServer" title={item.serverName ?? undefined}>
                  {item.serverName ?? '—'}
                </span>

                <span className={`historyStatus ${item.found ? 'ok' : 'fail'}`}>
                  {item.found ? t('searchHistory.statusFound') : t('searchHistory.statusNotFound')}
                </span>

                <span className="historyTime">{timeAgo(item.searchedAt)}</span>

                <div className="historyActions">
                  <button type="button" className="historyIconBtn" title={t('searchHistory.repeatSearchTitle')} onClick={() => onRepeat(item)}>
                    <LuRotateCw />
                  </button>
                  <button type="button" className="historyIconBtn danger" title={t('searchHistory.removeTitle')} onClick={() => onRemove(item.id)}>
                    <LuX />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isLoggedIn && (
          <p className="historyHint">
            {t('searchHistory.guestHint')}
          </p>
        )}
      </div>
    </section>
  );
};
