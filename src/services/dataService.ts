import { 
  Room, Activity, StudentMembership, Submission, Comment, TeacherPrivateNote, 
  ProgressStatus, ComprehensiveStudentEvidence, ActivityStatus,
  ActivitySummaryStats, StudentPortfolioRecord, StudentPortfolioData,
  AuditLog, UserRole
} from '../types';
import { 
  ROOM_CODE, TEACHER_CODES, initialRoom, initialStudents, 
  initialActivities, initialSubmissions, initialComments, initialTeacherNotes 
} from '../mock/demoData';
import { db, auth, isFirebaseConfigured, onAuthChanged } from '../firebase';
import { 
  doc, setDoc, getDoc, getDocs, collection, updateDoc, 
  deleteDoc, onSnapshot 
} from 'firebase/firestore';

const KEYS = {
  ROOM: 'cb_v2_room',
  ACTIVITIES: 'cb_v2_activities',
  STUDENTS: 'cb_v2_students',
  SUBMISSIONS: 'cb_v2_submissions',
  COMMENTS: 'cb_v2_comments',
  NOTES: 'cb_v2_notes',
  AUDIT_LOGS: 'cb_v2_audit_logs',
  APP_MODE: 'cb_app_mode'
};

const DEFAULT_ROOM_ID = 'room-kr-tw-01';

class DataService {
  private isFirestoreSyncStarted = false;
  private isReviewerMode = false;
  private unsubs: (() => void)[] = [];

  // Reviewer in-memory mock store (completely isolated from LocalStorage and Firestore)
  private reviewerRoom: Room | null = null;
  private reviewerActivities: Activity[] | null = null;
  private reviewerStudents: StudentMembership[] | null = null;
  private reviewerSubmissions: Submission[] | null = null;
  private reviewerComments: Comment[] | null = null;
  private reviewerNotes: Record<string, TeacherPrivateNote> | null = null;

  constructor() {
    // Only subscribe to Firestore if user is authenticated and not in reviewer mode
    onAuthChanged((user) => {
      if (user && !this.isReviewerMode && this.isFirebaseMode()) {
        this.initFirestoreSync();
      } else if (!user) {
        this.stopFirestoreSync();
      }
    });
  }

  // --- Reviewer Mode Controls ---
  public getIsReviewerMode(): boolean {
    return this.isReviewerMode;
  }

  public setReviewerMode(enabled: boolean): void {
    this.isReviewerMode = enabled;
    if (enabled) {
      this.stopFirestoreSync();
      this.initReviewerData();
    } else {
      this.clearReviewerData();
      this.stopFirestoreSync();
      if (auth.currentUser && this.isFirebaseMode()) {
        this.initFirestoreSync();
      }
    }
  }

  public initReviewerData(): void {
    this.reviewerRoom = JSON.parse(JSON.stringify(initialRoom));
    this.reviewerActivities = JSON.parse(JSON.stringify(initialActivities));
    this.reviewerStudents = JSON.parse(JSON.stringify(initialStudents));
    this.reviewerSubmissions = JSON.parse(JSON.stringify(initialSubmissions));
    this.reviewerComments = JSON.parse(JSON.stringify(initialComments));
    this.reviewerNotes = JSON.parse(JSON.stringify(initialTeacherNotes));
  }

  public clearReviewerData(): void {
    this.reviewerRoom = null;
    this.reviewerActivities = null;
    this.reviewerStudents = null;
    this.reviewerSubmissions = null;
    this.reviewerComments = null;
    this.reviewerNotes = null;
  }

  // --- Mode Determination ---
  public isFirebaseMode(): boolean {
    if (this.isReviewerMode) return false;
    if (!isFirebaseConfigured()) return false;
    const mode = localStorage.getItem(KEYS.APP_MODE);
    return mode !== 'demo';
  }

  public setAppMode(mode: 'firebase' | 'demo'): void {
    localStorage.setItem(KEYS.APP_MODE, mode);
    window.location.reload();
  }

  // --- LocalStorage Fallback & Cache Helpers ---
  private getStorage<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
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

  // --- Firestore Real-time Sync (Subcollections) ---
  public async initFirestoreSync() {
    if (this.isReviewerMode || this.isFirestoreSyncStarted || !this.isFirebaseMode()) return;
    if (!auth.currentUser) return; // Prevent unauthenticated subscription permission errors
    this.isFirestoreSyncStarted = true;

    try {
      // 1. Listen to Room: rooms/{roomId}
      const roomRef = doc(db, 'rooms', DEFAULT_ROOM_ID);
      const unsubRoom = onSnapshot(roomRef, (snapshot) => {
        if (this.isReviewerMode) return;
        if (snapshot.exists()) {
          const remoteRoom = snapshot.data() as Room;
          this.setStorage(KEYS.ROOM, remoteRoom);
        }
      }, (err) => {
        if (!this.isReviewerMode) {
          console.warn('Firestore room sync notice:', err.message);
        }
      });
      this.unsubs.push(unsubRoom);

      // 2. Listen to Activities: rooms/{roomId}/activities
      const activitiesCol = collection(db, 'rooms', DEFAULT_ROOM_ID, 'activities');
      const unsubActs = onSnapshot(activitiesCol, (snapshot) => {
        if (this.isReviewerMode) return;
        if (!snapshot.empty) {
          const list: Activity[] = [];
          snapshot.forEach((d) => list.push(d.data() as Activity));
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          this.setStorage(KEYS.ACTIVITIES, list);
        }
      }, (err) => {
        if (!this.isReviewerMode) {
          console.warn('Firestore activities sync notice:', err.message);
        }
      });
      this.unsubs.push(unsubActs);

      // 3. Listen to Submissions: rooms/{roomId}/submissions
      const subsCol = collection(db, 'rooms', DEFAULT_ROOM_ID, 'submissions');
      const unsubSubs = onSnapshot(subsCol, (snapshot) => {
        if (this.isReviewerMode) return;
        if (!snapshot.empty) {
          const list: Submission[] = [];
          snapshot.forEach((d) => list.push(d.data() as Submission));
          this.setStorage(KEYS.SUBMISSIONS, list);
        }
      }, (err) => {
        if (!this.isReviewerMode) {
          console.warn('Firestore submissions sync notice:', err.message);
        }
      });
      this.unsubs.push(unsubSubs);

      // 4. Listen to Comments: rooms/{roomId}/comments
      const cmtsCol = collection(db, 'rooms', DEFAULT_ROOM_ID, 'comments');
      const unsubCmts = onSnapshot(cmtsCol, (snapshot) => {
        if (this.isReviewerMode) return;
        if (!snapshot.empty) {
          const list: Comment[] = [];
          snapshot.forEach((d) => list.push(d.data() as Comment));
          this.setStorage(KEYS.COMMENTS, list);
        }
      }, (err) => {
        if (!this.isReviewerMode) {
          console.warn('Firestore comments sync notice:', err.message);
        }
      });
      this.unsubs.push(unsubCmts);

      // 5. Listen to Teacher Notes: teacherPrivateNotes/{noteId}
      const notesCol = collection(db, 'teacherPrivateNotes');
      const unsubNotes = onSnapshot(notesCol, (snapshot) => {
        if (this.isReviewerMode) return;
        if (!snapshot.empty) {
          const map: Record<string, TeacherPrivateNote> = {};
          snapshot.forEach((d) => {
            const data = d.data() as TeacherPrivateNote;
            map[data.membershipId] = data;
          });
          this.setStorage(KEYS.NOTES, map);
        }
      }, (err) => {
        if (!this.isReviewerMode) {
          console.warn('Firestore teacher notes sync notice:', err.message);
        }
      });
      this.unsubs.push(unsubNotes);

    } catch (e) {
      if (!this.isReviewerMode) {
        console.warn('Firestore connection initialized in offline-resilient mode:', e);
      }
    }
  }

  public stopFirestoreSync(): void {
    this.unsubs.forEach(unsub => {
      try {
        unsub();
      } catch {}
    });
    this.unsubs = [];
    this.isFirestoreSyncStarted = false;
  }

  // --- Audit Trail Logging (Strict: Only Teachers and Admins write to auditLogs) ---
  public logAuditAction(
    action: AuditLog['action'],
    targetType: AuditLog['targetType'],
    targetId: string,
    details?: string,
    role: UserRole = 'teacher'
  ): void {
    // Security enforcement: Anonymous students and reviewer mode are strictly forbidden from writing to auditLogs!
    if (this.isReviewerMode || role === 'student') return;

    const currentUser = auth.currentUser;
    const logItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actorUid: currentUser?.uid || 'local-actor',
      actorEmail: currentUser?.email || undefined,
      actorRole: role,
      action,
      targetType,
      targetId,
      details
    };

    // Save to LocalStorage cache
    const currentLogs = this.getStorage<any[]>(KEYS.AUDIT_LOGS, []);
    currentLogs.unshift(logItem);
    this.setStorage(KEYS.AUDIT_LOGS, currentLogs.slice(0, 200));

    // Save to Firestore auditLogs collection if teacher/admin
    if (this.isFirebaseMode() && currentUser && (role === 'teacher' || role === 'admin')) {
      try {
        setDoc(doc(db, 'auditLogs', logItem.id), logItem).catch(() => {});
      } catch {}
    }
  }

  public getAuditLogs(): AuditLog[] {
    return this.getStorage<AuditLog[]>(KEYS.AUDIT_LOGS, []);
  }

  // --- Student Participant Whitelist & Claiming ---
  public verifyStudentCredentials(
    roomCode: string, 
    participantCode: string, 
    englishNickname: string
  ): StudentMembership | null {
    if (roomCode.trim().toUpperCase() !== ROOM_CODE) {
      return null;
    }

    const students = this.getStudents();
    const cleanNick = englishNickname.trim().toLowerCase();
    const cleanCode = participantCode.trim().toUpperCase();

    const found = students.find(
      s => s.englishNickname.trim().toLowerCase() === cleanNick &&
           s.participantCode.trim().toUpperCase() === cleanCode
    );

    if (!found) {
      return null;
    }

    const partnerSide: 'Korea Class' | 'Taiwan Class' = 
      cleanCode.startsWith('K') ? 'Korea Class' :
      cleanCode.startsWith('T') ? 'Taiwan Class' :
      found.partnerSide;

    return {
      ...found,
      partnerSide
    };
  }

  /**
   * Binds anonymous auth UID to the participant document in rooms/{roomId}/participants/{participantId}
   */
  public async claimParticipantSlot(
    roomCode: string, 
    participantCode: string, 
    englishNickname: string
  ): Promise<boolean> {
    if (this.isReviewerMode || !this.isFirebaseMode() || !auth.currentUser) return true;
    try {
      const cleanCode = participantCode.trim().toUpperCase();
      const pDocRef = doc(db, 'rooms', DEFAULT_ROOM_ID, 'participants', `p-${cleanCode}`);
      const snap = await getDoc(pDocRef);

      if (snap.exists()) {
        const data = snap.data();
        if (!data.isClaimed) {
          await updateDoc(pDocRef, {
            authUid: auth.currentUser.uid,
            isClaimed: true,
            claimedAt: new Date().toISOString()
          });
        }
      } else {
        // Initialize participant slot if not pre-seeded
        await setDoc(pDocRef, {
          id: `p-${cleanCode}`,
          roomId: DEFAULT_ROOM_ID,
          participantCode: cleanCode,
          englishNickname,
          authUid: auth.currentUser.uid,
          isClaimed: true,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
      return true;
    } catch (e) {
      console.warn('Participant claim notice:', e);
      return true;
    }
  }

  public verifyTeacherCode(code: string): 'Korea Class' | 'Taiwan Class' | null {
    const c = code.trim().toUpperCase();
    if (c === TEACHER_CODES.KOREA) return 'Korea Class';
    if (c === TEACHER_CODES.TAIWAN) return 'Taiwan Class';
    return null;
  }

  // --- Room ---
  public getRoom(): Room {
    if (this.isReviewerMode) {
      if (!this.reviewerRoom) this.initReviewerData();
      return JSON.parse(JSON.stringify(this.reviewerRoom!));
    }
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

    if (this.isReviewerMode) {
      this.reviewerRoom = room;
      return room;
    }

    this.setStorage(KEYS.ROOM, room);

    if (this.isFirebaseMode()) {
      try {
        setDoc(doc(db, 'rooms', DEFAULT_ROOM_ID), room, { merge: true }).catch(() => {});
      } catch {}
    }

    this.logAuditAction('update', 'room', room.id, `Status changed for ${partnerSide} to ${newStatus}`);
    return room;
  }

  // --- Students (Local whitelist roster) ---
  public getStudents(): StudentMembership[] {
    if (this.isReviewerMode) {
      if (!this.reviewerStudents) this.initReviewerData();
      return JSON.parse(JSON.stringify(this.reviewerStudents!));
    }
    return this.getStorage<StudentMembership[]>(KEYS.STUDENTS, initialStudents);
  }

  public getStudentById(id: string): StudentMembership | undefined {
    return this.getStudents().find(s => s.id === id);
  }

  // --- Activities ---
  public getActivities(includeArchived = false, includeDeleted = false): Activity[] {
    const all = this.isReviewerMode
      ? (this.reviewerActivities || (this.initReviewerData(), this.reviewerActivities!))
      : this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    return all.filter(a => {
      if (!includeDeleted && a.isDeleted) return false;
      if (!includeArchived && a.status === 'archived') return false;
      return true;
    });
  }

  public getActivityById(id: string): Activity | undefined {
    return this.getActivities(true, true).find(a => a.id === id && !a.isDeleted);
  }

  public createActivity(activity: Omit<Activity, 'id' | 'roomId' | 'createdAt' | 'updatedAt'>): Activity {
    const dueTime = activity.dueDate ? new Date(activity.dueDate + 'T23:59:59Z').getTime() : Date.now() + 7 * 86400000;
    
    const newAct: Activity & { dueEpochMs: number } = {
      ...activity,
      id: `act-${Date.now()}`,
      roomId: DEFAULT_ROOM_ID,
      isDeleted: false,
      dueEpochMs: isNaN(dueTime) ? Date.now() + 7 * 86400000 : dueTime,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (this.isReviewerMode) {
      if (!this.reviewerActivities) this.initReviewerData();
      this.reviewerActivities!.unshift(newAct);
      return newAct;
    }

    const activities = this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    activities.unshift(newAct);
    this.setStorage(KEYS.ACTIVITIES, activities);

    if (this.isFirebaseMode()) {
      try {
        setDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'activities', newAct.id), newAct).catch(() => {});
      } catch {}
    }

    this.logAuditAction('create', 'activity', newAct.id, `Created activity: ${newAct.title}`);
    return newAct;
  }

  public updateActivity(id: string, updates: Partial<Activity>): Activity | null {
    if (this.isReviewerMode) {
      if (!this.reviewerActivities) this.initReviewerData();
      const idx = this.reviewerActivities!.findIndex(a => a.id === id);
      if (idx === -1) return null;
      this.reviewerActivities![idx] = {
        ...this.reviewerActivities![idx],
        ...updates,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      return this.reviewerActivities![idx];
    }

    const activities = this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    const idx = activities.findIndex(a => a.id === id);
    if (idx === -1) return null;

    activities[idx] = {
      ...activities[idx],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.setStorage(KEYS.ACTIVITIES, activities);

    if (this.isFirebaseMode()) {
      try {
        updateDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'activities', id), {
          ...updates,
          updatedAt: new Date().toISOString().split('T')[0]
        }).catch(() => {});
      } catch {}
    }

    this.logAuditAction('update', 'activity', id, `Updated fields: ${Object.keys(updates).join(', ')}`);
    return activities[idx];
  }

  public duplicateActivity(id: string): Activity | null {
    const act = this.getActivityById(id);
    if (!act) return null;

    const dueTime = act.dueDate ? new Date(act.dueDate + 'T23:59:59Z').getTime() : Date.now() + 7 * 86400000;
    const dup: Activity & { dueEpochMs: number } = {
      ...act,
      id: `act-${Date.now()}`,
      title: `${act.title} (Copy)`,
      status: 'draft',
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deletionReason: undefined,
      dueEpochMs: isNaN(dueTime) ? Date.now() + 7 * 86400000 : dueTime,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (this.isReviewerMode) {
      if (!this.reviewerActivities) this.initReviewerData();
      this.reviewerActivities!.unshift(dup);
      return dup;
    }

    const activities = this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    activities.unshift(dup);
    this.setStorage(KEYS.ACTIVITIES, activities);

    if (this.isFirebaseMode()) {
      try {
        setDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'activities', dup.id), dup).catch(() => {});
      } catch {}
    }

    this.logAuditAction('create', 'activity', dup.id, `Duplicated from ${id}`);
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

  // --- Deletion & Trash Policies ---
  public canDeleteActivity(id: string): { canDelete: boolean; reason: string } {
    const act = this.getActivityById(id);
    if (!act) {
      return { canDelete: false, reason: '존재하지 않는 활동입니다.' };
    }
    const subs = this.getSubmissions(id);
    if (subs.length > 0) {
      return { 
        canDelete: false, 
        reason: '학생 수행 기록이 있는 활동은 삭제할 수 없습니다. 평가 근거 보존을 위해 활동을 보관해 주세요.' 
      };
    }
    const allComments = this.getComments();
    const relatedComments = allComments.filter(c => c.activityId === id);
    if (relatedComments.length > 0) {
      return { 
        canDelete: false, 
        reason: '학생 수행 기록(댓글)이 있는 활동은 삭제할 수 없습니다. 평가 근거 보존을 위해 활동을 보관해 주세요.' 
      };
    }
    return { canDelete: true, reason: '' };
  }

  /**
   * Soft delete (moves to Trash Bin / Archive)
   */
  public softDeleteActivity(id: string, deletedBy: string, reason?: string): { success: boolean; message: string } {
    const check = this.canDeleteActivity(id);
    if (!check.canDelete) {
      return { 
        success: false, 
        message: check.reason || '학생 수행 기록이 있는 활동은 삭제할 수 없습니다.' 
      };
    }

    const updated = this.updateActivity(id, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy,
      deletionReason: reason || '교사 요청에 따른 휴지통 보관'
    });

    if (!updated) {
      return { success: false, message: '활동을 찾을 수 없습니다.' };
    }

    this.logAuditAction('soft_delete', 'activity', id, `Moved to trash by ${deletedBy}. Reason: ${reason || 'N/A'}`);
    return { success: true, message: '활동이 휴지통으로 안전하게 이동되었습니다.' };
  }

  public getTrashActivities(): Activity[] {
    const all = this.isReviewerMode
      ? (this.reviewerActivities || (this.initReviewerData(), this.reviewerActivities!))
      : this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    return all.filter(a => a.isDeleted === true);
  }

  public restoreTrashActivity(id: string, restoredBy: string): { success: boolean; message: string } {
    if (this.isReviewerMode) {
      if (!this.reviewerActivities) this.initReviewerData();
      const act = this.reviewerActivities!.find(a => a.id === id && a.isDeleted);
      if (!act) return { success: false, message: '휴지통에서 해당 활동을 찾을 수 없습니다.' };
      act.isDeleted = false;
      act.deletedAt = undefined;
      act.deletedBy = undefined;
      act.deletionReason = undefined;
      act.updatedAt = new Date().toISOString().split('T')[0];
      return { success: true, message: '활동이 정상적으로 복원되었습니다.' };
    }

    const activities = this.getStorage<Activity[]>(KEYS.ACTIVITIES, initialActivities);
    const act = activities.find(a => a.id === id && a.isDeleted);
    if (!act) {
      return { success: false, message: '휴지통에서 해당 활동을 찾을 수 없습니다.' };
    }

    act.isDeleted = false;
    act.deletedAt = undefined;
    act.deletedBy = undefined;
    act.deletionReason = undefined;
    act.updatedAt = new Date().toISOString().split('T')[0];

    this.setStorage(KEYS.ACTIVITIES, activities);

    if (this.isFirebaseMode()) {
      try {
        updateDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'activities', id), {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deletionReason: null,
          updatedAt: act.updatedAt
        }).catch(() => {});
      } catch {}
    }

    this.logAuditAction('restore', 'activity', id, `Restored from trash by admin (${restoredBy})`, 'admin');
    return { success: true, message: '활동이 정상적으로 복원되었습니다.' };
  }

  // --- Submissions (Student Writing / Polls / QA) ---
  public getSubmissions(activityId?: string): Submission[] {
    const all = this.isReviewerMode
      ? (this.reviewerSubmissions || (this.initReviewerData(), this.reviewerSubmissions!))
      : this.getStorage<Submission[]>(KEYS.SUBMISSIONS, initialSubmissions);
    const valid = all.filter(s => !s.isDeleted);
    if (!activityId) return valid;
    return valid.filter(s => s.activityId === activityId);
  }

  public getSubmissionById(id: string): Submission | undefined {
    return this.getSubmissions().find(s => s.id === id);
  }

  public createSubmission(sub: Omit<Submission, 'id' | 'submittedAt' | 'likesCount' | 'likedBy' | 'isHidden' | 'isApproved'>): Submission {
    const participantCodeClean = sub.participantCode.trim().toUpperCase();
    const newSub: Submission & { roomId: string; participantId: string; authorUid: string } = {
      ...sub,
      id: `sub-${Date.now()}`,
      roomId: DEFAULT_ROOM_ID,
      participantId: `p-${participantCodeClean}`,
      authorUid: auth.currentUser?.uid || 'anon-uid',
      submittedAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      likesCount: 0,
      likedBy: [],
      isApproved: true,
      isHidden: false,
      isDeleted: false
    };

    if (this.isReviewerMode) {
      if (!this.reviewerSubmissions) this.initReviewerData();
      this.reviewerSubmissions!.unshift(newSub);
      return newSub;
    }

    const subs = this.getStorage<Submission[]>(KEYS.SUBMISSIONS, initialSubmissions);
    subs.unshift(newSub);
    this.setStorage(KEYS.SUBMISSIONS, subs);

    if (this.isFirebaseMode()) {
      try {
        setDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'submissions', newSub.id), newSub).catch(() => {});
      } catch {}
    }

    return newSub;
  }

  public updateSubmission(
    id: string, 
    updates: Partial<Submission>, 
    requesterCode?: string
  ): { success: boolean; submission?: Submission; message?: string } {
    if (this.isReviewerMode) {
      if (!this.reviewerSubmissions) this.initReviewerData();
      const idx = this.reviewerSubmissions!.findIndex(s => s.id === id);
      if (idx === -1) return { success: false, message: '제출물을 찾을 수 없습니다.' };
      this.reviewerSubmissions![idx] = {
        ...this.reviewerSubmissions![idx],
        ...updates,
        updatedAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
      };
      return { success: true, submission: this.reviewerSubmissions![idx] };
    }

    const subs = this.getStorage<Submission[]>(KEYS.SUBMISSIONS, initialSubmissions);
    const idx = subs.findIndex(s => s.id === id);
    if (idx === -1) return { success: false, message: '제출물을 찾을 수 없습니다.' };

    const targetSub = subs[idx];

    // Ownership check: student can only edit their own submission
    if (requesterCode && targetSub.participantCode.toUpperCase() !== requesterCode.toUpperCase()) {
      return { success: false, message: '본인의 과제물만 수정할 수 있습니다.' };
    }

    // Deadline check
    const act = this.getActivityById(targetSub.activityId);
    if (act && act.dueDate) {
      const due = new Date(act.dueDate + 'T23:59:59Z');
      if (!isNaN(due.getTime()) && new Date() > due) {
        return { success: false, message: '마감일이 지난 활동의 과제물은 수정할 수 없습니다.' };
      }
    }

    subs[idx] = {
      ...subs[idx],
      ...updates,
      updatedAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    };
    this.setStorage(KEYS.SUBMISSIONS, subs);

    if (this.isFirebaseMode()) {
      try {
        updateDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'submissions', id), {
          ...updates,
          updatedAt: subs[idx].updatedAt
        }).catch(() => {});
      } catch {}
    }

    return { success: true, submission: subs[idx] };
  }

  /**
   * Likes: saved at rooms/{roomId}/submissions/{submissionId}/likes/{uid}
   */
  public async toggleLike(submissionId: string, participantCode: string): Promise<{ likesCount: number; isLiked: boolean }> {
    if (this.isReviewerMode) {
      if (!this.reviewerSubmissions) this.initReviewerData();
      const target = this.reviewerSubmissions!.find(s => s.id === submissionId);
      if (!target) return { likesCount: 0, isLiked: false };

      const cleanCode = participantCode.toUpperCase();
      const idx = target.likedBy.indexOf(cleanCode);
      let isLiked = false;

      if (idx >= 0) {
        target.likedBy.splice(idx, 1);
        target.likesCount = Math.max(0, target.likesCount - 1);
        isLiked = false;
      } else {
        target.likedBy.push(cleanCode);
        target.likesCount += 1;
        isLiked = true;
      }
      return { likesCount: target.likesCount, isLiked };
    }

    const subs = this.getStorage<Submission[]>(KEYS.SUBMISSIONS, initialSubmissions);
    const target = subs.find(s => s.id === submissionId);
    if (!target) return { likesCount: 0, isLiked: false };

    const cleanCode = participantCode.toUpperCase();
    const idx = target.likedBy.indexOf(cleanCode);
    let isLiked = false;

    if (idx >= 0) {
      target.likedBy.splice(idx, 1);
      target.likesCount = Math.max(0, target.likesCount - 1);
      isLiked = false;
    } else {
      target.likedBy.push(cleanCode);
      target.likesCount += 1;
      isLiked = true;
    }

    this.setStorage(KEYS.SUBMISSIONS, subs);

    if (this.isFirebaseMode() && auth.currentUser) {
      try {
        const likeDocRef = doc(db, 'rooms', DEFAULT_ROOM_ID, 'submissions', submissionId, 'likes', auth.currentUser.uid);
        if (isLiked) {
          await setDoc(likeDocRef, {
            uid: auth.currentUser.uid,
            participantCode: cleanCode,
            createdAt: new Date().toISOString()
          });
        } else {
          await deleteDoc(likeDocRef);
        }

        // Also update counter on submission document
        await updateDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'submissions', submissionId), {
          likesCount: target.likesCount,
          likedBy: target.likedBy
        });
      } catch (e) {
        console.warn('Like sync notice:', e);
      }
    }

    return { likesCount: target.likesCount, isLiked };
  }

  public toggleHideSubmission(id: string): boolean {
    if (this.isReviewerMode) {
      if (!this.reviewerSubmissions) this.initReviewerData();
      const target = this.reviewerSubmissions!.find(s => s.id === id);
      if (!target) return false;
      target.isHidden = !target.isHidden;
      return target.isHidden;
    }

    const subs = this.getStorage<Submission[]>(KEYS.SUBMISSIONS, initialSubmissions);
    const target = subs.find(s => s.id === id);
    if (!target) return false;
    target.isHidden = !target.isHidden;
    this.setStorage(KEYS.SUBMISSIONS, subs);

    if (this.isFirebaseMode()) {
      try {
        updateDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'submissions', id), { isHidden: target.isHidden }).catch(() => {});
      } catch {}
    }

    this.logAuditAction('update', 'submission', id, `Visibility toggled to hidden=${target.isHidden}`);
    return target.isHidden;
  }

  // --- Comments ---
  public getComments(submissionId?: string): Comment[] {
    const all = this.isReviewerMode
      ? (this.reviewerComments || (this.initReviewerData(), this.reviewerComments!))
      : this.getStorage<Comment[]>(KEYS.COMMENTS, initialComments);
    const valid = all.filter(c => !c.isDeleted);
    if (!submissionId) return valid;
    return valid.filter(c => c.submissionId === submissionId);
  }

  public addComment(cmt: Omit<Comment, 'id' | 'createdAt' | 'isHidden'>): Comment {
    const cleanCode = cmt.participantCode.trim().toUpperCase();
    const newCmt: Comment & { roomId: string; participantId: string; authorUid: string } = {
      ...cmt,
      id: `cmt-${Date.now()}`,
      roomId: DEFAULT_ROOM_ID,
      participantId: `p-${cleanCode}`,
      authorUid: auth.currentUser?.uid || 'anon-uid',
      createdAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      isHidden: false,
      isDeleted: false
    };

    if (this.isReviewerMode) {
      if (!this.reviewerComments) this.initReviewerData();
      this.reviewerComments!.push(newCmt);
      return newCmt;
    }

    const cmts = this.getStorage<Comment[]>(KEYS.COMMENTS, initialComments);
    cmts.push(newCmt);
    this.setStorage(KEYS.COMMENTS, cmts);

    if (this.isFirebaseMode()) {
      try {
        setDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'comments', newCmt.id), newCmt).catch(() => {});
      } catch {}
    }

    return newCmt;
  }

  public updateComment(id: string, content: string): Comment | null {
    if (this.isReviewerMode) {
      if (!this.reviewerComments) this.initReviewerData();
      const idx = this.reviewerComments!.findIndex(c => c.id === id);
      if (idx === -1) return null;
      this.reviewerComments![idx].content = content;
      this.reviewerComments![idx].updatedAt = new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' });
      return this.reviewerComments![idx];
    }

    const cmts = this.getStorage<Comment[]>(KEYS.COMMENTS, initialComments);
    const idx = cmts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    cmts[idx].content = content;
    cmts[idx].updatedAt = new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' });
    this.setStorage(KEYS.COMMENTS, cmts);

    if (this.isFirebaseMode()) {
      try {
        updateDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'comments', id), {
          content,
          updatedAt: cmts[idx].updatedAt
        }).catch(() => {});
      } catch {}
    }

    return cmts[idx];
  }

  public deleteComment(id: string, requesterRole: UserRole = 'teacher'): { success: boolean; message: string } {
    if (requesterRole === 'student') {
      return { success: false, message: '학생은 댓글을 삭제할 수 없습니다.' };
    }

    if (this.isReviewerMode) {
      if (!this.reviewerComments) this.initReviewerData();
      const idx = this.reviewerComments!.findIndex(c => c.id === id);
      if (idx === -1) return { success: false, message: '댓글을 찾을 수 없습니다.' };
      this.reviewerComments![idx].isDeleted = true;
      return { success: true, message: '댓글이 보관(삭제) 처리되었습니다.' };
    }

    const cmts = this.getStorage<Comment[]>(KEYS.COMMENTS, initialComments);
    const idx = cmts.findIndex(c => c.id === id);
    if (idx === -1) return { success: false, message: '댓글을 찾을 수 없습니다.' };

    cmts[idx].isDeleted = true;
    this.setStorage(KEYS.COMMENTS, cmts);

    if (this.isFirebaseMode()) {
      try {
        updateDoc(doc(db, 'rooms', DEFAULT_ROOM_ID, 'comments', id), { isDeleted: true }).catch(() => {});
      } catch {}
    }

    this.logAuditAction('soft_delete', 'comment', id, `Comment soft-deleted by ${requesterRole}`);
    return { success: true, message: '댓글이 보관(삭제) 처리되었습니다.' };
  }

  // --- Teacher Private Notes (Confidential) ---
  public getTeacherNotes(): Record<string, TeacherPrivateNote> {
    if (this.isReviewerMode) {
      if (!this.reviewerNotes) this.initReviewerData();
      return JSON.parse(JSON.stringify(this.reviewerNotes!));
    }
    return this.getStorage<Record<string, TeacherPrivateNote>>(KEYS.NOTES, initialTeacherNotes);
  }

  public saveTeacherNote(membershipId: string, noteText: string): void {
    if (this.isReviewerMode) {
      if (!this.reviewerNotes) this.initReviewerData();
      const noteObj: TeacherPrivateNote = {
        id: this.reviewerNotes![membershipId]?.id || `note-${Date.now()}`,
        roomId: DEFAULT_ROOM_ID,
        membershipId,
        teacherId: 'reviewer-demo-user',
        note: noteText,
        updatedAt: new Date().toLocaleDateString()
      };
      this.reviewerNotes![membershipId] = noteObj;
      return;
    }

    const notes = this.getTeacherNotes();
    const noteObj: TeacherPrivateNote = {
      id: notes[membershipId]?.id || `note-${Date.now()}`,
      roomId: DEFAULT_ROOM_ID,
      membershipId,
      teacherId: auth.currentUser?.uid || 'teacher-auth-user',
      note: noteText,
      updatedAt: new Date().toLocaleDateString()
    };
    notes[membershipId] = noteObj;
    this.setStorage(KEYS.NOTES, notes);

    if (this.isFirebaseMode()) {
      try {
        setDoc(doc(db, 'teacherPrivateNotes', `${DEFAULT_ROOM_ID}_${membershipId}`), noteObj).catch(() => {});
      } catch {}
    }

    this.logAuditAction('update', 'note', membershipId, 'Updated confidential teacher note');
  }

  // --- Assessment Evidence & Portfolio ---
  public getComprehensiveEvidence(studentId: string): ComprehensiveStudentEvidence | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const activities = this.getActivities();
    const subs = this.getSubmissions().filter(s => s.membershipId === student.id || s.participantCode.toUpperCase() === student.participantCode.toUpperCase());
    const comments = this.getComments().filter(c => c.membershipId === student.id || c.participantCode.toUpperCase() === student.participantCode.toUpperCase());
    
    const completedActs: Activity[] = [];
    const uncompletedActs: Activity[] = [];

    activities.forEach(act => {
      const hasSub = subs.some(s => s.activityId === act.id);
      if (hasSub) completedActs.push(act);
      else uncompletedActs.push(act);
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

  // --- Backup Export (JSON without Student PII) ---
  public exportRoomDataAsJSON(roomId: string = DEFAULT_ROOM_ID): void {
    const room = this.getRoom();
    const activities = this.getActivities(true, true);
    const submissions = this.getSubmissions().map(s => ({
      id: s.id,
      activityId: s.activityId,
      participantCode: s.participantCode,
      englishNickname: s.englishNickname,
      partnerSide: s.partnerSide,
      type: s.type,
      title: s.title,
      content: s.content,
      selectedOptions: s.selectedOptions,
      parentQuestionId: s.parentQuestionId,
      language: s.language,
      submittedAt: s.submittedAt,
      likesCount: s.likesCount,
      isApproved: s.isApproved
    }));
    const comments = this.getComments().map(c => ({
      id: c.id,
      submissionId: c.submissionId,
      activityId: c.activityId,
      participantCode: c.participantCode,
      englishNickname: c.englishNickname,
      partnerSide: c.partnerSide,
      content: c.content,
      createdAt: c.createdAt
    }));

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      exportScope: 'ClassBridge Room Archive (Sanitized, No Real Names / No Emails)',
      room,
      activities,
      submissions,
      comments
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classbridge_export_${roomId}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.logAuditAction('update', 'room', roomId, 'Teacher exported sanitized room data JSON backup');
  }

  // --- Production Safe Reset Protection ---
  public resetAllToDemo(): void {
    if (!import.meta.env.DEV) {
      console.error('Data reset is strictly disabled in production environment.');
      return;
    }
    localStorage.removeItem(KEYS.ROOM);
    localStorage.removeItem(KEYS.ACTIVITIES);
    localStorage.removeItem(KEYS.STUDENTS);
    localStorage.removeItem(KEYS.SUBMISSIONS);
    localStorage.removeItem(KEYS.COMMENTS);
    localStorage.removeItem(KEYS.NOTES);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
  }
}

export const dataService = new DataService();
