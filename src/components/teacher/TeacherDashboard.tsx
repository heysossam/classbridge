import React, { useState } from 'react';
import { 
  Plus, Calendar, Clock, CheckCircle2, RefreshCw, ChevronRight,
  GraduationCap, Copy, Edit2, Archive, Eye, BarChart2, Filter, 
  AlertCircle, FolderOpen, Layers, UserCheck, Trash2, Undo2, Download
} from 'lucide-react';
import { Language, Room, Activity, StudentMembership, ProgressStatus } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { ActivityCreatorModal } from './ActivityCreatorModal';
import { StudentDetailModal } from './StudentDetailModal';
import { StudentWorksDashboard } from './StudentWorksDashboard';
import { DangerousDeleteModal } from './DangerousDeleteModal';

interface TeacherDashboardProps {
  currentLang: Language;
  teacherSide: 'Korea Class' | 'Taiwan Class';
  onSwitchTeacherSide: (side: 'Korea Class' | 'Taiwan Class') => void;
  onBack: () => void;
  isReviewerMode?: boolean;
}

type TeacherTab = 'timeline' | 'works' | 'assessment' | 'archived';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentLang,
  teacherSide,
  onSwitchTeacherSide,
  onBack,
  isReviewerMode = false,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  const [activeTab, setActiveTab] = useState<TeacherTab>('timeline');

  const [room, setRoom] = useState<Room>(dataService.getRoom());
  const [activities, setActivities] = useState<Activity[]>(dataService.getActivities(true));
  const [students, setStudents] = useState<StudentMembership[]>(dataService.getStudents());
  
  // Modals state
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Dangerous Delete Modal state
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [deleteNoticeMessage, setDeleteNoticeMessage] = useState<string>('');

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

  // Activity Actions (Protected in Reviewer Mode)
  const handleDuplicate = (id: string) => {
    if (isReviewerMode) {
      alert(currentLang === 'ko' ? '평가자 체험 모드에서는 활동 복제 기능이 비활성화됩니다.' : 'Duplicate is disabled in reviewer demo mode.');
      return;
    }
    dataService.duplicateActivity(id);
    reloadActivities();
  };

  const handleToggleStatus = (act: Activity) => {
    if (isReviewerMode) {
      alert(currentLang === 'ko' ? '평가자 체험 모드에서는 활동 상태 변경이 비활성화됩니다.' : 'Status change is disabled in reviewer demo mode.');
      return;
    }
    const next = act.status === 'published' ? 'closed' : act.status === 'closed' ? 'published' : 'published';
    dataService.updateActivityStatus(act.id, next);
    reloadActivities();
  };

  const handleArchive = (id: string) => {
    if (isReviewerMode) {
      alert(currentLang === 'ko' ? '평가자 체험 모드에서는 보관 기능이 비활성화됩니다.' : 'Archive is disabled in reviewer demo mode.');
      return;
    }
    dataService.archiveActivity(id);
    reloadActivities();
  };

  const handleRestore = (id: string) => {
    if (isReviewerMode) {
      alert(currentLang === 'ko' ? '평가자 체험 모드에서는 복원 기능이 비활성화됩니다.' : 'Restore is disabled in reviewer demo mode.');
      return;
    }
    dataService.restoreActivity(id);
    reloadActivities();
  };

  const handleDeleteAttempt = (act: Activity) => {
    if (isReviewerMode) {
      alert(currentLang === 'ko' ? '평가자 체험 모드에서는 활동 삭제가 비활성화됩니다.' : 'Delete is disabled in reviewer demo mode.');
      return;
    }
    const check = dataService.canDeleteActivity(act.id);
    if (!check.canDelete) {
      setDeleteNoticeMessage(t('activity.cannotDeleteNotice'));
      setTimeout(() => setDeleteNoticeMessage(''), 5000);
      return;
    }
    setActivityToDelete(act);
  };

  const activeOrClosedActivities = activities.filter(a => a.status !== 'archived');
  const archivedActivities = activities.filter(a => a.status === 'archived');

  const displayStudents = students.filter(s => {
    if (filterSide === 'All') return true;
    return s.partnerSide === filterSide;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Requirement 3: Reviewer Demo Mode Top Banner */}
      {isReviewerMode && (
        <div style={{
          background: 'linear-gradient(90deg, #EFF6FF 0%, #F0FDF4 100%)',
          border: '1.5px solid #3B82F6',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge" style={{ background: '#2563EB', color: '#fff', fontSize: '0.8rem', padding: '4px 10px', fontWeight: 700 }}>
              평가자 체험 모드 · 가상 데이터
            </span>
            <span style={{ fontSize: '0.88rem', color: '#1E40AF', fontWeight: 500 }}>
              {currentLang === 'ko'
                ? '가상 데이터를 활용한 읽기 전용 평가 환경입니다. 실제 학생 데이터 및 비공개 메모는 격리되어 보호됩니다.'
                : 'Read-only evaluation environment with mock data. Real student data and private notes are safely isolated.'}
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#4B5563', background: '#fff', padding: '4px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid #DBEAFE', fontWeight: 600 }}>
            {currentLang === 'ko' ? 'Firebase 쓰기 차단됨 · 종료 시 초기화' : 'Firebase Writes Blocked · Reset on Exit'}
          </span>
        </div>
      )}

      {/* Top Controls Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'var(--bg-card)',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-light)',
        marginBottom: '16px',
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
            {teacherSide === 'Korea Class' 
              ? (currentLang === 'ko' ? '🇰🇷 Korea Class 교사' : currentLang === 'zh-TW' ? '🇰🇷 韓國班級教師' : '🇰🇷 Korea Class Teacher') 
              : (currentLang === 'ko' ? '🇹🇼 Taiwan Class 교사' : currentLang === 'zh-TW' ? '🇹🇼 臺灣班級教師' : '🇹🇼 Taiwan Class Teacher')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              if (isReviewerMode) {
                alert(currentLang === 'ko' ? '평가자 체험 모드에서는 데이터 내보내기가 비활성화됩니다.' : 'Data export is disabled in reviewer demo mode.');
                return;
              }
              dataService.exportRoomDataAsJSON(room.id);
            }}
            className="btn-outline"
            title={isReviewerMode ? '평가자 체험 모드에서는 내보내기가 비활성화됩니다.' : '활동, 과제물, 댓글, 투표 결과를 비식별화된 JSON 파일로 백업합니다.'}
            style={{ padding: '8px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', opacity: isReviewerMode ? 0.6 : 1 }}
          >
            <Download size={15} />
            <span>{currentLang === 'ko' ? '교류방 기록 내보내기' : currentLang === 'zh-TW' ? '匯出交流室紀錄' : 'Export Room Data'}</span>
          </button>

          <button
            onClick={() => setIsCreatorOpen(true)}
            className="btn-accent"
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>{t('teacher.createActivity')}</span>
          </button>

          <button
            onClick={() => onSwitchTeacherSide(teacherSide === 'Korea Class' ? 'Taiwan Class' : 'Korea Class')}
            className="btn-outline"
            style={{ padding: '8px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} />
            <span>{teacherSide === 'Korea Class' ? t('teacher.switchSideTaiwan') : t('teacher.switchSideKorea')}</span>
          </button>
        </div>
      </div>

      {/* Bilateral Progress Header */}
      <div className="cb-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
          <div>
            <span className="badge badge-neutral" style={{ marginBottom: '6px' }}>Room: {room.joinCode}</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {room.title}
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{t('teacher.overallProgress')}</div>
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
                {t('teacher.statusControl')}
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
                {t('teacher.statusControl')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Notice Alert if deletion blocked */}
      {deleteNoticeMessage && (
        <div style={{ 
          background: '#FEF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-sm)',
          padding: '12px 16px', color: '#991B1B', fontSize: '0.9rem', fontWeight: 700,
          marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>{deleteNoticeMessage}</span>
        </div>
      )}

      {/* Teacher Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        borderBottom: '2px solid var(--color-border-light)', 
        marginBottom: '20px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'timeline' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'timeline' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Layers size={17} />
          <span>{t('teacher.timelineTab')} ({activeOrClosedActivities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('works')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'works' ? '3px solid var(--color-accent)' : '3px solid transparent',
            color: activeTab === 'works' ? 'var(--color-accent)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <FolderOpen size={17} />
          <span>{t('teacher.worksDashboardTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('assessment')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'assessment' ? '3px solid var(--color-secondary)' : '3px solid transparent',
            color: activeTab === 'assessment' ? 'var(--color-secondary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <UserCheck size={17} />
          <span>{t('teacher.assessmentTab')} ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'archived' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'archived' ? 'var(--color-primary)' : 'var(--color-text-light)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Archive size={17} />
          <span>{t('teacher.archivedTab')} ({archivedActivities.length})</span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: 공동수업 타임라인 (Timeline & Activity Management) */}
      {/* ========================================================== */}
      {activeTab === 'timeline' && (
        <div className="cb-card" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {t('teacher.timelineTab')} ({activeOrClosedActivities.length})
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {currentLang === 'ko' ? '교사가 제작한 활동의 라이프사이클을 관리하고 학급별 참여를 모니터링합니다.' : currentLang === 'zh-TW' ? '管理教師建立之活動生命週期並掌握各班參與狀況。' : 'Manage activity lifecycles and monitor cross-classroom participation.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeOrClosedActivities.map((act) => {
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
                        {currentLang === 'ko' ? '기한:' : currentLang === 'zh-TW' ? '期限：' : 'Due:'} {act.startDate} ~ {act.dueDate}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)', marginBottom: '4px' }}>
                      {act.title}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {currentLang === 'ko' 
                        ? `제출 현황: 🇰🇷 Korea ${krCount}명 / 🇹🇼 Taiwan ${twCount}명 (총 ${allSubs.length}건)` 
                        : currentLang === 'zh-TW' 
                        ? `提交概況：🇰🇷 韓國 ${krCount} 人 / 🇹🇼 臺灣 ${twCount} 人（共 ${allSubs.length} 件）` 
                        : `Submissions: 🇰🇷 Korea ${krCount} / 🇹🇼 Taiwan ${twCount} (Total ${allSubs.length})`}
                    </div>
                  </div>

                  {/* Actions: Edit, Duplicate, Close/Open, Archive, Delete */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { setEditingActivity(act); setIsCreatorOpen(true); }}
                      className="btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit2 size={13} /> {currentLang === 'ko' ? '수정' : currentLang === 'zh-TW' ? '編輯' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDuplicate(act.id)}
                      className="btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Copy size={13} /> {currentLang === 'ko' ? '복제' : currentLang === 'zh-TW' ? '複製' : 'Duplicate'}
                    </button>
                    <button
                      onClick={() => handleToggleStatus(act)}
                      className="btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    >
                      {act.status === 'published' 
                        ? (currentLang === 'ko' ? '마감' : currentLang === 'zh-TW' ? '截止' : 'Close') 
                        : (currentLang === 'ko' ? '공개' : currentLang === 'zh-TW' ? '發布' : 'Publish')}
                    </button>
                    <button
                      onClick={() => handleArchive(act.id)}
                      className="btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#666' }}
                    >
                      <Archive size={13} /> {t('activity.archive')}
                    </button>
                    {act.status === 'draft' && (
                      <button
                        onClick={() => handleDeleteAttempt(act)}
                        className="btn-outline"
                        style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#DC2626' }}
                      >
                        <Trash2 size={13} /> {t('activity.deletePermanent')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: 학생 작품 대시보드 (Student Works Dashboard) */}
      {/* ========================================================== */}
      {activeTab === 'works' && (
        <StudentWorksDashboard
          currentLang={currentLang}
          activities={activities}
          students={students}
          onRefreshNeeded={reloadActivities}
          isReviewerMode={isReviewerMode}
        />
      )}

      {/* ========================================================== */}
      {/* TAB 3: 과정중심평가 시트 (Assessment Sheet) */}
      {/* ========================================================== */}
      {activeTab === 'assessment' && (
        <div className="cb-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {t('teacher.assessmentTab')} ({students.length})
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {currentLang === 'ko' 
                  ? '학생 카드를 클릭하면 모든 활동의 수행 근거를 한눈에 확인하고 종합 평어를 복사할 수 있습니다.' 
                  : currentLang === 'zh-TW' 
                  ? '點擊學生卡片可綜覽所有活動歷程實證並複製綜合評語。' 
                  : 'Click a student card to inspect comprehensive evidence and copy assessment comments.'}
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
                  {side === 'All' 
                    ? (currentLang === 'ko' ? '전체 34명' : currentLang === 'zh-TW' ? '全體 34人' : 'All 34') 
                    : side === 'Korea Class' 
                    ? (currentLang === 'ko' ? '🇰🇷 Korea 17명' : currentLang === 'zh-TW' ? '🇰🇷 韓國 17人' : '🇰🇷 Korea 17') 
                    : (currentLang === 'ko' ? '🇹🇼 Taiwan 17명' : currentLang === 'zh-TW' ? '🇹🇼 臺灣 17人' : '🇹🇼 Taiwan 17')}
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
                      <span className="badge badge-success">
                        {currentLang === 'ko' ? `완료: ${compCount}개` : currentLang === 'zh-TW' ? `完成：${compCount} 項` : `Completed: ${compCount}`}
                      </span>
                      <span className="badge badge-neutral">
                        {currentLang === 'ko' ? `제출물: ${subsCount}건` : currentLang === 'zh-TW' ? `提交物：${subsCount} 件` : `Works: ${subsCount}`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-border-light)', fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    <span>{t('teacher.viewStudentDetail')} →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: 보관된 활동 (Archived Activities & Safe Deletion) */}
      {/* ========================================================== */}
      {activeTab === 'archived' && (
        <div className="cb-card">
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {t('activity.archivedListTitle')} ({archivedActivities.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {t('activity.archivedListDesc')}
            </p>
          </div>

          {archivedActivities.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              {currentLang === 'ko' ? '보관된 활동이 없습니다.' : currentLang === 'zh-TW' ? '尚無封存的活動。' : 'No archived activities.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {archivedActivities.map(act => {
                const subs = dataService.getSubmissions(act.id);
                const canDel = dataService.canDeleteActivity(act.id).canDelete;

                return (
                  <div
                    key={act.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 18px',
                      background: 'var(--bg-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge badge-neutral">{act.type}</span>
                        <span className="badge badge-neutral">
                          {currentLang === 'ko' ? '보관됨' : currentLang === 'zh-TW' ? '已封存' : 'Archived'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                          {currentLang === 'ko' ? `학생 제출 ${subs.length}건` : currentLang === 'zh-TW' ? `學生提交 ${subs.length} 件` : `Submissions: ${subs.length}`}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                        {act.title}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleRestore(act.id)}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Undo2 size={14} />
                        <span>{t('activity.restore')}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAttempt(act)}
                        className="btn-outline"
                        style={{ 
                          padding: '6px 14px', 
                          fontSize: '0.82rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          color: canDel ? '#DC2626' : '#9CA3AF',
                          borderColor: canDel ? '#FCA5A5' : '#E5E7EB'
                        }}
                      >
                        <Trash2 size={14} />
                        <span>{t('activity.deletePermanent')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Activity Creator Modal */}
      {isCreatorOpen && (
        <ActivityCreatorModal
          currentLang={currentLang}
          activityToEdit={editingActivity}
          onClose={() => { setIsCreatorOpen(false); setEditingActivity(null); }}
          onSaved={() => { setIsCreatorOpen(false); setEditingActivity(null); reloadActivities(); }}
        />
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          currentLang={currentLang}
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          isReviewerMode={isReviewerMode}
        />
      )}

      {/* Dangerous Delete Modal */}
      {activityToDelete && (
        <DangerousDeleteModal
          currentLang={currentLang}
          activity={activityToDelete}
          onClose={() => setActivityToDelete(null)}
          onDeleted={() => {
            setActivityToDelete(null);
            reloadActivities();
          }}
        />
      )}
    </div>
  );
};
