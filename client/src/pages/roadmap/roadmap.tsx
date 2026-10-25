import React from 'react';
import './Roadmap.css';
import { useLang } from '../../i18n/LanguageContext';

interface Step {
  id: number;
  stage: string;
  status: 'done' | 'wip' | 'planned';
}

// Лента изменений — каждую запись пишете вручную, на обоих языках сразу
// (сайт двуязычный, значит и журнал должен быть). date — 'YYYY-MM-DD',
// форматируется под язык при показе. Новые записи добавлять в НАЧАЛО массива
// (самая свежая — сверху).
interface NewsEntry {
  date: string;
  ru: string;
  en: string;
}

const NEWS_FEED: NewsEntry[] = [
  // { date: '2026-10-25', ru: 'Добавил мультиязычность сайта.', en: 'Added multi-language support to the site.' },

  { date: '2026-10-25', ru: 'Исправление некоторых UI багов, улучшение мобильной версии сайта, добавлена смена языка.', en: 'Fixed some UI bugs, improved mobile version of the website, added a language change'},
  { date: '2026-10-22', ru: 'Запустил отслеживание активности игроков и сбор данных по часам.', en: 'Launched player activity tracking and hourly data collection.' },
  { date: '2026-10-18', ru: 'Добавил систему пользователей. Вход через Steam, личный кабинет и сессии.', en: 'Added the user system. Steam login, personal profile, and sessions.' },
  { date: '2026-09-06', ru: 'Запустил сайт. Поиск и отслеживание игроков по открытым данным.', en: 'Launched the site — player search and tracking based on public data.' },
];

// title/desc теперь переводятся через t(`roadmap.steps.${id}.*`) — тут остаётся
// только то, что не зависит от языка (номер этапа и статус). См. translations.ts.
const ROADMAP_STEPS: Step[] = [
  { id: 1, stage: 'STAGE | 01', status: 'done' },
  { id: 2, stage: 'STAGE | 02', status: 'wip' },
  { id: 3, stage: 'STAGE | 03', status: 'planned' },
  { id: 4, stage: 'STAGE | 04', status: 'planned' },
  { id: 5, stage: 'STAGE | 05', status: 'planned' },
];

export const Roadmap: React.FC = () => {
  const { t, lang } = useLang();

  const formatEntryDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="roadmapView">
      <header className="roadmapHeader">
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
      <section className="journalSection">
        <h2 className="journalHeading">{t('roadmap.journalTitle')}</h2>

        {NEWS_FEED.length === 0 ? (
          <p className="journalEmptyText">{t('roadmap.journalEmpty')}</p>
        ) : (
          <ul className="journalFeed">
            {NEWS_FEED.map((entry) => (
              <li className="journalFeedRow" key={entry.date + entry.ru}>
                <span className="journalFeedDate">{formatEntryDate(entry.date)}</span>
                <span className="journalFeedMsg">{lang === 'ru' ? entry.ru : entry.en}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
