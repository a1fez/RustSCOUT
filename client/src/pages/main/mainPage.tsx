import React from 'react';
import './MainPage.css';
import { 
  BiRadar, 
  BiShieldQuarter, 
  BiTargetLock, 
  BiNetworkChart, 
  BiTerminal, 
  BiTrendingUp,
  BiGlobe
} from 'react-icons/bi';

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
          ВЕБ-СЕРВИС МОНИТОРИНГА И РАЗВЕДКИ <span className="accentText">RUST</span>
        </h1>

        <p className="heroSubtitle">
          Онлайн-платформа внешней аналитики и трекинга игроков прямо в браузере.
          Сервис фиксирует онлайн противников, вскрывает скрытые смурф-составы и строит графики активности без установки сторонних программ.
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
            <h3 className="cardTitle">ДВУХУРОВНЕВЫЙ РАДАР СЕРВЕРОВ</h3>
            <p className="cardDesc">
              Фоновый сбор данных через распределенные очереди. Первые топ 100 серверов опрашиваются менее чем за 60 секунд, а остальные с позицией 101–200 обновляются каждые 2 минуты.
            </p>
            <ul className="cardBulletList">
              <li>Быстрое определение входа/выхода цели</li>
              <li>Синхронизация данных прямо в веб-интерфейсе</li>
            </ul>
          </div>

          <div className="moduleCard highlighted">
            <div className="cardCorner" />
            <div className="cardIconWrap">
              <BiNetworkChart className="cardIcon accent" />
              <span className="cardIndex accent">CORE_02</span>
            </div>
            <h3 className="cardTitle">ДЕТЕКТОР СМУРФОВ И СВЯЗЕЙ</h3>
            <p className="cardDesc">
              Построение графа связей на основе совпадения сессий, общих игровых серверов и истории смены никнеймов. Вскрывает основу клана, даже если они играют с чистых аккаунтов.
            </p>
            <ul className="cardBulletList">
              <li>Поиск скрытых взаимосвязей SteamID</li>
              <li>История переходов и совместных сессий</li>
            </ul>
          </div>

          <div className="moduleCard">
            <div className="cardCorner" />
            <div className="cardIconWrap">
              <BiTrendingUp className="cardIcon" />
              <span className="cardIndex">CORE_03</span>
            </div>
            <h3 className="cardTitle">ПРЕДИКТОР ОФФЛАЙН-РЕЙДОВ</h3>
            <p className="cardDesc">
              Аналитика суточных графиков сна и тепловые карты онлайна. Платформа рассчитывает вероятные окна глубокого оффлайна противника на базе собранной статистики.
            </p>
            <ul className="cardBulletList">
              <li>Определение часового пояса клана</li>
              <li>Расчет безопасных окон для вылазок</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. PIPELINE WORKFLOW (КАК РАБОТАЕТ ВЕБ-СЕРВИС) */}
      <section className="pipelineSection">
        <div className="sectionHeader">
          <span className="sectionTag">PIPELINE WORKFLOW</span>
          <h2 className="sectionTitle">КАК РАБОТАЕТ RUSTSCOUT</h2>
        </div>

        <div className="stepsWorkflow">
          <div className="workflowStep">
            <div className="stepNumber">01</div>
            <h4 className="stepTitle">ПОИСК В БРАУЗЕРЕ</h4>
            <p className="stepText">Вводите SteamID64, ссылку на профиль или сервер в строке поиска на сайте.</p>
          </div>
          <div className="workflowArrow">&gt;&gt;</div>

          <div className="workflowStep">
            <div className="stepNumber">02</div>
            <h4 className="stepTitle">БЫСТРЫЙ КЭШ</h4>
            <p className="stepText">Серверный демон опрашивает 200 серверов пулами и отдает данные из Redis за доли миллисекунды.</p>
          </div>
          <div className="workflowArrow">&gt;&gt;</div>

          <div className="workflowStep">
            <div className="stepNumber">03</div>
            <h4 className="stepTitle">ВЕБ-ТЕЛЕМЕТРИЯ</h4>
            <p className="stepText">Получаете полную сводку: текущий статус цели, сервер, продолжительность сессии и алерты.</p>
          </div>
        </div>
      </section>

      {/* 4. БЕЗОПАСНОСТЬ И ЛЕГАЛЬНОСТЬ */}
      <section className="securityNotice">
        <BiGlobe className="securityIcon" />
        <div className="securityTextWrap">
          <h4 className="securityTitle">ПОЛНОСТЬЮ ОБЛАЧНЫЙ ВЕБ-СЕРВИС // 100% БЕЗОПАСНО</h4>
          <p className="securityText">
            RustScout работает исключительно в браузере как веб-сервис. Сайт не требует скачивания исполняемых файлов (.exe), не взаимодействует с процессами ОС и не внедряется в память игры. Вся аналитика строится на публичных метаданных серверов.
          </p>
        </div>
      </section>
    </div>
  );
};