import React from 'react';
import './comingSoon.css';
import { LiaGrinWinkSolid } from 'react-icons/lia';
import { useLang } from '../../i18n/LanguageContext';

interface ComingSoonProps {
  onBack?: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onBack }) => {
  const { t } = useLang();

  return (
    <div className="comingSoonView">
      <h1 className="comingSoonTitle">{t('comingSoon.titleTop')}</h1>
      <h1 className="comingSoonTitle">{t('comingSoon.titleBottom')} <LiaGrinWinkSolid className="comingSoonIcon" /></h1>


      {onBack && (
        <button className="comingSoonBackBtn" onClick={onBack} type="button">
          {t('comingSoon.backBtn')}
        </button>
      )}
    </div>
  );
};

export default ComingSoon;
