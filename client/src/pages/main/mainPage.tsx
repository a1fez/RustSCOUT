import React from 'react';
import './mainPage.css';
import { 
  BiRadar, BiShieldQuarter, BiTargetLock, BiNetworkChart, 
  BiTerminal, BiTrendingUp, BiGlobe,
  BiGift, BiSync, BiRocket,
  BiCurrentLocation, 
} from 'react-icons/bi';

 import { BiEnvelope } from 'react-icons/bi'; 
 import { FaTelegramPlane, FaDiscord } 
 from 'react-icons/fa'; 

interface MainPageProps {
  onNavigateSearch?: () => void;
  onOpenRoadmap?: () => void;
}

export const MainPage: React.FC<MainPageProps> = ({ onNavigateSearch, onOpenRoadmap }) => {
  return (
    <div className="mainPage">
      {/* 1. HERO SECTION */}
      <section className="heroSection">
        <div className="heroTelemetry">
          <span className="telemetryDot" />
          <span>////</span>
        </div>

        <h1 className="heroTitle">
          ВЕБ-СЕРВИС МОНИТОРИНГА И АНАЛИЗА ИГРОКОВ <span className="accentText">RUST</span>
        </h1>

        <p className="heroSubtitle">
          Сервис фиксирует онлайн игроков, пользуюясь публичными данными серверов и фильтрирует. Так вы получаете быстрый доступ к информации вместо траты кучу времени на ручной поиск. В будущем сервис будет предоставлять аналитику по игрокам и кланам, а также графики активности и взаимосвязей.
        </p>

        <div className="heroActions">
          <button className="primaryBtn" onClick={onNavigateSearch} type="button">
            <BiTerminal className="btnIcon" />
            <span>ПЕРЕЙТИ К ПОИСКУ</span>
          </button>

          <button className="secondaryBtn" onClick={onOpenRoadmap} type="button">
            <span>ПЛАН РАЗРАБОТКИ // WIP</span>
          </button>
        </div>

        {/* Метрики системы */}
        <div className="metricsStrip">
          <div className="metricItem">
            <span className="metricVal">&le; 60s</span>
            <span className="metricLabel">СИНХРОНИЗАЦИЯ ТОП 1-100</span>
          </div>
          <div className="metricDivider" />
          <div className="metricItem">
            <span className="metricVal">120s</span>
            <span className="metricLabel">СИНХРОНИЗАЦИЯ ТОП 101-200</span>
          </div>
          <div className="metricDivider" />
          <div className="metricItem">
            <span className="metricVal">1s</span>
            <span className="metricLabel">СКОРОСТЬ ПОЛУЧЕНИЯ ДАННЫХ</span>
          </div>
          
        </div>
      </section>

      {/* 2. КЛЮЧЕВЫЕ МОДУЛИ ВЕБ-ПЛАТФОРМЫ */}
      <section className="modulesSection">
        <div className="sectionHeader">
          <span className="sectionTag">PLATFORM ARCHITECTURE</span>
          <h2 className="sectionTitle">ФУНКЦИОНАЛ ПЛАТФОРМЫ</h2>
        </div>

        <div className="modulesGrid">
          <div className="moduleCard">
            <div className="cardCorner" />
            <div className="cardIconWrap">
              <BiRadar className="cardIcon" />
              <span className="cardIndex">CORE_01</span>
            </div>
            <h3 className="cardTitle">СБОР ДАННЫХ</h3>
            <p className="cardDesc">
              Фоновый сбор данных через распределенные очереди. Система опрашивает топ 300 серверов которые имеют свою тир систему и приоритетно собирает данные с наиболее популярных серверов.
            </p>
            <ul className="cardBulletList">
              <li>Быстрое определение входа/выхода игрока</li>
              <li>Анализ активности на серверах</li>
            </ul>
          </div>

          <div className="moduleCard highlighted">
            <div className="cardCorner" />
            <div className="cardIconWrap">
              <BiCurrentLocation className="cardIcon accent" />
              <span className="cardIndex accent">CORE_02</span>
            </div>
            <h3 className="cardTitle">ОТСЛЕЖИВАНИЕ АКТИВНОСТИ</h3>
            <p className="cardDesc">
              Спроектированная система дает возможность отслеживать активность игрока на разных серверах и определять его поведение и выбирать подходящий для вас момент. В будущем будут выстроины графики активности игроков, благодаря этому вы сможете определить наилучшее время для ваших действий.
              
            </p>
            <ul className="cardBulletList">
              <li>Поиск скрытых взаимосвязей</li>
              <li>История переходов и совместных сессий</li>
            </ul>
          </div>

          <div className="moduleCard">
            <div className="cardCorner" />
            <div className="cardIconWrap">
              <BiNetworkChart  className="cardIcon" />
              <span className="cardIndex">CORE_03</span>
            </div>
            <h3 className="cardTitle">АНАЛИЗ ИСТОРИИ СЕРВЕРОВ</h3>
            <p className="cardDesc">
              Система показывает историю переходов игроков между серверами и строит граф связей. В будущем это позволит выявлять скрытые взаимосвязи между игроками и кланами, а также определять их активность на разных серверах.
            </p>
            <ul className="cardBulletList">
              <li>Определение часового пояса клана</li>
              <li>Расчет безопасных окон для вылазок</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. PIPELINE WORKFLOW (КАК РАБОТАЕТ ВЕБ-СЕРВИС) */}
      <section className="advantagesSection">
      <div className="sectionHeader">
        <span className="sectionTag">WHY RUSTSCOUT</span>
        <h2 className="sectionTitle">ПОЧЕМУ RUSTSCOUT</h2>
      </div>

      <div className="advantagesStrip">
        <div className="advantageItem">
          <span className="advantageIcon">
            <BiGift />
          </span>
          <h3 className="advantageTitle">БЕСПЛАТНО</h3>
          <p className="advantageDesc">
            Полный доступ к поиску и мониторингу без подписок и скрытых платежей.
          </p>
        </div>

        <div className="advantageDivider" />

        <div className="advantageItem">
          <span className="advantageIcon">
            <BiSync />
          </span>
          <h3 className="advantageTitle">АКТУАЛЬНОСТЬ ДАННЫХ</h3>
          <p className="advantageDesc">
            Обновление каждые 60–120 секунд, без устаревших снимков.
          </p>
        </div>

        <div className="advantageDivider" />

        <div className="advantageItem">
          <span className="advantageIcon">
            <BiRocket />
          </span>
          <h3 className="advantageTitle">ВИДИМОЕ РАЗВИТИЕ ПРОЕКТА</h3>
          <p className="advantageDesc">
            Открытый план разработки, новые модули выходят регулярно.
          </p>
        </div>
      </div>
    </section>

      {/* 4. БЕЗОПАСНОСТЬ И ЛЕГАЛЬНОСТЬ */}
      <section className="contactsSection">
      <div className="contactsTextWrap">
        <h4 className="contactsTitle">СВЯЗЬ С НАМИ</h4>
        <p className="contactsText">
          Есть вопрос, нашли баг или хотите предложить фичу - пишите в любой из каналов ниже.
        </p>
      </div>

      <div className="contactsLinks">
        <a
          href="https://t.me/rustscout"
          target="_blank"
          rel="noopener noreferrer"
          className="contactLink"
        >
          <FaTelegramPlane className="contactLinkIcon" />
          <span>Telegram</span>
        </a>

        
       

        <a href="https://mail.google.com/mail/u/0/#inbox?compose=new" target="_blank" className="contactLink">
          <BiEnvelope className="contactLinkIcon" />
          <span>rustscout@gmail.com</span>
        </a>
      </div>
    </section>

    </div>
  );
};