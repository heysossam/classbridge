import React, { useState } from 'react';
import { 
  FolderOpen, UserCheck, Search, Filter, ArrowUpDown, Calendar, 
  Heart, MessageSquare, CheckCircle2, Clock, Globe, Eye, EyeOff, 
  FileText, Lock, ChevronRight, Copy, Check, AlertCircle, Layers
} from 'lucide-react';
import { 
  Language, Activity, StudentMembership, Submission, Comment, 
  ActivitySummaryStats, StudentPortfolioData, StudentPortfolioRecord 
} from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { SubmissionDetailModal } from './SubmissionDetailModal';
import { generateComprehensiveEvaluation } from '../../services/evaluationEngine';

interface StudentWorksDashboardProps {
  currentLang: Language;
  activities: Activity[];
  students: StudentMembership[];
  onRefreshNeeded?: () => void;
  isReviewerMode?: boolean;
}

export const StudentWorksDashboard: React.FC<StudentWorksDashboardProps> = ({
  currentLang,
  activities,
  students,
  onRefreshNeeded,
  isReviewerMode = false,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  // Top view mode: 'by_activity' vs 'by_student'
  const [viewMode, setViewMode] = useState<'by_activity' | 'by_student'>('by_activity');

  // ----------------------------------------------------
  // Mode A: By Activity State
  // ----------------------------------------------------
  const nonArchivedActivities = activities.filter(a => a.status !== 'archived');
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    nonArchivedActivities[0]?.id || activities[0]?.id || ''
  );

  const selectedActivity = activities.find(a => a.id === selectedActivityId) || nonArchivedActivities[0];
  const summaryStats: ActivitySummaryStats | null = selectedActivity 
    ? dataService.getActivitySummary(selectedActivity.id) 
    : null;

  // Filters for Mode A
  const [sideFilter, setSideFilter] = useState<'All' | 'Korea Class' | 'Taiwan Class'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'submitted' | 'pending' | 'public' | 'hidden'>('All');
  const [langFilter, setLangFilter] = useState<string>('All');
  const [searchNickname, setSearchNickname] = useState('');
  const [searchCode, setSearchCode] = useState('');

  // Sorting for Mode A
  type SortOption = 'newest' | 'oldest' | 'nickname' | 'comments' | 'likes';
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Selected Submission for Modal
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);

  // ----------------------------------------------------
  // Mode B: By Student Portfolio State
  // ----------------------------------------------------
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [portfolioStudentSearch, setPortfolioStudentSearch] = useState('');
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [portfolioNoteSaved, setPortfolioNoteSaved] = useState<Record<string, boolean>>({});
  const [portfolioNotes, setPortfolioNotes] = useState<Record<string, string>>(() => {
    const n = dataService.getTeacherNotes();
    const map: Record<string, string> = {};
    Object.keys(n).forEach(k => { map[k] = n[k].note; });
    return map;
  });
  const [copiedPortEval, setCopiedPortEval] = useState(false);

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const portfolioData: StudentPortfolioData | null = selectedStudent 
    ? dataService.getStudentPortfolio(selectedStudent.id) 
    : null;

  // ----------------------------------------------------
  // Helpers for Mode A Submissions Filtering & Sorting
  // ----------------------------------------------------
  const rawSubmissions = selectedActivity ? dataService.getSubmissions(selectedActivity.id) : [];

  const filteredSubmissions = rawSubmissions.filter(sub => {
    // Partner side filter
    if (sideFilter !== 'All' && sub.partnerSide !== sideFilter) return false;

    // Status filter
    if (statusFilter === 'public' && sub.isHidden) return false;
    if (statusFilter === 'hidden' && !sub.isHidden) return false;
    if (statusFilter === 'pending' && sub.isApproved) return false;

    // Language filter
    if (langFilter !== 'All' && sub.language !== langFilter) return false;

    // Search nickname
    if (searchNickname.trim() && !sub.englishNickname.toLowerCase().includes(searchNickname.trim().toLowerCase())) {
      return false;
    }

    // Search participant code
    if (searchCode.trim() && !sub.participantCode.toUpperCase().includes(searchCode.trim().toUpperCase())) {
      return false;
    }

    return true;
  });

  // Sort submissions
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortOption === 'newest') {
      return (b.submittedAt || '').localeCompare(a.submittedAt || '');
    }
    if (sortOption === 'oldest') {
      return (a.submittedAt || '').localeCompare(b.submittedAt || '');
    }
    if (sortOption === 'nickname') {
      return a.englishNickname.localeCompare(b.englishNickname);
    }
    if (sortOption === 'comments') {
      const cA = dataService.getComments(a.id).length;
      const cB = dataService.getComments(b.id).length;
      return cB - cA;
    }
    if (sortOption === 'likes') {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    return 0;
  });

  const handleSavePortfolioNote = (studentId: string, text: string) => {
    dataService.saveTeacherNote(studentId, text);
    setPortfolioNoteSaved(prev => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setPortfolioNoteSaved(prev => ({ ...prev, [studentId]: false }));
    }, 2500);
    if (onRefreshNeeded) onRefreshNeeded();
  };

  const handleCopyPortfolioEval = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPortEval(true);
    setTimeout(() => setCopiedPortEval(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Mode Toggle: By Activity vs By Student */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'var(--bg-card)', 
        padding: '12px 18px', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--color-border-light)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('by_activity')}
            className="btn-outline"
            style={{
              padding: '8px 16px',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: viewMode === 'by_activity' ? 'var(--color-primary)' : '#fff',
              color: viewMode === 'by_activity' ? '#fff' : 'var(--color-primary)',
              border: '1px solid var(--color-primary)'
            }}
          >
            <FolderOpen size={17} />
            <span>{t('teacher.byActivity')}</span>
          </button>

          <button
            onClick={() => setViewMode('by_student')}
            className="btn-outline"
            style={{
              padding: '8px 16px',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: viewMode === 'by_student' ? 'var(--color-primary)' : '#fff',
              color: viewMode === 'by_student' ? '#fff' : 'var(--color-primary)',
              border: '1px solid var(--color-primary)'
            }}
          >
            <UserCheck size={17} />
            <span>{t('teacher.byStudent')}</span>
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={14} color="var(--color-secondary)" />
          <span>{t('teacher.privateNoteHidden')}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE A: 과제별 작품함 (Submissions by Activity) */}
      {/* ========================================================================= */}
      {viewMode === 'by_activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Activity Selector Strip */}
          <div className="cb-card" style={{ padding: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
              {t('teacher.selectActivity')}:
            </label>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {nonArchivedActivities.map(act => {
                const isSelected = act.id === selectedActivityId;
                const subsCount = dataService.getSubmissions(act.id).length;
                return (
                  <button
                    key={act.id}
                    onClick={() => setSelectedActivityId(act.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isSelected ? 'var(--color-secondary-light)' : '#fff',
                      color: 'var(--color-primary)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.12s ease, border-color 0.12s ease'
                    }}
                  >
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{act.type}</span>
                    <span>{act.title}</span>
                    <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{subsCount}건</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Top Summary Statistics Box */}
          {summaryStats && selectedActivity && (
            <div className="cb-card" style={{ background: 'var(--bg-subtle)', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{selectedActivity.type}</span>
                    <span className="badge badge-neutral">{t('teacher.targetSide')}: {selectedActivity.targetSide}</span>
                    <span className={`badge ${selectedActivity.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
                      {selectedActivity.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {selectedActivity.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ background: '#fff', padding: '8px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 600 }}>{t('teacher.totalTargetStudents')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{summaryStats.targetCount}명</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 600 }}>{t('teacher.submitted')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>{summaryStats.submittedCount}명</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 600 }}>{t('teacher.unsubmittedCount')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)' }}>{summaryStats.unsubmittedCount}명</div>
                  </div>
                </div>
              </div>

              {/* Secondary Stats Strip */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)' }}>
                <span style={{ color: 'var(--color-text)' }}>
                  🇰🇷 <strong>{t('teacher.koreaSubmissions')}:</strong> {summaryStats.koreaSubmissionsCount}건
                </span>
                <span style={{ color: 'var(--color-text)' }}>
                  🇹🇼 <strong>{t('teacher.taiwanSubmissions')}:</strong> {summaryStats.taiwanSubmissionsCount}건
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  💬 <strong>{t('teacher.totalComments')}:</strong> {summaryStats.commentsCount}개
                </span>
                <span style={{ color: 'var(--color-accent)' }}>
                  ❤️ <strong>{t('teacher.totalLikes')}:</strong> {summaryStats.likesCount}개
                </span>
              </div>
            </div>
          )}

          {/* Filters & Search Toolbar */}
          <div className="cb-card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
              {/* Partner Side Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', marginBottom: '3px' }}>
                  {t('teacher.targetSide')}
                </label>
                <select
                  value={sideFilter}
                  onChange={(e) => setSideFilter(e.target.value as any)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                >
                  <option value="All">{t('teacher.all')} 학급</option>
                  <option value="Korea Class">🇰🇷 Korea Class</option>
                  <option value="Taiwan Class">🇹🇼 Taiwan Class</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', marginBottom: '3px' }}>
                  공개/승인 상태
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                >
                  <option value="All">{t('teacher.all')} 상태</option>
                  <option value="public">{t('teacher.public')} 작품</option>
                  <option value="hidden">{t('teacher.hidden')} 작품</option>
                  <option value="pending">{t('teacher.pendingApproval')}</option>
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', marginBottom: '3px' }}>
                  {t('teacher.langFilter')}
                </label>
                <select
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                >
                  <option value="All">{t('teacher.all')} 언어</option>
                  <option value="en">English (en)</option>
                  <option value="ko">한국어 (ko)</option>
                  <option value="zh-TW">繁體中文 (zh-TW)</option>
                </select>
              </div>

              {/* Nickname Search */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', marginBottom: '3px' }}>
                  {t('teacher.searchNickname')}
                </label>
                <input
                  type="text"
                  value={searchNickname}
                  onChange={(e) => setSearchNickname(e.target.value)}
                  placeholder="예: Sunny, Alice"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* Code Search */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', marginBottom: '3px' }}>
                  {t('teacher.searchCode')}
                </label>
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="예: K7M4"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* Sorting */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', marginBottom: '3px' }}>
                  {t('teacher.sort')}
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                >
                  <option value="newest">{t('teacher.newest')}</option>
                  <option value="oldest">{t('teacher.oldest')}</option>
                  <option value="nickname">{t('teacher.nameAZ')}</option>
                  <option value="comments">{t('teacher.mostComments')}</option>
                  <option value="likes">{t('teacher.mostLikes')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Work Cards Grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                제출된 학생 작품 ({sortedSubmissions.length}개)
              </span>
            </div>

            {sortedSubmissions.length === 0 ? (
              <div className="cb-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                {t('teacher.noSubmissions')}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {sortedSubmissions.map(sub => {
                  const subComments = dataService.getComments(sub.id);

                  return (
                    <div
                      key={sub.id}
                      className="cb-card hoverable"
                      style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid var(--color-border-light)',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Author Info Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                                {sub.englishNickname}
                              </span>
                              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                                {sub.participantCode}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                              {sub.submittedAt}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span className={`badge ${sub.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`} style={{ fontSize: '0.68rem' }}>
                              {sub.partnerSide === 'Korea Class' ? '🇰🇷 KR' : '🇹🇼 TW'}
                            </span>
                            <span className={`badge ${sub.isHidden ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                              {sub.isHidden ? t('teacher.hidden') : t('teacher.public')}
                            </span>
                          </div>
                        </div>

                        {/* Poll option badge if poll */}
                        {sub.selectedOptions && sub.selectedOptions.length > 0 && selectedActivity?.pollConfig && (
                          <div style={{ marginBottom: '8px' }}>
                            {sub.selectedOptions.map(optId => {
                              const opt = selectedActivity.pollConfig?.options.find(o => o.id === optId);
                              return (
                                <span key={optId} className="badge badge-accent" style={{ fontSize: '0.72rem', marginRight: '4px' }}>
                                  선택: {opt ? opt.text : optId}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Title if present */}
                        {sub.title && (
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: '4px' }}>
                            {sub.title}
                          </div>
                        )}

                        {/* Content Excerpt */}
                        <p style={{
                          fontSize: '0.88rem',
                          color: 'var(--color-text)',
                          lineHeight: 1.5,
                          marginBottom: '10px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {sub.content}
                        </p>

                        {/* Translation excerpt if exists */}
                        {sub.translationEn && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '8px', background: 'var(--bg-subtle)', padding: '4px 8px', borderRadius: 'var(--radius-xs)' }}>
                            En: "{sub.translationEn.length > 50 ? sub.translationEn.substring(0, 50) + '...' : sub.translationEn}"
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Comments, Likes, View Button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)' }}>
                            <Heart size={14} fill="currentColor" /> {sub.likesCount || 0}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)' }}>
                            <MessageSquare size={14} /> {subComments.length}
                          </span>
                        </div>

                        <button
                          onClick={() => setActiveSubmission(sub)}
                          className="btn-primary"
                          style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                        >
                          {t('teacher.viewSubmission')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE B: 학생별 포트폴리오 (Student Portfolio) */}
      {/* ========================================================================= */}
      {viewMode === 'by_student' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Student Selector Bar */}
          <div className="cb-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {t('teacher.portfolioTitle')} — 학생 선택 ({students.length}명):
              </label>
              <input
                type="text"
                value={portfolioStudentSearch}
                onChange={(e) => setPortfolioStudentSearch(e.target.value)}
                placeholder="영어 이름 또는 참여코드 검색..."
                style={{ padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', fontSize: '0.82rem', width: '220px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {students
                .filter(st => {
                  if (!portfolioStudentSearch.trim()) return true;
                  const q = portfolioStudentSearch.toLowerCase();
                  return st.englishNickname.toLowerCase().includes(q) || st.participantCode.toLowerCase().includes(q);
                })
                .map(st => {
                  const isSelected = st.id === selectedStudentId;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isSelected ? 'var(--color-secondary-light)' : '#fff',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{st.partnerSide === 'Korea Class' ? '🇰🇷' : '🇹🇼'}</span>
                      <span>{st.englishNickname}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>{st.participantCode}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Student Portfolio Summary Statistics Box */}
          {portfolioData && (
            <div className="cb-card" style={{ background: 'var(--bg-subtle)', borderLeft: '4px solid var(--color-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className={`badge ${portfolioData.student.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`}>
                      {portfolioData.student.partnerSide === 'Korea Class' ? '🇰🇷 Korea Class' : '🇹🇼 Taiwan Class'}
                    </span>
                    <span className="badge badge-neutral">Code: {portfolioData.student.participantCode}</span>
                  </div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {portfolioData.student.englishNickname} 학생의 전체 수행 기록
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ background: '#fff', padding: '8px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 600 }}>{t('teacher.totalAssigned')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{portfolioData.totalAssigned}개</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 600 }}>{t('teacher.completed')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>{portfolioData.completedCount}개</div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 600 }}>{t('teacher.incomplete')}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)' }}>{portfolioData.incompleteCount}개</div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics Strip */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span>❓ <strong>{t('teacher.questionsAsked')}:</strong> {portfolioData.questionsCount}건</span>
                  <span>💡 <strong>{t('teacher.answersGiven')}:</strong> {portfolioData.answersCount}건</span>
                  <span>💬 <strong>{t('teacher.commentsCount')}:</strong> {portfolioData.commentsCount}개</span>
                  <span style={{ color: 'var(--color-accent)' }}>❤️ <strong>{t('teacher.likesReceived')}:</strong> {portfolioData.likesReceivedCount}개</span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={onlyIncomplete}
                    onChange={(e) => setOnlyIncomplete(e.target.checked)}
                  />
                  <span>{t('teacher.onlyIncomplete')}</span>
                </label>
              </div>
            </div>
          )}

          {/* Student Portfolio Timeline List */}
          {portfolioData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {portfolioData.records
                .filter(rec => !onlyIncomplete || !rec.isCompleted)
                .map((rec, idx) => {
                  return (
                    <div
                      key={rec.activity.id}
                      className="cb-card"
                      style={{
                        padding: '18px',
                        borderLeft: rec.isCompleted ? '4px solid var(--color-success)' : '4px solid var(--color-warning)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                              {rec.activity.type}
                            </span>
                            <span className={`badge ${rec.isCompleted ? 'badge-success' : 'badge-warning'}`}>
                              {rec.isCompleted ? t('teacher.completed') : t('teacher.incomplete')}
                            </span>
                            {rec.submission && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                                제출일: {rec.submission.submittedAt}
                              </span>
                            )}
                          </div>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {idx + 1}. {rec.activity.title}
                          </h4>
                        </div>

                        {rec.submission && (
                          <button
                            onClick={() => setActiveSubmission(rec.submission!)}
                            className="btn-outline"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          >
                            {t('teacher.viewSubmission')}
                          </button>
                        )}
                      </div>

                      {/* Content Section */}
                      {rec.isCompleted && rec.submission ? (
                        <div style={{ background: '#FAF9F5', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', border: '1px solid var(--color-border-light)' }}>
                          {/* Poll selection if poll */}
                          {rec.submission.selectedOptions && rec.submission.selectedOptions.length > 0 && rec.activity.pollConfig && (
                            <div style={{ marginBottom: '6px' }}>
                              {rec.submission.selectedOptions.map(optId => {
                                const opt = rec.activity.pollConfig?.options.find(o => o.id === optId);
                                return (
                                  <span key={optId} className="badge badge-accent" style={{ marginRight: '6px', fontSize: '0.75rem' }}>
                                    선택: {opt ? opt.text : optId}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {rec.submission.title && (
                            <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                              {rec.submission.title}
                            </div>
                          )}

                          <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                            {rec.submission.content}
                          </div>

                          {rec.submission.translationEn && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
                              Eng: "{rec.submission.translationEn}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ background: '#FFFBEB', color: '#B45309', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={16} />
                          <span>아직 제출되지 않은 과제입니다. 기한: {rec.activity.dueDate}</span>
                        </div>
                      )}

                      {/* Comments & Likes for this activity */}
                      {rec.studentComments.length > 0 && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                          💬 학생이 이 활동에 작성한 댓글: {rec.studentComments.length}건
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Teacher Observation Note & Overall Assessment for Selected Student (Requirement 3: 평가자 체험 모드에서는 비공개) */}
          {selectedStudent && (
            <div className="cb-card" style={{ borderTop: isReviewerMode ? '4px solid var(--color-border)' : '4px solid var(--color-primary)' }}>
              {isReviewerMode ? (
                <div style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Lock size={18} color="var(--color-text-muted)" />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-muted)', margin: 0 }}>
                      교사 비공개 관찰 메모 (평가자 체험 모드 열람 제한)
                    </h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                    보안 및 개인정보 보호 원칙에 따라 평가자 체험 모드에서는 비공개 교사 관찰 메모가 비공개 처리됩니다.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Lock size={18} color="var(--color-secondary)" />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {selectedStudent.englishNickname} 학생 전용 교사 비공개 관찰 메모
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {t('teacher.privateNoteHidden')}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={portfolioNotes[selectedStudent.id] || ''}
                    onChange={(e) => setPortfolioNotes({ ...portfolioNotes, [selectedStudent.id]: e.target.value })}
                    placeholder="학생의 포트폴리오를 종합 검토하고 수업 관찰 기록을 작성하세요..."
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', marginBottom: '8px' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                    {portfolioNoteSaved[selectedStudent.id] && (
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={15} /> {t('teacher.noteSaved')}
                      </span>
                    )}
                    <button
                      onClick={() => handleSavePortfolioNote(selectedStudent.id, portfolioNotes[selectedStudent.id] || '')}
                      className="btn-primary"
                      style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                    >
                      {t('teacher.saveNote')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submission Detail Modal */}
      {activeSubmission && selectedActivity && (
        <SubmissionDetailModal
          currentLang={currentLang}
          submission={activeSubmission}
          activity={selectedActivity}
          onClose={() => setActiveSubmission(null)}
          onUpdated={() => {
            if (onRefreshNeeded) onRefreshNeeded();
          }}
        />
      )}
    </div>
  );
};
