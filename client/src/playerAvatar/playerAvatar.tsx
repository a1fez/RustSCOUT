import { useState } from 'react';
import { LuUser } from 'react-icons/lu';
import './playerAvatar.css';

interface PlayerAvatarProps {
  src?: string | null;
  alt?: string;
}

// Аватар игрока: картинка Steam, а если её нет или она не загрузилась — иконка.
// Размер и скругление задаёт родитель (.cardImage, .playerImg, ...), компонент
// просто заполняет его целиком.
export const PlayerAvatar = ({ src, alt = '' }: PlayerAvatarProps) => {
  // Запоминаем, КАКАЯ ссылка сломалась: если придёт новая src — снова пробуем картинку
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <div className="playerAvatar">
      {showImage ? (
        <img src={src!} alt={alt} loading="lazy" onError={() => setFailedSrc(src!)} />
      ) : (
        <LuUser className="playerAvatarFallback" aria-hidden="true" />
      )}
    </div>
  );
};
