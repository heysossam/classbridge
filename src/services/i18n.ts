import ko from '../locales/ko.json';
import en from '../locales/en.json';
import zhTW from '../locales/zh-TW.json';
import { Language } from '../types';

const translations: Record<Language, any> = {
  ko,
  en,
  'zh-TW': zhTW,
};

export function getTranslation(lang: Language, path: string): string {
  const dict = translations[lang] || translations.ko;
  const parts = path.split('.');
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to Korean if key missing
      let fallback: any = translations.ko;
      for (const fPart of parts) {
        if (fallback && typeof fallback === 'object' && fPart in fallback) {
          fallback = fallback[fPart];
        } else {
          return path;
        }
      }
      return typeof fallback === 'string' ? fallback : path;
    }
  }

  return typeof current === 'string' ? current : path;
}
