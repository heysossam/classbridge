import React, { useState } from 'react';
import { 
  X, Copy, Check, Lock, Award, AlertTriangle, MessageSquare, 
  CheckCircle2, Clock, Heart, BookOpen, Layers
} from 'lucide-react';
import { Language, StudentMembership } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { generateComprehensiveEvaluation } from '../../services/evaluationEngine';

interface StudentDetailModalProps {
  currentLang: Language;
  student: StudentMembership;
  onClose: () => void;
  isReviewerMode?: boolean;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  currentLang,
  student,
  onClose,
  isReviewerMode = false,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  const evidence = dataService.getComprehensiveEvidence(student.id);

  const existingNote = evidence?.teacherNote?.note || '';
  const [noteText, setNoteText] = useState(existingNote);
  const [noteSaved, setNoteSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate Comprehensive Evaluation Statement
  const evalResult = generateComprehensiveEvaluation(evidence, currentLang);
  const [editableEval, setEditableEval] = useState(evalResult.sentence);

  const handleSaveNote = () => {
    dataService.saveTeacherNote(student.id, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  const handleCopyEval = () => {
    navigator.clipboard.writeText(editableEval);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge ${student.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`}>
                {student.partnerSide === 'Korea Class' ? '🇰🇷 Korea Class' : '🇹🇼 Taiwan Class'}
              </span>
              <span className="badge badge-neutral">
                Code: {student.participantCode}
              </span>
              <span className="badge badge-success">
                완료 활동: {evidence?.completedActivities.length || 0}개
              </span>
              <span className="badge badge-warning">
                미완료: {evidence?.uncompletedActivities.length || 0}개
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {student.englishNickname} 학생 수행 근거
            </h2>
          </div>

          <button onClick={onClose} className="btn-outline" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* Section 1: Completion Status Overview */}
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
            과제 수행 현황:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {evidence?.completedActivities.map(a => (
              <span key={a.id} className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                ✓ {a.title}
              </span>
            ))}
            {evidence?.uncompletedActivities.map(a => (
              <span key={a.id} className="badge badge-neutral" style={{ fontSize: '0.75rem', color: '#999' }}>
                ○ {a.title} (미완료)
              </span>
            ))}
          </div>
        </div>

        {/* Section 2: Submitted Posts & Activity Evidence */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={16} />
            <span>작성한 글, 투표, 질문·답변 기록 ({evidence?.submissions.length || 0}건)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
            {evidence?.submissions.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                아직 제출된 활동 기록이 없습니다.
              </div>
            ) : (
              evidence?.submissions.map(sub => (
                <div key={sub.id} style={{ background: '#fff', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-xs)', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{sub.type}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>{sub.submittedAt}</span>
                  </div>
                  {sub.title && <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}>{sub.title}</div>}
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.4, margin: '4px 0' }}>"{sub.content}"</p>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span>좋아요 {sub.likesCount}개</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 3: Process-based Evaluation Generator (KILLER FEATURE) */}
        <div style={{ 
          background: '#FFFFFF', 
          border: '2px solid rgba(23, 76, 79, 0.2)', 
          borderRadius: 'var(--radius-md)', 
          padding: '16px', 
          marginBottom: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {t('teacher.evalTitle')}
              </h3>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
              {evalResult.competency}
            </span>
          </div>

          <div style={{ 
            background: 'var(--color-warning-soft)', 
            border: '1px solid rgba(216, 154, 49, 0.4)', 
            borderRadius: 'var(--radius-xs)', 
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '10px',
            fontSize: '0.76rem',
            color: 'var(--color-text)'
          }}>
            <AlertTriangle size={15} color="var(--color-warning)" style={{ flexShrink: 0 }} />
            <span>참고 평어는 자동 채점이나 확정 평가가 아니며 교사가 반드시 확인하고 수정해야 합니다.</span>
          </div>

          <textarea
            value={editableEval}
            onChange={(e) => setEditableEval(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontSize: '0.88rem',
              lineHeight: 1.5,
              marginBottom: '10px',
              background: 'var(--bg-primary)'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCopyEval}
              className={copied ? 'btn-primary' : 'btn-accent'}
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? '복사 완료!' : '참고 평어 복사하기'}</span>
            </button>
          </div>
        </div>

        {/* Section 4: Teacher Confidential Note (Requirement 3: 평가자 체험 모드에서는 비공개) */}
        {isReviewerMode ? (
          <div style={{ marginBottom: '20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px dashed var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              <Lock size={14} />
              <span>교사 비공개 관찰 메모 (평가자 체험 모드 열람 제한)</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
              보안 및 개인정보 보호 원칙에 따라 평가자 체험 모드에서는 교사 비공개 관찰 메모가 비공개 처리됩니다.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
              <Lock size={14} />
              <span>교사 비공개 평가 메모 (학생 절대 비공개)</span>
            </div>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="학생의 성실성, 협업 태도, 영어 언어 성장 등에 대한 교사만의 비공개 관찰 메모를 작성하세요..."
              rows={2}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                marginBottom: '6px'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
              {noteSaved && <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 600 }}>저장되었습니다!</span>}
              <button onClick={handleSaveNote} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                메모 저장
              </button>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-outline" style={{ padding: '6px 18px' }}>닫기</button>
        </div>
      </div>
    </div>
  );
};
