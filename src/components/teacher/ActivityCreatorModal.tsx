import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Sparkles, AlertCircle, Camera } from 'lucide-react';
import { Activity, ActivityType, TargetSide, VisibilityScope, SentenceFrame, PollOption, Language } from '../../types';
import { dataService } from '../../services/dataService';

interface ActivityCreatorModalProps {
  currentLang?: Language;
  activityToEdit?: Activity | null;
  onClose: () => void;
  onSaved: (activity: Activity) => void;
}

export const ActivityCreatorModal: React.FC<ActivityCreatorModalProps> = ({
  currentLang = 'ko',
  activityToEdit,
  onClose,
  onSaved,
}) => {
  const isEdit = !!activityToEdit;

  // Basic settings
  const [title, setTitle] = useState(activityToEdit?.title || '');
  const [type, setType] = useState<ActivityType>(activityToEdit?.type || 'writing');
  const [instructionsKo, setInstructionsKo] = useState(activityToEdit?.instructionsKo || '');
  const [instructionsEn, setInstructionsEn] = useState(activityToEdit?.instructionsEn || '');
  const [instructionsZh, setInstructionsZh] = useState(activityToEdit?.instructionsZh || '');
  const [startDate, setStartDate] = useState(activityToEdit?.startDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(activityToEdit?.dueDate || '2026-09-30');
  const [isRequired, setIsRequired] = useState(activityToEdit?.isRequired ?? true);
  const [targetSide, setTargetSide] = useState<TargetSide>(activityToEdit?.targetSide || 'Both');
  const [status, setStatus] = useState<Activity['status']>(activityToEdit?.status || 'published');

  // Limits & Rules
  const [submissionLimit, setSubmissionLimit] = useState(activityToEdit?.submissionLimit || 1);
  const [minWordCount, setMinWordCount] = useState(activityToEdit?.minWordCount || 10);
  const [maxWordCount, setMaxWordCount] = useState(activityToEdit?.maxWordCount || 150);
  const [allowEdit, setAllowEdit] = useState(activityToEdit?.allowEdit ?? true);
  const [allowComments, setAllowComments] = useState(activityToEdit?.allowComments ?? true);
  const [allowLikes, setAllowLikes] = useState(activityToEdit?.allowLikes ?? true);
  const [allowPartnerResponse, setAllowPartnerResponse] = useState(activityToEdit?.allowPartnerResponse ?? true);
  const [requireApproval, setRequireApproval] = useState(activityToEdit?.requireApproval ?? false);
  const [viewAfterSubmit, setViewAfterSubmit] = useState(activityToEdit?.viewAfterSubmit ?? true);
  const [visibility, setVisibility] = useState<VisibilityScope>(activityToEdit?.visibility || 'both_classes');

  // Sentence Frames
  const [sentenceFrames, setSentenceFrames] = useState<SentenceFrame[]>(
    activityToEdit?.sentenceFrames || [
      { id: 'sf-new-1', frame: 'I like ___ because ___.', example: 'I like this because it is traditional.' }
    ]
  );
  const [newFrameText, setNewFrameText] = useState('');

  // Poll Config
  const [pollOptions, setPollOptions] = useState<PollOption[]>(
    activityToEdit?.pollConfig?.options || [
      { id: 'opt-1', text: 'Option A' },
      { id: 'opt-2', text: 'Option B' }
    ]
  );
  const [newOptionText, setNewOptionText] = useState('');
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(activityToEdit?.pollConfig?.allowMultipleChoices ?? false);
  const [requireReason, setRequireReason] = useState(activityToEdit?.pollConfig?.requireReason ?? true);

  // QA Config
  const [maxQuestionsPerStudent, setMaxQuestionsPerStudent] = useState(activityToEdit?.qaConfig?.maxQuestionsPerStudent || 3);
  const [respondentScope, setRespondentScope] = useState<'partner_only' | 'both_classes'>(activityToEdit?.qaConfig?.respondentScope || 'partner_only');

  const [error, setError] = useState('');

  const handleAddFrame = () => {
    if (!newFrameText.trim()) return;
    setSentenceFrames([
      ...sentenceFrames,
      { id: `sf-${Date.now()}`, frame: newFrameText.trim(), example: newFrameText.trim() }
    ]);
    setNewFrameText('');
  };

  const handleRemoveFrame = (id: string) => {
    setSentenceFrames(sentenceFrames.filter(sf => sf.id !== id));
  };

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    if (pollOptions.length >= 10) {
      setError('선택지는 최대 10개까지 설정 가능합니다.');
      return;
    }
    setPollOptions([
      ...pollOptions,
      { id: `opt-${Date.now()}`, text: newOptionText.trim(), targetSide: 'Both' }
    ]);
    setNewOptionText('');
  };

  const handleRemoveOption = (id: string) => {
    if (pollOptions.length <= 2) {
      setError('선택지는 최소 2개 이상이어야 합니다.');
      return;
    }
    setPollOptions(pollOptions.filter(o => o.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('활동 제목을 입력하세요.');
      return;
    }
    if (!instructionsKo.trim() && !instructionsEn.trim()) {
      setError('최소 1개 언어로 활동 안내를 작성하세요.');
      return;
    }

    const payload = {
      title: title.trim(),
      type,
      instructionsKo: instructionsKo.trim(),
      instructionsEn: instructionsEn.trim(),
      instructionsZh: instructionsZh.trim(),
      startDate,
      dueDate,
      isRequired,
      targetSide,
      status,
      sentenceFrames,
      submissionLimit,
      minWordCount,
      maxWordCount,
      allowEdit,
      allowComments,
      allowLikes,
      allowPartnerResponse,
      requireApproval,
      viewAfterSubmit,
      visibility,
      pollConfig: type === 'poll' ? {
        options: pollOptions,
        allowMultipleChoices,
        requireReason,
        resultsVisibility: 'immediate' as const,
        allowVoteChange: true
      } : undefined,
      qaConfig: type === 'qa' ? {
        maxQuestionsPerStudent,
        questionMaxWords: 60,
        answerMaxWords: maxWordCount,
        respondentScope,
        minAnswersPerStudent: 1,
        allowAnswerEdit: allowEdit
      } : undefined
    };

    if (isEdit && activityToEdit) {
      const updated = dataService.updateActivity(activityToEdit.id, payload);
      if (updated) onSaved(updated);
    } else {
      const created = dataService.createActivity(payload);
      onSaved(created);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {isEdit ? '활동 수정하기' : '새 국제공동수업 활동 만들기'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              글쓰기, 투표, 질문·답변 과제를 설계하고 양국 학생의 참여 규칙을 설정합니다.
            </p>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#FDF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#B91C1C', fontSize: '0.88rem', fontWeight: 600, marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: Basic Info */}
          <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '12px' }}>
              1. 기본 정보 및 활동 유형
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>활동 제목 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: If You Had One Day in Seoul or Taiwan"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.92rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>활동 유형 *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ActivityType)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.92rem' }}
                >
                  <option value="writing">Writing (글쓰기)</option>
                  <option value="poll">Poll (투표)</option>
                  <option value="qa">Q&A (질문·답변)</option>
                </select>
              </div>
            </div>

            {/* Target & Required */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>대상 학급</label>
                <select
                  value={targetSide}
                  onChange={(e) => setTargetSide(e.target.value as TargetSide)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                >
                  <option value="Both">Both (양국 모두)</option>
                  <option value="Korea Class">Korea Class만</option>
                  <option value="Taiwan Class">Taiwan Class만</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>필수 여부</label>
                <select
                  value={isRequired ? 'true' : 'false'}
                  onChange={(e) => setIsRequired(e.target.value === 'true')}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                >
                  <option value="true">필수 과제</option>
                  <option value="false">선택 과제</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>상태</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Activity['status'])}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                >
                  <option value="published">공개 (Published)</option>
                  <option value="draft">초안 (Draft)</option>
                  <option value="closed">마감 (Closed)</option>
                  <option value="archived">보관 (Archived)</option>
                </select>
              </div>
            </div>

            {/* Schedule */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>마감일</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Instructions in 3 languages */}
          <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '12px' }}>
              2. 3개국어 활동 안내문
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '2px' }}>한국어 안내</label>
                <textarea
                  value={instructionsKo}
                  onChange={(e) => setInstructionsKo(e.target.value)}
                  rows={2}
                  placeholder="한국 학생들에게 전달할 활동 안내를 적어주세요."
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '2px' }}>English Instructions *</label>
                <textarea
                  value={instructionsEn}
                  onChange={(e) => setInstructionsEn(e.target.value)}
                  rows={2}
                  placeholder="Provide activity instructions in English for both classrooms."
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '2px' }}>繁體中文 (대만 번체) 指引</label>
                <textarea
                  value={instructionsZh}
                  onChange={(e) => setInstructionsZh(e.target.value)}
                  rows={2}
                  placeholder="請為臺灣班級學生提供繁體中文指引（可選）。"
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Sentence Frames */}
          <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
              3. 영어 문장 틀 (Sentence Frames)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {sentenceFrames.map(sf => (
                <div key={sf.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '6px 10px', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem' }}>
                  <span>{sf.frame}</span>
                  <button type="button" onClick={() => handleRemoveFrame(sf.id)} style={{ color: '#EF4444', fontSize: '0.8rem' }}>삭제</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newFrameText}
                onChange={(e) => setNewFrameText(e.target.value)}
                placeholder="예: If I visit ___, I want to ___."
                style={{ flex: 1, padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
              />
              <button type="button" onClick={handleAddFrame} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Plus size={14} /> 문장 틀 추가
              </button>
            </div>
          </div>

          {/* Section 4: Type-Specific Settings */}
          {type === 'poll' && (
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                4. 투표(Poll) 전용 설정 (선택지 2~10개)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                {pollOptions.map((opt, idx) => (
                  <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '6px 10px', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem' }}>
                    <span>{idx + 1}. {opt.text}</span>
                    <button type="button" onClick={() => handleRemoveOption(opt.id)} style={{ color: '#EF4444', fontSize: '0.8rem' }}>삭제</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  placeholder="새 선택지 이름 입력..."
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
                <button type="button" onClick={handleAddOption} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <Plus size={14} /> 선택지 추가
                </button>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={allowMultipleChoices} onChange={(e) => setAllowMultipleChoices(e.target.checked)} />
                  다중 선택 허용
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={requireReason} onChange={(e) => setRequireReason(e.target.checked)} />
                  선택 이유 필수 작성
                </label>
              </div>
            </div>
          )}

          {type === 'qa' && (
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                4. 질문·답변(Q&A) 전용 설정
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>1인당 질문 수 (1~5개)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={maxQuestionsPerStudent}
                    onChange={(e) => setMaxQuestionsPerStudent(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>답변 대상 범위</label>
                  <select
                    value={respondentScope}
                    onChange={(e) => setRespondentScope(e.target.value as any)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="partner_only">상대국 학생만 답변 허용</option>
                    <option value="both_classes">양국 학급 모두 답변 가능</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Interaction & Limits */}
          <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '10px' }}>
              5. 제출 제한 및 소통 설정
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>1인당 제출 수 (1~5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={submissionLimit}
                  onChange={(e) => setSubmissionLimit(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>최소 단어 수</label>
                <input
                  type="number"
                  min={0}
                  value={minWordCount}
                  onChange={(e) => setMinWordCount(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>최대 단어 수</label>
                <input
                  type="number"
                  min={10}
                  value={maxWordCount}
                  onChange={(e) => setMaxWordCount(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', fontSize: '0.82rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={allowEdit} onChange={(e) => setAllowEdit(e.target.checked)} /> 자기 글 수정 허용
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} /> 댓글 허용
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={allowLikes} onChange={(e) => setAllowLikes(e.target.checked)} /> 좋아요 허용
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={viewAfterSubmit} onChange={(e) => setViewAfterSubmit(e.target.checked)} /> 제출 후 다른 학생 글 보기
              </label>
            </div>
          {/* Future Photo Policy Notice */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)'
          }}>
            <Camera size={16} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
            <span>
              {currentLang === 'ko' && '학생 사진 첨부 기능은 개인정보 보호를 위해 교사 승인 방식으로 추후 제공됩니다.'}
              {currentLang === 'en' && 'Student photo attachments will be available later with teacher approval for privacy protection.'}
              {currentLang === 'zh-TW' && '為保護個人資料，學生照片附件功能將於日後以教師審核方式提供。'}
            </span>
          </div>
        </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)' }}>
            <button type="button" onClick={onClose} className="btn-outline" style={{ padding: '8px 18px' }}>취소</button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 24px' }}>
              {isEdit ? '수정 내용 저장' : '활동 생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
