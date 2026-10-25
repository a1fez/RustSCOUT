import React from 'react';
import './Roadmap.css';
import { useLang } from '../../i18n/LanguageContext';

interface Step {
  id: number;
  stage: string;
  status: 'done' | 'wip' | 'planned';
}

// title/desc теперь переводятся через t(`roadmap.steps.${id}.*`) — тут остаётся
// только то, что не зависит от языка (номер этапа и статус). См. translations.ts.
const ROADMAP_STEPS: Step[] = [
  { id: 1, stage: 'STAGE | 01', status: 'done' },
  { id: 2, stage: 'STAGE | 02', status: 'wip' },
  { id: 3, stage: 'STAGE | 03', status: 'planned' },
  { id: 4, stage: 'STAGE | 04', status: 'planned' },
  { id: 5, stage: 'STAGE | 05', status: 'planned' },
];

interface RoadmapProps {
  onBack?: () => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ onBack }) => {
  const { t } = useLang();

  return (
    <div className="roadmapView">
      <header className="roadmapHeader">
        {onBack && (
          <button className="roadmapBackBtn" onClick={onBack} type="button">
            {t('roadmap.backBtn')}
          </button>
        )}
        <div className="roadmapBadge">SYSTEM PIPELINE // LIVE STATUS</div>
        <h1 className="roadmapTitle">{t('roadmap.title')}</h1>
        <p className="roadmapDesc">
          {t('roadmap.desc')}
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
            <div
              key={step.id}
              className={`nodeCol ${step.status}`}
            >
              <div className="nodeMarkerWrap">
                <div className={`nodeMarker ${step.status}`}>
                  {step.status === 'done' && <span className="markerIcon">✓</span>}
                  {step.status === 'wip' && <span className="markerPulseDot" />}
                  {step.status === 'planned' && <span className="markerNumber">{step.id}</span>}
                </div>
              </div>

              <div className="nodeCard">
                <span className="nodeStage">{step.stage}</span>
                <h3 className="nodeTitle">{t(`roadmap.steps.${step.id}.title`)}</h3>
                <p className="nodeBody">{t(`roadmap.steps.${step.id}.desc`)}</p>
                <div className="nodeStatus">
                  {step.status === 'done' && t('roadmap.statusDone')}
                  {step.status === 'wip' && t('roadmap.statusWip')}
                  {step.status === 'planned' && t('roadmap.statusPlanned')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
