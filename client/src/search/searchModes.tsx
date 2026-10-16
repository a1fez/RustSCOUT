import { LuHash, LuUserSearch } from 'react-icons/lu';
import { FaSteam } from 'react-icons/fa';
import { IoChevronDown } from 'react-icons/io5';
import type { IconType } from 'react-icons';
import './searchModes.css';

export type SearchMode = 'bm' | 'steam' | 'nick';

interface ModeInfo {
  id: SearchMode;
  label: string;   // короткая подпись на кнопке
  title: string;   // заголовок в раскрывающемся блоке
  desc: string;
  example: string;
  Icon: IconType;
}

export const SEARCH_MODES: ModeInfo[] = [
  {
    id: 'bm',
    label: 'BM ID',
    title: 'По BattleMetrics',
    desc: 'ID или ссылка на игрока в BattleMetrics. Сервер не нужен, работает даже с закрытым профилем Steam.',
    example: 'battlemetrics.com/players/123456789',
    Icon: LuHash,
  },
  {
    id: 'steam',
    label: 'STEAM + СЕРВЕР',
    title: 'По Steam и серверу',
    desc: 'SteamID64 и сервер, где игрок сейчас. Сверяем ник из Steam с онлайном сервера.',
    example: '76561198000000000',
    Icon: FaSteam,
  },
  {
    id: 'nick',
    label: 'НИКНЕЙМ',
    title: 'По никнейму',
    desc: 'Увидел ник в игре — вводи как есть. Сервер можно указать, чтобы сузить поиск.',
    example: 'xX_Raid_Xx',
    Icon: LuUserSearch,
  },
];

interface SearchModesProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
  infoOpen: boolean;
  onToggleInfo: () => void;
}

export const SearchModes = ({ mode, onChange, infoOpen, onToggleInfo }: SearchModesProps) => (
  <div className="searchModes">
    <div className="modeTabs" role="tablist" aria-label="Режим поиска">
      {SEARCH_MODES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={mode === id}
          className={`modeTab ${mode === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon className="modeTabIcon" />
          <span>{label}</span>
        </button>
      ))}
    </div>

    <button
      type="button"
      className={`modeInfoToggle ${infoOpen ? 'open' : ''}`}
      onClick={onToggleInfo}
      aria-expanded={infoOpen}
      aria-label={infoOpen ? 'Скрыть описание режимов' : 'Что делает каждый режим'}
    >
      <IoChevronDown />
    </button>

    {/* Блоки всегда в DOM: высота раскрывается через grid-template-rows 0fr → 1fr,
        а сами карточки «выпрыгивают» с перелётом (cubic-bezier > 1) по очереди. */}
    <div className={`modeInfo ${infoOpen ? 'open' : ''}`} aria-hidden={!infoOpen}>
      <div className="modeInfoInner">
        {SEARCH_MODES.map(({ id, title, desc, example, Icon }, i) => (
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
              <span className="modeInfoTitle">{title}</span>
            </span>
            <span className="modeInfoDesc">{desc}</span>
            <code className="modeInfoExample">{example}</code>
          </button>
        ))}
      </div>
    </div>
  </div>
);
