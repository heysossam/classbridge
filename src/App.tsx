import React, { useState, useEffect, useRef } from 'react';
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
import { StudentLoadingCard, StudentErrorCard } from './components/student/StudentEntryStateCard';
import { dataService } from './services/dataService';
import { logoutFirebaseUser, loginAnonymouslyStudent } from './firebase';

type AppView = 
  | 'start' 
  | 'student_join' 
  | 'student_activities' 
  | 'student_activity_detail' 
  | 'teacher_login' 
  | 'teacher_dashboard' 
  | 'admin';

export type StudentEntryStatus = 
  | 'idle' 
  | 'validating' 
  | 'authenticating' 
  | 'loadingData' 
  | 'ready' 
  | 'error';

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
  const requestedViewParam = searchParams.get('view');
  const studentCodeParam = searchParams.get('code');
  const actIdParam = searchParams.get('act');
  const isDirectAdminAccess = requestedViewParam === 'admin';
  const isDirectTeacherAccess = requestedViewParam === 'teacher_dashboard' && !isTeacherSavedAuth && !isReviewerUrl;

  const isStudentDeepLink = !!(studentCodeParam && (requestedViewParam?.startsWith('student') || requestedViewParam === null) && !isReviewerUrl);

  // Initial view decision
  const initialView: AppView = isDirectAdminAccess 
    ? 'start' 
    : isDirectTeacherAccess 
    ? 'teacher_login' 
    : isReviewerUrl
    ? 'teacher_dashboard'
    : isStudentDeepLink
    ? 'student_activities'
    : ((requestedViewParam as AppView) || 'start');

  const [currentLang, setCurrentLang] = useState<Language>(initialLang);
  const [currentView, setCurrentView] = useState<AppView>(initialView);
  const [showAdminRestrictedModal, setShowAdminRestrictedModal] = useState<boolean>(isDirectAdminAccess);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(isTeacherSavedAuth || isReviewerUrl);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isReviewerMode, setIsReviewerMode] = useState<boolean>(isReviewerUrl);

  // Student entry state machine (Requirement 1)
  const [studentEntryStatus, setStudentEntryStatus] = useState<StudentEntryStatus>(
    isStudentDeepLink ? 'validating' : 'idle'
  );
  const [studentEntryError, setStudentEntryError] = useState<string>('');
  const [studentSession, setStudentSession] = useState<StudentMembership | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Guards against duplicate async executions in React StrictMode
  const isProcessingEntryRef = useRef<boolean>(false);
  const studentInitTriggeredRef = useRef<boolean>(false);

  // Teacher Session State
  const [teacherSide, setTeacherSide] = useState<'Korea Class' | 'Taiwan Class'>(savedTeacherSide || 'Korea Class');

  // Unified Student Entry Sequence: idle -> validating -> authenticating -> loadingData -> ready -> error
  const runStudentEntrySequence = async (
    code: string,
    englishNickname?: string,
    targetView: AppView = 'student_activities',
    targetActivityId?: string | null
  ) => {
    if (isProcessingEntryRef.current) return;
    isProcessingEntryRef.current = true;

    try {
      // Stage 1: validating
      setStudentEntryStatus('validating');
      setStudentEntryError('');

      const cleanCode = code.trim().toUpperCase();
      let verified: StudentMembership | null = null;

      if (englishNickname) {
        verified = dataService.verifyStudentCredentials('BRIDGE2026', cleanCode, englishNickname);
      } else {
        const found = dataService.getStudents().find(s => s.participantCode.toUpperCase() === cleanCode);
        if (found) {
          const partnerSide: 'Korea Class' | 'Taiwan Class' = cleanCode.startsWith('K') 
            ? 'Korea Class' 
            : cleanCode.startsWith('T') 
            ? 'Taiwan Class' 
            : found.partnerSide;
          verified = { ...found, partnerSide };
        }
      }

      if (!verified) {
        setStudentEntryStatus('error');
        setStudentEntryError(
          currentLang === 'zh-TW'
            ? '未能進入。請確認參與代碼後再試一次。'
            : currentLang === 'en'
            ? 'Failed to enter. Please check your participant code and try again.'
            : '입장하지 못했습니다. 참여코드를 확인하고 다시 시도해 주세요.'
        );
        isProcessingEntryRef.current = false;
        return;
      }

      // Stage 2: authenticating
      setStudentEntryStatus('authenticating');
      if (!dataService.getIsReviewerMode() && dataService.isFirebaseMode()) {
        try {
          await loginAnonymouslyStudent();
          await dataService.claimParticipantSlot('BRIDGE2026', verified.participantCode, verified.englishNickname);
        } catch (authErr) {
          console.warn('Student anonymous auth fallback/notice:', authErr);
        }
      }

      // Stage 3: loadingData
      setStudentEntryStatus('loadingData');
      if (!dataService.getIsReviewerMode() && dataService.isFirebaseMode()) {
        try {
          await dataService.initFirestoreSync('student');
          await dataService.waitForInitialData(3500);
        } catch (dataErr) {
          console.warn('Firestore initial data sync notice:', dataErr);
        }
      }

      dataService.logAuditAction(
        'login',
        'room',
        verified.roomId,
        `Student verified and joined: ${verified.englishNickname} (${verified.participantCode})`,
        'student'
      );

      // Stage 4: ready - Change currentView and run replaceState exactly once
      setStudentSession(verified);
      setStudentEntryStatus('ready');

      let destView: AppView = targetView;
      let matchedAct: Activity | null = null;
      if (targetActivityId) {
        matchedAct = dataService.getActivityById(targetActivityId) || null;
        if (matchedAct) {
          setSelectedActivity(matchedAct);
          destView = 'student_activity_detail';
        }
      }
      setCurrentView(destView);

      // Requirement 6: Single replaceState execution upon reaching ready
      const url = new URL(window.location.href);
      url.searchParams.set('lang', currentLang);
      url.searchParams.set('view', destView);
      url.searchParams.set('code', verified.participantCode);
      if (matchedAct) {
        url.searchParams.set('act', matchedAct.id);
      } else {
        url.searchParams.delete('act');
      }
      window.history.replaceState({}, document.title, url.pathname + url.search);

    } catch (unexpectedErr) {
      console.error('Unexpected student entry error:', unexpectedErr);
      setStudentEntryStatus('error');
      setStudentEntryError('입장하지 못했습니다. 참여코드를 확인하고 다시 시도해 주세요.');
    } finally {
      isProcessingEntryRef.current = false;
    }
  };

  // Initial student deep-link handler (on page refresh / direct URL)
  useEffect(() => {
    if (isStudentDeepLink && studentCodeParam && !studentInitTriggeredRef.current) {
      studentInitTriggeredRef.current = true;
      const targetView: AppView = (requestedViewParam as AppView) || 'student_activities';
      runStudentEntrySequence(studentCodeParam, undefined, targetView, actIdParam);
    }
  }, []);

  // Handle direct URL admin attempt cleanup
  useEffect(() => {
    if (isDirectAdminAccess || isDirectTeacherAccess) {
      const url = new URL(window.location.href);
      if (isDirectAdminAccess) url.searchParams.delete('view');
      if (isDirectTeacherAccess) url.searchParams.set('view', 'teacher_login');
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
    }
  }, [isDirectAdminAccess, isDirectTeacherAccess]);

  // Route guard: Prevent unauthorized access to admin or teacher dashboard
  useEffect(() => {
    if (currentView === 'admin' && !isAdminAuthenticated) {
      setCurrentView('start');
      setShowAdminRestrictedModal(true);
    } else if (currentView === 'teacher_dashboard' && !isTeacherAuthenticated && !isReviewerMode) {
      setCurrentView('teacher_login');
    }
  }, [currentView, isTeacherAuthenticated, isAdminAuthenticated, isReviewerMode]);

  // URL state synchronization: Single source of truth. Does NOT fire during transient loading states!
  useEffect(() => {
    if (
      studentEntryStatus === 'validating' ||
      studentEntryStatus === 'authenticating' ||
      studentEntryStatus === 'loadingData' ||
      studentEntryStatus === 'error'
    ) {
      return;
    }

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
  }, [currentView, currentLang, studentSession, selectedActivity, isReviewerMode, studentEntryStatus]);

  const currentRole: UserRole | null = 
    (currentView.startsWith('student') || studentEntryStatus !== 'idle') ? 'student' :
    currentView.startsWith('teacher') ? 'teacher' :
    currentView === 'admin' ? 'admin' : null;

  const handleSelectRole = (role: UserRole) => {
    if (role === 'student') {
      setCurrentView('student_join');
    } else if (role === 'teacher') {
      setCurrentView('teacher_login');
    } else if (role === 'admin') {
      setShowAdminRestrictedModal(true);
    }
  };

  const handleStartStudentJoin = (roomCode: string, participantCode: string, englishNickname: string) => {
    runStudentEntrySequence(participantCode, englishNickname, 'student_activities');
  };

  const handleRetryStudentEntry = () => {
    isProcessingEntryRef.current = false;
    studentInitTriggeredRef.current = false;
    setStudentEntryStatus('idle');
    setStudentEntryError('');
    setStudentSession(null);
    setSelectedActivity(null);
    setCurrentView('student_join');

    const url = new URL(window.location.href);
    url.searchParams.set('lang', currentLang);
    url.searchParams.set('view', 'student_join');
    url.searchParams.delete('code');
    url.searchParams.delete('act');
    window.history.replaceState({}, document.title, url.pathname + url.search);
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

  const handleEnterReviewerMode = () => {
    dataService.setReviewerMode(true);
    setIsReviewerMode(true);
    setIsTeacherAuthenticated(true);
    setTeacherSide('Korea Class');
    setCurrentView('teacher_dashboard');
  };

  const handleGlobalExit = async () => {
    // 1. Reset entry status & state
    isProcessingEntryRef.current = false;
    studentInitTriggeredRef.current = false;
    setStudentEntryStatus('idle');
    setStudentEntryError('');
    setIsTeacherAuthenticated(false);
    setIsAdminAuthenticated(false);
    setIsReviewerMode(false);
    setStudentSession(null);
    setSelectedActivity(null);
    setShowAdminRestrictedModal(false);
    setCurrentView('start');

    // 2. dataService cleanup
    dataService.setReviewerMode(false);
    dataService.stopFirestoreSync();
    dataService.resetDataLoadedState();

    // 3. sessionStorage cleanup
    sessionStorage.removeItem('cb_teacher_side');
    sessionStorage.clear();

    // 4. URL cleanup
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('code');
    url.searchParams.delete('act');
    url.searchParams.delete('modal');
    url.searchParams.delete('reviewer');
    url.searchParams.delete('mode');
    const cleanUrl = url.pathname + (url.searchParams.get('lang') ? `?lang=${url.searchParams.get('lang')}` : '');
    window.history.replaceState({}, document.title, cleanUrl);

    // 5. Firebase signOut
    try {
      await logoutFirebaseUser();
    } catch (e) {
      console.warn('Firebase sign out notice on exit:', e);
    }
  };

  const isTransientLoading = 
    studentEntryStatus === 'validating' || 
    studentEntryStatus === 'authenticating' || 
    studentEntryStatus === 'loadingData';

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
        {/* Requirement 2: Show single stable centered loading card from validating until ready */}
        {isTransientLoading && (
          <StudentLoadingCard currentLang={currentLang} />
        )}

        {/* Requirement 9: Show explicit error card with retry button on failure */}
        {studentEntryStatus === 'error' && (
          <StudentErrorCard
            currentLang={currentLang}
            errorMessage={studentEntryError}
            onRetry={handleRetryStudentEntry}
          />
        )}

        {/* Normal Views rendered only when NOT in transient loading or error state */}
        {!isTransientLoading && studentEntryStatus !== 'error' && (
          <>
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
                onStartJoin={handleStartStudentJoin}
                onBack={handleGlobalExit}
              />
            )}

            {currentView === 'student_activities' && studentSession && (
              <div className="page-view">
                <StudentActivityList
                  currentLang={currentLang}
                  student={studentSession}
                  onSelectActivity={handleSelectStudentActivity}
                  onBack={handleGlobalExit}
                />
              </div>
            )}

            {currentView === 'student_activity_detail' && studentSession && selectedActivity && (
              <div className="page-view">
                <UniversalActivityView
                  currentLang={currentLang}
                  student={studentSession}
                  activity={selectedActivity}
                  onBack={() => setCurrentView('student_activities')}
                />
              </div>
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

            {currentView === 'admin' && (
              <AdminView
                currentLang={currentLang}
                onBack={handleGlobalExit}
              />
            )}
          </>
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
