import React from 'react';
import './Roadmap.css';

interface Step {
  id: number;
  stage: string;
  title: string;
  desc: string;
  status: 'done' | 'wip' | 'planned';
}

const ROADMAP_STEPS: Step[] = [
  {
    id: 1,
    stage: 'PHASE // 01',
    title: 'Ядро & Кэш',
    desc: 'Фоновый скрапер серверов Rust, обратный индекс в Redis и быстрый поиск игроков.',
    status: 'done',
  },
  {
    id: 2,
    stage: 'PHASE // 02',
    title: 'Радар онлайна',
    desc: 'Батчинг через MGET, сверка активности каждые 2 минуты и звуковые алерты.',
    status: 'wip',
  },
  {
    id: 3,
    stage: 'PHASE // 03',
    title: 'Telegram Бот',
    desc: 'Пуш-уведомления на телефон: мгновенный сигнал, когда противник зашел или покинул сервер.',
    status: 'planned',
  },
  {
    id: 4,
    stage: 'PHASE // 04',
    title: 'Граф связей',
    desc: 'Анализ тиммейтов: поиск скрытых смурфов, общий пул серверов и активность клана.',
    status: 'planned',
  },
  {
    id: 5,
    stage: 'PHASE // 05',
    title: 'Предиктор рейдов',
    desc: 'Паттерны онлайна: аналитика часов сна базы, графики типичного времени выхода из игры.',
    status: 'planned',
  },
];

interface RoadmapProps {
  onBack?: () => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ onBack }) => {
  return (
    <div className="roadmapView">
      <header className="roadmapHeader">
        {onBack && (
          <button className="roadmapBackBtn" onClick={onBack} type="button">
            ← НАЗАД В ДАШБОРД
          </button>
        )}
        <div className="roadmapBadge">SYSTEM PIPELINE // LIVE STATUS</div>
        <h1 className="roadmapTitle">ПЛАН РАЗРАБОТКИ</h1>
        <p className="roadmapDesc">
          Текущее состояние модулей RustScout и архитектурный роадмап
        </p>
      </header>

      <section className="timelineSection">
        {/* Базовая линия и бегущий импульс */}
        <div className="trackLine">
          <div className="trackPulse" />
        </div>

        {/* 5 узлов */}
        <div className="nodesGrid">
          {ROADMAP_STEPS.map((step) => (
            <div key={step.id} className={`nodeCol ${step.status}`}>
              <div className="nodeMarkerWrap">
                <div className={`nodeMarker ${step.status}`}>
                  {step.status === 'done' && <span className="markerIcon">✓</span>}
                  {step.status === 'wip' && <span className="markerPulseDot" />}
                  {step.status === 'planned' && <span className="markerNumber">{step.id}</span>}
                </div>
              </div>

              <div className="nodeCard">
                <span className="nodeStage">{step.stage}</span>
                <h3 className="nodeTitle">{step.title}</h3>
                <p className="nodeBody">{step.desc}</p>
                <div className="nodeStatus">
                  {step.status === 'done' && 'ГОТОВО'}
                  {step.status === 'wip' && 'В ПРОЦЕССЕ'}
                  {step.status === 'planned' && 'В ПЛАНАХ'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};