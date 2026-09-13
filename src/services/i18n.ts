import ko from '../locales/ko.json';
import en from '../locales/en.json';
import zhTW from '../locales/zh-TW.json';
import { Language, Activity } from '../types';

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

export interface LocalizedActivityContent {
  title: string;
  instructions: string;
  isFallback: boolean;
  fallbackNotice?: string;
}

/**
 * Activity title and instruction priority:
 * 1. User's selected language
 * 2. English (en)
 * 3. Registered original text
 * If alternative fallback text is shown, displays the specified fallback notice.
 */
export function getLocalizedActivityContent(activity: Activity, lang: Language): LocalizedActivityContent {
  const noticeText = getTranslation(lang, 'activity.fallbackNotice');

  // Priority for instructions
  let instructions = '';
  let isInstructionsFallback = false;

  if (lang === 'ko') {
    if (activity.instructionsKo?.trim()) {
      instructions = activity.instructionsKo;
    } else if (activity.instructionsEn?.trim()) {
      instructions = activity.instructionsEn;
      isInstructionsFallback = true;
    } else {
      instructions = activity.instructionsZh || '';
      isInstructionsFallback = true;
    }
  } else if (lang === 'zh-TW') {
    if (activity.instructionsZh?.trim()) {
      instructions = activity.instructionsZh;
    } else if (activity.instructionsEn?.trim()) {
      instructions = activity.instructionsEn;
      isInstructionsFallback = true;
    } else {
      instructions = activity.instructionsKo || '';
      isInstructionsFallback = true;
    }
  } else {
    // English
    if (activity.instructionsEn?.trim()) {
      instructions = activity.instructionsEn;
    } else if (activity.instructionsKo?.trim()) {
      instructions = activity.instructionsKo;
      isInstructionsFallback = true;
    } else {
      instructions = activity.instructionsZh || '';
      isInstructionsFallback = true;
    }
  }

  // Priority for title
  let title = activity.title;
  if (lang === 'ko' && activity.titleKo) {
    title = activity.titleKo;
  } else if (lang === 'zh-TW' && activity.titleZh) {
    title = activity.titleZh;
  } else if (lang === 'en' && activity.titleEn) {
    title = activity.titleEn;
  }

  return {
    title,
    instructions: instructions || activity.title,
    isFallback: isInstructionsFallback,
    fallbackNotice: isInstructionsFallback ? noticeText : undefined
  };
}
