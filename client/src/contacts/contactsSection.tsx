import { BiEnvelope } from 'react-icons/bi';
import { FaTelegramPlane } from 'react-icons/fa';
import { SiDiscord } from "react-icons/si";
import './contactsSection.css';

/**
 * Блок «Связь с нами». Используется и на главной, и под списком карточек поиска —
 * отдельным блоком, не внутри контейнера карточек.
 */
export const ContactsSection = () => (
  <section className="contactsSection reveal">
    <div className="contactsTextWrap">
      <h4 className="contactsTitle">сВась</h4>
      <p className="contactsText">
        Есть вопрос, нашли баг или хотите предложить фичу - пишите в любой из каналов ниже.
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
);

export default ContactsSection;
