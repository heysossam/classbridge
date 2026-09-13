import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Send, Heart, MessageSquare, CheckCircle2, Edit2, 
  Clock, AlertCircle, BarChart2, MessageCircleQuestion, FileText, Trash2, Check,
  ShieldAlert, ShieldCheck, PenTool, ClipboardX, Info
} from 'lucide-react';
import { Language, StudentMembership, Activity, Submission, Comment, TeacherFeedback } from '../../types';
import { getTranslation, getLocalizedActivityContent } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { checkSafety, getCategoryBadgeLabel } from '../../services/safetyModeration';
import { 
  WritingLanguage, 
  countWritingContent, 
  formatContentCountDisplay, 
  getRecommendedLimits, 
  getUnitLabel 
} from '../../services/textCounter';

interface UniversalActivityViewProps {
  currentLang: Language;
  student: StudentMembership;
  activity: Activity;
  onBack: () => void;
}

export const UniversalActivityView: React.FC<UniversalActivityViewProps> = ({
  currentLang,
  student,
  activity,
  onBack,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  // Submissions and comments state
  const [submissions, setSubmissions] = useState<Submission[]>(dataService.getSubmissions(activity.id));
  const [allComments, setAllComments] = useState<Comment[]>(dataService.getComments());

  // Form State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [writingLang, setWritingLang] = useState<WritingLanguage>(
    student.partnerSide === 'Taiwan Class' ? 'zh-TW' : 'ko'
  );
  const [translationEn, setTranslationEn] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<string>('');
  const [formError, setFormError] = useState('');

  // Independent Writing Mode & Metrics (Requirement 8)
  const isIndependentWritingMode = activity.type === 'writing' && 
    (activity.independentWritingMode !== false) && 
    !activity.allowPasteAccessibility;

  const [writingStartTime, setWritingStartTime] = useState<string>('');
  const [pasteAttempts, setPasteAttempts] = useState<number>(0);
  const [pasteWarningNotice, setPasteWarningNotice] = useState<string>('');
  const [selectedAssistance, setSelectedAssistance] = useState<string[]>(['direct_thought']);

  // Real-Time 3-Language Safety Notice (Requirement 5)
  const [safetyNotice, setSafetyNotice] = useState<{ isClean: boolean; categories: string[]; friendlyAdvice?: string }>({ 
    isClean: true, 
    categories: [] 
  });

  // Editing Submission State
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Comment input per submission
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [subViewModes, setSubViewModes] = useState<Record<string, 'original' | 'translation'>>({});

  // QA Question Answer target
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState('');

  const mySubmissions = submissions.filter(
    s => s.membershipId === student.id || s.participantCode.toUpperCase() === student.participantCode.toUpperCase()
  );

  const canSubmitMore = mySubmissions.length < activity.submissionLimit;

  // Real-time safety check on input change (non-punitive gentle advice)
  useEffect(() => {
    const combined = `${postTitle} ${postContent} ${translationEn}`.trim();
    if (!combined) {
      setSafetyNotice({ isClean: true, categories: [] });
      return;
    }
    const result = checkSafety(combined, writingLang);
    setSafetyNotice({
      isClean: result.isClean,
      categories: result.flaggedCategories,
      friendlyAdvice: result.friendlyAdvice
    });
  }, [postContent, postTitle, translationEn, writingLang]);

  // Track start time on first input
  const handleContentChange = (val: string) => {
    if (!writingStartTime && val.trim().length > 0) {
      setWritingStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    setPostContent(val);
  };

  // Paste / Drop Interceptor for Independent Writing Mode
  const handlePasteBlock = (e: React.ClipboardEvent | React.DragEvent | any) => {
    if (isIndependentWritingMode) {
      e.preventDefault();
      setPasteAttempts(prev => prev + 1);
      setPasteWarningNotice('이 활동은 스스로 문장을 만들어 보는 활동이에요. 필요한 경우 선생님께 붙여넣기 허용을 요청하세요.');
      setTimeout(() => {
        setPasteWarningNotice(prev => prev === '이 활동은 스스로 문장을 만들어 보는 활동이에요. 필요한 경우 선생님께 붙여넣기 허용을 요청하세요.' ? '' : prev);
      }, 7000);
    }
  };

  // Beforeinput interceptor (mobile & browser contextual paste/drop)
  const handleBeforeInput = (e: any) => {
    if (isIndependentWritingMode) {
      if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') {
        e.preventDefault();
        handlePasteBlock(e);
      }
    }
  };

  // Filter submissions by activity visibility scope
  const visibleSubmissions = submissions.filter(sub => {
    const isMine = sub.participantCode.toUpperCase() === student.participantCode.toUpperCase();

    if (activity.visibility === 'author_and_teacher') {
      return isMine;
    }
    if (activity.visibility === 'my_class') {
      return sub.partnerSide === student.partnerSide;
    }
    if (activity.visibility === 'teachers_only') {
      return false;
    }
    return true;
  });

  // Insert Sentence Frame into content
  const handleInsertFrame = (frame: string) => {
    setSelectedFrame(frame);
    if (!postContent.includes(frame.replace('___', ''))) {
      const updated = postContent ? `${postContent} ${frame}` : frame;
      setPostContent(updated);
      if (!writingStartTime) {
        setWritingStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }
  };

  // Poll option toggle
  const handleOptionToggle = (optId: string) => {
    if (activity.pollConfig?.allowMultipleChoices) {
      if (selectedOptions.includes(optId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optId));
      } else {
        setSelectedOptions([...selectedOptions, optId]);
      }
    } else {
      setSelectedOptions([optId]);
    }
  };

  // Handle Main Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!canSubmitMore) {
      setFormError(`제출 제한(${activity.submissionLimit}개)에 도달했습니다.`);
      return;
    }

    if (activity.type === 'poll') {
      if (selectedOptions.length === 0) {
        setFormError(currentLang === 'ko' ? '최소 1개의 선택지를 골라주세요.' : 'Please select at least one option.');
        return;
      }
      if (activity.pollConfig?.requireReason && !postContent.trim()) {
        setFormError(currentLang === 'ko' ? '선택 이유를 작성해 주세요.' : 'Please write your reason.');
        return;
      }
    } else {
      if (!postContent.trim()) {
        setFormError(currentLang === 'ko' ? '내용을 작성해 주세요.' : 'Please enter content.');
        return;
      }

      // Requirement 1: 언어별 분량 계산 (본문만 계산, 제목·번역문 제외)
      const currentCount = countWritingContent(postContent, writingLang);
      const { min: recMin, max: recMax } = getRecommendedLimits(writingLang, activity.minWordCount, activity.maxWordCount);
      const unit = getUnitLabel(writingLang);

      if (activity.minWordCount && currentCount < recMin) {
        setFormError(`최소 ${recMin}${unit} 이상 작성해 주세요. (현재: ${currentCount}${unit})`);
        return;
      }
      if (activity.maxWordCount && currentCount > recMax) {
        setFormError(`최대 ${recMax}${unit} 이하로 작성해 주세요. (현재: ${currentCount}${unit})`);
        return;
      }
    }

    const safetyCheck = checkSafety(`${postTitle} ${postContent} ${translationEn}`.trim(), writingLang);

    dataService.createSubmission({
      activityId: activity.id,
      membershipId: student.id,
      participantCode: student.participantCode,
      englishNickname: student.englishNickname,
      partnerSide: student.partnerSide,
      type: activity.type === 'qa' ? 'qa_question' : activity.type,
      title: postTitle.trim() || undefined,
      content: postContent.trim(),
      translationEn: translationEn.trim() || undefined,
      selectedOptions: activity.type === 'poll' ? selectedOptions : undefined,
      language: writingLang,
      writingStartTime: writingStartTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pasteAttemptsCount: pasteAttempts,
      assistanceDeclaration: selectedAssistance,
      detectedCategories: safetyCheck.flaggedCategories
    });

    setPostTitle('');
    setPostContent('');
    setTranslationEn('');
    setSelectedOptions([]);
    setWritingStartTime('');
    setPasteAttempts(0);
    setPasteWarningNotice('');
    setSelectedAssistance(['direct_thought']);
    setSubmissions(dataService.getSubmissions(activity.id));
  };

  // QA Answer Submit
  const handleAnswerSubmit = (questionId: string) => {
    if (!answerContent.trim()) return;

    // Check respondentScope
    if (activity.qaConfig?.respondentScope === 'partner_only') {
      const q = submissions.find(s => s.id === questionId);
      if (q && q.partnerSide === student.partnerSide) {
        alert(currentLang === 'ko' ? '상대국 학생 질문에만 답변할 수 있습니다.' : 'Only partner students can reply to this question.');
        return;
      }
    }

    dataService.createSubmission({
      activityId: activity.id,
      membershipId: student.id,
      participantCode: student.participantCode,
      englishNickname: student.englishNickname,
      partnerSide: student.partnerSide,
      type: 'qa_answer',
      content: answerContent.trim(),
      parentQuestionId: questionId,
      language: 'en'
    });

    setAnsweringQuestionId(null);
    setAnswerContent('');
    setSubmissions(dataService.getSubmissions(activity.id));
  };

  // Like Toggle
  const handleLike = (subId: string) => {
    dataService.toggleLike(subId, student.participantCode);
    setSubmissions(dataService.getSubmissions(activity.id));
  };

  // Comment Add
  const handleAddComment = (subId: string) => {
    const text = commentInputs[subId];
    if (!text || !text.trim()) return;

    const safetyCheck = checkSafety(text.trim());

    dataService.addComment({
      submissionId: subId,
      activityId: activity.id,
      membershipId: student.id,
      participantCode: student.participantCode,
      englishNickname: student.englishNickname,
      partnerSide: student.partnerSide,
      content: text.trim(),
      detectedCategories: safetyCheck.flaggedCategories
    });

    setCommentInputs({ ...commentInputs, [subId]: '' });
    setAllComments(dataService.getComments());
  };

  // Submission Edit
  const handleSaveEditSub = (subId: string) => {
    const res = dataService.updateSubmission(subId, { content: editContent.trim() }, student.participantCode);
    if (!res.success) {
      alert(res.message || '과제물을 수정할 수 없습니다.');
      return;
    }
    setEditingSubId(null);
    setSubmissions(dataService.getSubmissions(activity.id));
  };

  const localizedContent = getLocalizedActivityContent(activity, currentLang);

  // Poll options filtering for student side
  const pollOptions = activity.pollConfig?.options.filter(
    opt => !opt.targetSide || opt.targetSide === 'Both' || opt.targetSide === student.partnerSide
  ) || [];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} />
          <span>{currentLang === 'ko' ? '활동 목록으로' : currentLang === 'zh-TW' ? '返回活動清單' : 'Back to Activities'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{student.englishNickname}</span>
          <span className="badge badge-neutral">Code: {student.participantCode}</span>
          <span className={`badge ${student.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`}>
            {student.partnerSide === 'Korea Class' ? '🇰🇷 Korea' : '🇹🇼 Taiwan'}
          </span>
        </div>
      </div>

      {/* Activity Header Card */}
      <div className="cb-card" style={{ marginBottom: '24px', borderTop: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{activity.type}</span>
          <span className={`badge ${activity.isRequired ? 'badge-accent' : 'badge-neutral'}`}>
            {activity.isRequired 
              ? (currentLang === 'ko' ? '필수' : currentLang === 'zh-TW' ? '必修' : 'Required')
              : (currentLang === 'ko' ? '선택' : currentLang === 'zh-TW' ? '選修' : 'Elective')}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {currentLang === 'ko' ? '마감일' : currentLang === 'zh-TW' ? '截止日' : 'Due'}: {activity.dueDate}
          </span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
          {localizedContent.title}
        </h1>

        {localizedContent.isFallback && localizedContent.fallbackNotice && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFBEB', color: '#B45309', padding: '4px 10px', borderRadius: 'var(--radius-xs)', fontSize: '0.78rem', marginBottom: '10px' }}>
            <AlertCircle size={14} />
            <span>{localizedContent.fallbackNotice}</span>
          </div>
        )}

        <p style={{ color: 'var(--color-text)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {localizedContent.instructions}
        </p>
      </div>

      {/* Sentence Frames Helper */}
      {activity.sentenceFrames && activity.sentenceFrames.length > 0 && (
        <div className="cb-card" style={{ marginBottom: '24px', background: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '10px' }}>
            {currentLang === 'ko' ? '💡 영어 문장 틀 (클릭하여 본문에 삽입):' : '💡 English Sentence Frames:'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {activity.sentenceFrames.map(sf => (
              <button
                key={sf.id}
                type="button"
                onClick={() => handleInsertFrame(sf.frame)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: '1px solid var(--color-border)',
                  background: '#fff',
                  color: 'var(--color-primary)',
                  cursor: 'pointer'
                }}
              >
                {sf.frame}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submission Form (If allowed) */}
      {canSubmitMore && (
        <div className="cb-card" style={{ marginBottom: '32px', border: '2px solid var(--color-secondary-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
              {activity.type === 'poll' ? (currentLang === 'ko' ? '투표 참여 및 이유 작성' : 'Cast Your Vote') :
               activity.type === 'qa' ? (currentLang === 'ko' ? '상대국 친구에게 질문 등록' : 'Ask a Question') :
               (currentLang === 'ko' ? '나의 글 작성하기' : 'Write Submission')}
            </h3>

            {isIndependentWritingMode && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 'var(--radius-xs)', padding: '3px 8px', fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                <PenTool size={12} />
                <span>스스로 쓰기 모드 적용</span>
              </span>
            )}
          </div>

          {/* Paste Attempt Warning Notice (Requirement 8: 비난하지 않는 부드러운 안내) */}
          {pasteWarningNotice && (
            <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: '#92400E', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ClipboardX size={18} color="#D97706" style={{ flexShrink: 0 }} />
              <span>{pasteWarningNotice}</span>
            </div>
          )}

          {/* Real-Time Safety Guidance Banner (Requirement 5: 자동 처벌/낙인 없는 부드러운 재검토 안내) */}
          {!safetyNotice.isClean && safetyNotice.friendlyAdvice && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: '#991B1B', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
              <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>따뜻한 배려 안내: </strong>
                <span>{safetyNotice.friendlyAdvice}</span>
                <div style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '3px' }}>
                  ※ 입력하신 내용은 교사의 안전 확인을 거친 후 친구들에게 공유됩니다.
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div style={{ background: '#FDF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#B91C1C', fontSize: '0.85rem', fontWeight: 600, marginBottom: '14px' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Poll Options Grid */}
            {activity.type === 'poll' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>
                  {currentLang === 'ko' ? '선택지를 골라주세요:' : currentLang === 'zh-TW' ? '請選擇選項：' : 'Choose your option:'}
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '8px' }}>
                  ※ {t('activity.teacherMockImageNotice')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {pollOptions.map(opt => {
                    const isSelected = selectedOptions.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleOptionToggle(opt.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          background: isSelected ? 'var(--color-accent-soft)' : '#fff',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{opt.text}</span>
                        {isSelected && <CheckCircle2 size={18} color="var(--color-accent)" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Title for Writing */}
            {activity.type === 'writing' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  {currentLang === 'ko' ? '제목 (선택 사항)' : 'Title (Optional)'}
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => {
                    if (!writingStartTime && e.target.value.trim().length > 0) {
                      setWritingStartTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    }
                    setPostTitle(e.target.value);
                  }}
                  onPaste={handlePasteBlock}
                  onDrop={handlePasteBlock}
                  onBeforeInput={handleBeforeInput}
                  placeholder="예: My Favorite Spot in Seoul"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                />
              </div>
            )}

            {/* Writing Language Selector (Requirement 1: UI 언어와 학생 작성 언어 분리) */}
            <div style={{ marginBottom: '14px', background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {currentLang === 'ko' ? '작성 언어' : currentLang === 'zh-TW' ? '書寫語言' : 'Writing Language'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['en', 'ko', 'zh-TW'] as WritingLanguage[]).map((lang) => {
                    const isSelected = writingLang === lang;
                    const label = lang === 'en' ? 'English' : lang === 'ko' ? '한국어' : '繁體中文';
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setWritingLang(lang)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 700 : 500,
                          borderRadius: 'var(--radius-xs)',
                          border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: isSelected ? 'var(--color-primary)' : '#fff',
                          color: isSelected ? '#fff' : 'var(--color-text)',
                          cursor: 'pointer',
                          transition: 'background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease'
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {activity.type === 'poll' ? (currentLang === 'ko' ? '선택 이유 (작성 언어)' : 'Reason') : (currentLang === 'ko' ? '본문' : 'Content')}
                </label>
                {/* 언어별 분량 표기 (본문만 계산, 권장 분량 고정) */}
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {formatContentCountDisplay(
                    countWritingContent(postContent, writingLang),
                    writingLang,
                    currentLang,
                    activity.minWordCount,
                    activity.maxWordCount
                  )}
                </span>
              </div>
              <textarea
                value={postContent}
                onChange={(e) => handleContentChange(e.target.value)}
                onPaste={handlePasteBlock}
                onDrop={handlePasteBlock}
                onBeforeInput={handleBeforeInput}
                rows={4}
                placeholder={
                  writingLang === 'en' ? 'Write in English...' :
                  writingLang === 'zh-TW' ? '請用繁體中文書寫...' :
                  '한국어로 작성하세요. 문장 틀 칩을 누르면 자동으로 추가됩니다.'
                }
                style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem', lineHeight: 1.5 }}
              />
            </div>

            {/* Optional English Translation */}
            {activity.type === 'writing' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  {currentLang === 'ko' ? '영어 번역문 (선택 사항)' : 'English Translation (Optional)'}
                </label>
                <textarea
                  value={translationEn}
                  onChange={(e) => setTranslationEn(e.target.value)}
                  onPaste={handlePasteBlock}
                  onDrop={handlePasteBlock}
                  onBeforeInput={handleBeforeInput}
                  rows={2}
                  placeholder="상대국 친구들을 위한 영문 설명이 있다면 적어보세요..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                />
              </div>
            )}

            {/* Student Self-Declaration Checklist (Requirement 8: 도움 도구 사용 표시) */}
            {activity.type === 'writing' && activity.requireAssistanceDeclaration !== false && (
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                  ✍️ 이 글을 작성할 때 도움받은 방법을 선택해 주세요:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'direct_thought', label: '내 생각으로 직접 작성함' },
                    { id: 'sentence_frames', label: '수업에서 제공한 문장 틀을 활용함' },
                    { id: 'dictionary_translation', label: '사전 또는 번역기의 도움을 받음' },
                    { id: 'generative_ai', label: '생성형 AI의 도움을 받음' },
                    { id: 'teacher_peer', label: '교사 또는 친구의 도움을 받음' },
                  ].map((item) => {
                    const isChecked = selectedAssistance.includes(item.id);
                    return (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssistance([...selectedAssistance, item.id]);
                            } else {
                              setSelectedAssistance(selectedAssistance.filter(id => id !== item.id));
                            }
                          }}
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  ※ 도움 도구를 사용했다고 해서 감점되지 않으며, 솔직한 자기표시는 선생님의 맞춤 지도에 큰 도움이 됩니다.
                </div>
              </div>
            )}

            <button type="submit" className="btn-accent" style={{ alignSelf: 'flex-end', padding: '12px 24px', fontSize: '0.95rem' }}>
              <Send size={16} />
              <span>{currentLang === 'ko' ? '제출하기' : 'Submit'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Submissions Feed */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '16px' }}>
          {currentLang === 'ko' ? '친구들의 활동 기록' : currentLang === 'zh-TW' ? '同儕活動成果' : 'Classroom Feed'} ({visibleSubmissions.length})
        </h3>

        {activity.visibility === 'teachers_only' ? (
          <div className="cb-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
            {currentLang === 'ko' && '본 활동은 양국 교사만 열람할 수 있도록 설정되어 있습니다.'}
            {currentLang === 'en' && 'This activity is configured to be viewable by teachers only.'}
            {currentLang === 'zh-TW' && '此活動目前設定為僅限兩國教師查閱。'}
          </div>
        ) : visibleSubmissions.length === 0 ? (
          <div className="cb-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
            {currentLang === 'ko' && '아직 제출된 글이 없습니다. 첫 번째로 소중한 의견을 공유해 보세요!'}
            {currentLang === 'en' && 'No submissions yet. Be the first to share your thoughts!'}
            {currentLang === 'zh-TW' && '尚未有繳交之作品。歡迎搶先發表您的第一則意見！'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {visibleSubmissions.map(sub => {
              const isMine = sub.participantCode.toUpperCase() === student.participantCode.toUpperCase();
              const isMaskedForOther = (sub.isHidden || sub.moderationStatus === 'needs_review' || (activity.requireApproval && !sub.isApproved)) && !isMine;
              const isPendingForAuthor = (sub.isHidden || sub.moderationStatus === 'needs_review' || (activity.requireApproval && !sub.isApproved)) && isMine;
              const teacherFeedback = dataService.getTeacherFeedback(sub.id);
              const subComments = allComments.filter(c => c.submissionId === sub.id && !c.isDeleted);
              const isLikedByMe = sub.likedBy.includes(student.participantCode.toUpperCase());

              // For QA answer, show linked question
              const parentQ = sub.parentQuestionId ? submissions.find(q => q.id === sub.parentQuestionId) : null;

              return (
                <div key={sub.id} className="cb-card" style={{ border: isMine ? '2px solid var(--color-accent)' : '1px solid var(--color-border-light)' }}>
                  {/* Post Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem' }}>
                        {sub.englishNickname}
                      </span>
                      <span className={`badge ${sub.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`} style={{ fontSize: '0.72rem' }}>
                        {sub.partnerSide === 'Korea Class' ? '🇰🇷 KR' : '🇹🇼 TW'}
                      </span>
                      {isMine && (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>내 글</span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      {sub.submittedAt}
                    </span>
                  </div>

                  {/* Pending review badge for author (Requirement 4 & 5) */}
                  {isPendingForAuthor && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 'var(--radius-xs)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '8px' }}>
                      <ShieldAlert size={14} />
                      <span>선생님 확인 중인 글입니다. (검토 완료 후 친구들에게 안전하게 공개됩니다)</span>
                    </div>
                  )}

                  {/* Masked Content for Other Students (Requirement 4: 일반 학생에게 원문 노출 차단) */}
                  {isMaskedForOther ? (
                    <div style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                      <ShieldAlert size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>이 글은 안전한 교류를 위해 교사가 확인하고 있습니다.</span>
                    </div>
                  ) : (
                    <>
                      {/* QA Link notice */}
                      {sub.type === 'qa_answer' && parentQ && (
                        <div style={{ background: 'var(--bg-subtle)', padding: '6px 10px', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                          ↳ <strong>{parentQ.englishNickname}</strong>의 질문에 대한 답변: "{parentQ.content}"
                        </div>
                      )}

                      {/* Poll Option Tag */}
                      {sub.selectedOptions && sub.selectedOptions.length > 0 && (
                        <div style={{ marginBottom: '6px' }}>
                          {sub.selectedOptions.map(optId => {
                            const opt = activity.pollConfig?.options.find(o => o.id === optId);
                            return (
                              <span key={optId} className="badge badge-accent" style={{ fontSize: '0.78rem', marginRight: '6px' }}>
                                선택: {opt ? opt.text : optId}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Post Title */}
                      {sub.title && (
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
                          {sub.title}
                        </h4>
                      )}

                      {/* Post Content or Edit Mode */}
                      {editingSubId === sub.id ? (
                        <div style={{ marginBottom: '10px' }}>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.92rem' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                            <button onClick={() => setEditingSubId(null)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>취소</button>
                            <button onClick={() => handleSaveEditSub(sub.id)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>수정 완료</button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.92rem', color: 'var(--color-text)', lineHeight: 1.5, marginBottom: '8px' }}>
                          {sub.content}
                        </p>
                      )}

                      {/* English Translation Toggle */}
                      {sub.translationEn && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setSubViewModes(prev => ({ ...prev, [sub.id]: 'original' }))}
                              className="btn-outline"
                              style={{
                                padding: '3px 8px', fontSize: '0.72rem',
                                background: subViewModes[sub.id] !== 'translation' ? 'var(--color-primary)' : 'transparent',
                                color: subViewModes[sub.id] !== 'translation' ? '#fff' : 'var(--color-text)'
                              }}
                            >
                              {t('submissionDetail.viewOriginal')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSubViewModes(prev => ({ ...prev, [sub.id]: 'translation' }))}
                              className="btn-outline"
                              style={{
                                padding: '3px 8px', fontSize: '0.72rem',
                                background: subViewModes[sub.id] === 'translation' ? 'var(--color-secondary)' : 'transparent',
                                color: subViewModes[sub.id] === 'translation' ? '#fff' : 'var(--color-text)'
                              }}
                            >
                              {t('submissionDetail.viewTranslation')}
                            </button>
                          </div>

                          {subViewModes[sub.id] === 'translation' && (
                            <div style={{ background: '#FAF9F5', padding: '8px 12px', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', border: '1px solid var(--color-border-light)' }}>
                              Eng: "{sub.translationEn}"
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Teacher Feedback Card (Requirement 3: 작성 본인에게만 공개, 다른 학생 열람 불가) */}
                  {isMine && teacherFeedback && teacherFeedback.isPublished && (
                    <div style={{
                      marginTop: '12px',
                      marginBottom: '10px',
                      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                      border: '1px solid #86EFAC',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#166534', fontSize: '0.85rem' }}>
                          <MessageSquare size={15} />
                          <span>선생님 피드백</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#15803D' }}>{teacherFeedback.updatedAt}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#14532D', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {teacherFeedback.content}
                      </p>
                    </div>
                  )}

                  {/* Post Actions Bar (Only if not masked for others) */}
                  {!isMaskedForOther && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Like Button */}
                        {activity.allowLikes && (
                          <button
                            onClick={() => handleLike(sub.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: isLikedByMe ? 'var(--color-accent)' : 'var(--color-text-muted)',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            <Heart size={16} fill={isLikedByMe ? 'currentColor' : 'none'} />
                            <span>{sub.likesCount}</span>
                          </button>
                        )}

                        {/* Comments count */}
                        {activity.allowComments && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            <MessageSquare size={16} />
                            <span>{subComments.length}</span>
                          </div>
                        )}

                        {/* QA Reply button */}
                        {activity.type === 'qa' && sub.type === 'qa_question' && (
                          <button
                            onClick={() => setAnsweringQuestionId(answeringQuestionId === sub.id ? null : sub.id)}
                            className="btn-outline"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          >
                            답변 작성하기
                          </button>
                        )}
                      </div>

                      {/* Own Post Edit Button */}
                      {isMine && activity.allowEdit && editingSubId !== sub.id && (
                        <button
                          onClick={() => { setEditingSubId(sub.id); setEditContent(sub.content); }}
                          className="btn-outline"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit2 size={13} />
                          <span>수정</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* QA Answer Input Box */}
                  {!isMaskedForOther && answeringQuestionId === sub.id && (
                    <div style={{ marginTop: '12px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                        {sub.englishNickname}의 질문에 답변 작성:
                      </div>
                      <textarea
                        value={answerContent}
                        onChange={(e) => setAnswerContent(e.target.value)}
                        rows={2}
                        placeholder="친절하고 구체적인 답변을 영어로 작성해 보세요..."
                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                        <button onClick={() => setAnsweringQuestionId(null)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.78rem' }}>취소</button>
                        <button onClick={() => handleAnswerSubmit(sub.id)} className="btn-accent" style={{ padding: '4px 12px', fontSize: '0.78rem' }}>답변 등록</button>
                      </div>
                    </div>
                  )}

                  {/* Comments Section (Only if not masked for others) */}
                  {!isMaskedForOther && activity.allowComments && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--color-border-light)' }}>
                      {/* Comments List */}
                      {subComments.map(c => {
                        const isMyComment = c.participantCode.toUpperCase() === student.participantCode.toUpperCase();
                        const isCommentMasked = (c.isHidden || c.moderationStatus === 'needs_review') && !isMyComment;

                        if (isCommentMasked) {
                          return (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 0', fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              <ShieldAlert size={13} color="#94A3B8" />
                              <span>이 댓글은 안전한 교류를 위해 교사가 확인하고 있습니다.</span>
                            </div>
                          );
                        }

                        return (
                          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', fontSize: '0.85rem' }}>
                            <div>
                              <span style={{ fontWeight: 700, color: 'var(--color-primary)', marginRight: '6px' }}>
                                {c.englishNickname} ({c.partnerSide === 'Korea Class' ? 'KR' : 'TW'}):
                              </span>
                              {editingCommentId === c.id ? (
                                <span style={{ display: 'inline-flex', gap: '4px' }}>
                                  <input
                                    type="text"
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    style={{ padding: '2px 6px', fontSize: '0.82rem' }}
                                  />
                                  <button onClick={() => { dataService.updateComment(c.id, editCommentText); setEditingCommentId(null); setAllComments(dataService.getComments()); }}>완료</button>
                                </span>
                              ) : (
                                <span>{c.content}</span>
                              )}
                              {isMyComment && (c.isHidden || c.moderationStatus === 'needs_review') && (
                                <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#D97706', fontWeight: 600 }}>
                                  (교사 검토 중)
                                </span>
                              )}
                            </div>

                            {isMyComment && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }}
                                  style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => { dataService.deleteComment(c.id); setAllComments(dataService.getComments()); }}
                                  style={{ color: '#EF4444', fontSize: '0.75rem' }}
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Comment Input */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <input
                          type="text"
                          value={commentInputs[sub.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [sub.id]: e.target.value })}
                          placeholder="따뜻한 응원이나 추천 댓글을 남겨보세요..."
                          style={{ flex: 1, padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                        />
                        <button
                          onClick={() => handleAddComment(sub.id)}
                          className="btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        >
                          댓글
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };
