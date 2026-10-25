import { LuHash, LuUserSearch } from 'react-icons/lu';
import { FaSteam } from 'react-icons/fa';
import { IoChevronDown } from 'react-icons/io5';
import type { IconType } from 'react-icons';
import { useLang } from '../i18n/LanguageContext';
import './searchModes.css';

export type SearchMode = 'bm' | 'steam' | 'nick';

// label/title/desc больше не хранятся тут — они переводятся через t('searchModes.<id>.*'),
// см. src/i18n/translations.ts. Здесь остаётся только то, что не зависит от языка.
interface ModeInfo {
  id: SearchMode;
  example: string;
  Icon: IconType;
}

export const SEARCH_MODES: ModeInfo[] = [
  {
    id: 'bm',
    example: 'battlemetrics.com/players/123456789',
    Icon: LuHash,
  },
  {
    id: 'steam',
    example: '76561198000000000',
    Icon: FaSteam,
  },
  {
    id: 'nick',
    example: 'FAFIK',
    Icon: LuUserSearch,
  },
];

interface SearchModesProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
  infoOpen: boolean;
  onToggleInfo: () => void;
}

export const SearchModes = ({ mode, onChange, infoOpen, onToggleInfo }: SearchModesProps) => {
  const { t } = useLang();

  return (
    <div className="searchModes">
      <div className="modeTabs" role="tablist" aria-label={t('searchModes.tabsAriaLabel')}>
        {SEARCH_MODES.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            className={`modeTab ${mode === id ? 'active' : ''}`}
            onClick={() => onChange(id)}
          >
            <Icon className="modeTabIcon" />
            <span>{t(`searchModes.${id}.label`)}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`modeInfoToggle ${infoOpen ? 'open' : ''}`}
        onClick={onToggleInfo}
        aria-expanded={infoOpen}
        aria-label={infoOpen ? t('searchModes.hideInfo') : t('searchModes.showInfo')}
      >
        <IoChevronDown />
      </button>

      {/* Блоки всегда в DOM: высота раскрывается через grid-template-rows 0fr → 1fr,
          а сами карточки «выпрыгивают» с перелётом (cubic-bezier > 1) по очереди. */}
      <div className={`modeInfo ${infoOpen ? 'open' : ''}`} aria-hidden={!infoOpen}>
        <div className="modeInfoInner">
          {SEARCH_MODES.map(({ id, example, Icon }, i) => (
            <button
              key={id}
              type="button"
              tabIndex={infoOpen ? 0 : -1}
              className={`modeInfoCard ${mode === id ? 'active' : ''}`}
              style={{ '--i': i } as React.CSSProperties}
              onClick={() => onChange(id)}
            >
              <span className="modeInfoHead">
                <Icon className="modeInfoIcon" />
                <span className="modeInfoTitle">{t(`searchModes.${id}.title`)}</span>
              </span>
              <span className="modeInfoDesc">{t(`searchModes.${id}.desc`)}</span>
              <code className="modeInfoExample">{example}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
