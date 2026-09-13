import React from 'react';
import { 
  BookOpen, CheckCircle2, Clock, FileText, BarChart2, MessageCircleQuestion, 
  ArrowRight, AlertCircle, ArrowLeft, Calendar
} from 'lucide-react';
import { Language, StudentMembership, Activity } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';

interface StudentActivityListProps {
  currentLang: Language;
  student: StudentMembership;
  onSelectActivity: (activity: Activity) => void;
  onBack: () => void;
}

export const StudentActivityList: React.FC<StudentActivityListProps> = ({
  currentLang,
  student,
  onSelectActivity,
  onBack,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);
  const activities = dataService.getActivities();
  const submissions = dataService.getSubmissions();

  const getTypeBadge = (type: Activity['type']) => {
    switch (type) {
      case 'writing':
        return (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={13} /> {currentLang === 'ko' ? '글쓰기' : currentLang === 'zh-TW' ? '寫作任務' : 'Writing'}
          </span>
        );
      case 'poll':
        return (
          <span className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <BarChart2 size={13} /> {currentLang === 'ko' ? '투표' : currentLang === 'zh-TW' ? '偏好票選' : 'Poll'}
          </span>
        );
      case 'qa':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MessageCircleQuestion size={13} /> {currentLang === 'ko' ? '질문·답변' : currentLang === 'zh-TW' ? '問答互動' : 'Q&A'}
          </span>
        );
    }
  };

  const getInstructions = (act: Activity) => {
    if (currentLang === 'zh-TW' && act.instructionsZh) return act.instructionsZh;
    if (currentLang === 'en' && act.instructionsEn) return act.instructionsEn;
    return act.instructionsKo || act.instructionsEn;
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Student Session Header */}
      <div style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid var(--color-border-light)', 
        borderRadius: 'var(--radius-md)', 
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} />
            <span>{currentLang === 'ko' ? '나가기' : 'Exit'}</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.15rem' }}>
              {student.englishNickname}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
              Code: {student.participantCode}
            </span>
            <span className={`badge ${student.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`}>
              {student.partnerSide === 'Korea Class' ? '🇰🇷 Korea Class' : '🇹🇼 Taiwan Class'}
            </span>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
          {currentLang === 'ko' ? '나의 국제공동수업 활동' : currentLang === 'zh-TW' ? '我的跨國共同教學任務' : 'My Joint Class Activities'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          {currentLang === 'ko' ? '한국과 대만 친구들이 함께하는 과제를 확인하고 차례대로 참여해 보세요.' : 'Explore joint assignments and share your thoughts with your partner classroom.'}
        </p>
      </div>

      {/* Activities Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.map(act => {
          const mySubmissions = submissions.filter(
            s => s.activityId === act.id && (s.membershipId === student.id || s.participantCode.toUpperCase() === student.participantCode.toUpperCase())
          );
          const isCompleted = mySubmissions.length > 0;
          const isClosed = act.status === 'closed';

          return (
            <div 
              key={act.id} 
              className="cb-card hoverable"
              onClick={() => onSelectActivity(act)}
              style={{ 
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: `5px solid ${isCompleted ? 'var(--color-success)' : act.isRequired ? 'var(--color-accent)' : 'var(--color-border)'}`
              }}
            >
              <div style={{ flex: '1 1 500px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {getTypeBadge(act.type)}
                  <span className={`badge ${act.isRequired ? 'badge-accent' : 'badge-neutral'}`} style={{ fontSize: '0.72rem' }}>
                    {act.isRequired ? (currentLang === 'ko' ? '필수 과제' : 'Required') : (currentLang === 'ko' ? '선택 과제' : 'Optional')}
                  </span>
                  {isCompleted ? (
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                      <CheckCircle2 size={12} /> {currentLang === 'ko' ? '제출 완료' : 'Completed'} ({mySubmissions.length}개)
                    </span>
                  ) : isClosed ? (
                    <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                      {currentLang === 'ko' ? '마감됨' : 'Closed'}
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                      <Clock size={12} /> {currentLang === 'ko' ? '미완료' : 'Pending'}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
                  {act.title}
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.45, marginBottom: '10px' }}>
                  {getInstructions(act)}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {act.startDate} ~ {act.dueDate}
                  </span>
                  <span>1인 최대 {act.submissionLimit}개 제출</span>
                </div>
              </div>

              <div>
                <button
                  className={isCompleted ? 'btn-secondary' : 'btn-accent'}
                  style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{isCompleted ? (currentLang === 'ko' ? '내용 확인 / 이어하기' : 'View & Continue') : (currentLang === 'ko' ? '과제 시작하기' : 'Start Activity')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
