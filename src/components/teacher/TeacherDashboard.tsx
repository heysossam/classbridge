import React, { useState } from 'react';
import { 
  Users, CheckCircle2, Clock, Calendar, ArrowRight, RefreshCw, 
  ExternalLink, Eye, EyeOff, AlertCircle, Sparkles, Filter, ChevronRight,
  GraduationCap
} from 'lucide-react';
import { Language, Room, ProgressStatus, StudentMembership, StudentResponse } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { StudentDetailModal } from './StudentDetailModal';

interface TeacherDashboardProps {
  currentLang: Language;
  teacherSide: 'Korea Class' | 'Taiwan Class';
  onSwitchTeacherSide: (side: 'Korea Class' | 'Taiwan Class') => void;
  onBack: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentLang,
  teacherSide,
  onSwitchTeacherSide,
  onBack,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  const [room, setRoom] = useState<Room>(dataService.getRoom());
  const [students, setStudents] = useState<StudentMembership[]>(dataService.getStudents());
  const [responses, setResponses] = useState<StudentResponse[]>(dataService.getResponses());
  const [selectedStudent, setSelectedStudent] = useState<StudentMembership | null>(null);
  const [filterSide, setFilterSide] = useState<'All' | 'Korea Class' | 'Taiwan Class'>('All');

  // Status mapping
  const getStatusBadge = (status: ProgressStatus) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success"><CheckCircle2 size={13} /> {t('status.completed')}</span>;
      case 'in_progress':
        return <span className="badge badge-warning"><Clock size={13} /> {t('status.in_progress')}</span>;
      default:
        return <span className="badge badge-neutral">{t('status.not_started')}</span>;
    }
  };

  // Toggle my class status
  const handleStatusCycle = () => {
    const currentStatus = teacherSide === 'Korea Class' ? room.partnerAStatus : room.partnerBStatus;
    const nextStatus: ProgressStatus = 
      currentStatus === 'not_started' ? 'in_progress' :
      currentStatus === 'in_progress' ? 'completed' : 'not_started';

    const updated = dataService.updateClassStatus(teacherSide, nextStatus);
    setRoom({ ...updated });
  };

  // Metrics
  const krStudents = students.filter(s => s.partnerSide === 'Korea Class');
  const twStudents = students.filter(s => s.partnerSide === 'Taiwan Class');
  
  const krSubmitted = responses.filter(r => r.partnerSide === 'Korea Class');
  const twSubmitted = responses.filter(r => r.partnerSide === 'Taiwan Class');

  const unsubmittedKrCodes = krStudents
    .filter(s => !responses.some(r => r.participantCode.toUpperCase() === s.participantCode.toUpperCase()))
    .map(s => s.participantCode);

  const unsubmittedTwCodes = twStudents
    .filter(s => !responses.some(r => r.participantCode.toUpperCase() === s.participantCode.toUpperCase()))
    .map(s => s.participantCode);

  // Filtered student list
  const displayStudents = students.filter(s => {
    if (filterSide === 'All') return true;
    return s.partnerSide === filterSide;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Controls: Switch Persona Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'var(--bg-card)',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-light)',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GraduationCap size={20} color="var(--color-primary)" />
          <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
            {t('teacher.dashboardTitle')}
          </span>
          <span className={`badge ${teacherSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`}>
            {teacherSide === 'Korea Class' ? '🇰🇷 Korea Class 교사' : '🇹🇼 Taiwan Class 教師'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {currentLang === 'ko' ? '시점 전환:' : 'Switch View:'}
          </span>
          <button
            onClick={() => onSwitchTeacherSide(teacherSide === 'Korea Class' ? 'Taiwan Class' : 'Korea Class')}
            className="btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} />
            <span>{teacherSide === 'Korea Class' ? t('teacher.switchSideTaiwan') : t('teacher.switchSideKorea')}</span>
          </button>
        </div>
      </div>

      {/* Main Project Header */}
      <div className="cb-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span className="badge badge-neutral" style={{ marginBottom: '8px' }}>
              Room Code: {room.joinCode}
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {room.title}
            </h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              {t('teacher.overallProgress')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {room.overallProgress}%
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div style={{ width: '100%', height: '10px', background: 'var(--color-border-light)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ width: `${room.overallProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: 'var(--radius-full)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} />
            <span><strong>{t('teacher.nextSchedule')}:</strong> {room.nextSchedule}</span>
          </div>
          <div style={{ color: 'var(--color-text-light)' }}>
            최근 상태 업데이트: {room.lastUpdated}
          </div>
        </div>
      </div>

      {/* Bilateral Bridge Board: Two Classrooms Linked Together (PRD 11조) */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(280px, 1fr) auto minmax(280px, 1fr)', 
          alignItems: 'center', 
          gap: '16px'
        }}>
          {/* Korea Class Card */}
          <div className="cb-card" style={{ 
            border: teacherSide === 'Korea Class' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: '#FFFFFF',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🇰🇷</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {room.partnerALabel}
                </h3>
              </div>
              {getStatusBadge(room.partnerAStatus)}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              <strong>다음 할 일:</strong> {room.partnerANextTask}
            </div>

            {teacherSide === 'Korea Class' && (
              <button
                onClick={handleStatusCycle}
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
              >
                <RefreshCw size={14} />
                <span>{t('teacher.statusControl')}</span>
              </button>
            )}
          </div>

          {/* Connection Symbol */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--color-secondary)'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'var(--color-secondary-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Sparkles size={20} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>Bridge</span>
          </div>

          {/* Taiwan Class Card */}
          <div className="cb-card" style={{ 
            border: teacherSide === 'Taiwan Class' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
            background: '#FFFFFF',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🇹🇼</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {room.partnerBLabel}
                </h3>
              </div>
              {getStatusBadge(room.partnerBStatus)}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              <strong>下一個任務:</strong> {room.partnerBNextTask}
            </div>

            {teacherSide === 'Taiwan Class' && (
              <button
                onClick={handleStatusCycle}
                className="btn-accent"
                style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
              >
                <RefreshCw size={14} />
                <span>{t('teacher.statusControl')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Participation & Submission Summary Cards (PRD 8조 핵심기능 3) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div className="cb-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            {t('teacher.totalStudents')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {students.length}명
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
            🇰🇷 Korea {krStudents.length}명 / 🇹🇼 Taiwan {twStudents.length}명
          </div>
        </div>

        <div className="cb-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            {t('teacher.submittedCount')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {responses.length}명 ({Math.round((responses.length / students.length) * 100)}%)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
            🇰🇷 {krSubmitted.length}/{krStudents.length} · 🇹🇼 {twSubmitted.length}/{twStudents.length}
          </div>
        </div>

        <div className="cb-card" style={{ padding: '18px', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            {t('teacher.unsubmittedCodes')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {unsubmittedKrCodes.concat(unsubmittedTwCodes).length > 0 ? (
              unsubmittedKrCodes.concat(unsubmittedTwCodes).map(code => (
                <span key={code} className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                  {code}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>
                모든 학생 제출 완료!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Student List & Assessment Evidence Table */}
      <div className="cb-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {t('teacher.participationSummary')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {currentLang === 'ko' ? '학생 이름을 클릭하면 수행 근거와 과정중심 참고 평어를 확인하고 복사할 수 있습니다.' : 'Click a student to view evidence and copy evaluation statements.'}
            </p>
          </div>

          {/* Filter Side */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['All', 'Korea Class', 'Taiwan Class'] as const).map(side => (
              <button
                key={side}
                onClick={() => setFilterSide(side)}
                className={`btn-outline ${filterSide === side ? 'active' : ''}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: filterSide === side ? 'var(--color-primary)' : 'transparent',
                  color: filterSide === side ? '#fff' : 'var(--color-text)',
                  borderColor: filterSide === side ? 'var(--color-primary)' : 'var(--color-border)'
                }}
              >
                {side === 'All' ? '전체' : side === 'Korea Class' ? '🇰🇷 Korea' : '🇹🇼 Taiwan'}
              </button>
            ))}
          </div>
        </div>

        {/* Student Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          {displayStudents.map(st => {
            const resp = responses.find(r => r.participantCode.toUpperCase() === st.participantCode.toUpperCase());
            const isSubmitted = !!resp;

            return (
              <div
                key={st.id}
                onClick={() => setSelectedStudent(st)}
                className="cb-card hoverable"
                style={{
                  cursor: 'pointer',
                  padding: '16px',
                  border: '1px solid var(--color-border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                        {st.englishNickname}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                        {st.participantCode}
                      </span>
                    </div>

                    <span className={`badge ${st.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`} style={{ fontSize: '0.7rem' }}>
                      {st.partnerSide === 'Korea Class' ? '🇰🇷 KR' : '🇹🇼 TW'}
                    </span>
                  </div>

                  {isSubmitted ? (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '4px' }}>
                        {resp.selectedOption}
                      </div>
                      <p style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--color-text)', 
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        "{resp.fullStatement}"
                      </p>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-warning)', padding: '12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={15} />
                      <span>{currentLang === 'ko' ? '활동 미제출 상태' : 'Unsubmitted'}</span>
                    </div>
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '14px', 
                  paddingTop: '10px', 
                  borderTop: '1px solid var(--color-border-light)',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ color: isSubmitted ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
                    {isSubmitted ? '✓ 제출 완료' : '미제출'}
                  </span>

                  <span style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t('teacher.viewStudentDetail')}
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          currentLang={currentLang}
          student={selectedStudent}
          response={responses.find(r => r.participantCode.toUpperCase() === selectedStudent.participantCode.toUpperCase())}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
