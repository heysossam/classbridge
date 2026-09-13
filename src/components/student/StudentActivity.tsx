import React from 'react';
import { Language, StudentMembership } from '../../types';
import { UniversalActivityView } from './UniversalActivityView';
import { dataService } from '../../services/dataService';

interface StudentActivityProps {
  currentLang: Language;
  student: StudentMembership;
  onBack: () => void;
}

export const StudentActivity: React.FC<StudentActivityProps> = ({
  currentLang,
  student,
  onBack,
}) => {
  // Delegate to UniversalActivityView with food poll or first activity
  const activities = dataService.getActivities();
  const targetAct = activities.find(a => a.type === 'poll') || activities[0];

  return (
    <UniversalActivityView
      currentLang={currentLang}
      student={student}
      activity={targetAct}
      onBack={onBack}
    />
  );
};
