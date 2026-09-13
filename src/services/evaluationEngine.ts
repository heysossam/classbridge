import { ComprehensiveStudentEvidence, EvaluationResult, Language } from '../types';

export function generateComprehensiveEvaluation(
  evidence: ComprehensiveStudentEvidence | null,
  lang: Language = 'ko'
): EvaluationResult {
  if (!evidence) {
    return {
      sentence: '학생 활동 데이터가 존재하지 않습니다.',
      competency: '기본 참여',
      reflectionQuestion: '학생의 활동 기록을 확인해 주세요.'
    };
  }

  const { completedActivities, submissions, comments, likesReceivedCount } = evidence;
  const count = completedActivities.length;
  const writingCount = submissions.filter(s => s.type === 'writing').length;
  const qaCount = submissions.filter(s => s.type === 'qa_question' || s.type === 'qa_answer').length;
  const pollCount = submissions.filter(s => s.type === 'poll').length;
  const commentCount = comments.length;

  if (count === 0) {
    if (lang === 'en') {
      return {
        sentence: 'Has not yet completed any joint international activities. Encouragement to participate using sentence frames and structured prompts is recommended.',
        competency: 'Classroom Engagement & Motivation',
        reflectionQuestion: 'Does the student need extra language scaffolding or partner encouragement?'
      };
    } else if (lang === 'zh-TW') {
      return {
        sentence: '尚未完成任何跨國共同教學任務。建議透過句型引導與同儕互動鼓勵其積極參與。',
        competency: '課堂參與與動機',
        reflectionQuestion: '學生是否需要句型鷹架或夥伴的進一步鼓勵？'
      };
    }
    return {
      sentence: '국제공동수업 문화 교류 활동에 아직 참여하지 않아, 영어 문장 틀을 활용한 자기표현 참여를 위한 교사의 추가 격려와 지도가 필요함.',
      competency: '수업 참여 및 자기표현 태도',
      reflectionQuestion: '학생이 영어 문장 구성에 어려움을 겪고 있는지 확인해 볼 필요가 있습니다.'
    };
  }

  // Active multi-activity participant
  if (lang === 'en') {
    let sentence = `Actively participated in ${count} cross-cultural activities including `;
    const parts: string[] = [];
    if (writingCount > 0) parts.push(`cultural self-expression writings (${writingCount})`);
    if (qaCount > 0) parts.push(`bilateral Q&A discussions (${qaCount})`);
    if (pollCount > 0) parts.push(`collaborative preference voting`);
    sentence += parts.join(', ');
    sentence += `. Interacted with partner students through ${commentCount} thoughtful comments, earning ${likesReceivedCount} likes for empathetic and clear English communication.`;

    return {
      sentence,
      competency: 'Global Citizenship & Intercultural Communication',
      reflectionQuestion: 'How consistently does the student apply culturally respectful vocabulary in writing and replies?'
    };
  }

  if (lang === 'zh-TW') {
    let sentence = `積極參與 ${count} 項跨國文化活動，涵蓋`;
    const parts: string[] = [];
    if (writingCount > 0) parts.push(`文化自我表達寫作 (${writingCount}篇)`);
    if (qaCount > 0) parts.push(`雙向提問與解答互動 (${qaCount}次)`);
    if (pollCount > 0) parts.push(`文化偏好票選`);
    sentence += parts.join('、');
    sentence += `。並在同儕作品下留下 ${commentCount} 則具有同理心的互動留言，獲得跨國夥伴 ${likesReceivedCount} 次點讚肯定，展現卓越的英語溝通與文化尊重素養。`;

    return {
      sentence,
      competency: '全球公民素養與跨文化溝通能力',
      reflectionQuestion: '請教師審閱學生在回覆夥伴問題時是否展現真誠的在地生活經驗分享。'
    };
  }

  // Korean (default)
  let sentence = `총 ${count}개의 국제공동수업 활동(`;
  const parts: string[] = [];
  if (writingCount > 0) parts.push(`문화 소개 및 자기표현 글쓰기 ${writingCount}편`);
  if (qaCount > 0) parts.push(`상대국 학생과의 Q&A ${qaCount}회`);
  if (pollCount > 0) parts.push(`선호도 투표`);
  sentence += parts.join(', ');
  sentence += `)에 성실히 참여함. 상대국 친구들의 글에 ${commentCount}개의 배려 깊은 댓글을 남기고 ${likesReceivedCount}회의 공감(좋아요)을 얻으며, 문화적 차이를 긍정적으로 탐구하고 영어로 자신의 생각과 질문을 조리 있게 전달함.`;

  return {
    sentence,
    competency: '의사소통 역량 및 문화다양성 존중',
    reflectionQuestion: '학생의 활동 기록을 확인하시고, 실제 수업 중 보여준 태도와 협업 노력을 덧붙여 수정해 주세요.'
  };
}
