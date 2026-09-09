import { useEffect, useState } from 'react';
import type { NotifEvent } from '../notifications/notification';
import { NOTIF_META, formatRelativeTime } from '../notifications/notification';
import './trackJournal.css';

interface TrackJournalProps {
  events: NotifEvent[];
  onClear?: () => void;
  /** Заголовок панели. По умолчанию — общий журнал; в модалке передаём свой. */
  title?: string;
  /** Доп. класс на корень .journal (напр. для другой высоты внутри модалки). */
  className?: string;
  /** Текст пустого состояния под заголовком. */
  emptyHint?: string;
}

function EventBody({ e }: { e: NotifEvent }) {
  if (e.type === 'switched' && e.serverFrom && e.serverTo) {
    return (
      <div className="journalSwitch">
        <span className="journalAction">сменил сервер</span>
        <span className="journalServer from">{e.serverFrom}</span>
        <span className="journalArrow">↓</span>
        <span className="journalServer to">{e.serverTo}</span>
      </div>
    );
  }

  if (e.type === 'returned' && e.serverTo) {
    return (
      <div className="journalSwitch">
        <span className="journalAction">вернулся на исходный сервер</span>
        <span className="journalServer home">{e.serverTo}</span>
      </div>
    );
  }

  if (e.type === 'left' && e.serverFrom) {
    return (
      <div className="journalSwitch">
        <span className="journalAction">покинул сервер</span>
        <span className="journalServer from">{e.serverFrom}</span>
      </div>
    );
  }

  if (e.type === 'online' && e.serverTo) {
    return (
      <div className="journalSwitch">
        <span className="journalAction">снова в игре</span>
        <span className="journalServer to">{e.serverTo}</span>
      </div>
    );
  }

  return <p className="journalMsg">{e.message}</p>;
}

export const TrackJournal = ({
  events,
  onClear,
  title = 'ИСТОРИЯ ОТСЛЕЖИВАНИЯ',
  className,
  emptyHint = 'Поставьте игрока на отслеживание - уход и смена сервера появятся здесь',
}: TrackJournalProps) => {
  // Раз в 15с перерисовываем, чтобы «X мин назад» не застывало
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => forceTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={className ? `journal ${className}` : 'journal'}>
      <header className="journalHeader">
        <span className="journalTitle">{title}</span>
        {onClear && (
          <button
            className="journalClearBtn"
            onClick={onClear}
            disabled={events.length === 0}
          >
            Очистить
          </button>
        )}
      </header>

      <div className="journalList">
        {events.length === 0 ? (
          <div className="journalEmpty">
            <span className="journalEmptyGlyph">◎</span>
            <p>Пока пусто</p>
            <span className="journalEmptyHint">{emptyHint}</span>
          </div>
        ) : (
          events.map((e) => {
            const meta = NOTIF_META[e.type];
            return (
              <div key={e.id} className="journalItem">
                <span
                  className="journalDot"
                  style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
                />
                <div className="journalBody">
                  <div className="journalTopline">
                    <span className="journalTag" style={{ color: meta.color }}>
                      {meta.glyph} {meta.label}
                    </span>
                    <span className="journalTime">{formatRelativeTime(e.timestamp)}</span>
                  </div>
                  <div className="journalPlayer" title={e.player}>{e.player}</div>
                  <EventBody e={e} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TrackJournal;
