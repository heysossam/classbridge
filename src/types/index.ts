export type Language = 'ko' | 'en' | 'zh-TW';

export type UserRole = 'teacher' | 'student' | 'admin';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type ActivityType = 'writing' | 'poll' | 'qa';

export type ActivityStatus = 'draft' | 'published' | 'closed' | 'archived';

export type TargetSide = 'Korea Class' | 'Taiwan Class' | 'Both';

export type VisibilityScope = 'author_and_teacher' | 'my_class' | 'both_classes' | 'teachers_only';

export interface SentenceFrame {
  id: string;
  frame: string;
  example: string;
}

export interface PollOption {
  id: string;
  text: string;
  targetSide?: 'Korea Class' | 'Taiwan Class' | 'Both';
}

export interface Activity {
  id: string;
  roomId: string;
  title: string;
  type: ActivityType;
  instructionsKo: string;
  instructionsEn: string;
  instructionsZh: string;
  startDate: string;
  dueDate: string;
  isRequired: boolean;
  targetSide: TargetSide;
  status: ActivityStatus;
  sentenceFrames: SentenceFrame[];
  submissionLimit: number; // 1 ~ 5
  minWordCount: number;
  maxWordCount: number;
  allowEdit: boolean;
  allowComments: boolean;
  allowLikes: boolean;
  allowPartnerResponse: boolean;
  requireApproval: boolean;
  viewAfterSubmit: boolean;
  visibility: VisibilityScope;

  // Poll-specific settings
  pollConfig?: {
    options: PollOption[];
    allowMultipleChoices: boolean;
    requireReason: boolean;
    resultsVisibility: 'immediate' | 'after_due' | 'private';
    allowVoteChange: boolean;
  };

  // QA-specific settings
  qaConfig?: {
    maxQuestionsPerStudent: number;
    questionMaxWords: number;
    answerMaxWords: number;
    respondentScope: 'partner_only' | 'both_classes';
    minAnswersPerStudent: number;
    allowAnswerEdit: boolean;
  };

  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  activityId: string;
  membershipId: string;
  participantCode: string;
  englishNickname: string;
  partnerSide: 'Korea Class' | 'Taiwan Class';
  type: 'writing' | 'poll' | 'qa_question' | 'qa_answer';
  title?: string;
  content: string;
  translationEn?: string;
  selectedOptions?: string[]; // for poll
  parentQuestionId?: string; // for qa_answer
  language: 'ko' | 'en' | 'zh-TW' | 'other';
  submittedAt: string;
  updatedAt?: string;
  isApproved: boolean;
  isHidden: boolean;
  likesCount: number;
  likedBy: string[]; // participantCodes
}

export interface Comment {
  id: string;
  submissionId: string;
  activityId: string;
  membershipId: string;
  participantCode: string;
  englishNickname: string;
  partnerSide: 'Korea Class' | 'Taiwan Class';
  content: string;
  createdAt: string;
  updatedAt?: string;
  isHidden: boolean;
}

export interface StudentMembership {
  id: string;
  roomId: string;
  participantCode: string;
  englishNickname: string;
  partnerSide: 'Korea Class' | 'Taiwan Class';
  createdAt: string;
}

export interface TeacherPrivateNote {
  id: string;
  roomId: string;
  membershipId: string;
  teacherId: string;
  note: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  title: string;
  joinCode: string;
  partnerALabel: string;
  partnerBLabel: string;
  partnerAStatus: ProgressStatus;
  partnerBStatus: ProgressStatus;
  partnerANextTask: string;
  partnerBNextTask: string;
  overallProgress: number;
  nextSchedule: string;
  lastUpdated: string;
}

export interface EvaluationResult {
  sentence: string;
  competency: string;
  reflectionQuestion: string;
}

export interface ComprehensiveStudentEvidence {
  membership: StudentMembership;
  completedActivities: Activity[];
  uncompletedActivities: Activity[];
  submissions: Submission[];
  comments: Comment[];
  likesGivenCount: number;
  likesReceivedCount: number;
  teacherNote?: TeacherPrivateNote;
}
