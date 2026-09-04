import { useState } from 'react';
import logo from '../resource/rustScout3.png';
import './navbar.css';
import { BiArchive } from 'react-icons/bi';
import { GoGear } from 'react-icons/go';
import { HiUserCircle } from "react-icons/hi";

import { CornerSvg } from './cornerSvg';



const MENU_ITEMS = ['main', 'search', 'info'];

interface NavbarProps {
  onOpenRoadmap?: () => void;
  onSelectTab?: (tab: string) => void;
}

const Navbar = ({ onOpenRoadmap, onSelectTab }: NavbarProps) => {
  const [activeTab, setActiveTab] = useState('SEARCH');
  const [isNotifOpen, setNotifOpen] = useState(false);
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
              onClick={() => {setActiveTab(item); onSelectTab?.(item);}}
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
          <div className="notification" onClick={() => setNotifOpen(!isNotifOpen)}>
            <BiArchive className="icon" />
            <div className="notificationBadge" />
            {isNotifOpen && (
              <div className="notificationDropdown">
                <header className="notifHeader">
                  <span className="notifTitle">ЖУРНАЛ СОБЫТИЙ // LOGS</span>
                  <button className="notifClearBtn">Очистить</button>
                </header>

                <div className="notifList">
                  {/* Пример карточки события */}
                  <div className="notifItem offline">
                    <span className="notifIndicator" />
                    <div className="notifContent">
                      <div className="notifMeta">
                        <span className="notifPlayer">Player_One</span>
                        <span className="notifTime">2 мин назад</span>
                      </div>
                      <p className="notifMsg">Покинул сервер [EU] Rustafied Main</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <GoGear className="icon" />
          <HiUserCircle className="icon" color="black" style={{ backgroundColor: "white", borderRadius: "50%" }} />
        </div>
      </div>
    </div>



    
  );
};

export default Navbar;