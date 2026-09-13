import React, { useState } from 'react';
import { 
  Plus, Calendar, Clock, CheckCircle2, RefreshCw, ChevronRight,
  GraduationCap, Copy, Edit2, Archive, Eye, BarChart2, Filter, AlertCircle
} from 'lucide-react';
import { Language, Room, Activity, StudentMembership, ProgressStatus } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { ActivityCreatorModal } from './ActivityCreatorModal';
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
  const [activities, setActivities] = useState<Activity[]>(dataService.getActivities(true));
  const [students, setStudents] = useState<StudentMembership[]>(dataService.getStudents());
  
  // Modals state
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Check URL modal param
  const searchParams = new URLSearchParams(window.location.search);
  const initialModalName = searchParams.get('modal');
  const initStudent = initialModalName ? students.find(s => s.englishNickname.toLowerCase() === initialModalName.toLowerCase()) || null : null;
  const [selectedStudent, setSelectedStudent] = useState<StudentMembership | null>(initStudent);

  const [filterSide, setFilterSide] = useState<'All' | 'Korea Class' | 'Taiwan Class'>('All');

  // Reload activities
  const reloadActivities = () => {
    setActivities(dataService.getActivities(true));
  };

  // Status toggle
  const handleStatusCycle = () => {
    const currentStatus = teacherSide === 'Korea Class' ? room.partnerAStatus : room.partnerBStatus;
    const nextStatus: ProgressStatus = 
      currentStatus === 'not_started' ? 'in_progress' :
      currentStatus === 'in_progress' ? 'completed' : 'not_started';

    const updated = dataService.updateClassStatus(teacherSide, nextStatus);
    setRoom({ ...updated });
  };

  // Activity Actions
  const handleDuplicate = (id: string) => {
    dataService.duplicateActivity(id);
    reloadActivities();
  };

  const handleToggleStatus = (act: Activity) => {
    const next = act.status === 'published' ? 'closed' : act.status === 'closed' ? 'published' : 'published';
    dataService.updateActivityStatus(act.id, next);
    reloadActivities();
  };

  const handleArchive = (id: string) => {
    dataService.updateActivityStatus(id, 'archived');
    reloadActivities();
  };

  const activeActivities = activities.filter(a => a.status === 'published');
  const closedActivities = activities.filter(a => a.status === 'closed');
  const draftOrArchived = activities.filter(a => a.status === 'draft' || a.status === 'archived');

  const displayStudents = students.filter(s => {
    if (filterSide === 'All') return true;
    return s.partnerSide === filterSide;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Controls Bar */}
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
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="btn-accent"
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>새 활동 만들기</span>
          </button>

          <button
            onClick={() => onSwitchTeacherSide(teacherSide === 'Korea Class' ? 'Taiwan Class' : 'Korea Class')}
            className="btn-outline"
            style={{ padding: '8px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} />
            <span>{teacherSide === 'Korea Class' ? '🇹🇼 Taiwan 교사 시점' : '🇰🇷 Korea 교사 시점'}</span>
          </button>
        </div>
      </div>

      {/* Room Bilateral Progress Header */}
      <div className="cb-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
          <div>
            <span className="badge badge-neutral" style={{ marginBottom: '6px' }}>Room: {room.joinCode}</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {room.title}
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>공동수업 전체 진행률</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{room.overallProgress}%</div>
          </div>
        </div>

        <div style={{ width: '100%', height: '8px', background: 'var(--color-border-light)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ width: `${room.overallProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }} />
        </div>

        {/* Bilateral Linked Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>🇰🇷 Korea Class</span>
              <span className="badge badge-warning">{room.partnerAStatus}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{room.partnerANextTask}</div>
            {teacherSide === 'Korea Class' && (
              <button onClick={handleStatusCycle} className="btn-secondary" style={{ width: '100%', padding: '4px 10px', fontSize: '0.78rem' }}>
                우리 학급 상태 변경
              </button>
            )}
          </div>

          <div style={{ color: 'var(--color-secondary)', fontWeight: 800 }}>⇄ Bridge</div>

          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>🇹🇼 Taiwan Class</span>
              <span className="badge badge-warning">{room.partnerBStatus}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{room.partnerBNextTask}</div>
            {teacherSide === 'Taiwan Class' && (
              <button onClick={handleStatusCycle} className="btn-accent" style={{ width: '100%', padding: '4px 10px', fontSize: '0.78rem' }}>
                우리 학급 상태 변경
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section H: Card-based Timeline for Activities */}
      <div className="cb-card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              공동수업 활동 타임라인 ({activities.length}개)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              교사가 제작한 활동의 라이프사이클을 관리하고 학급별 참여를 모니터링합니다.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activities.map((act) => {
            const allSubs = dataService.getSubmissions(act.id);
            const krCount = allSubs.filter(s => s.partnerSide === 'Korea Class').length;
            const twCount = allSubs.filter(s => s.partnerSide === 'Taiwan Class').length;

            return (
              <div 
                key={act.id} 
                style={{ 
                  border: '1px solid var(--color-border-light)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '14px 16px',
                  background: act.status === 'closed' ? '#FAF9F6' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ flex: '1 1 450px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>{act.type}</span>
                    <span className={`badge ${act.status === 'published' ? 'badge-success' : act.status === 'closed' ? 'badge-neutral' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                      {act.status}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {act.targetSide}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      기한: {act.startDate} ~ {act.dueDate}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)', marginBottom: '4px' }}>
                    {act.title}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    제출 현황: 🇰🇷 Korea {krCount}명 / 🇹🇼 Taiwan {twCount}명 (총 {allSubs.length}건)
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    onClick={() => { setEditingActivity(act); setIsCreatorOpen(true); }}
                    className="btn-outline"
                    style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit2 size={13} /> 수정
                  </button>
                  <button
                    onClick={() => handleDuplicate(act.id)}
                    className="btn-outline"
                    style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={13} /> 복제
                  </button>
                  <button
                    onClick={() => handleToggleStatus(act)}
                    className="btn-outline"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                  >
                    {act.status === 'published' ? '마감' : '공개'}
                  </button>
                  {act.status !== 'archived' && (
                    <button
                      onClick={() => handleArchive(act.id)}
                      className="btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#999' }}
                    >
                      <Archive size={13} /> 보관
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Student Assessment & Participation Sheet */}
      <div className="cb-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              학생별 다중 활동 참여 및 과정중심평가 ({students.length}명)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              학생 카드를 클릭하면 모든 활동의 수행 근거를 한눈에 확인하고 종합 평어를 복사할 수 있습니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['All', 'Korea Class', 'Taiwan Class'] as const).map(side => (
              <button
                key={side}
                onClick={() => setFilterSide(side)}
                className="btn-outline"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: filterSide === side ? 'var(--color-primary)' : 'transparent',
                  color: filterSide === side ? '#fff' : 'var(--color-text)'
                }}
              >
                {side === 'All' ? '전체 34명' : side === 'Korea Class' ? '🇰🇷 Korea 17명' : '🇹🇼 Taiwan 17명'}
              </button>
            ))}
          </div>
        </div>

        {/* Student Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {displayStudents.map(st => {
            const ev = dataService.getComprehensiveEvidence(st.id);
            const compCount = ev?.completedActivities.length || 0;
            const subsCount = ev?.submissions.length || 0;

            return (
              <div
                key={st.id}
                onClick={() => setSelectedStudent(st)}
                className="cb-card hoverable"
                style={{
                  cursor: 'pointer',
                  padding: '14px',
                  border: '1px solid var(--color-border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)' }}>{st.englishNickname}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{st.participantCode}</span>
                    </div>
                    <span className={`badge ${st.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`} style={{ fontSize: '0.68rem' }}>
                      {st.partnerSide === 'Korea Class' ? '🇰🇷 KR' : '🇹🇼 TW'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', fontSize: '0.78rem' }}>
                    <span className="badge badge-success">완료: {compCount}개</span>
                    <span className="badge badge-neutral">제출물: {subsCount}건</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-border-light)', fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  <span>수행 근거 & 평어 보기 →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {isCreatorOpen && (
        <ActivityCreatorModal
          activityToEdit={editingActivity}
          onClose={() => { setIsCreatorOpen(false); setEditingActivity(null); }}
          onSaved={() => { setIsCreatorOpen(false); setEditingActivity(null); reloadActivities(); }}
        />
      )}

      {selectedStudent && (
        <StudentDetailModal
          currentLang={currentLang}
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
