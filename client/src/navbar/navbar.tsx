import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import logo from '../resource/rustScoutLogo.png';
import './navbar.css';
import { BiArchive } from 'react-icons/bi';
import { GoGear } from 'react-icons/go';
import { SiSteam } from 'react-icons/si';
import { IoLanguage } from "react-icons/io5";
import { LuHouse, LuSearch, LuBookOpen, LuRadio, LuSignpost } from 'react-icons/lu';
import type { NotifEvent } from '../notifications/notification';
import { NOTIF_META, formatRelativeTime } from '../notifications/notification';
import type { SteamUser } from "../pages/userProfile/userProfile";
import { PlayerAvatar } from '../playerAvatar/playerAvatar';
import { useLang } from '../i18n/LanguageContext';

const MENU_ITEMS = ['main', 'search', 'documentation', 'session', 'roadmap'];

// Иконки для нижней мобильной навигации — те же пункты меню, что и в desktop-шапке,
// просто на телефоне показываем кружок с иконкой вместо текста.
const MENU_ICONS: Record<string, React.ReactNode> = {
  main: <LuHouse />,
  search: <LuSearch />,
  documentation: <LuBookOpen />,
  session: <LuRadio />,
  roadmap: <LuSignpost />,
};

interface NavbarProps {
  user?: SteamUser | null;
  onOpenProfile?: () => void;
  onSelectTab?: (tab: string) => void;
  notifications?: NotifEvent[];
  onClearNotifications?: () => void;
  onMarkAllRead?: () => void;
  authLoading?: boolean;
}

const Navbar = ({
  user,
  onOpenProfile,
  onSelectTab,
  notifications = [],
  onClearNotifications,
  onMarkAllRead,
  authLoading,
}: NavbarProps) => {
  const { t, lang, setLang } = useLang();
  const [activeTab, setActiveTab] = useState('search');
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [, forceTick] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [dotLeft, setDotLeft] = useState<number | null>(null);
  const [trackBounds, setTrackBounds] = useState<{ left: number; width: number } | null>(null);

  const unreadCount = notifications.reduce((acc, n) => (n.read ? acc : acc + 1), 0);

  // Закрытие меню по клику вне него
  useEffect(() => {
    if (!isNotifOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  // Пока меню открыто — обновляем относительное время
  useEffect(() => {
    if (!isNotifOpen) return;
    const id = window.setInterval(() => forceTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, [isNotifOpen]);

  // Пересчёт позиции "маршрутной" точки и дорожки под пунктами меню
  useLayoutEffect(() => {
    const recalc = () => {
      const menuEl = menuRef.current;
      if (!menuEl) return;
      const menuRect = menuEl.getBoundingClientRect();

      const centers = MENU_ITEMS.map((item) => {
        const el = itemRefs.current[item];
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return rect.left + rect.width / 2 - menuRect.left;
      });

      const activeIndex = MENU_ITEMS.indexOf(activeTab);
      const activeCenter = centers[activeIndex];
      if (activeCenter != null) setDotLeft(activeCenter);

      const validCenters = centers.filter((c): c is number => c != null);
      if (validCenters.length > 1) {
        const left = validCenters[0];
        const right = validCenters[validCenters.length - 1];
        setTrackBounds({ left, width: right - left });
      }
    };

    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [activeTab]);

  const toggleNotif = () => {
    setNotifOpen((open) => {
      const next = !open;
      if (next && unreadCount > 0) onMarkAllRead?.();
      return next;
    });
  };

  return (
    <>
    <div className="navbar">
      {/* Логотип */}
      <div className="logo">
        <img src={logo} alt="RustScout" />
      </div>

      <ul className="menu" ref={menuRef}>
        {MENU_ITEMS.map((item) => {
          const isSelected = activeTab === item;
          return (
            <li
              key={item}
              ref={(el) => { itemRefs.current[item] = el; }}
              className={`menuItem ${isSelected ? 'selected' : ''}`}
              onClick={() => { setActiveTab(item); onSelectTab?.(item); }}
            >
              <span className="menuSocket" />
              <span className="menuText">{item}</span>
            </li>
          );
        })}

        {trackBounds && (
          <span
            className="menuTrack"
            style={{ left: trackBounds.left, width: trackBounds.width }}
          />
        )}
        {dotLeft !== null && (
          <span className="menuDot" style={{ left: dotLeft }} />
        )}
      </ul>

      {/* Правая часть: иконки (кнопка «План разработки» переехала на главную и в профиль) */}
      <div className="rightSection">
        <div className="settings">
          <button
            type="button"
            className="langSwitch"
            onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            aria-label="Switch language"
            title={lang === 'en' ? 'Switch to English' : 'Переключить на русский'}
          >
            {lang === 'ru' ? 'RU' : 'EN'}
            <IoLanguage/>
          </button>
          <div className="notification" ref={notifRef}>
            <button
              type="button"
              className={`notifTrigger ${isNotifOpen ? 'active' : ''}`}
              onClick={toggleNotif}
              aria-label={t('navbar.notifAriaLabel')}
            >
              <BiArchive className="iconBi"/>
              {unreadCount > 0 && (
                <span className="notificationBadge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {isNotifOpen && (
              <div className="notificationDropdown">
                <header className="notifHeader">
                  <span className="notifTitle">{t('navbar.notifTitle')}</span>
                  <button
                    className="notifClearBtn"
                    onClick={onClearNotifications}
                    disabled={notifications.length === 0}
                  >
                    {t('navbar.clear')}
                  </button>
                </header>

                <div className="notifList">
                  {notifications.length === 0 ? (
                    <div className="notifEmpty">
                      <span className="notifEmptyGlyph">◎</span>
                      <p>{t('navbar.notifEmptyTitle')}</p>
                      <span className="notifEmptyHint">
                        {t('navbar.notifEmptyHint')}
                      </span>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const meta = NOTIF_META[n.type];
                      return (
                        <div
                          key={n.id}
                          className={`notifItem ${n.read ? '' : 'unread'}`}
                        >
                          <span
                            className="notifIndicator"
                            style={{
                              background: meta.color,
                              boxShadow: `0 0 6px ${meta.color}`,
                            }}
                          />
                          <div className="notifContent">
                            <div className="notifMeta">
                              <span className="notifPlayer">{n.player}</span>
                              <span className="notifTime">
                                {formatRelativeTime(n.timestamp, t)}
                              </span>
                            </div>
                            <p className="notifMsg">
                              <span
                                className="notifTag"
                                style={{ color: meta.color }}
                              >
                                {meta.glyph} {t(`notifTypes.${n.type}`)}
                              </span>{' '}
                              {n.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          
          <GoGear className="icon" />
          {authLoading ? (
            <span className="navAvatarSkeleton"/>
          ) : user ? (
            <button className="navAvatarButton" onClick={onOpenProfile} title={user.name} type="button">
                <PlayerAvatar src={user.avatarfull} alt={user.name}/>
            </button>
          ) : (
            <button className="signUpButton" onClick={() => window.location.href = '/api/auth/steam'} type="button">
               Login
              <SiSteam className="iconSi" />
            </button>
          )} 
        
          
        </div>
      </div>
    </div>

    {/* Нижняя навигация — видна только на мобильных (см. navbar.css),
        те же пункты и тот же activeTab/onSelectTab, что у меню наверху. */}
    <nav className="mobileBottomNav">
      {MENU_ITEMS.map((item) => {
        const isSelected = activeTab === item;
        return (
          <button
            key={item}
            type="button"
            className={`mobileNavBtn ${isSelected ? 'active' : ''}`}
            onClick={() => { setActiveTab(item); onSelectTab?.(item); }}
            aria-label={item}
          >
            {MENU_ICONS[item]}
          </button>
        );
      })}
    </nav>
    </>
  );
};

export default Navbar;
