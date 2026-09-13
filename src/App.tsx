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
  const initialView = (searchParams.get('view') as AppView) || 'start';

  const [currentLang, setCurrentLang] = useState<Language>(initialLang);
  const [currentView, setCurrentView] = useState<AppView>(initialView);

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

  // Sync initial view when direct URL params are used
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
      setCurrentView('admin');
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

  const handleTeacherLoginSuccess = (side: 'Korea Class' | 'Taiwan Class', role?: 'teacher' | 'admin') => {
    if (role === 'admin') {
      setCurrentView('admin');
    } else {
      setTeacherSide(side);
      setCurrentView('teacher_dashboard');
    }
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
