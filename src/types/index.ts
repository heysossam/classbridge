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
  imageUrl?: string;
  imageLabel?: string;
}

export interface Activity {
  id: string;
  roomId: string;
  title: string;
  titleKo?: string;
  titleEn?: string;
  titleZh?: string;
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

  // Independent Writing Mode & Accessibility Settings (Requirement 8)
  independentWritingMode?: boolean; // Default true
  allowPasteAccessibility?: boolean; // Default false
  requireAssistanceDeclaration?: boolean; // Default true

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

  // Soft Delete fields for safety protection
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;

  createdAt: string;
  updatedAt: string;
}

export type HiddenReason = 
  | '상대를 불편하게 하는 표현'
  | '개인정보 포함 가능성'
  | '수업과 무관한 내용'
  | '교사 확인 필요'
  | '기타';

export type ModerationStatus = 'approved' | 'needs_review' | 'flagged' | 'hidden';

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

  // Moderation & Safety Fields (Requirement 4 & 5)
  moderationStatus?: ModerationStatus;
  hiddenReason?: HiddenReason;
  hiddenAt?: string;
  hiddenBy?: string;
  detectedCategories?: string[];

  // Independent Writing Process Metrics (Requirement 8)
  writingStartTime?: string;
  editCount?: number;
  pasteAttemptsCount?: number;
  assistanceDeclaration?: string[];

  // Soft delete fields
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
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

  // Moderation & Safety Fields (Requirement 4 & 5)
  moderationStatus?: ModerationStatus;
  hiddenReason?: HiddenReason;
  hiddenAt?: string;
  hiddenBy?: string;
  detectedCategories?: string[];

  // Soft delete fields
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

// Teacher Feedback Subcollection document: rooms/{roomId}/submissions/{submissionId}/feedback/teacher
export interface TeacherFeedback {
  id: 'teacher';
  submissionId: string;
  roomId: string;
  teacherUid: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail?: string;
  userRole: UserRole;
  action: 'create' | 'update' | 'soft_delete' | 'restore' | 'permanent_delete' | 'login' | 'hide' | 'unhide' | 'moderate' | 'feedback';
  targetType: 'activity' | 'submission' | 'comment' | 'note' | 'room' | 'feedback';
  targetId: string;
  details?: string;
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

export interface ActivitySummaryStats {
  activity: Activity;
  targetCount: number;
  submittedCount: number;
  unsubmittedCount: number;
  koreaSubmissionsCount: number;
  taiwanSubmissionsCount: number;
  commentsCount: number;
  likesCount: number;
}

export interface StudentPortfolioRecord {
  activity: Activity;
  isCompleted: boolean;
  submission?: Submission;
  studentComments: Comment[];
  likesReceived: number;
  teacherNote?: TeacherPrivateNote;
}

export interface StudentPortfolioData {
  student: StudentMembership;
  totalAssigned: number;
  completedCount: number;
  incompleteCount: number;
  questionsCount: number;
  answersCount: number;
  commentsCount: number;
  likesReceivedCount: number;
  records: StudentPortfolioRecord[];
}
