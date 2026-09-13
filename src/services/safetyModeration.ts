import { Language } from '../types';

export interface SafetyCheckResult {
  isClean: boolean;
  flaggedCategories: string[];
  friendlyAdvice: string;
}

// 1. Phone Numbers (Korea: 010-XXXX-XXXX, 02-XXX-XXXX; Taiwan: 09XX-XXX-XXX, 02-XXXX-XXXX; International: +82, +886)
const PHONE_REGEX = /(?:\+?82|0)[0-9]{1,2}[-\s.]?[0-9]{3,4}[-\s.]?[0-9]{4}|(?:\+?886|0)9[0-9]{2}[-\s.]?[0-9]{3}[-\s.]?[0-9]{3}/;

// 2. Email Address
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// 3. SNS ID / External Contacts sharing patterns
const SNS_CONTACT_REGEX = /(?:인스타|insta(?:gram)?|카톡|kakaotalk|line\s*id|라인\s*아이디|wechat|위챗|discord|디코|디스코드|텔레그램|telegram|페이스북|facebook)[\s:：#@_-]*[a-zA-Z0-9._-]{3,}/i;

// 4. Specific School Name & Real Name risk patterns (e.g. OO초등학교, OO중학교, OO국민소학, 내 이름은 OO, My real name is OO)
const PII_SCHOOL_NAME_REGEX = /(?:[가-힣]{2,6}(?:초등학교|중학교|고등학교)|[\u4e00-\u9fa5]{2,6}(?:國民小學|國小|國民中學|國中|高中)|(?:내\s*실명은|내\s*이름은|제\s*이름은)\s+[가-힣]{2,4}|my\s+(?:real\s+)?name\s+is\s+[A-Z][a-z]+\s+[A-Z][a-z]+)/i;

// 5. Spam / Flooding (Characters repeated 8 or more times)
const FLOODING_SPAM_REGEX = /(.)\1{7,}|(?:ㅋ{7,}|ㅎ{7,}|ㅠ{7,}|!{7,}|\?{7,}|哈{7,})/;

// 6. Threat / Violence Patterns (KO, EN, ZH-TW)
const THREAT_REGEX = /(?:죽여버|패버린다|가만안둬|죽인다|때려눕|폭행|kill\s+you|beat\s+you\s+up|i\s+will\s+hurt\s+you|我要殺|打死你|揍你|放學後別走)/i;

// 7. Sexual / Hate Speech Patterns (KO, EN, ZH-TW)
const SEXUAL_HATE_REGEX = /(?:변태|음란|성폭력|섹스|야동|성관계|bitch|slut|nigger|faggot|porn|色情|做愛|變態|色狼)/i;

// 8. Profanity & Insults (KO, EN, ZH-TW)
// Word boundary and specific pattern protection to avoid false positives on normal words like "class", "assist", "sheet"
const PROFANITY_KO_REGEX = /(?:씨[바발]|시[바발]|개새끼|지랄|병신|꺼져|닥쳐|엠창|좆|존나|미친놈|미친년|빡대가리|바보|멍청이)/;
const PROFANITY_EN_REGEX = /\b(?:fuck(?:ing|er)?|shit|asshole|bastard|dickhead|cunt|motherfucker|stupid|idiot)\b/i;
const PROFANITY_ZH_REGEX = /(?:幹你娘|操你媽|王八蛋|白痴|智障|笨蛋|賤人|他媽的|靠北|靠腰|機掰)/;

export function checkSafety(text: string, lang: Language = 'ko'): SafetyCheckResult {
  if (!text || !text.trim()) {
    return {
      isClean: true,
      flaggedCategories: [],
      friendlyAdvice: ''
    };
  }

  const flagged: string[] = [];

  // 1. Phone number
  if (PHONE_REGEX.test(text)) {
    flagged.push('전화번호 형식');
  }

  // 2. Email
  if (EMAIL_REGEX.test(text)) {
    flagged.push('이메일 주소');
  }

  // 3. SNS or External Contact
  if (SNS_CONTACT_REGEX.test(text)) {
    flagged.push('SNS 아이디 또는 외부 연락처 공유');
  }

  // 4. Real Name / School PII Pattern
  if (PII_SCHOOL_NAME_REGEX.test(text)) {
    flagged.push('실명·학교명 입력 가능성을 알리는 위험 패턴');
  }

  // 5. Flooding / Spam
  if (FLOODING_SPAM_REGEX.test(text)) {
    flagged.push('반복 도배');
  }

  // 6. Threat / Violence
  if (THREAT_REGEX.test(text)) {
    flagged.push('위협 가능 표현');
  }

  // 7. Sexual / Hate speech
  if (SEXUAL_HATE_REGEX.test(text)) {
    flagged.push('성적·혐오 표현 가능성');
  }

  // 8. Profanity / Insult
  if (PROFANITY_KO_REGEX.test(text) || PROFANITY_EN_REGEX.test(text) || PROFANITY_ZH_REGEX.test(text)) {
    flagged.push('욕설·모욕 가능 표현');
  }

  const isClean = flagged.length === 0;

  let friendlyAdvice = '';
  if (!isClean) {
    if (lang === 'ko') {
      friendlyAdvice = '작성하신 내용에 개인정보(연락처·학교명)나 상대를 불편하게 할 수 있는 표현이 감지되었습니다. 안전하고 따뜻한 교류를 위해 다시 한 번 검토해 주세요.';
    } else if (lang === 'zh-TW') {
      friendlyAdvice = '您輸入的文字可能包含個人聯絡方式、學校名稱或需要再斟酌的表達。為了彼此安全友善的交流，請再次檢視並修改。';
    } else {
      friendlyAdvice = 'Your text may contain personal contact info, school details, or language that needs review. Please check your message for a safe, respectful exchange.';
    }
  }

  return {
    isClean,
    flaggedCategories: flagged,
    friendlyAdvice
  };
}

/**
 * Return user-friendly badge label for flagged category
 */
export function getCategoryBadgeLabel(category: string, lang: Language): string {
  if (lang === 'zh-TW') {
    switch (category) {
      case '전화번호 형식': return '電話號碼格式';
      case '이메일 주소': return '電子郵件地址';
      case 'SNS 아이디 또는 외부 연락처 공유': return '社群帳號/外部聯絡方式';
      case '실명·학교명 입력 가능성을 알리는 위험 패턴': return '姓名/學校可能外流';
      case '반복 도배': return '重複灌水文字';
      case '위협 가능 표현': return '潛在威脅字詞';
      case '성적·혐오 표현 가능성': return '潛在不當/仇恨字詞';
      case '욕설·모욕 가능 표현': return '潛在不雅/侮辱字詞';
      default: return category;
    }
  } else if (lang === 'en') {
    switch (category) {
      case '전화번호 형식': return 'Phone Number Format';
      case '이메일 주소': return 'Email Address';
      case 'SNS 아이디 또는 외부 연락처 공유': return 'SNS / External Contact';
      case '실명·학교명 입력 가능성을 알리는 위험 패턴': return 'Real Name / School Pattern';
      case '반복 도배': return 'Spam Flooding';
      case '위협 가능 표현': return 'Threat Pattern';
      case '성적·혐오 표현 가능성': return 'Sexual / Hate Speech';
      case '욕설·모욕 가능 표현': return 'Profanity / Insult';
      default: return category;
    }
  }
  return category;
}
