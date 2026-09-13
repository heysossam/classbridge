import React, { useState } from 'react';
import { 
  X, Heart, MessageSquare, Lock, Copy, Check, Eye, EyeOff, 
  Calendar, Globe, AlertCircle, FileText, CheckCircle2 
} from 'lucide-react';
import { Language, Submission, Activity, StudentMembership, TeacherPrivateNote } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { generateComprehensiveEvaluation } from '../../services/evaluationEngine';

interface SubmissionDetailModalProps {
  currentLang: Language;
  submission: Submission;
  activity: Activity;
  onClose: () => void;
  onUpdated?: () => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  currentLang,
  submission,
  activity,
  onClose,
  onUpdated,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  // Active submission state (may be updated like isHidden)
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

  // Teacher observation note
  const notes = dataService.getTeacherNotes();
  const existingNote = notes[submission.membershipId]?.note || '';
  const [noteText, setNoteText] = useState(existingNote);
  const [noteSaved, setNoteSaved] = useState(false);

  // Assessment phrase
  const evidence = dataService.getComprehensiveEvidence(submission.membershipId);
  const evalResult = generateComprehensiveEvaluation(evidence, currentLang);
  const [editableEval, setEditableEval] = useState(evalResult.sentence);
  const [copied, setCopied] = useState(false);

  // Toggle Visibility (Public vs Hidden)
  const handleToggleHide = () => {
    const isNowHidden = dataService.toggleHideSubmission(currentSub.id);
    setCurrentSub({ ...currentSub, isHidden: isNowHidden });
    if (onUpdated) onUpdated();
  };

  // Save Teacher Note
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
          width: '100%', maxWidth: '780px', maxHeight: '90vh',
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
                {currentSub.isHidden ? t('submissionDetail.statusHidden') : t('submissionDetail.statusPublic')}
              </span>
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

        {/* Visibility & Actions Bar */}
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

          <button
            onClick={handleToggleHide}
            className="btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {currentSub.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{currentSub.isHidden ? t('submissionDetail.setPublic') : t('submissionDetail.setHidden')}</span>
          </button>
        </div>

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

        {/* Section: Teacher Observation Note (Private) */}
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
            placeholder="학생의 수행 과정, 자기표현 태도, 협력 태도를 관찰하여 메모를 작성하세요..."
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
