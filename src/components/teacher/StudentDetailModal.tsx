import React, { useState } from 'react';
import { X, Copy, Check, Lock, Sparkles, BookOpen, AlertTriangle, MessageSquare, Award } from 'lucide-react';
import { Language, StudentMembership, StudentResponse } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { generateEvaluationStatement } from '../../services/evaluationEngine';

interface StudentDetailModalProps {
  currentLang: Language;
  student: StudentMembership;
  response: StudentResponse | undefined;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  currentLang,
  student,
  response,
  onClose,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  // Load teacher note
  const notes = dataService.getTeacherNotes();
  const existingNote = notes[student.id]?.note || '';
  const [noteText, setNoteText] = useState(existingNote);
  const [noteSaved, setNoteSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate Reference Evaluation
  const evalResult = generateEvaluationStatement(response, currentLang);
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge ${student.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`}>
                {student.partnerSide === 'Korea Class' ? '🇰🇷 Korea Class' : '🇹🇼 Taiwan Class'}
              </span>
              <span className="badge badge-neutral">
                Code: {student.participantCode}
              </span>
              {response ? (
                <span className="badge badge-success">
                  {currentLang === 'ko' ? '제출 완료' : currentLang === 'zh-TW' ? '已提交' : 'Submitted'}
                </span>
              ) : (
                <span className="badge badge-warning">
                  {currentLang === 'ko' ? '미제출' : currentLang === 'zh-TW' ? '未提交' : 'Unsubmitted'}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {student.englishNickname}
            </h2>
          </div>

          <button onClick={onClose} className="btn-outline" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* Section 1: Student Submitted Evidence */}
        <div style={{ 
          background: 'var(--bg-subtle)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '16px', 
          marginBottom: '20px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '10px' }}>
            <MessageSquare size={16} />
            <span>{currentLang === 'ko' ? '학생 수행 근거 (제출 내용)' : currentLang === 'zh-TW' ? '學生歷程實證' : 'Student Evidence'}</span>
          </div>

          {response ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{currentLang === 'ko' ? '선택 디자인:' : 'Selected Design:'}</span>
                <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{response.selectedOption}</span>
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                  {currentLang === 'ko' ? '영어로 작성한 의견:' : 'English Statement:'}
                </span>
                <div style={{ 
                  background: '#fff', 
                  padding: '10px 12px', 
                  borderRadius: 'var(--radius-xs)', 
                  fontWeight: 600, 
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-border-light)'
                }}>
                  "{response.fullStatement}"
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textAlign: 'right' }}>
                제출 시각: {response.submittedAt}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', fontStyle: 'italic', padding: '8px 0' }}>
              {currentLang === 'ko' ? '아직 활동 결과가 제출되지 않았습니다.' : 'No submission recorded yet.'}
            </div>
          )}
        </div>

        {/* Section 2: Process-based Assessment Reference Statement (KILLER FEATURE) */}
        <div style={{ 
          background: '#FFFFFF', 
          border: '2px solid rgba(23, 76, 79, 0.2)', 
          borderRadius: 'var(--radius-md)', 
          padding: '18px', 
          marginBottom: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {t('teacher.evalTitle')}
              </h3>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
              {evalResult.competency}
            </span>
          </div>

          {/* Mandatory Teacher Verification Notice */}
          <div style={{ 
            background: 'var(--color-warning-soft)', 
            border: '1px solid rgba(216, 154, 49, 0.4)', 
            borderRadius: 'var(--radius-xs)', 
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            fontSize: '0.78rem',
            color: 'var(--color-text)'
          }}>
            <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0 }} />
            <span>{t('teacher.evalNotice')}</span>
          </div>

          {/* Editable Reference Textarea */}
          <textarea
            value={editableEval}
            onChange={(e) => setEditableEval(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontSize: '0.92rem',
              lineHeight: 1.5,
              color: 'var(--color-text)',
              marginBottom: '12px',
              background: 'var(--bg-primary)'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCopyEval}
              className={copied ? 'btn-primary' : 'btn-accent'}
              style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? t('teacher.evalCopied') : t('teacher.copyEval')}</span>
            </button>
          </div>
        </div>

        {/* Section 3: Teacher Confidential Note */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
            <Lock size={15} />
            <span>{t('teacher.privateNote')}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
              ({currentLang === 'ko' ? '학생에게 절대 노출되지 않음' : 'Never visible to students'})
            </span>
          </div>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={currentLang === 'ko' ? '이 학생의 수행 과정, 영어 태도, 모둠 협업 등에 대한 교사만의 비공개 메모를 입력하세요...' : 'Enter private notes regarding this student...'}
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontSize: '0.88rem',
              lineHeight: 1.4,
              marginBottom: '8px'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
            {noteSaved && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>
                {t('teacher.noteSaved')}
              </span>
            )}
            <button
              onClick={handleSaveNote}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              {t('teacher.saveNote')}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-outline" style={{ padding: '8px 20px' }}>
            {t('teacher.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
