import React, { useState } from 'react';
import { Language, UserRole } from './types';
import { Header } from './components/common/Header';
import { StartScreen } from './components/start/StartScreen';
import { StudentJoin } from './components/student/StudentJoin';
import { StudentActivity } from './components/student/StudentActivity';
import { TeacherLogin } from './components/teacher/TeacherLogin';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminView } from './components/admin/AdminView';

type AppView = 
  | 'start' 
  | 'student_join' 
  | 'student_activity' 
  | 'teacher_login' 
  | 'teacher_dashboard' 
  | 'admin';

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialLang = (searchParams.get('lang') as Language) || 'ko';
  const initialView = (searchParams.get('view') as AppView) || 'start';

  const [currentLang, setCurrentLang] = useState<Language>(initialLang);
  const [currentView, setCurrentView] = useState<AppView>(initialView);

  const studentCode = searchParams.get('code') || 'K7M4';
  const studentName = searchParams.get('name') || 'Sunny';
  const studentSide = (searchParams.get('side') as 'Korea Class' | 'Taiwan Class') || 'Korea Class';

  // Student Session State (preset for easy testing or real login)
  const [studentSession, setStudentSession] = useState<{
    roomCode: string;
    participantCode: string;
    englishNickname: string;
    partnerSide: 'Korea Class' | 'Taiwan Class';
  } | null>({
    roomCode: 'BRIDGE2026',
    participantCode: studentCode,
    englishNickname: studentName,
    partnerSide: studentSide
  });

  // Teacher Session State
  const [teacherSide, setTeacherSide] = useState<'Korea Class' | 'Taiwan Class'>('Korea Class');

  // Current Role Mapping for Header
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
      setCurrentView('admin');
    }
  };

  const handleStudentJoinSuccess = (data: {
    roomCode: string;
    participantCode: string;
    englishNickname: string;
    partnerSide: 'Korea Class' | 'Taiwan Class';
  }) => {
    setStudentSession(data);
    setCurrentView('student_activity');
  };

  const handleTeacherLoginSuccess = (side: 'Korea Class' | 'Taiwan Class') => {
    setTeacherSide(side);
    setCurrentView('teacher_dashboard');
  };

  const handleExitToStart = () => {
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
          />
        )}

        {currentView === 'student_join' && (
          <StudentJoin
            currentLang={currentLang}
            onJoinSuccess={handleStudentJoinSuccess}
            onBack={handleExitToStart}
          />
        )}

        {currentView === 'student_activity' && studentSession && (
          <StudentActivity
            currentLang={currentLang}
            student={studentSession}
            onBack={() => setCurrentView('student_join')}
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

        {currentView === 'admin' && (
          <AdminView
            currentLang={currentLang}
            onBack={handleExitToStart}
          />
        )}
      </main>
    </div>
  );
}
