import { 
  Room, Activity, StudentMembership, Submission, Comment, TeacherPrivateNote, 
  ProgressStatus, ComprehensiveStudentEvidence, ActivityStatus,
  ActivitySummaryStats, StudentPortfolioRecord, StudentPortfolioData
} from '../types';
import { 
  ROOM_CODE, TEACHER_CODES, initialRoom, initialStudents, 
  initialActivities, initialSubmissions, initialComments, initialTeacherNotes 
} from '../mock/demoData';

const KEYS = {
  ROOM: 'cb_v2_room',
  ACTIVITIES: 'cb_v2_activities',
  STUDENTS: 'cb_v2_students',
  SUBMISSIONS: 'cb_v2_submissions',
  COMMENTS: 'cb_v2_comments',
  NOTES: 'cb_v2_notes',
};

class DataService {
  private getStorage<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
      // First boot only: seed demo data to LocalStorage so future runs use persisted store
      const cloned = JSON.parse(JSON.stringify(fallback));
      localStorage.setItem(key, JSON.stringify(cloned));
      return cloned;
    } catch {
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage error:', e);
    }
  }

  // --- Auth & Whitelist ---
  public verifyStudentCredentials(
    roomCode: string, 
    participantCode: string, 
    englishNickname: string
  ): StudentMembership | null {
    if (roomCode.trim().toUpperCase() !== ROOM_CODE) {
      return null;
    }

    const students = this.getStudents();
    const found = students.find(
      s => s.englishNickname.trim().toLowerCase() === englishNickname.trim().toLowerCase() &&
           s.participantCode.trim().toUpperCase() === participantCode.trim().toUpperCase()
    );

    return found || null;
  }

  public verifyTeacherCode(code: string): 'Korea Class' | 'Taiwan Class' | null {
    const c = code.trim().toUpperCase();
    if (c === TEACHER_CODES.KOREA) return 'Korea Class';
    if (c === TEACHER_CODES.TAIWAN) return 'Taiwan Class';
    return null;
  }

  // --- Room ---
  public getRoom(): Room {
    return this.getStorage<Room>(KEYS.ROOM, initialRoom);
  }

  public updateClassStatus(partnerSide: 'Korea Class' | 'Taiwan Class', newStatus: ProgressStatus): Room {
    const room = this.getRoom();
    if (partnerSide === 'Korea Class') {
      room.partnerAStatus = newStatus;
    } else {
      room.partnerBStatus = newStatus;
    }
    room.lastUpdated = 'Just now';
    this.setStorage(KEYS.ROOM, room);
    return room;
  }

  // --- Students ---
  public getStudents(): StudentMembership[] {
    return this.getStorage<StudentMembership[]>(KEYS.STUDENTS, initialStudents);
  }

  public getStudentById(id: string): StudentMembership | undefined {
    return this.getStudents().find(s => s.id === id);
  }

  // --- Activities ---
  public getActivities(includeArchived = false): Activity[] {
    const all = this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    if (includeArchived) return all;
    return all.filter(a => a.status !== 'archived');
  }

  public getActivityById(id: string): Activity | undefined {
    return this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities).find(a => a.id === id);
  }

  public createActivity(activity: Omit<Activity, 'id' | 'roomId' | 'createdAt' | 'updatedAt'>): Activity {
    const activities = this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    const newAct: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
      roomId: 'room-kr-tw-01',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    activities.unshift(newAct);
    this.setStorage(KEYS.ACTIVITIES, activities);
    return newAct;
  }

  public updateActivity(id: string, updates: Partial<Activity>): Activity | null {
    const activities = this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    const idx = activities.findIndex(a => a.id === id);
    if (idx === -1) return null;

    activities[idx] = {
      ...activities[idx],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.setStorage(KEYS.ACTIVITIES, activities);
    return activities[idx];
  }

  public duplicateActivity(id: string): Activity | null {
    const act = this.getActivityById(id);
    if (!act) return null;

    const dup: Activity = {
      ...act,
      id: `act-${Date.now()}`,
      title: `${act.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    const activities = this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    activities.unshift(dup);
    this.setStorage(KEYS.ACTIVITIES, activities);
    return dup;
  }

  public updateActivityStatus(id: string, status: ActivityStatus): void {
    this.updateActivity(id, { status });
  }

  public archiveActivity(id: string): Activity | null {
    return this.updateActivity(id, { status: 'archived' });
  }

  public restoreActivity(id: string): Activity | null {
    return this.updateActivity(id, { status: 'published' });
  }

  public canDeleteActivity(id: string): { canDelete: boolean; reason: string } {
    const act = this.getActivityById(id);
    if (!act) {
      return { canDelete: false, reason: '존재하지 않는 활동입니다.' };
    }
    // Condition 1: Must be draft status
    if (act.status !== 'draft') {
      return { 
        canDelete: false, 
        reason: '학생 수행 기록이 있는 활동은 삭제할 수 없습니다. 평가 근거 보존을 위해 활동을 보관해 주세요.' 
      };
    }
    // Condition 2: 0 student submissions
    const subs = this.getSubmissions(id);
    if (subs.length > 0) {
      return { 
        canDelete: false, 
        reason: '학생 수행 기록이 있는 활동은 삭제할 수 없습니다. 평가 근거 보존을 위해 활동을 보관해 주세요.' 
      };
    }
    // Condition 3: 0 comments
    const allComments = this.getComments();
    const relatedComments = allComments.filter(c => c.activityId === id);
    if (relatedComments.length > 0) {
      return { 
        canDelete: false, 
        reason: '학생 수행 기록이 있는 활동은 삭제할 수 없습니다. 평가 근거 보존을 위해 활동을 보관해 주세요.' 
      };
    }
    // Condition 4: Poll choices / QA submissions are covered under subs.length === 0
    return { canDelete: true, reason: '' };
  }

  public deleteActivityPermanently(id: string): { success: boolean; message: string } {
    const check = this.canDeleteActivity(id);
    if (!check.canDelete) {
      return { 
        success: false, 
        message: check.reason || '학생 수행 기록이 있는 활동은 삭제할 수 없습니다. 평가 근거 보존을 위해 활동을 보관해 주세요.' 
      };
    }
    const activities = this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    const filtered = activities.filter(a => a.id !== id);
    this.setStorage(KEYS.ACTIVITIES, filtered);
    return { success: true, message: '활동이 영구 삭제되었습니다.' };
  }

  public getActivitySummary(activityId: string): ActivitySummaryStats | null {
    const act = this.getActivityById(activityId);
    if (!act) return null;

    const allStudents = this.getStudents();
    const targetStudents = act.targetSide === 'Both' 
      ? allStudents 
      : allStudents.filter(s => s.partnerSide === act.targetSide);
    const targetCount = targetStudents.length;

    const subs = this.getSubmissions(activityId);
    const submittedMembershipIds = new Set(subs.map(s => s.membershipId || s.participantCode.toUpperCase()));
    
    const submittedCount = targetStudents.filter(s => 
      submittedMembershipIds.has(s.id) || submittedMembershipIds.has(s.participantCode.toUpperCase())
    ).length;
    const unsubmittedCount = Math.max(0, targetCount - submittedCount);

    const koreaSubs = subs.filter(s => s.partnerSide === 'Korea Class').length;
    const taiwanSubs = subs.filter(s => s.partnerSide === 'Taiwan Class').length;

    const allComments = this.getComments();
    const subIds = new Set(subs.map(s => s.id));
    const commentsCount = allComments.filter(c => c.activityId === activityId || subIds.has(c.submissionId)).length;
    const likesCount = subs.reduce((acc, cur) => acc + (cur.likesCount || 0), 0);

    return {
      activity: act,
      targetCount,
      submittedCount,
      unsubmittedCount,
      koreaSubmissionsCount: koreaSubs,
      taiwanSubmissionsCount: taiwanSubs,
      commentsCount,
      likesCount,
    };
  }

  public getStudentPortfolio(studentId: string): StudentPortfolioData | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    // All active or assigned activities (excluding archived from default student view)
    const activities = this.getActivities(true).filter(a => a.status !== 'archived');
    const mySideActivities = activities.filter(a => a.targetSide === 'Both' || a.targetSide === student.partnerSide);
    
    const allSubs = this.getSubmissions();
    const mySubs = allSubs.filter(s => s.membershipId === student.id || s.participantCode.toUpperCase() === student.participantCode.toUpperCase());
    
    const allComments = this.getComments();
    const myComments = allComments.filter(c => c.membershipId === student.id || c.participantCode.toUpperCase() === student.participantCode.toUpperCase());
    
    const notes = this.getTeacherNotes();
    const teacherNote = notes[student.id];

    let questionsCount = 0;
    let answersCount = 0;
    mySubs.forEach(s => {
      if (s.type === 'qa_question') questionsCount++;
      if (s.type === 'qa_answer') answersCount++;
    });

    const records: StudentPortfolioRecord[] = mySideActivities.map(act => {
      const sub = mySubs.find(s => s.activityId === act.id);
      const isCompleted = !!sub;
      const actComments = myComments.filter(c => c.activityId === act.id || (sub && c.submissionId === sub.id));
      const likesReceived = sub ? (sub.likesCount || 0) : 0;

      return {
        activity: act,
        isCompleted,
        submission: sub,
        studentComments: actComments,
        likesReceived,
        teacherNote
      };
    });

    const completedCount = records.filter(r => r.isCompleted).length;
    const incompleteCount = records.filter(r => !r.isCompleted).length;
    const likesReceivedCount = mySubs.reduce((acc, cur) => acc + (cur.likesCount || 0), 0);

    return {
      student,
      totalAssigned: mySideActivities.length,
      completedCount,
      incompleteCount,
      questionsCount,
      answersCount,
      commentsCount: myComments.length,
      likesReceivedCount,
      records
    };
  }

  // --- Submissions (Posts / Polls / QA) ---
  public getSubmissions(activityId?: string): Submission[] {
    const all = this.getStorage<Submission[]>(KEYS.SUBMISSIONS, initialSubmissions);
    if (!activityId) return all;
    return all.filter(s => s.activityId === activityId);
  }

  public getSubmissionById(id: string): Submission | undefined {
    return this.getSubmissions().find(s => s.id === id);
  }

  public createSubmission(sub: Omit<Submission, 'id' | 'submittedAt' | 'likesCount' | 'likedBy' | 'isHidden' | 'isApproved'>): Submission {
    const subs = this.getSubmissions();
    const newSub: Submission = {
      ...sub,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      likesCount: 0,
      likedBy: [],
      isApproved: true,
      isHidden: false
    };
    subs.unshift(newSub);
    this.setStorage(KEYS.SUBMISSIONS, subs);
    return newSub;
  }

  public updateSubmission(id: string, updates: Partial<Submission>): Submission | null {
    const subs = this.getSubmissions();
    const idx = subs.findIndex(s => s.id === id);
    if (idx === -1) return null;

    subs[idx] = {
      ...subs[idx],
      ...updates,
      updatedAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    };
    this.setStorage(KEYS.SUBMISSIONS, subs);
    return subs[idx];
  }

  public toggleLike(submissionId: string, participantCode: string): { likesCount: number; isLiked: boolean } {
    const subs = this.getSubmissions();
    const target = subs.find(s => s.id === submissionId);
    if (!target) return { likesCount: 0, isLiked: false };

    const idx = target.likedBy.indexOf(participantCode.toUpperCase());
    let isLiked = false;
    if (idx >= 0) {
      target.likedBy.splice(idx, 1);
      target.likesCount = Math.max(0, target.likesCount - 1);
      isLiked = false;
    } else {
      target.likedBy.push(participantCode.toUpperCase());
      target.likesCount += 1;
      isLiked = true;
    }

    this.setStorage(KEYS.SUBMISSIONS, subs);
    return { likesCount: target.likesCount, isLiked };
  }

  public toggleHideSubmission(id: string): boolean {
    const subs = this.getSubmissions();
    const target = subs.find(s => s.id === id);
    if (!target) return false;
    target.isHidden = !target.isHidden;
    this.setStorage(KEYS.SUBMISSIONS, subs);
    return target.isHidden;
  }

  // --- Comments ---
  public getComments(submissionId?: string): Comment[] {
    const all = this.getStorage<Comment[]>(KEYS.COMMENTS, initialComments);
    if (!submissionId) return all;
    return all.filter(c => c.submissionId === submissionId);
  }

  public addComment(cmt: Omit<Comment, 'id' | 'createdAt' | 'isHidden'>): Comment {
    const cmts = this.getStorage<Comment[]>(KEYS.COMMENTS, initialComments);
    const newCmt: Comment = {
      ...cmt,
      id: `cmt-${Date.now()}`,
      createdAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      isHidden: false
    };
    cmts.push(newCmt);
    this.setStorage(KEYS.COMMENTS, cmts);
    return newCmt;
  }

  public updateComment(id: string, content: string): Comment | null {
    const cmts = this.getStorage<Comment[]>(KEYS.COMMENTS, initialComments);
    const idx = cmts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    cmts[idx].content = content;
    cmts[idx].updatedAt = new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' });
    this.setStorage(KEYS.COMMENTS, cmts);
    return cmts[idx];
  }

  public deleteComment(id: string): void {
    const cmts = this.getStorage<Comment[]>(KEYS.COMMENTS, initialComments);
    const filtered = cmts.filter(c => c.id !== id);
    this.setStorage(KEYS.COMMENTS, filtered);
  }

  // --- Teacher Notes ---
  public getTeacherNotes(): Record<string, TeacherPrivateNote> {
    return this.getStorage<Record<string, TeacherPrivateNote>>(KEYS.NOTES, initialTeacherNotes);
  }

  public saveTeacherNote(membershipId: string, noteText: string): void {
    const notes = this.getTeacherNotes();
    notes[membershipId] = {
      id: notes[membershipId]?.id || `note-${Date.now()}`,
      roomId: 'room-kr-tw-01',
      membershipId,
      teacherId: 'teacher-auth-user',
      note: noteText,
      updatedAt: new Date().toLocaleDateString()
    };
    this.setStorage(KEYS.NOTES, notes);
  }

  // --- Comprehensive Evidence for Assessment ---
  public getComprehensiveEvidence(studentId: string): ComprehensiveStudentEvidence | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const activities = this.getActivities();
    const subs = this.getSubmissions().filter(s => s.membershipId === student.id || s.participantCode.toUpperCase() === student.participantCode.toUpperCase());
    const comments = this.getComments().filter(c => c.membershipId === student.id || c.participantCode.toUpperCase() === student.participantCode.toUpperCase());
    
    // Check completion per activity
    const completedActs: Activity[] = [];
    const uncompletedActs: Activity[] = [];

    activities.forEach(act => {
      const hasSub = subs.some(s => s.activityId === act.id);
      if (hasSub) {
        completedActs.push(act);
      } else {
        uncompletedActs.push(act);
      }
    });

    const notes = this.getTeacherNotes();
    const likesReceived = subs.reduce((acc, cur) => acc + (cur.likesCount || 0), 0);
    const allSubs = this.getSubmissions();
    const likesGiven = allSubs.filter(s => s.likedBy.includes(student.participantCode.toUpperCase())).length;

    return {
      membership: student,
      completedActivities: completedActs,
      uncompletedActivities: uncompletedActs,
      submissions: subs,
      comments,
      likesGivenCount: likesGiven,
      likesReceivedCount: likesReceived,
      teacherNote: notes[student.id]
    };
  }

  /**
   * [DEV ONLY / INTERNAL]
   * 개발 및 비상 테스트 전용 초기화 함수.
   * 사용자 UI에는 절대 노출하지 않으며 관리자 화면 진입 시에도 절대 자동 호출되지 않습니다.
   * 
   * TODO: Firebase 연결 후에는 Google Authentication으로 로그인한 사용자 중
   * 지정된 관리자 UID(예: adminUIDs.includes(currentUser.uid))만 관리자 권한을 획득하도록 구현 예정.
   */
  public resetAllToDemo(): void {
    localStorage.removeItem(KEYS.ROOM);
    localStorage.removeItem(KEYS.ACTIVITIES);
    localStorage.removeItem(KEYS.STUDENTS);
    localStorage.removeItem(KEYS.SUBMISSIONS);
    localStorage.removeItem(KEYS.COMMENTS);
    localStorage.removeItem(KEYS.NOTES);
  }
}

export const dataService = new DataService();
