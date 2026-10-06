import { useState } from 'react';
import './useProfile.css';
import { FaSteam } from 'react-icons/fa';
import {
  LuUser,
  LuBell,
  LuTarget,
  LuCrown,
  LuLogOut,
  LuCopy,
  LuCheck,
  LuExternalLink,
  LuVolume2,
  LuUsers,
  LuHistory,
  LuSearch,
} from 'react-icons/lu';
import { NOTIF_META } from '../../notifications/notification';
import type { NotifType } from '../../notifications/notification';

type Section = 'profile' | 'friends' | 'history' | 'notifications' | 'tracking' | 'subscription';

// Моковые данные — реальная авторизация через Steam появится на STAGE | 02 (см. роадмап).
const MOCK_USER = {
  personaname: 'rust_hunter_94',
  steamId: '76561198000000000',
  avatarfull: '',
  profileUrl: 'https://steamcommunity.com/profiles/76561198000000000',
  linkedAt: '04.10.2026',
  plan: 'FREE',
};

// Типы событий, для которых реально показываем переключатель (без «update» — это системные новости).
const TOGGLE_TYPES: NotifType[] = ['left', 'switched', 'returned', 'online', 'offline'];

interface PlanColumn {
  id: string;
  name: string;
  priceLabel: string;
}

const PLAN_COLUMNS: PlanColumn[] = [
  { id: 'free', name: 'FREE', priceLabel: '0 ₽' },
  { id: 'starter', name: 'STARTER', priceLabel: '99 ₽/мес' },
  { id: 'pro', name: 'PRO', priceLabel: '249 ₽/мес' },
  { id: 'ultimate', name: 'ULTIMATE', priceLabel: '499 ₽/мес' },
];

type CellState = 'yes' | 'no' | 'soon';

interface FeatureCell {
  state: CellState;
  text?: string;
}

interface FeatureRow {
  id: string;
  label: string;
  cells: Record<string, FeatureCell>;
}

// Прогрессия реальная: лимит карточек → окно трекинга → глубина истории → канал оповещений.
// Звонки и шеринг Rust+ — задел на будущий функционал, помечены «скоро».
const FEATURE_ROWS: FeatureRow[] = [
  {
    id: 'slots',
    label: 'Карточек отслеживания одновременно',
    cells: {
      free: { state: 'yes', text: '2' },
      starter: { state: 'yes', text: '5' },
      pro: { state: 'yes', text: '12' },
      ultimate: { state: 'yes', text: '20+' },
    },
  },
  {
    id: 'window',
    label: 'Окно трекинга',
    cells: {
      free: { state: 'yes', text: '60 мин' },
      starter: { state: 'yes', text: '100 мин' },
      pro: { state: 'yes', text: '3 часа' },
      ultimate: { state: 'yes', text: 'Безлимит' },
    },
  },
  {
    id: 'sound',
    label: 'Звуковые оповещения',
    cells: {
      free: { state: 'no' },
      starter: { state: 'yes' },
      pro: { state: 'yes' },
      ultimate: { state: 'yes' },
    },
  },
  {
    id: 'history',
    label: 'История поиска',
    cells: {
      free: { state: 'yes', text: 'Сессия' },
      starter: { state: 'yes', text: '7 дней' },
      pro: { state: 'yes', text: '30 дней' },
      ultimate: { state: 'yes', text: 'Безлимит' },
    },
  },
  {
    id: 'priority',
    label: 'Приоритетный опрос статусов',
    cells: {
      free: { state: 'no' },
      starter: { state: 'no' },
      pro: { state: 'yes' },
      ultimate: { state: 'yes' },
    },
  },
  {
    id: 'calls',
    label: 'Звонок на телефон при критическом событии',
    cells: {
      free: { state: 'no' },
      starter: { state: 'no' },
      pro: { state: 'soon' },
      ultimate: { state: 'soon' },
    },
  },
  {
    id: 'rustplus',
    label: 'Общий Rust+ на команду (подключил один — видят все)',
    cells: {
      free: { state: 'no' },
      starter: { state: 'no' },
      pro: { state: 'no' },
      ultimate: { state: 'soon' },
    },
  },
  {
    id: 'teamcalls',
    label: 'Звонки-будильники для всей команды',
    cells: {
      free: { state: 'no' },
      starter: { state: 'no' },
      pro: { state: 'no' },
      ultimate: { state: 'soon' },
    },
  },
  {
    id: 'graph',
    label: 'Граф связей и смурф-детект',
    cells: {
      free: { state: 'no' },
      starter: { state: 'no' },
      pro: { state: 'no' },
      ultimate: { state: 'soon' },
    },
  },
];

type FriendStatus = 'ingame' | 'online' | 'offline';

interface Friend {
  id: string;
  name: string;
  status: FriendStatus;
  server?: string;
  lastSeen?: string;
}

const FRIENDS_ACTIVE: Friend[] = [
  { id: '1', name: 'desert_fox', status: 'ingame', server: 'Rustoria x5' },
  { id: '2', name: 'nikita_rust', status: 'ingame', server: 'Facepunch #3' },
  { id: '3', name: 'babywolf', status: 'online' },
];

const FRIENDS_OFFLINE: Friend[] = [
  { id: '4', name: 'sanya_pro', status: 'offline', lastSeen: '2 дня назад' },
  { id: '5', name: 'kreker1337', status: 'offline', lastSeen: '5 ч назад' },
  { id: '6', name: 'oleg_tank', status: 'offline', lastSeen: 'неделю назад' },
];

const FRIEND_STATUS_META: Record<FriendStatus, { label: string; color: string }> = {
  ingame: { label: 'В ИГРЕ', color: '#22c55e' },
  online: { label: 'В СЕТИ', color: '#38bdf8' },
  offline: { label: 'НЕ В СЕТИ', color: '#52525b' },
};

interface HistoryEntry {
  id: string;
  steamId: string;
  name: string;
  server: string;
  when: string;
}

const SEARCH_HISTORY: HistoryEntry[] = [
  { id: 'h1', steamId: '76561198012345678', name: 'desert_fox', server: 'Rustoria x5', when: '12 мин назад' },
  { id: 'h2', steamId: '76561198087654321', name: 'bad_guy_94', server: 'Facepunch #3', when: '3 ч назад' },
  { id: 'h3', steamId: '76561198011112222', name: 'Не привязан', server: 'Rust Royale', when: 'сегодня, 09:14' },
  { id: 'h4', steamId: '76561198033334444', name: 'nikita_rust', server: 'Rustoria x5', when: 'вчера, 21:02' },
  { id: 'h5', steamId: '76561198055556666', name: 'kreker1337', server: 'Facepunch #1', when: '2 дня назад' },
];

export const UserProfile: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [copied, setCopied] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifToggles, setNotifToggles] = useState<Record<NotifType, boolean>>({
    left: true,
    switched: true,
    returned: true,
    online: true,
    offline: false,
    update: true,
  });

  const [trackDuration, setTrackDuration] = useState(100);
  const [maxTracked, setMaxTracked] = useState(5);
  const [autoTrack, setAutoTrack] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState('free');

  const handleCopySteamId = () => {
    navigator.clipboard.writeText(MOCK_USER.steamId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleNotif = (type: NotifType) => {
    setNotifToggles((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const currentPlanName =
    PLAN_COLUMNS.find((col) => col.id === selectedPlan)?.name ?? MOCK_USER.plan;

  const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'ПРОФИЛЬ', icon: <LuUser /> },
    { id: 'friends', label: 'ДРУЗЬЯ', icon: <LuUsers /> },
    { id: 'history', label: 'ИСТОРИЯ ПОИСКА', icon: <LuHistory /> },
    { id: 'notifications', label: 'УВЕДОМЛЕНИЯ', icon: <LuBell /> },
    { id: 'tracking', label: 'ОТСЛЕЖИВАНИЕ', icon: <LuTarget /> },
    { id: 'subscription', label: 'ПОДПИСКА', icon: <LuCrown /> },
  ];

  return (
    <div className="profileView">
      {/* Плашка профиля — во всю ширину, над навигацией и контентом */}
      <div className="profileBanner">
        <div className="identityAvatar">
          {MOCK_USER.avatarfull ? (
            <img src={MOCK_USER.avatarfull} alt={MOCK_USER.personaname} />
          ) : (
            <LuUser className="identityAvatarFallback" />
          )}
          <span className="identitySteamBadge" title="Подключено через Steam">
            <FaSteam />
          </span>
        </div>

        <div className="bannerInfo">
          <p className="identityName">{MOCK_USER.personaname}</p>
          <div className="bannerMetaRow">
            <div className="identitySteamId">
              <code>{MOCK_USER.steamId}</code>
              <button className="copyBtnSmall" onClick={handleCopySteamId} title="Копировать SteamID">
                {copied ? <LuCheck /> : <LuCopy />}
              </button>
            </div>
            <a
              className="identityProfileLink"
              href={MOCK_USER.profileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Профиль Steam <LuExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="bannerActions">
          <span className="bannerPlanChip">{currentPlanName}</span>
          <button className="logoutBtn" type="button">
            <LuLogOut /> Выйти
          </button>
        </div>
      </div>

      <div className="profileLayout">
        {/* Левая колонка: навигация по разделам */}
        <aside className="profileSidebar">
          <nav className="profileNav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`profileNavItem ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
                type="button"
              >
                <span className="profileNavIcon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Правая колонка: контент выбранного раздела */}
        <section className="profileContent">
          {activeSection === 'profile' && (
            <div className="contentPane">
              <h2 className="paneTitle">Профиль Steam</h2>
              <p className="paneHint">
                Данные подключённого Steam-аккаунта. Авторизация пока в разработке — отображены
                демо-значения.
              </p>

              <div className="infoGrid">
                <div className="infoTile">
                  <span className="infoTileLabel">Статус подключения</span>
                  <span className="infoTileValue connectedValue">
                    <span className="statusDotSmall" /> Подключено через Steam
                  </span>
                </div>
                <div className="infoTile">
                  <span className="infoTileLabel">Привязан</span>
                  <span className="infoTileValue">{MOCK_USER.linkedAt}</span>
                </div>
                <div className="infoTile">
                  <span className="infoTileLabel">SteamID64</span>
                  <span className="infoTileValue monoValue">{MOCK_USER.steamId}</span>
                </div>
                <div className="infoTile">
                  <span className="infoTileLabel">Текущий тариф</span>
                  <span className="infoTileValue">{currentPlanName}</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'friends' && (
            <div className="contentPane">
              <h2 className="paneTitle">Друзья</h2>
              <p className="paneHint">Друзья Steam, добавленные в RustScout. Демо-список.</p>

              <div className="friendsColumns">
                <div className="friendsColumn">
                  <p className="settingsGroupLabel">В СЕТИ ({FRIENDS_ACTIVE.length})</p>
                  <div className="friendsList">
                    {FRIENDS_ACTIVE.map((friend) => {
                      const meta = FRIEND_STATUS_META[friend.status];
                      return (
                        <div className="friendCard" key={friend.id}>
                          <div className="friendAvatar">
                            <LuUser />
                          </div>
                          <div className="friendInfo">
                            <p className="friendName">{friend.name}</p>
                            <div className="friendStatusRow">
                              <span
                                className="statusDotSmall"
                                style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
                              />
                              <span className="friendStatusLabel" style={{ color: meta.color }}>
                                {meta.label}
                              </span>
                              {friend.server && <span className="friendServer">· {friend.server}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="friendsColumn">
                  <p className="settingsGroupLabel">НЕ В СЕТИ ({FRIENDS_OFFLINE.length})</p>
                  <div className="friendsList">
                    {FRIENDS_OFFLINE.map((friend) => {
                      const meta = FRIEND_STATUS_META[friend.status];
                      return (
                        <div className="friendCard" key={friend.id}>
                          <div className="friendAvatar">
                            <LuUser />
                          </div>
                          <div className="friendInfo">
                            <p className="friendName">{friend.name}</p>
                            <div className="friendStatusRow">
                              <span
                                className="statusDotSmall"
                                style={{ background: meta.color }}
                              />
                              <span className="friendStatusLabel">{meta.label}</span>
                              {friend.lastSeen && <span className="friendServer">· {friend.lastSeen}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="contentPane">
              <h2 className="paneTitle">История поиска</h2>
              <p className="paneHint">Последние запросы игроков по SteamID. Демо-данные.</p>

              <div className="historyList">
                {SEARCH_HISTORY.map((entry) => (
                  <div className="historyItem" key={entry.id}>
                    <span className="historyIcon">
                      <LuSearch />
                    </span>
                    <div className="historyInfo">
                      <p className="historyName">{entry.name}</p>
                      <p className="historySub">
                        <code>{entry.steamId}</code> · {entry.server}
                      </p>
                    </div>
                    <span className="historyWhen">{entry.when}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="contentPane">
              <h2 className="paneTitle">Уведомления</h2>
              <p className="paneHint">
                Какие события отслеживания показывать в журнале и звуковые оповещения.
              </p>

              <div className="settingsRow">
                <div className="settingsRowLabel">
                  <LuVolume2 />
                  <div>
                    <p className="settingsRowTitle">Звуковые оповещения</p>
                    <p className="settingsRowSub">Звук при смене сервера, уходе или возвращении игрока</p>
                  </div>
                </div>
                <button
                  className={`toggleSwitch ${soundEnabled ? 'on' : ''}`}
                  onClick={() => setSoundEnabled((v) => !v)}
                  type="button"
                  role="switch"
                  aria-checked={soundEnabled}
                >
                  <span className="toggleKnob" />
                </button>
              </div>

              <div className="settingsDivider" />

              <p className="settingsGroupLabel">Типы событий в журнале</p>
              {TOGGLE_TYPES.map((type) => {
                const meta = NOTIF_META[type];
                const enabled = notifToggles[type];
                return (
                  <div className="settingsRow" key={type}>
                    <div className="settingsRowLabel">
                      <span
                        className="notifTypeDot"
                        style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
                      />
                      <div>
                        <p className="settingsRowTitle">{meta.label}</p>
                      </div>
                    </div>
                    <button
                      className={`toggleSwitch ${enabled ? 'on' : ''}`}
                      onClick={() => toggleNotif(type)}
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                    >
                      <span className="toggleKnob" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeSection === 'tracking' && (
            <div className="contentPane">
              <h2 className="paneTitle">Отслеживание</h2>
              <p className="paneHint">Параметры отслеживания игроков по умолчанию.</p>

              <div className="settingsRow">
                <div className="settingsRowLabel">
                  <div>
                    <p className="settingsRowTitle">Длительность отслеживания</p>
                    <p className="settingsRowSub">Окно, на которое включается трекинг игрока</p>
                  </div>
                </div>
                <div className="segmentedControl">
                  {[30, 60, 100].map((min) => (
                    <button
                      key={min}
                      className={`segmentBtn ${trackDuration === min ? 'active' : ''}`}
                      onClick={() => setTrackDuration(min)}
                      type="button"
                    >
                      {min} мин
                    </button>
                  ))}
                </div>
              </div>

              <div className="settingsDivider" />

              <div className="settingsRow">
                <div className="settingsRowLabel">
                  <div>
                    <p className="settingsRowTitle">Лимит одновременных отслеживаний</p>
                    <p className="settingsRowSub">Сколько игроков можно трекать параллельно</p>
                  </div>
                </div>
                <div className="stepperControl">
                  <button
                    className="stepperBtn"
                    onClick={() => setMaxTracked((v) => Math.max(1, v - 1))}
                    type="button"
                  >
                    −
                  </button>
                  <span className="stepperValue">{maxTracked}</span>
                  <button
                    className="stepperBtn"
                    onClick={() => setMaxTracked((v) => Math.min(20, v + 1))}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="settingsDivider" />

              <div className="settingsRow">
                <div className="settingsRowLabel">
                  <div>
                    <p className="settingsRowTitle">Автотрекинг новых карточек</p>
                    <p className="settingsRowSub">Включать отслеживание сразу при добавлении карточки игрока</p>
                  </div>
                </div>
                <button
                  className={`toggleSwitch ${autoTrack ? 'on' : ''}`}
                  onClick={() => setAutoTrack((v) => !v)}
                  type="button"
                  role="switch"
                  aria-checked={autoTrack}
                >
                  <span className="toggleKnob" />
                </button>
              </div>
            </div>
          )}

          {activeSection === 'subscription' && (
            <div className="contentPane">
              <h2 className="paneTitle">Подписка</h2>
              <p className="paneHint">
                Платные тарифы в разработке (STAGE | 03 роадмапа). Функционал слева, тарифы сверху —
                выбрать можно снизу таблицы.
              </p>

              <div className="planTableWrap">
                <table className="planTable">
                  <thead>
                    <tr>
                      <th className="planFeatureHeader">Функционал</th>
                      {PLAN_COLUMNS.map((col) => (
                        <th
                          key={col.id}
                          className={`planColHeader ${selectedPlan === col.id ? 'selectedCol' : ''}`}
                        >
                          <span className="planColName">{col.name}</span>
                          <span className="planColPrice">{col.priceLabel}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_ROWS.map((row) => (
                      <tr key={row.id}>
                        <td className="planFeatureCell">{row.label}</td>
                        {PLAN_COLUMNS.map((col) => {
                          const cell = row.cells[col.id];
                          return (
                            <td
                              key={col.id}
                              className={`planValueCell ${selectedPlan === col.id ? 'selectedCol' : ''}`}
                            >
                              {cell.state === 'no' && <span className="cellNo">—</span>}
                              {cell.state === 'yes' && (
                                <span className="cellYes">
                                  <LuCheck size={13} /> {cell.text}
                                </span>
                              )}
                              {cell.state === 'soon' && <span className="cellSoon">Скоро</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="planFeatureCell" />
                      {PLAN_COLUMNS.map((col) => {
                        const isCurrent = selectedPlan === col.id;
                        return (
                          <td
                            key={col.id}
                            className={`planCtaCell ${isCurrent ? 'selectedCol' : ''}`}
                          >
                            <button
                              className={`planSelectBtn ${isCurrent ? 'isCurrent' : ''}`}
                              type="button"
                              disabled={isCurrent}
                              onClick={() => setSelectedPlan(col.id)}
                            >
                              {isCurrent ? 'Текущий тариф' : 'Перейти'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserProfile;
