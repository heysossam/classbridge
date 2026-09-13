import React, { useState } from 'react';
import { 
  X, Heart, MessageSquare, Lock, Copy, Check, Eye, EyeOff, 
  Calendar, Globe, AlertCircle, FileText, CheckCircle2, MessageCircle,
  PenTool, ShieldAlert, Sparkles, HelpCircle, ShieldCheck
} from 'lucide-react';
import { 
  Language, Submission, Activity, StudentMembership, TeacherPrivateNote, 
  TeacherFeedback, HiddenReason, ModerationStatus 
} from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { generateComprehensiveEvaluation } from '../../services/evaluationEngine';
import { getCategoryBadgeLabel } from '../../services/safetyModeration';

interface SubmissionDetailModalProps {
  currentLang: Language;
  submission: Submission;
  activity: Activity;
  onClose: () => void;
  onUpdated?: () => void;
}

const HIDDEN_REASON_OPTIONS: HiddenReason[] = [
  '상대를 불편하게 하는 표현',
  '개인정보 포함 가능성',
  '수업과 무관한 내용',
  '교사 확인 필요',
  '기타'
];

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  currentLang,
  submission,
  activity,
  onClose,
  onUpdated,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  // Active submission state (may be updated like isHidden or moderationStatus)
  const [currentSub, setCurrentSub] = useState<Submission>(submission);
  const student = dataService.getStudentById(submission.membershipId) || {
    id: submission.membershipId,
    roomId: 'room-kr-tw-01',
    englishNickname: submission.englishNickname,
    participantCode: submission.participantCode,
    partnerSide: submission.partnerSide,
    createdAt: ''
  };

  // View toggle: original text vs english translation
  const [viewMode, setViewMode] = useState<'original' | 'translation'>('original');

  // Comments for this submission
  const comments = dataService.getComments(currentSub.id);

  // Teacher observation note (Private, separate from feedback)
  const notes = dataService.getTeacherNotes();
  const existingNote = notes[submission.membershipId]?.note || '';
  const [noteText, setNoteText] = useState(existingNote);
  const [noteSaved, setNoteSaved] = useState(false);

  // Teacher feedback state (Requirement 3: 1 teacher feedback per submission)
  const existingFeedback = dataService.getTeacherFeedback(currentSub.id);
  const [feedbackText, setFeedbackText] = useState(existingFeedback?.content || '');
  const [feedbackPublished, setFeedbackPublished] = useState(existingFeedback?.isPublished ?? true);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  // Soft Hiding & Moderation state (Requirement 4)
  const [isHideModalOpen, setIsHideModalOpen] = useState(false);
  const [selectedHideReason, setSelectedHideReason] = useState<HiddenReason>('상대를 불편하게 하는 표현');

  // Assessment phrase
  const evidence = dataService.getComprehensiveEvidence(submission.membershipId);
  const evalResult = generateComprehensiveEvaluation(evidence, currentLang);
  const [editableEval, setEditableEval] = useState(evalResult.sentence);
  const [copied, setCopied] = useState(false);

  // Apply Soft Hide with Reason
  const handleApplyHide = () => {
    const updated = dataService.hideSubmission(currentSub.id, selectedHideReason, '교사');
    if (updated) setCurrentSub({ ...updated });
    setIsHideModalOpen(false);
    if (onUpdated) onUpdated();
  };

  // Restore to Public
  const handleRestoreToPublic = () => {
    const updated = dataService.restoreSubmission(currentSub.id, '교사');
    if (updated) setCurrentSub({ ...updated });
    if (onUpdated) onUpdated();
  };

  // Save Teacher Feedback (Requirement 3)
  const handleSaveFeedback = () => {
    dataService.saveTeacherFeedback(currentSub.id, feedbackText, feedbackPublished);
    setFeedbackSaved(true);
    setTimeout(() => setFeedbackSaved(false), 2500);
    if (onUpdated) onUpdated();
  };

  // Save Teacher Private Note
  const handleSaveNote = () => {
    dataService.saveTeacherNote(submission.membershipId, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
    if (onUpdated) onUpdated();
  };

  // Copy Reference Statement
  const handleCopyEval = () => {
    navigator.clipboard.writeText(editableEval);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(23, 76, 79, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1050, padding: '20px'
      }}
    >
      <div 
        className="cb-card modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '100%', maxWidth: '820px', maxHeight: '92vh',
          overflowY: 'auto', background: '#fff', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-light)', padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span className={`badge ${currentSub.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`}>
                {currentSub.partnerSide === 'Korea Class' ? '🇰🇷 Korea Class' : '🇹🇼 Taiwan Class'}
              </span>
              <span className="badge badge-neutral">Code: {currentSub.participantCode}</span>
              <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>
                <Globe size={12} style={{ marginRight: '4px' }} />
                {currentSub.language || 'en'}
              </span>
              <span className={`badge ${currentSub.isHidden ? 'badge-warning' : 'badge-success'}`}>
                {currentSub.isHidden ? '숨김 (비공개)' : '공개'}
              </span>
              {currentSub.moderationStatus && currentSub.moderationStatus !== 'approved' && (
                <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                  상태: {currentSub.moderationStatus}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {currentSub.englishNickname} 학생의 작품 — {activity.title}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Calendar size={13} />
              <span>제출일: {currentSub.submittedAt}</span>
            </div>
          </div>

          <button onClick={onClose} className="btn-outline" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Visibility & Moderation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.9rem' }}>
              <Heart size={16} fill="currentColor" />
              <span>좋아요 {currentSub.likesCount || 0}</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
              <MessageSquare size={16} />
              <span>댓글 {comments.length}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentSub.isHidden ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600 }}>
                  [숨김 상태: {currentSub.hiddenReason || '교사 확인 필요'}]
                </span>
                <button
                  onClick={handleRestoreToPublic}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Eye size={14} />
                  <span>다시 공개(복원)</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsHideModalOpen(true)}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#DC2626', borderColor: '#FCA5A5' }}
              >
                <EyeOff size={14} />
                <span>부적절한 글 숨기기</span>
              </button>
            )}
          </div>
        </div>

        {/* Hide Reason Modal Dialog */}
        {isHideModalOpen && (
          <div style={{
            background: '#FFFBEB',
            border: '1.5px solid #FCD34D',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
            marginBottom: '18px'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} />
              <span>게시글 숨김 사유를 선택해 주세요 (영구 삭제 금지 · 학생 보호)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#78350F', marginBottom: '10px' }}>
              숨김 처리 시 다른 학생들에게는 본문 대신 "이 글은 안전한 교류를 위해 교사가 확인하고 있습니다." 문구가 노출됩니다. (글 작성 학생과 교사는 원문 열람 가능)
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {HIDDEN_REASON_OPTIONS.map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedHideReason(reason)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.8rem',
                    fontWeight: selectedHideReason === reason ? 700 : 500,
                    border: selectedHideReason === reason ? '1.5px solid #D97706' : '1px solid #FCD34D',
                    background: selectedHideReason === reason ? '#D97706' : '#fff',
                    color: selectedHideReason === reason ? '#fff' : '#78350F',
                    cursor: 'pointer'
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsHideModalOpen(false)}
                className="btn-outline"
                style={{ padding: '5px 12px', fontSize: '0.8rem' }}
              >
                취소
              </button>
              <button
                onClick={handleApplyHide}
                className="btn-primary"
                style={{ padding: '5px 14px', fontSize: '0.8rem', background: '#D97706' }}
              >
                숨김 적용
              </button>
            </div>
          </div>
        )}

        {/* Selected Poll Options or QA Context */}
        {currentSub.selectedOptions && currentSub.selectedOptions.length > 0 && (
          <div style={{ marginBottom: '16px', background: 'var(--color-accent-soft)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '6px' }}>
              선택한 투표 항목:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {currentSub.selectedOptions.map(optId => {
                const opt = activity.pollConfig?.options.find(o => o.id === optId);
                return (
                  <span key={optId} className="badge badge-accent" style={{ fontSize: '0.85rem', padding: '6px 10px' }}>
                    {opt ? opt.text : optId}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Box with Translation Toggle */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
              제출 본문
            </span>
            {currentSub.translationEn && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('original')}
                  className="btn-outline"
                  style={{
                    padding: '4px 10px', fontSize: '0.78rem',
                    background: viewMode === 'original' ? 'var(--color-primary)' : 'transparent',
                    color: viewMode === 'original' ? '#fff' : 'var(--color-text)'
                  }}
                >
                  {t('submissionDetail.viewOriginal')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('translation')}
                  className="btn-outline"
                  style={{
                    padding: '4px 10px', fontSize: '0.78rem',
                    background: viewMode === 'translation' ? 'var(--color-secondary)' : 'transparent',
                    color: viewMode === 'translation' ? '#fff' : 'var(--color-text)'
                  }}
                >
                  {t('submissionDetail.viewTranslation')}
                </button>
              </div>
            )}
          </div>

          <div style={{ 
            background: viewMode === 'translation' ? '#FAF9F5' : '#fff',
            border: '1px solid var(--color-border)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '16px', 
            fontSize: '0.95rem', 
            lineHeight: 1.6,
            color: 'var(--color-text)',
            whiteSpace: 'pre-wrap'
          }}>
            {currentSub.title && (
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '8px' }}>
                {currentSub.title}
              </div>
            )}
            {viewMode === 'translation' && currentSub.translationEn 
              ? currentSub.translationEn 
              : currentSub.content}
          </div>
        </div>

        {/* Requirement 8: Independent Writing Process Metrics Box */}
        <div style={{
          background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
          border: '1px solid #BBF7D0',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 16px',
          marginBottom: '22px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <PenTool size={16} color="var(--color-success)" />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              글쓰기 수행 과정 정보 (스스로 쓰기 모드)
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontSize: '0.82rem', marginBottom: '10px' }}>
            <div style={{ background: '#fff', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid #E5E7EB' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>작성 시작 시각</div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>{currentSub.writingStartTime || currentSub.submittedAt}</div>
            </div>
            <div style={{ background: '#fff', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid #E5E7EB' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>최종 제출 시각</div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>{currentSub.submittedAt}</div>
            </div>
            <div style={{ background: '#fff', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid #E5E7EB' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>수정 횟수</div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>{currentSub.editCount ?? 0}회</div>
            </div>
            <div style={{ background: '#fff', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid #E5E7EB' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>붙여넣기 시도 횟수</div>
              <div style={{ fontWeight: 700, color: (currentSub.pasteAttemptsCount || 0) > 0 ? '#D97706' : 'var(--color-primary)', marginTop: '2px' }}>
                {currentSub.pasteAttemptsCount ?? 0}회
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid #E5E7EB', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>학생 자기확인 (도움받은 방법): </span>
            <span>
              {currentSub.assistanceDeclaration && currentSub.assistanceDeclaration.length > 0 
                ? currentSub.assistanceDeclaration.join(', ') 
                : '내 생각으로 직접 작성함'}
            </span>
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
            ※ 붙여넣기 제한은 학생의 독립적인 문장 구성을 돕는 교육적 보조 장치이며, 완전한 부정행위 방지 수단이 아닙니다. AI 작성 여부를 자동 판별하지 않으며, 교사가 학생의 초안과 수업 맥락을 함께 확인합니다.
          </div>
        </div>

        {/* Requirement 3: Teacher Feedback Section (Single feedback per submission) */}
        <div style={{
          background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
          border: '1.5px solid #94A3B8',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          marginBottom: '22px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={18} color="#2563EB" />
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                선생님 피드백 (학생 제출물당 1건)
              </h4>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>
              <input
                type="checkbox"
                checked={feedbackPublished}
                onChange={(e) => setFeedbackPublished(e.target.checked)}
              />
              <span>학생에게 피드백 공개 (isPublished)</span>
            </label>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            ※ 담당 교사 또는 관리자만 작성·수정할 수 있습니다. 학생은 본인 제출물에 공개된 피드백만 읽을 수 있으며, 타인에게는 비공개됩니다. 피드백 영구 삭제는 불가합니다.
          </p>

          <textarea
            rows={3}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="학생의 성취와 노력, 어휘 및 문장 표현에 대한 긍정적이고 구체적인 피드백을 1건 작성해 주세요..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.9rem', marginBottom: '8px', lineHeight: 1.5 }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
            {feedbackSaved && (
              <span style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={15} /> 피드백이 안전하게 저장되었습니다
              </span>
            )}
            <button
              onClick={handleSaveFeedback}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              피드백 저장
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} />
            <span>작품에 등록된 친구들의 댓글 ({comments.length}개)</span>
          </h4>
          {comments.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '8px' }}>
              아직 등록된 댓글이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {comments.map(c => (
                <div key={c.id} style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {c.englishNickname} ({c.partnerSide === 'Korea Class' ? '🇰🇷 KR' : '🇹🇼 TW'})
                    </span>
                    <span style={{ color: 'var(--color-text-light)' }}>{c.createdAt}</span>
                  </div>
                  <div style={{ color: 'var(--color-text)' }}>{c.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Teacher Observation Note (Private, completely separate from student feedback) */}
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '18px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Lock size={16} color="var(--color-secondary)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {t('teacher.privateNote')}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {t('teacher.privateNoteHidden')}
            </span>
          </div>
          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="학생의 수행 과정, 자기표현 태도, 협력 태도를 관찰하여 비공개 메모를 작성하세요..."
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
            {noteSaved && (
              <span style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={15} /> {t('teacher.noteSaved')}
              </span>
            )}
            <button
              onClick={handleSaveNote}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              {t('teacher.saveNote')}
            </button>
          </div>
        </div>

        {/* Section: Process-based Assessment Reference Statement */}
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--color-primary)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {t('teacher.evalTitle')}
              </h4>
            </div>
            <button
              onClick={handleCopyEval}
              className="btn-outline"
              style={{ padding: '4px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
              <span>{copied ? t('teacher.evalCopied') : t('teacher.copyEval')}</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={editableEval}
            onChange={(e) => setEditableEval(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.88rem', lineHeight: 1.5, background: '#fff', marginBottom: '8px' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{t('teacher.evalNotice')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
