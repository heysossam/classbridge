import React, { useState } from 'react';
import { 
  ArrowLeft, Send, Heart, MessageSquare, CheckCircle2, Edit2, 
  Clock, AlertCircle, BarChart2, MessageCircleQuestion, FileText, Trash2, Check
} from 'lucide-react';
import { Language, StudentMembership, Activity, Submission, Comment } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';

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
  const [translationEn, setTranslationEn] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<string>('');
  const [formError, setFormError] = useState('');

  // Editing Submission State
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Comment input per submission
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // QA Question Answer target
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState('');

  const mySubmissions = submissions.filter(
    s => s.membershipId === student.id || s.participantCode.toUpperCase() === student.participantCode.toUpperCase()
  );

  const canSubmitMore = mySubmissions.length < activity.submissionLimit;

  // Insert Sentence Frame into content
  const handleInsertFrame = (frame: string) => {
    setSelectedFrame(frame);
    if (!postContent.includes(frame.replace('___', ''))) {
      setPostContent(prev => prev ? `${prev} ${frame}` : frame);
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
      const wordCount = postContent.trim().split(/\s+/).length;
      if (activity.minWordCount && wordCount < activity.minWordCount) {
        setFormError(`최소 ${activity.minWordCount}단어 이상 작성해 주세요. (현재: ${wordCount}단어)`);
        return;
      }
      if (activity.maxWordCount && wordCount > activity.maxWordCount) {
        setFormError(`최대 ${activity.maxWordCount}단어 이하로 작성해 주세요. (현재: ${wordCount}단어)`);
        return;
      }
    }

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
      language: 'en'
    });

    setPostTitle('');
    setPostContent('');
    setTranslationEn('');
    setSelectedOptions([]);
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

    dataService.addComment({
      submissionId: subId,
      activityId: activity.id,
      membershipId: student.id,
      participantCode: student.participantCode,
      englishNickname: student.englishNickname,
      partnerSide: student.partnerSide,
      content: text.trim()
    });

    setCommentInputs({ ...commentInputs, [subId]: '' });
    setAllComments(dataService.getComments());
  };

  // Submission Edit
  const handleSaveEditSub = (subId: string) => {
    dataService.updateSubmission(subId, { content: editContent.trim() });
    setEditingSubId(null);
    setSubmissions(dataService.getSubmissions(activity.id));
  };

  // Get instructions
  const getInstructions = () => {
    if (currentLang === 'zh-TW' && activity.instructionsZh) return activity.instructionsZh;
    if (currentLang === 'en' && activity.instructionsEn) return activity.instructionsEn;
    return activity.instructionsKo || activity.instructionsEn;
  };

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
          <span>{currentLang === 'ko' ? '활동 목록으로' : 'Back to Activities'}</span>
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{activity.type}</span>
          <span className={`badge ${activity.isRequired ? 'badge-accent' : 'badge-neutral'}`}>
            {activity.isRequired ? '필수' : '선택'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            마감일: {activity.dueDate}
          </span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
          {activity.title}
        </h1>

        <p style={{ color: 'var(--color-text)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {getInstructions()}
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
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '16px' }}>
            {activity.type === 'poll' ? (currentLang === 'ko' ? '투표 참여 및 이유 작성' : 'Cast Your Vote') :
             activity.type === 'qa' ? (currentLang === 'ko' ? '상대국 친구에게 질문 등록' : 'Ask a Question') :
             (currentLang === 'ko' ? '나의 글 작성하기' : 'Write Submission')}
          </h3>

          {formError && (
            <div style={{ background: '#FDF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#B91C1C', fontSize: '0.85rem', fontWeight: 600, marginBottom: '14px' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Poll Options Grid */}
            {activity.type === 'poll' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>
                  {currentLang === 'ko' ? '선택지를 골라주세요:' : 'Choose your option:'}
                </label>
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
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="예: My Favorite Spot in Seoul"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                />
              </div>
            )}

            {/* Content Textarea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {activity.type === 'poll' ? (currentLang === 'ko' ? '선택 이유 (영어로 작성 권장)' : 'Reason') : (currentLang === 'ko' ? '본문 (원하는 언어로 자유롭게 작성)' : 'Content')}
                </label>
                {activity.minWordCount > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    권장 단어 수: {activity.minWordCount}~{activity.maxWordCount}단어 (현재: {postContent.trim() ? postContent.trim().split(/\s+/).length : 0}단어)
                  </span>
                )}
              </div>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={4}
                placeholder={currentLang === 'ko' ? '내용을 작성하세요. 문장 틀 칩을 누르면 자동으로 추가됩니다.' : 'Write your response here...'}
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
                  rows={2}
                  placeholder="상대국 친구들을 위한 영문 설명이 있다면 적어보세요..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                />
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
          {currentLang === 'ko' ? '친구들의 활동 기록' : 'Classroom Feed'} ({submissions.length})
        </h3>

        {submissions.length === 0 ? (
          <div className="cb-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
            아직 제출된 글이 없습니다. 첫 번째로 소중한 의견을 공유해 보세요!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {submissions.map(sub => {
              const isMine = sub.participantCode.toUpperCase() === student.participantCode.toUpperCase();
              const subComments = allComments.filter(c => c.submissionId === sub.id && !c.isHidden);
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

                  {/* English Translation */}
                  {sub.translationEn && (
                    <div style={{ background: '#FAF9F5', padding: '8px 12px', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>
                      Eng: "{sub.translationEn}"
                    </div>
                  )}

                  {/* Post Actions Bar */}
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

                  {/* QA Answer Input Box */}
                  {answeringQuestionId === sub.id && (
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

                  {/* Comments Section */}
                  {activity.allowComments && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--color-border-light)' }}>
                      {/* Comments List */}
                      {subComments.map(c => {
                        const isMyComment = c.participantCode.toUpperCase() === student.participantCode.toUpperCase();
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
