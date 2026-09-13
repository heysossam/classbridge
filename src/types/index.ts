export type Language = 'ko' | 'en' | 'zh-TW';

export type UserRole = 'teacher' | 'student' | 'admin';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface Room {
  id: string;
  title: string;
  joinCode: string;
  partnerALabel: string; // 'Korea Class'
  partnerBLabel: string; // 'Taiwan Class'
  partnerAStatus: ProgressStatus;
  partnerBStatus: ProgressStatus;
  partnerANextTask: string;
  partnerBNextTask: string;
  overallProgress: number; // 0 ~ 100
  nextSchedule: string;
  currentActivityTitle: string;
  lastUpdated: string;
}

export interface StudentMembership {
  id: string;
  roomId: string;
  participantCode: string; // e.g., 'K7M4', 'T9Q2'
  englishNickname: string; // e.g., 'Sunny', 'Leo'
  partnerSide: 'Korea Class' | 'Taiwan Class';
  createdAt: string;
}

export interface ActivityOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  votesCount?: number;
}

export interface Activity {
  id: string;
  roomId: string;
  title: string;
  instructions: string;
  dueDate: string;
  options: ActivityOption[];
  sentenceFrames: {
    id: string;
    frame: string;
    example: string;
  }[];
  status: 'active' | 'closed';
}

export interface StudentResponse {
  id: string;
  roomId: string;
  activityId: string;
  membershipId: string;
  participantCode: string;
  englishNickname: string;
  partnerSide: 'Korea Class' | 'Taiwan Class';
  selectedOption: string; // 'Design A', 'Design B', 'Design C'
  sentenceFrame: string;
  userReason: string;
  fullStatement: string;
  submittedAt: string;
  visibilityStatus: 'public' | 'hidden';
}

export interface TeacherPrivateNote {
  id: string;
  roomId: string;
  membershipId: string;
  teacherId: string;
  note: string;
  updatedAt: string;
}

export interface EvaluationResult {
  sentence: string;
  competency: string;
  reflectionQuestion: string;
}
