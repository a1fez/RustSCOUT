import React, { useState } from 'react';
import './useProfile.css';
import { FaSteam } from 'react-icons/fa';
import {
  LuUser,
  LuBell,
  LuCrown,
  LuLogOut,
  LuCopy,
  LuCheck,
  LuExternalLink,
  LuVolume2,
  LuUsers,
  LuHistory,
  LuSatelliteDish,
} from 'react-icons/lu';
import { NOTIF_META } from '../../notifications/notification';
import type { NotifType } from '../../notifications/notification';

type Section = 'profile' | 'friends' | 'history' | 'notifications' | 'rustplus' | 'subscription';



// Моковые данные — реальная авторизация через Steam появится на STAGE | 02 (см. роадмап).
const MOCK_USER = {
  name: 'xxx',
  steamId: '76561198000000000',
  avatarfull: '',
  profileUrl: 'https://steamcommunity.com/profiles/76561198000000000',
  linkedAt: '04.10.2026',
  plan: 'FREE',
};

export type SteamUser = typeof MOCK_USER;

// Типы событий, для которых реально показываем переключатель (без «update» — это системные новости).
const TOGGLE_TYPES: NotifType[] = ['left', 'switched', 'returned', 'online', 'offline'];

interface PlanColumn {
  id: string;
  name: string;
  priceLabel: string;
}

// Пока только 2 тарифа: FREE доступен сейчас, SUPPORT — витрина будущего функционала,
// сам тариф пока нельзя оформить.
const PLAN_COLUMNS: PlanColumn[] = [
  { id: 'free', name: 'FREE', priceLabel: '0 ₽' },
  { id: 'support', name: 'SUPPORT', priceLabel: 'Скоро' },
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

// Звонки при рейде, графики активности, граф связей и интеграция с Rust+ — фичи SUPPORT,
// но сам тариф ещё не запущен, поэтому везде «скоро».
const FEATURE_ROWS: FeatureRow[] = [
  {
    id: 'slots',
    label: 'Карточек отслеживания одновременно',
    cells: {
      free: { state: 'yes', text: '2' },
      support: { state: 'yes', text: '10+' },
    },
  },
  {
    id: 'window',
    label: 'Окно трекинга',
    cells: {
      free: { state: 'yes', text: '60 мин' },
      support: { state: 'yes', text: 'Безлимит' },
    },
  },
  {
    id: 'sound',
    label: 'Звуковые оповещения',
    cells: {
      free: { state: 'no' },
      support: { state: 'yes' },
    },
  },
  {
    id: 'history',
    label: 'Глубина истории поиска',
    cells: {
      free: { state: 'yes', text: 'Сессия' },
      support: { state: 'yes', text: 'Безлимит' },
    },
  },
  {
    id: 'priority',
    label: 'Приоритетный опрос статусов',
    cells: {
      free: { state: 'no' },
      support: { state: 'yes' },
    },
  },
  {
    id: 'calls',
    label: 'Звонок при рейде / критическом событии',
    cells: {
      free: { state: 'no' },
      support: { state: 'soon' },
    },
  },
  {
    id: 'activity',
    label: 'Графики активности',
    cells: {
      free: { state: 'no' },
      support: { state: 'soon' },
    },
  },
  {
    id: 'graph',
    label: 'Граф связей и смурф-детект',
    cells: {
      free: { state: 'no' },
      support: { state: 'soon' },
    },
  },
  {
    id: 'rustplus',
    label: 'Интеграция с Rust+',
    cells: {
      free: { state: 'no' },
      support: { state: 'soon' },
    },
  },
];

interface UserProfileProps {
  user: SteamUser | null;
  loading: boolean;
  onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, loading, onLogout }) => {
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

  if (loading) return <div>Загрузка...</div>;
  if (!user) return <a href="/api/auth/steam">Войти через Steam</a>;
  const handleCopySteamId = () => {
    navigator.clipboard.writeText(user.steamId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleNotif = (type: NotifType) => {
    setNotifToggles((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const currentPlanName = user.plan;

  const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'ПРОФИЛЬ', icon: <LuUser /> },
    { id: 'friends', label: 'ДРУЗЬЯ', icon: <LuUsers /> },
    { id: 'history', label: 'ИСТОРИЯ ПОИСКА', icon: <LuHistory /> },
    { id: 'notifications', label: 'УВЕДОМЛЕНИЯ', icon: <LuBell /> },
    { id: 'rustplus', label: 'RUST+', icon: <LuSatelliteDish /> },
    { id: 'subscription', label: 'ПОДПИСКА', icon: <LuCrown /> },
  ];

  return (
    <div className="profileView">
      {/* Плашка профиля — во всю ширину, над навигацией и контентом */}
      <div className="profileBanner reveal" style={{ '--reveal-order': 0 } as React.CSSProperties}>
        <div className="identityAvatar">
          {user.avatarfull ? (
            <img src={user.avatarfull} alt={user.name} />
          ) : (
            <LuUser className="identityAvatarFallback" />
          )}
          <span className="identitySteamBadge" title="Подключено через Steam">
            <FaSteam />
          </span>
        </div>

        <div className="bannerInfo">
          <p className="identityName">{user.name}</p>
          <div className="bannerMetaRow">
            <div className="identitySteamId">
              <code>{user.steamId}</code>
              <button className="copyBtnSmall" onClick={handleCopySteamId} title="Копировать SteamID">
                {copied ? <LuCheck /> : <LuCopy />}
              </button>
            </div>
            <a
              className="identityProfileLink"
              href={user.profileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Профиль Steam <LuExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="bannerActions">
          <span className="bannerPlanChip">{currentPlanName}</span>
          <button className="logoutBtn" type="button"  onClick={onLogout}>
            <LuLogOut /> Выйти
          </button>
        </div>
      </div>

      <div className="profileLayout">
        {/* Левая колонка: навигация по разделам */}
        <aside className="profileSidebar reveal" style={{ '--reveal-order': 1 } as React.CSSProperties}>
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
        <section className="profileContent reveal" style={{ '--reveal-order': 2 } as React.CSSProperties}>
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
                  <span className="infoTileValue">{user.linkedAt}</span>
                </div>
                <div className="infoTile">
                  <span className="infoTileLabel">SteamID64</span>
                  <span className="infoTileValue monoValue">{user.steamId}</span>
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
              <div className="paneSoon">
                <span className="paneSoonText">В разработке</span>
                <span className="paneSoonHint">Скоро появится ;)</span>
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="contentPane">
              <h2 className="paneTitle">История поиска</h2>
              <div className="paneSoon">
                <span className="paneSoonText">В разработке</span>
                <span className="paneSoonHint">Скоро появится ;)</span>
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

          {activeSection === 'rustplus' && (
            <div className="contentPane">
              <h2 className="paneTitle">Rust+</h2>
              <div className="paneSoon">
                <span className="paneSoonText">В разработке</span>
                <span className="paneSoonHint">Скоро появится ;)</span>
              </div>
            </div>
          )}

          {activeSection === 'subscription' && (
            <div className="contentPane">
              <h2 className="paneTitle">Подписка</h2>
              <p className="paneHint">
                Базовый функционал бесплатен и останется таким. SUPPORT добавит звонки при
                рейде, графики активности и граф связей — но сам тариф пока недоступен для
                оформления.
              </p>

              <div className="planTableWrap">
                <table className="planTable">
                  <thead>
                    <tr>
                      <th className="planFeatureHeader">Функционал</th>
                      {PLAN_COLUMNS.map((col) => (
                        <th
                          key={col.id}
                          className={`planColHeader ${col.id === 'free' ? 'selectedCol' : ''}`}
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
                              className={`planValueCell ${col.id === 'free' ? 'selectedCol' : ''}`}
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
                        const isFree = col.id === 'free';
                        return (
                          <td
                            key={col.id}
                            className={`planCtaCell ${isFree ? 'selectedCol' : ''}`}
                          >
                            <button
                              className={`planSelectBtn ${isFree ? 'isCurrent' : ''}`}
                              type="button"
                              disabled
                            >
                              {isFree ? 'Текущий тариф' : 'Скоро'}
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
