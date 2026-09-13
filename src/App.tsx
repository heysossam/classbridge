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
  
  // Direct URL admin & teacher dashboard access defense
  // NOTE: In this LocalStorage MVP, client-side route guards prevent students and unauthorized users
  // from directly entering teacher dashboards or admin screens via URL parameter manipulation (?view=...).
  // True server-side security authorization will be enforced upon Firebase integration via
  // Firebase Authentication (Custom Claims) and Firestore Security Rules.
  const requestedViewParam = searchParams.get('view');
  const isDirectAdminAccess = requestedViewParam === 'admin';
  const isDirectTeacherAccess = requestedViewParam === 'teacher_dashboard';

  // If directly requesting teacher_dashboard without prior authentication, route to teacher_login
  const initialView: AppView = isDirectAdminAccess 
    ? 'start' 
    : isDirectTeacherAccess 
    ? 'teacher_login' 
    : ((requestedViewParam as AppView) || 'start');

  const [currentLang, setCurrentLang] = useState<Language>(initialLang);
  const [currentView, setCurrentView] = useState<AppView>(initialView);
  const [showAdminRestrictedModal, setShowAdminRestrictedModal] = useState<boolean>(isDirectAdminAccess);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);

  // Student Session
  const studentCodeParam = searchParams.get('code') || 'K7M4';
  const initialStudent = dataService.getStudents().find(s => s.participantCode.toUpperCase() === studentCodeParam.toUpperCase()) || dataService.getStudents()[0];
  const [studentSession, setStudentSession] = useState<StudentMembership | null>(initialStudent);

  // Selected Activity for Student View
  const actIdParam = searchParams.get('act') || 'act-01';
  const initialAct = dataService.getActivityById(actIdParam) || dataService.getActivities()[0];
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(initialAct);

  // Teacher Session State
  const [teacherSide, setTeacherSide] = useState<'Korea Class' | 'Taiwan Class'>('Korea Class');

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
    if (currentView === 'admin') {
      setCurrentView('start');
      setShowAdminRestrictedModal(true);
    } else if (currentView === 'teacher_dashboard' && !isTeacherAuthenticated) {
      // Screen-level block: Redirect unauthenticated teacher dashboard access to login
      setCurrentView('teacher_login');
    }
  }, [currentView, isTeacherAuthenticated]);

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
    setIsTeacherAuthenticated(true);
    setTeacherSide(side);
    setCurrentView('teacher_dashboard');
  };

  const handleExitToStart = () => {
    setIsTeacherAuthenticated(false);
    setCurrentView('start');
  };

  return (
    <div className="app-container">
      <Header
        currentLang={currentLang}
        onSelectLang={setCurrentLang}
        currentRole={currentRole}
        onExitRole={handleExitToStart}
      />

      <main className="main-content">
        {currentView === 'start' && (
          <StartScreen
            currentLang={currentLang}
            onSelectRole={handleSelectRole}
            onAdminClick={() => setShowAdminRestrictedModal(true)}
          />
        )}

        {currentView === 'student_join' && (
          <StudentJoin
            currentLang={currentLang}
            onJoinSuccess={handleStudentJoinSuccess}
            onBack={handleExitToStart}
          />
        )}

        {currentView === 'student_activities' && studentSession && (
          <StudentActivityList
            currentLang={currentLang}
            student={studentSession}
            onSelectActivity={handleSelectStudentActivity}
            onBack={() => setCurrentView('student_join')}
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
            onBack={handleExitToStart}
          />
        )}

        {currentView === 'teacher_dashboard' && (
          <TeacherDashboard
            currentLang={currentLang}
            teacherSide={teacherSide}
            onSwitchTeacherSide={setTeacherSide}
            onBack={handleExitToStart}
          />
        )}

        {/* AdminView is rendered only if authorized (currently blocked) */}
        {currentView === 'admin' && (
          <AdminView
            currentLang={currentLang}
            onBack={handleExitToStart}
          />
        )}
      </main>

      {/* Admin Access Restriction Notice Modal */}
      <AdminRestrictedModal
        isOpen={showAdminRestrictedModal}
        onClose={() => setShowAdminRestrictedModal(false)}
        currentLang={currentLang}
      />
    </div>
  );
}
