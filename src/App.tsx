import React, { useState, useEffect } from 'react';
import { Language, UserRole, StudentMembership, Activity } from './types';
import { Header } from './components/common/Header';
import { StartScreen } from './components/start/StartScreen';
import { StudentJoin } from './components/student/StudentJoin';
import { StudentActivityList } from './components/student/StudentActivityList';
import { UniversalActivityView } from './components/student/UniversalActivityView';
import { TeacherLogin } from './components/teacher/TeacherLogin';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminView } from './components/admin/AdminView';
import { AdminRestrictedModal } from './components/common/AdminRestrictedModal';
import { dataService } from './services/dataService';
import { logoutFirebaseUser } from './firebase';

type AppView = 
  | 'start' 
  | 'student_join' 
  | 'student_activities' 
  | 'student_activity_detail' 
  | 'teacher_login' 
  | 'teacher_dashboard' 
  | 'admin';

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialLang = (searchParams.get('lang') as Language) || 'ko';
  
  // Reviewer URL query check: synchronous initialization
  const isReviewerUrl = searchParams.get('reviewer') === 'true' || searchParams.get('mode') === 'reviewer';
  if (isReviewerUrl && !dataService.getIsReviewerMode()) {
    dataService.setReviewerMode(true);
  }

  // Teacher session from current browser session
  const savedTeacherSide = (sessionStorage.getItem('cb_teacher_side') as 'Korea Class' | 'Taiwan Class') || null;
  const isTeacherSavedAuth = !!savedTeacherSide;

  // Direct URL admin & teacher dashboard access defense
  // NOTE: In this LocalStorage MVP, client-side route guards prevent students and unauthorized users
  // from directly entering teacher dashboards or admin screens via URL parameter manipulation (?view=...).
  // True server-side security authorization will be enforced upon Firebase integration via
  // Firebase Authentication (Custom Claims) and Firestore Security Rules.
  const requestedViewParam = searchParams.get('view');
  const isDirectAdminAccess = requestedViewParam === 'admin';
  const isDirectTeacherAccess = requestedViewParam === 'teacher_dashboard' && !isTeacherSavedAuth && !isReviewerUrl;

  // If directly requesting teacher_dashboard without prior authentication, route to teacher_login
  const initialView: AppView = isDirectAdminAccess 
    ? 'start' 
    : isDirectTeacherAccess 
    ? 'teacher_login' 
    : isReviewerUrl
    ? 'teacher_dashboard'
    : ((requestedViewParam as AppView) || 'start');

  const [currentLang, setCurrentLang] = useState<Language>(initialLang);
  const [currentView, setCurrentView] = useState<AppView>(initialView);
  const [showAdminRestrictedModal, setShowAdminRestrictedModal] = useState<boolean>(isDirectAdminAccess);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(isTeacherSavedAuth || isReviewerUrl);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isReviewerMode, setIsReviewerMode] = useState<boolean>(isReviewerUrl);

  // Student Session: Only restore if explicit code parameter is provided
  const studentCodeParam = searchParams.get('code');
  const initialStudent = studentCodeParam 
    ? dataService.getStudents().find(s => s.participantCode.toUpperCase() === studentCodeParam.toUpperCase()) || null
    : null;
  const [studentSession, setStudentSession] = useState<StudentMembership | null>(initialStudent);

  // Selected Activity for Student View: Only restore if explicit act parameter is provided
  const actIdParam = searchParams.get('act');
  const initialAct = actIdParam ? dataService.getActivityById(actIdParam) || null : null;
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(initialAct);

  // Teacher Session State
  const [teacherSide, setTeacherSide] = useState<'Korea Class' | 'Taiwan Class'>(savedTeacherSide || 'Korea Class');

  // Handle direct URL admin attempt cleanup
  useEffect(() => {
    if (isDirectAdminAccess || isDirectTeacherAccess) {
      const url = new URL(window.location.href);
      if (isDirectAdminAccess) url.searchParams.delete('view');
      if (isDirectTeacherAccess) url.searchParams.set('view', 'teacher_login');
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
    }
  }, [isDirectAdminAccess, isDirectTeacherAccess]);

  // Route guard: Prevent any unauthorized access to admin or unauthenticated teacher dashboard
  useEffect(() => {
    if (currentView === 'admin' && !isAdminAuthenticated) {
      setCurrentView('start');
      setShowAdminRestrictedModal(true);
    } else if (currentView === 'teacher_dashboard' && !isTeacherAuthenticated && !isReviewerMode) {
      // Screen-level block: Redirect unauthenticated teacher dashboard access to login
      setCurrentView('teacher_login');
    }
  }, [currentView, isTeacherAuthenticated, isAdminAuthenticated, isReviewerMode]);

  // URL state synchronization: keeps current view, language, and context in sync for refresh resilience
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', currentLang);
    if (currentView !== 'start') {
      url.searchParams.set('view', currentView);
    } else {
      url.searchParams.delete('view');
    }

    if (isReviewerMode) {
      url.searchParams.set('reviewer', 'true');
    } else {
      url.searchParams.delete('reviewer');
      url.searchParams.delete('mode');
    }

    if (currentView.startsWith('student') && studentSession) {
      url.searchParams.set('code', studentSession.participantCode);
    } else {
      url.searchParams.delete('code');
    }

    if (currentView === 'student_activity_detail' && selectedActivity) {
      url.searchParams.set('act', selectedActivity.id);
    } else {
      url.searchParams.delete('act');
    }

    window.history.replaceState({}, document.title, url.pathname + url.search);
  }, [currentView, currentLang, studentSession, selectedActivity, isReviewerMode]);

  // Sync initial view when direct student URL params are used
  useEffect(() => {
    if ((initialView as string) === 'student_activity' || initialView === 'student_activity_detail') {
      setCurrentView('student_activity_detail');
    } else if (initialView === 'student_activities') {
      setCurrentView('student_activities');
    }
  }, [initialView]);

  const currentRole: UserRole | null = 
    currentView.startsWith('student') ? 'student' :
    currentView.startsWith('teacher') ? 'teacher' :
    currentView === 'admin' ? 'admin' : null;

  const handleSelectRole = (role: UserRole) => {
    if (role === 'student') {
      setCurrentView('student_join');
    } else if (role === 'teacher') {
      setCurrentView('teacher_login');
    } else if (role === 'admin') {
      // Direct admin role selection is blocked before Firebase Google Auth
      setShowAdminRestrictedModal(true);
    }
  };

  const handleStudentJoinSuccess = (student: StudentMembership) => {
    setStudentSession(student);
    setCurrentView('student_activities'); // Go to 'My Joint Activities' list
  };

  const handleSelectStudentActivity = (act: Activity) => {
    setSelectedActivity(act);
    setCurrentView('student_activity_detail');
  };

  const handleTeacherLoginSuccess = (side: 'Korea Class' | 'Taiwan Class') => {
    dataService.setReviewerMode(false);
    setIsReviewerMode(false);
    setIsTeacherAuthenticated(true);
    setTeacherSide(side);
    sessionStorage.setItem('cb_teacher_side', side);
    setCurrentView('teacher_dashboard');
  };

  // Requirement 3: 안전한 평가자 체험 모드 진입
  const handleEnterReviewerMode = () => {
    dataService.setReviewerMode(true);
    setIsReviewerMode(true);
    setIsTeacherAuthenticated(true);
    setTeacherSide('Korea Class');
    setCurrentView('teacher_dashboard');
  };

  // Requirement 2: 모든 화면의 나가기 버튼 정상화 및 공통 초기화 함수
  const handleGlobalExit = async () => {
    // 1. React 상태 초기화
    setIsTeacherAuthenticated(false);
    setIsAdminAuthenticated(false);
    setIsReviewerMode(false);
    setStudentSession(null);
    setSelectedActivity(null);
    setShowAdminRestrictedModal(false);
    setCurrentView('start');

    // 2. dataService reviewer mode 정리
    dataService.setReviewerMode(false);

    // 3. sessionStorage의 현재 화면 및 역할 상태 제거
    sessionStorage.removeItem('cb_teacher_side');
    sessionStorage.clear();

    // 4. URL의 view, code, act, modal, reviewer 등 화면 복원용 query parameter 제거
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('code');
    url.searchParams.delete('act');
    url.searchParams.delete('modal');
    url.searchParams.delete('reviewer');
    url.searchParams.delete('mode');
    const cleanUrl = url.pathname + (url.searchParams.get('lang') ? `?lang=${url.searchParams.get('lang')}` : '');
    window.history.replaceState({}, document.title, cleanUrl);

    // 5. 학생 익명 세션 또는 Google 세션이 있으면 적절히 signOut
    try {
      await logoutFirebaseUser();
    } catch (e) {
      console.warn('Firebase sign out notice on exit:', e);
    }
  };

  return (
    <div className="app-container">
      <Header
        currentLang={currentLang}
        onSelectLang={setCurrentLang}
        currentRole={currentRole}
        onExitRole={handleGlobalExit}
        isReviewerMode={isReviewerMode}
      />

      <main className="main-content">
        {currentView === 'start' && (
          <StartScreen
            currentLang={currentLang}
            onSelectRole={handleSelectRole}
            onAdminClick={() => setShowAdminRestrictedModal(true)}
            onReviewerClick={handleEnterReviewerMode}
          />
        )}

        {currentView === 'student_join' && (
          <StudentJoin
            currentLang={currentLang}
            onJoinSuccess={handleStudentJoinSuccess}
            onBack={handleGlobalExit}
          />
        )}

        {currentView === 'student_activities' && studentSession && (
          <StudentActivityList
            currentLang={currentLang}
            student={studentSession}
            onSelectActivity={handleSelectStudentActivity}
            onBack={handleGlobalExit}
          />
        )}

        {currentView === 'student_activity_detail' && studentSession && selectedActivity && (
          <UniversalActivityView
            currentLang={currentLang}
            student={studentSession}
            activity={selectedActivity}
            onBack={() => setCurrentView('student_activities')}
          />
        )}

        {currentView === 'teacher_login' && (
          <TeacherLogin
            currentLang={currentLang}
            onLoginSuccess={handleTeacherLoginSuccess}
            onBack={handleGlobalExit}
            onEnterReviewerMode={handleEnterReviewerMode}
          />
        )}

        {currentView === 'teacher_dashboard' && (
          <TeacherDashboard
            currentLang={currentLang}
            teacherSide={teacherSide}
            onSwitchTeacherSide={setTeacherSide}
            onBack={handleGlobalExit}
            isReviewerMode={isReviewerMode}
          />
        )}

        {/* AdminView is rendered only if authorized (currently blocked) */}
        {currentView === 'admin' && (
          <AdminView
            currentLang={currentLang}
            onBack={handleGlobalExit}
          />
        )}
      </main>

      {/* Admin Access Restriction Notice Modal */}
      <AdminRestrictedModal
        isOpen={showAdminRestrictedModal}
        onClose={() => setShowAdminRestrictedModal(false)}
        onAdminAuthenticated={() => {
          setIsAdminAuthenticated(true);
          setCurrentView('admin');
        }}
        currentLang={currentLang}
      />
    </div>
  );
}
