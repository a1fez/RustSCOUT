import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { translations } from './translations';
import type { Lang } from './translations';

const STORAGE_KEY = 'rustscout_lang';

// null — языка ещё не выбирали (ни вручную, ни автоматически) в этом браузере.
function readSavedLang(): Lang | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {
    // localStorage недоступен (приватный режим и т.п.)
  }
  return null;
}

type Params = Record<string, string | number>;

// Достаёт узел по пути вида 'navbar.clear' из словаря нужного языка.
// undefined, если по пути ничего нет — отличаем "не нашли" от "нашли пустую строку".
function lookup(path: string, lang: Lang): unknown {
  const parts = path.split('.');
  let node: unknown = translations[lang];
  for (const part of parts) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

// Подставляет {name} в строке значениями из params, например:
// interpolate('Введите минимум {count} символа', { count: 3 }) → 'Введите минимум 3 символа'
function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  // Перевод по заранее известному пути — если перевод забыли добавить, вернёт
  // сам путь (например "search.someKey"), чтобы это было заметно в интерфейсе.
  t: (path: string, params?: Params) => string;
  // Перевод для значений, которые приходят извне (например код ошибки с backend) —
  // если такого ключа нет в словаре, тихо возвращает fallback, а не путь-заглушку.
  tf: (path: string, fallback: string, params?: Params) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // true, если язык уже был выбран (вручную или автоматически) раньше в этом
  // браузере — вычисляется один раз, до того как эффект ниже успеет что-то
  // записать в localStorage (иначе "уже выбирали?" всегда оказалось бы true).
  const hadSavedPref = useRef(false);
  const [lang, setLang] = useState<Lang>(() => {
    const saved = readSavedLang();
    hadSavedPref.current = saved !== null;
    return saved ?? 'ru';
  });

  // Запоминаем выбор между визитами
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // игнорируем — просто не сохранится между визитами
    }
  }, [lang]);

  // Автоопределение языка по стране посетителя (Cloudflare подставляет
  // заголовок CF-IPCountry на каждый запрос, backend отдаёт его через
  // /api/geo) — только при первом визите, когда язык ещё никем не выбран.
  // Иначе геолокация перезатирала бы осознанный выбор пользователя заново
  // при каждом визите.
  useEffect(() => {
    if (hadSavedPref.current) return;

    fetch('/api/geo')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.country && data.country !== 'RU') setLang('en');
      })
      .catch(() => {
        // гео недоступно (например, локальная разработка без Cloudflare) —
        // просто остаёмся на дефолте
      });
  }, []);

  const t = (path: string, params?: Params) => {
    const node = lookup(path, lang);
    return interpolate(typeof node === 'string' ? node : path, params);
  };

  const tf = (path: string, fallback: string, params?: Params) => {
    const node = lookup(path, lang);
    return interpolate(typeof node === 'string' ? node : fallback, params);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tf }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Хук для использования в любом компоненте: const { t, lang, setLang } = useLang();
export const useLang = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLang() должен вызываться внутри <LanguageProvider>');
  }
  return ctx;
};
