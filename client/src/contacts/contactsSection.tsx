import { BiEnvelope } from 'react-icons/bi';
import { FaTelegramPlane } from 'react-icons/fa';
import { SiDiscord } from "react-icons/si";
import { useLang } from '../i18n/LanguageContext';
import './contactsSection.css';

/**
 * Блок «Связь с нами». Используется и на главной, и под списком карточек поиска —
 * отдельным блоком, не внутри контейнера карточек.
 */
export const ContactsSection = () => {
  const { t } = useLang();

  return (
  <>
    <section className="contactsSection reveal">
      <div className="contactsTextWrap">
        <h4 className="contactsTitle">{t('contactsSection.title')}</h4>
        <p className="contactsText">
          {t('contactsSection.text')}
        </p>
      </div>

      <div className="contactsLinks">
        <a
          href="https://t.me/rustscout"
          target="_blank"
          rel="noopener noreferrer"
          className="contactLink"
        >
          <FaTelegramPlane className="contactLinkIcon" />
          <span>Telegram</span>


        </a>
        <a
          href="https://discord.gg/ZkyekxzhxE"
          target="_blank"
          rel="noopener noreferrer"
          className="contactLink"
        >
          <SiDiscord  className="contactLinkIcon" />
          <span>Discord</span>
        </a>


        <a
          href="https://mail.google.com/mail/u/0/#inbox?compose=new"
          target="_blank"
          rel="noopener noreferrer"
          className="contactLink"
        >
          <BiEnvelope className="contactLinkIcon" />
          <span>rustscout@gmail.com</span>
        </a>
      </div>
    </section>

    <footer className="siteFooter">
      <p className="siteFooterText">
        Copyright © 2026 RustScout (rustscout.app). All rights reserved. Rust is a registered
        trademark of Facepunch Studios. RustScout is not affiliated with or endorsed by Facepunch
        Studios.
      </p>
    </footer>
  </>
  );
};

export default ContactsSection;
