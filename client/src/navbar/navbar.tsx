import { useState } from 'react';
import logo from '../resource/rustScout3.png';
import './navbar.css';
import { BiArchive } from 'react-icons/bi';
import { GoGear } from 'react-icons/go';
import { CornerSvg } from './cornerSvg';
// твои остальные импорты (logo, иконки)...

const MENU_ITEMS = ['ГЛАВНАЯ', 'ПОИСК', 'ИНФОРМАЦИЯ'];

const Navbar = ({ onOpenRoadmap }: { onOpenRoadmap?: () => void }) => {
  const [activeTab, setActiveTab] = useState('ПОИСК');

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
              onClick={() => setActiveTab(item)}
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
          <BiArchive className="icon" />
          <GoGear className="icon" />
        </div>
      </div>
    </div>
  );
};

export default Navbar;