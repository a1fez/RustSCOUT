// Звуковое сопровождение событий отслеживания (уход / смена сервера).
import notifyUrl from '../resource/sounds/soundRustScout.mp3';

let audio: HTMLAudioElement | null = null;
let primed = false;

function ensureAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(notifyUrl);
    audio.preload = 'auto';
    audio.volume = 0.55;
  }
  return audio;
}

/**
 * Вызывать в рамках пользовательского жеста (клик по «Отслеживать игрока»),
 * чтобы браузер разрешил дальнейшее автоматическое воспроизведение.
 */
export function primeAudio(): void {
  const el = ensureAudio();
  if (primed) return;
  el.play()
    .then(() => {
      el.pause();
      el.currentTime = 0;
      primed = true;
    })
    .catch(() => {
      /* жеста ещё не было — попробуем в следующий раз */
    });
}

/** Проиграть уведомляющий звук. */
export function playAlert(): void {
  try {
    const el = ensureAudio();
    el.currentTime = 0;
    void el.play();
  } catch {
    /* автоплей мог быть заблокирован — игнорируем */
  }
}
