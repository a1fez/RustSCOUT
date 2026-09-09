import { useEffect, useRef, useState } from 'react';
import logo from '../resource/rustScoutLogo.png';
import './navbar.css';
import { BiArchive } from 'react-icons/bi';
import { GoGear } from 'react-icons/go';
import { HiUserCircle } from 'react-icons/hi';

import { CornerSvg } from './cornerSvg';
import type { NotifEvent } from '../notifications/notification';
import { NOTIF_META, formatRelativeTime } from '../notifications/notification';

const MENU_ITEMS = ['main', 'search'];

interface NavbarProps {
  onOpenRoadmap?: () => void;
  onSelectTab?: (tab: string) => void;
  notifications?: NotifEvent[];
  onClearNotifications?: () => void;
  onMarkAllRead?: () => void;
}

const Navbar = ({
  onOpenRoadmap,
  onSelectTab,
  notifications = [],
  onClearNotifications,
  onMarkAllRead,
}: NavbarProps) => {
  const [activeTab, setActiveTab] = useState('search');
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [, forceTick] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

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

  const toggleNotif = () => {
    setNotifOpen((open) => {
      const next = !open;
      if (next && unreadCount > 0) onMarkAllRead?.();
      return next;
    });
  };

  return (
    <div className="navbar">
      {/* Логотип */}
      <div className="logo">
        <img src={logo} alt="RustScout" />
      </div>

      <ul className="menu">
        {MENU_ITEMS.map((item) => {
          const isSelected = activeTab === item;
          return (
            <li
              key={item}
              className={`menuItem ${isSelected ? 'selected' : ''}`}
              onClick={() => { setActiveTab(item); onSelectTab?.(item); }}
            >
              <span className="menuText">{item}</span>

              {/* 4 угла прицела */}
              <div className="targetSight">
                <CornerSvg className="cornerIcon cornerTL" />
                <CornerSvg className="cornerIcon cornerTR" />
                <CornerSvg className="cornerIcon cornerBL" />
                <CornerSvg className="cornerIcon cornerBR" />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Правая часть: кнопка-знак + иконки */}
      <div className="rightSection">
        <button className="roadMapButton" onClick={onOpenRoadmap} type="button">
          <span className="roadMapBeacon beaconLeft" />
          <span className="roadMapText">ПЛАН РАЗРАБОТКИ</span>
          <span className="roadMapBeacon beaconRight" />
        </button>

        <div className="settings">
          <div className="notification" ref={notifRef}>
            <button
              type="button"
              className={`notifTrigger ${isNotifOpen ? 'active' : ''}`}
              onClick={toggleNotif}
              aria-label="Системные оповещения"
            >
              <BiArchive className="icon" />
              {unreadCount > 0 && (
                <span className="notificationBadge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="notificationDropdown">
                <header className="notifHeader">
                  <span className="notifTitle">СИСТЕМА · ОБНОВЛЕНИЯ</span>
                  <button
                    className="notifClearBtn"
                    onClick={onClearNotifications}
                    disabled={notifications.length === 0}
                  >
                    Очистить
                  </button>
                </header>

                <div className="notifList">
                  {notifications.length === 0 ? (
                    <div className="notifEmpty">
                      <span className="notifEmptyGlyph">◎</span>
                      <p>Оповещений нет</p>
                      <span className="notifEmptyHint">
                        Здесь появляются системные оповещения и новости об
                        обновлениях
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
                                {formatRelativeTime(n.timestamp)}
                              </span>
                            </div>
                            <p className="notifMsg">
                              <span
                                className="notifTag"
                                style={{ color: meta.color }}
                              >
                                {meta.glyph} {meta.label}
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
          <HiUserCircle
            className="icon"
            color="black"
            style={{ backgroundColor: 'white', borderRadius: '50%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
