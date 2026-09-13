export type WritingLanguage = 'en' | 'ko' | 'zh-TW';

/**
 * Calculates text length according to each language's specific standard:
 * - English: Words via Intl.Segmenter('en', { granularity: 'word' }), isWordLike only (contractions = 1 word)
 * - Korean: Eo-jeol (space-separated meaningful chunks, ignoring pure punctuation/whitespace)
 * - Traditional Chinese: Han characters (excluding spaces and punctuation) + English words in word units
 */
export function countWritingContent(text: string, lang: WritingLanguage): number {
  if (!text || !text.trim()) return 0;

  if (lang === 'en') {
    const IntlAny = Intl as any;
    if (typeof Intl !== 'undefined' && IntlAny.Segmenter) {
      const segmenter = new IntlAny.Segmenter('en', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text)) as any[];
      return segments.filter(s => s.isWordLike).length;
    }
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  if (lang === 'ko') {
    // 한국어: 어절 수
    // 공백으로 구분되는 의미 있는 덩어리 계산 (공백, 줄바꿈, 문장부호만 있는 항목 제외)
    const chunks = text.trim().split(/\s+/);
    return chunks.filter(chunk => /[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]/.test(chunk)).length;
  }

  if (lang === 'zh-TW') {
    // 번체중국어: 글자 수(字數)
    // - 공백과 문장부호를 제외한 한자 글자 수 계산
    // - 중국어 문장 안의 영문은 영문 단어 단위로 계산
    let count = 0;
    // 1. Hanzi characters
    const hanzi = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g);
    if (hanzi) {
      count += hanzi.length;
    }
    // 2. English words within Chinese text
    const IntlAny = Intl as any;
    if (typeof Intl !== 'undefined' && IntlAny.Segmenter) {
      const segmenter = new IntlAny.Segmenter('en', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text)) as any[];
      const enWords = segments.filter(s => s.isWordLike && /^[a-zA-Z0-9'’-]+$/.test(s.segment));
      count += enWords.length;
    } else {
      const enWords = text.match(/[a-zA-Z0-9'’-]+/g);
      if (enWords) count += enWords.length;
    }
    return count;
  }

  return text.trim().length;
}

/**
 * Returns static recommended range for the chosen writing language:
 * English: 20~200 words
 * Korean: 20~200 어절
 * Traditional Chinese: 50~400 字
 */
export function getRecommendedLimits(
  lang: WritingLanguage, 
  actMinWordCount?: number, 
  actMaxWordCount?: number
): { min: number; max: number } {
  if (lang === 'zh-TW') {
    return {
      min: actMinWordCount && actMinWordCount > 0 ? Math.max(50, actMinWordCount * 2) : 50,
      max: actMaxWordCount && actMaxWordCount > 0 ? Math.max(400, actMaxWordCount * 2) : 400
    };
  }

  return {
    min: actMinWordCount && actMinWordCount > 0 ? actMinWordCount : 20,
    max: actMaxWordCount && actMaxWordCount > 0 ? actMaxWordCount : 200
  };
}

/**
 * Formats the exact display string required:
 * - English: 권장 분량 20~200 words / 현재 4 words (or in EN: Recommended: 20~200 words / Current: 4 words)
 * - Korean: 권장 분량 20~200어절 / 현재 4어절
 * - Traditional Chinese: 建議字數 50~400字 / 目前 12字
 */
export function formatContentCountDisplay(
  currentCount: number,
  lang: WritingLanguage,
  uiLang: 'ko' | 'en' | 'zh-TW',
  actMinWordCount?: number,
  actMaxWordCount?: number
): string {
  const { min, max } = getRecommendedLimits(lang, actMinWordCount, actMaxWordCount);

  if (lang === 'en') {
    const recLabel = uiLang === 'en' ? 'Recommended' : uiLang === 'zh-TW' ? '建議字數' : '권장 분량';
    const curLabel = uiLang === 'en' ? 'Current' : uiLang === 'zh-TW' ? '目前' : '현재';
    return `${recLabel} ${min}~${max} words / ${curLabel} ${currentCount} words`;
  }

  if (lang === 'ko') {
    const recLabel = uiLang === 'en' ? 'Recommended' : uiLang === 'zh-TW' ? '建議字數' : '권장 분량';
    const curLabel = uiLang === 'en' ? 'Current' : uiLang === 'zh-TW' ? '目前' : '현재';
    return `${recLabel} ${min}~${max}어절 / ${curLabel} ${currentCount}어절`;
  }

  // zh-TW
  const recLabel = uiLang === 'zh-TW' ? '建議字數' : uiLang === 'en' ? 'Recommended' : '권장 분량';
  const curLabel = uiLang === 'zh-TW' ? '目前' : uiLang === 'en' ? 'Current' : '현재';
  return `${recLabel} ${min}~${max}字 / ${curLabel} ${currentCount}字`;
}

/**
 * Returns unit label for validation error messages
 */
export function getUnitLabel(lang: WritingLanguage): string {
  if (lang === 'en') return 'words';
  if (lang === 'ko') return '어절';
  return '字';
}
