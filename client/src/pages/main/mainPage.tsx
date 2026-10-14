import React from 'react';
import './mainPage.css';

import { ContactsSection } from '../../contacts/contactsSection';

interface MainPageProps {
  onNavigateSearch?: () => void;
  onOpenRoadmap?: () => void;
}

const FAQ_ITEMS = [
  {
    q: 'Это законно?',
    a: 'Да. Сервис ничего не взламывает и не обходит защиту серверов — он читает те же публичные данные, которые и так видит любой игрок через консоль сервера.',
  },
  {
    q: 'Сколько это стоит?',
    a: 'Ничего. Основной поиск и мониторинг останутся бесплатными. Но хостинг и API-токены стоят реальных денег каждый месяц, так что часть продвинутых фич в будущем может стать платной или ограниченной — честно предупреждаю заранее.',
  },
  {
    q: 'Насколько свежие данные?',
    a: 'Топ 1–100 серверов синхронизируется не реже раза в 60 секунд, топ 101–200 — раз в 120 секунд. Старых снимков не показываем.',
  },
  {
    q: 'Зачем вход через Steam?',
    a: 'Нужен для системы пользователей и авторизации, а в будущем — для интеграции с Rust+ и возможности подключать друзей. Из Steam мы забираем только публичный профиль: ни паролей, ни платёжных данных сервис не видит.',
  },
  {
    q: 'Проект не забросят?',
    a: 'План разработки открыт — можно посмотреть, что уже сделано, а что в работе. Я веду его сам и обновляю по мере реальных изменений, а не для галочки.',
  },
  {
    q: 'Какие сервера отслеживаются?',
    a: 'Топ-300 серверов Rust — от самых популярных ванильных до крупных модифицированных, с приоритетом по реальной активности игроков. Нужного сервера нет в списке — напишите, добавляю по запросам.',
  },
  {
    q: 'Нужно ли что-то устанавливать?',
    a: 'Нет, и стараюсь обходиться без расширений и прочей ерунды. Разве что в будущем появится своё мобильное приложение с открытым исходным кодом — в первую очередь ради уведомлений, чтобы упростить структуру проекта.',
  },
  {
    q: 'Кого вообще можно найти?',
    a: 'Любого игрока, который хотя бы раз заходил на один из отслеживаемых серверов, — по нику или SteamID.',
  },
  {
    q: 'Что в планах дальше?',
    a: 'Графики активности по времени суток, определение часового пояса кланов и поиск связей между игроками по истории серверов — всё это уже в работе, прогресс виден в плане разработки.',
  },
  {
    q: 'Как сообщить о проблеме?',
    a: 'Пишите в Telegram, Discord или на почту внизу страницы — отвечаю лично, обычно в течение дня.',
  },
];

const FEATURES = [
  {
    index: 'I',
    title: 'Сбор данных',
    text: 'Фоновый сбор через распределённые очереди: система опрашивает топ-300 серверов по своей тир-системе и в первую очередь — самые популярные из них.',
  },
  {
    index: 'II',
    title: 'Отслеживание активности',
    text: 'Видно, на каких серверах и когда именно активен игрок. Дальше это превратится в графики активности — чтобы было проще угадывать подходящий момент.',
  },
  {
    index: 'III',
    title: 'История серверов',
    text: 'История переходов между серверами уже строит граф связей. В планах — находить по нему скрытые связи между игроками и кланами.',
  },
];

export const MainPage: React.FC<MainPageProps> = ({ onNavigateSearch, onOpenRoadmap }) => {
  return (
    <div className="mainJournal">
      {/* ШАПКА */}
      <header className="masthead reveal" style={{ '--reveal-order': 0 } as React.CSSProperties}>
        <div className="mastheadKicker">
          <span>ГЛАВНАЯ</span>
          <span>СОЛО-РАЗРАБОТКА · В ПРОЦЕССЕ</span>
        </div>

        <div className="mastheadGrid">
          <h1 className="mastheadTitle">
            Точно и без лишнего — <em>RustSCOUT</em>
          </h1>

          <div className="mastheadLead">
            <p>
              RustScout фиксирует, кто сейчас в сети на серверах Rust, — по тем же
              открытым данным, которые и так показывает сам сервер. Без ручного обхода
              вкладок и без гаданий, зашёл человек или нет.
            </p>

            <div className="mastheadActions">
              <button className="actionLink actionLink--primary" onClick={onNavigateSearch} type="button">
                Перейти к поиску <span className="actionArrow">→</span>
              </button>
              <button className="actionLink" onClick={onOpenRoadmap} type="button">
                План разработки
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ЛИЧНОЕ ПИСЬМО АВТОРА */}
      <section className="letterSection reveal" style={{ '--reveal-order': 1 } as React.CSSProperties}>
        <span className="letterMark">Письмо автора</span>

        <blockquote className="letterBody">
          <p>
            Всем привет. Здесь нет магии или скрытых механизмов: сервис собирает только открытые публичные данные серверов и моментально показывает статус игроков в удобном интерфейсе.

            Я развиваю проект в одиночку и отвечаю за репутацию своим именем. Если у вас возникнут вопросы по работе алгоритмов или безопасности данных — ниже есть честный FAQ и открытая документация.
          </p>
          <p>
            Информация которую использует сам сервис, является общедоступной, сервис предоставляет ее в удобном виде с учетом ее автоматизации вместо долгого и ручного поиска.
          </p>
          <footer className="letterSign">— Единственный разраб RustScout</footer>
        </blockquote>
      </section>

      {/* FAQ */}
      <section className="faqSection reveal" style={{ '--reveal-order': 2 } as React.CSSProperties}>
        <div className="faqKicker">
          <span>FAQ</span>
          <span>ЧАСТЫЕ ВОПРОСЫ</span>
        </div>
        <h2 className="sectionHead">Прежде чем начать</h2>

        <p className="faqIntro">
          Слежу за другими трекерами и форумами — вижу, на что жалуются их
          игроки. Что-то беру в работу, что-то обхожу стороной специально. Но
          если честно, хочется не чужих недовольных пользователей, а своих =)
        </p>

        <dl className="faqList">
          {FAQ_ITEMS.map((item, i) => (
            <div className="faqRow" key={item.q}>
              <span className="faqNum">{String(i + 1).padStart(2, '0')}</span>
              <div className="faqBody">
                <dt className="faqQ">{item.q}</dt>
                <dd className="faqA">{item.a}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* КАК ЭТО УСТРОЕНО */}
      <section className="featuresSection reveal" style={{ '--reveal-order': 3 } as React.CSSProperties}>
        <div className="sectionKicker">Функционал</div>
        <h2 className="sectionHead">Как это устроено</h2>

        <ol className="featureList">
          {FEATURES.map((f) => (
            <li className="featureItem" key={f.index}>
              <span className="featureIndex">{f.index}</span>
              <div className="featureBody">
                <h3 className="featureTitle">{f.title}</h3>
                <p className="featureText">{f.text}</p>
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
