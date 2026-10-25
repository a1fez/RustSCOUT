import React from 'react';
import './mainPage.css';

import { ContactsSection } from '../../contacts/contactsSection';
import { useLang } from '../../i18n/LanguageContext';

interface MainPageProps {
  onNavigateSearch?: () => void;
}

// q/a текста здесь больше нет — переводятся через t(`mainPage.faq.<id>.q`) при рендере,
// тут остаётся только порядок и id. См. src/i18n/translations.ts.
const FAQ_IDS = [
  'legal',
  'cost',
  'freshness',
  'steamLogin',
  'abandoned',
  'trackedServers',
  'install',
  'whoCanBeFound',
  'future',
  'reportIssue',
] as const;

// index — язык-независимый (римские цифры), title/text — через t(`mainPage.features.<id>.*`).
const FEATURES = [
  { id: 'collection', index: 'I' },
  { id: 'activityTracking', index: 'II' },
  { id: 'serverHistory', index: 'III' },
] as const;

export const MainPage: React.FC<MainPageProps> = ({ onNavigateSearch }) => {
  const { t } = useLang();

  return (
    <div className="mainJournal">
      {/* ШАПКА */}
      <header className="masthead reveal" style={{ '--reveal-order': 0 } as React.CSSProperties}>
        <div className="mastheadKicker">
          <span>{t('mainPage.kickerHome')}</span>
          <span>{t('mainPage.kickerSolo')}</span>
        </div>

        <div className="mastheadGrid">
          <h1 className="mastheadTitle">
            {t('mainPage.titlePrefix')} <em>RustSCOUT</em>
          </h1>

          <div className="mastheadLead">
            <p>
              {t('mainPage.leadText')}
            </p>

            <div className="mastheadActions">
              <button className="actionLink actionLink--primary" onClick={onNavigateSearch} type="button">
                {t('mainPage.ctaSearch')} <span className="actionArrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ЛИЧНОЕ ПИСЬМО АВТОРА */}
      <section className="letterSection reveal" style={{ '--reveal-order': 1 } as React.CSSProperties}>
        <span className="letterMark">{t('mainPage.letterMark')}</span>

        <blockquote className="letterBody">
          <p>
            {t('mainPage.letterP1')}
          </p>
          <p>
            {t('mainPage.letterP2')}
          </p>
          <footer className="letterSign">{t('mainPage.letterSign')}</footer>
        </blockquote>
      </section>

      {/* FAQ */}
      <section className="faqSection reveal" style={{ '--reveal-order': 2 } as React.CSSProperties}>
        <div className="faqKicker">
          <span>{t('mainPage.faqKickerTag')}</span>
          <span>{t('mainPage.faqKickerLabel')}</span>
        </div>
        <h2 className="sectionHead">{t('mainPage.faqSectionHead')}</h2>

        <p className="faqIntro">
          {t('mainPage.faqIntro')}
        </p>

        <dl className="faqList">
          {FAQ_IDS.map((id, i) => (
            <div className="faqRow" key={id}>
              <span className="faqNum">{String(i + 1).padStart(2, '0')}</span>
              <div className="faqBody">
                <dt className="faqQ">{t(`mainPage.faq.${id}.q`)}</dt>
                <dd className="faqA">{t(`mainPage.faq.${id}.a`)}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* КАК ЭТО УСТРОЕНО */}
      <section className="featuresSection reveal" style={{ '--reveal-order': 3 } as React.CSSProperties}>
        <div className="sectionKicker">{t('mainPage.featuresKicker')}</div>
        <h2 className="sectionHead">{t('mainPage.featuresSectionHead')}</h2>

        <ol className="featureList">
          {FEATURES.map((f) => (
            <li className="featureItem" key={f.id}>
              <span className="featureIndex">{f.index}</span>
              <div className="featureBody">
                <h3 className="featureTitle">{t(`mainPage.features.${f.id}.title`)}</h3>
                <p className="featureText">{t(`mainPage.features.${f.id}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* СВЯЗЬ С НАМИ */}
      <ContactsSection />
    </div>
  );
};
