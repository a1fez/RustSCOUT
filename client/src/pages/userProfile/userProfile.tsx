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
import { PlayerAvatar } from '../../playerAvatar/playerAvatar';
import { useLang } from '../../i18n/LanguageContext';

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
  // 'support' показывает t('profile.soon') вместо фиксированной цены — считается при рендере.
  priceLabel?: string;
}

// Пока только 2 тарифа: FREE доступен сейчас, SUPPORT — витрина будущего функционала,
// сам тариф пока нельзя оформить.
const PLAN_COLUMNS: PlanColumn[] = [
  { id: 'free', name: 'FREE', priceLabel: '0 ₽' },
  { id: 'support', name: 'SUPPORT' },
];

type CellState = 'yes' | 'no' | 'soon';

interface FeatureCell {
  state: CellState;
  // text — значение, не зависящее от языка (просто число: '2', '10+').
  text?: string;
  // textKey — путь в словаре для значений-слов ('60 мин' / 'Безлимит' и т.п.).
  textKey?: string;
}

interface FeatureRow {
  id: string;
  cells: Record<string, FeatureCell>;
}

// label теперь переводится через t(`profile.features.${id}`) при рендере.
// Звонки при рейде, графики активности, граф связей и интеграция с Rust+ — фичи SUPPORT,
// но сам тариф ещё не запущен, поэтому везде «скоро».
const FEATURE_ROWS: FeatureRow[] = [
  {
    id: 'slots',
    cells: {
      free: { state: 'yes', text: '2' },
      support: { state: 'yes', text: '10+' },
    },
  },
  {
    id: 'window',
    cells: {
      free: { state: 'yes', textKey: 'profile.sixtyMin' },
      support: { state: 'yes', textKey: 'profile.unlimited' },
    },
  },
  {
    id: 'sound',
    cells: {
      free: { state: 'yes' },
      support: { state: 'yes' },
    },
  },
  {
    id: 'history',
    cells: {
      free: { state: 'yes', textKey: 'profile.sessionOnly' },
      support: { state: 'yes', textKey: 'profile.unlimited' },
    },
  },
  {
    id: 'priority',
    cells: {
      free: { state: 'yes' },
      support: { state: 'yes' },
    },
  },
  {
    id: 'calls',
    cells: {
      free: { state: 'no' },
      support: { state: 'soon' },
    },
  },
  {
    id: 'activity',
    cells: {
      free: { state: 'no' },
      support: { state: 'soon' },
    },
  },
  {
    id: 'graph',
    cells: {
      free: { state: 'no' },
      support: { state: 'soon' },
    },
  },
  {
    id: 'rustplus',
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
  const { t } = useLang();

  if (loading) return <div>{t('profile.loading')}</div>;
  if (!user) return <a href="/api/auth/steam">{t('profile.loginCta')}</a>;
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
    { id: 'profile', label: t('profile.nav.profile'), icon: <LuUser /> },
    { id: 'friends', label: t('profile.nav.friends'), icon: <LuUsers /> },
    { id: 'history', label: t('profile.nav.history'), icon: <LuHistory /> },
    { id: 'notifications', label: t('profile.nav.notifications'), icon: <LuBell /> },
    { id: 'rustplus', label: 'RUST+', icon: <LuSatelliteDish /> },
    { id: 'subscription', label: t('profile.nav.subscription'), icon: <LuCrown /> },
  ];

  return (
    <div className="profileView">
      {/* Плашка профиля — во всю ширину, над навигацией и контентом */}
      <div className="profileBanner reveal" style={{ '--reveal-order': 0 } as React.CSSProperties}>
        <div className="identityAvatar">
          <PlayerAvatar src={user.avatarfull} alt={user.name} />
          <span className="identitySteamBadge" title={t('profile.steamBadgeTitle')}>
            <FaSteam />
          </span>
        </div>

        <div className="bannerInfo">
          <p className="identityName">{user.name}</p>
          <div className="bannerMetaRow">
            <div className="identitySteamId">
              <code>{user.steamId}</code>
              <button className="copyBtnSmall" onClick={handleCopySteamId} title={t('profile.copySteamIdTitle')}>
                {copied ? <LuCheck /> : <LuCopy />}
              </button>
            </div>
            <a
              className="identityProfileLink"
              href={user.profileUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('profile.steamProfileLink')} <LuExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="bannerActions">
          <span className="bannerPlanChip">{currentPlanName}</span>
          <button className="logoutBtn" type="button"  onClick={onLogout}>
            <LuLogOut /> {t('profile.logout')}
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
              <h2 className="paneTitle">{t('profile.paneTitleProfile')}</h2>

              <div className="infoGrid">
                <div className="infoTile">
                  <span className="infoTileLabel">{t('profile.statusLabel')}</span>
                  <span className="infoTileValue connectedValue">
                    <span className="statusDotSmall" /> {t('profile.statusValue')}
                  </span>
                </div>
                <div className="infoTile">
                  <span className="infoTileLabel">{t('profile.linkedLabel')}</span>
                  <span className="infoTileValue">{user.linkedAt}</span>
                </div>
                <div className="infoTile">
                  <span className="infoTileLabel">{t('profile.steamIdLabel')}</span>
                  <span className="infoTileValue monoValue">{user.steamId}</span>
                </div>
                <div className="infoTile">
                  <span className="infoTileLabel">{t('profile.planLabel')}</span>
                  <span className="infoTileValue">{currentPlanName}</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'friends' && (
            <div className="contentPane">
              <h2 className="paneTitle">{t('profile.friendsTitle')}</h2>
              <div className="paneSoon">
                <span className="paneSoonText">{t('profile.inDevelopment')}</span>
                <span className="paneSoonHint">{t('profile.comingSoon')}</span>
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="contentPane">
              <h2 className="paneTitle">{t('profile.historyTitle')}</h2>
              <div className="paneSoon">
                <span className="paneSoonText">{t('profile.inDevelopment')}</span>
                <span className="paneSoonHint">{t('profile.comingSoon')}</span>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="contentPane">
              <h2 className="paneTitle">{t('profile.notificationsTitle')}</h2>
              <p className="paneHint">
                {t('profile.notificationsHint')}
              </p>

              <div className="settingsRow">
                <div className="settingsRowLabel">
                  <LuVolume2 />
                  <div>
                    <p className="settingsRowTitle">{t('profile.soundAlertsTitle')}</p>
                    <p className="settingsRowSub">{t('profile.soundAlertsSub')}</p>
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

              <p className="settingsGroupLabel">{t('profile.eventTypesLabel')}</p>
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
                        <p className="settingsRowTitle">{t(`notifTypes.${type}`)}</p>
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
                <span className="paneSoonText">{t('profile.inDevelopment')}</span>
                <span className="paneSoonHint">{t('profile.comingSoon')}</span>
              </div>
            </div>
          )}

          {activeSection === 'subscription' && (
            <div className="contentPane">
              <h2 className="paneTitle">{t('profile.subscriptionTitle')}</h2>
              <p className="paneHint">
                {t('profile.subscriptionHint')}
              </p>

              <div className="planTableWrap">
                <table className="planTable">
                  <thead>
                    <tr>
                      <th className="planFeatureHeader">{t('profile.functionalityHeader')}</th>
                      {PLAN_COLUMNS.map((col) => (
                        <th
                          key={col.id}
                          className={`planColHeader ${col.id === 'free' ? 'selectedCol' : ''}`}
                        >
                          <span className="planColName">{col.name}</span>
                          <span className="planColPrice">{col.priceLabel ?? t('profile.soon')}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_ROWS.map((row) => (
                      <tr key={row.id}>
                        <td className="planFeatureCell">{t(`profile.features.${row.id}`)}</td>
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
                                  <LuCheck size={13} /> {cell.text ?? (cell.textKey ? t(cell.textKey) : '')}
                                </span>
                              )}
                              {cell.state === 'soon' && <span className="cellSoon">{t('profile.soon')}</span>}
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
                              {isFree ? t('profile.currentPlanBtn') : t('profile.soon')}
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
