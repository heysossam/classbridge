import { StudentResponse, EvaluationResult, Language } from '../types';

export function generateEvaluationStatement(
  response: StudentResponse | undefined,
  lang: Language = 'ko'
): EvaluationResult {
  if (!response) {
    if (lang === 'en') {
      return {
        sentence: 'Has not yet submitted the international exchange activity; needs teacher encouragement to participate in English-based cultural sharing.',
        competency: 'Participation & Engagement',
        reflectionQuestion: 'Did the student require extra guidance to use the sentence frames?'
      };
    } else if (lang === 'zh-TW') {
      return {
        sentence: '尚未完成跨國文化交流任務，建議給予適度引導以鼓勵參與英文意見表達。',
        competency: '參與與表達態度',
        reflectionQuestion: '是否需要協助學生理解句型框架？'
      };
    }
    return {
      sentence: '국제공동수업 문화 교류 활동에 아직 참여하지 않아, 영어 문장 틀을 활용한 자기표현 참여를 위한 교사의 추가 격려와 지도가 필요함.',
      competency: '수업 참여 및 자기표현 태도',
      reflectionQuestion: '학생이 영어 문장 구성에 어려움을 겪고 있는지 확인해 볼 필요가 있습니다.'
    };
  }

  const { selectedOption, sentenceFrame, userReason } = response;
  const isQuestion = sentenceFrame.includes('question');
  const isSuggestion = sentenceFrame.includes('suggestion');
  const isDesire = sentenceFrame.includes('would like');

  if (lang === 'en') {
    let statement = '';
    let competency = 'Intercultural Communication & English Literacy';

    if (isQuestion) {
      statement = `Actively raised a thoughtful cultural inquiry ("${userReason}") regarding ${selectedOption}, demonstrating curiosity and respect for the partner classroom's perspective.`;
      competency = 'Global Citizenship & Cultural Inquiry';
    } else if (isSuggestion) {
      statement = `Constructively proposed a creative idea ("${userReason}") for ${selectedOption}, actively contributing to collaborative cross-cultural decision making.`;
      competency = 'Creative Problem Solving & Collaboration';
    } else if (isDesire) {
      statement = `Expressed personal preference and expectations ("${userReason}") in natural English using structured sentence frames, showing high interest in bilateral friendship.`;
      competency = 'Expressive Language Use & Cultural Empathy';
    } else {
      statement = `Clearly articulated reasons for choosing ${selectedOption} using structured English frames ("${userReason}"), demonstrating thoughtful intercultural understanding and positive participation.`;
      competency = 'Intercultural Communication & Critical Thinking';
    }

    return {
      sentence: statement,
      competency,
      reflectionQuestion: 'Does this statement accurately reflect the student’s classroom growth?'
    };
  }

  if (lang === 'zh-TW') {
    let statement = '';
    let competency = '跨文化溝通與英語素養';

    if (isQuestion) {
      statement = `主動針對${selectedOption}提出深具文化思考的問題（"${userReason}"），展現對夥伴國家同儕觀點的好奇與尊重。`;
      competency = '全球公民素養與文化探究';
    } else if (isSuggestion) {
      statement = `運用結構化英文句型，針對${selectedOption}提出富有創意的具體建議（"${userReason}"），積極促進雙邊班級的合作與共識形成。`;
      competency = '合作解決問題與溝通素養';
    } else {
      statement = `善用英語句型框架清楚說明選擇${selectedOption}之原因（"${userReason}"），在跨國文化交流中展現同理心與認真參與之學習態度。`;
      competency = '跨文化表達與同理心';
    }

    return {
      sentence: statement,
      competency,
      reflectionQuestion: '請確認該評語是否切合學生的課堂實況表現。'
    };
  }

  // Korean (default)
  let statement = '';
  let competency = '의사소통 역량 및 문화다양성 존중';

  if (isQuestion) {
    statement = `상대국 학생에게 문화적 호기심을 담은 질문("${userReason}")을 영어 문장 틀을 활용해 정중하게 표현하고, 상대 문화에 대한 깊이 있는 탐구 의지를 보임.`;
    competency = '문화 탐구 및 적극적 상호작용';
  } else if (isSuggestion) {
    statement = `공동 기념품인 ${selectedOption}에 대한 창의적인 제안("${userReason}")을 영어로 조리 있게 설명하며, 양국 학급 간 협력적 의사결정에 적극적으로 기여함.`;
    competency = '창의적 문제해결 및 공동체 협력';
  } else if (isDesire) {
    statement = `자신이 희망하는 문화 교류 결과물(${selectedOption})에 대한 기대와 이유("${userReason}")를 영어 문장 틀을 통해 자연스럽게 전달하며 친밀감을 형성함.`;
    competency = '자기표현 및 문화적 공감대 형성';
  } else {
    statement = `상대국 학생에게 자신의 선호(${selectedOption})와 그 이유("${userReason}")를 영어 문장 틀을 바탕으로 충실히 표현하고, 문화적 차이를 긍정적으로 수용하며 성실하게 활동에 참여함.`;
    competency = '글로벌 시민성 및 기초 의사소통';
  }

  return {
    sentence: statement,
    competency,
    reflectionQuestion: '학생의 실제 영어 사용 노력과 태도를 반영하여 필요한 단어를 교사가 가감해 주세요.'
  };
}
