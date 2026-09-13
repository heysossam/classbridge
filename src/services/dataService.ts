import { Room, Activity, StudentMembership, StudentResponse, TeacherPrivateNote, ProgressStatus } from '../types';
import { initialRoom, initialActivity, initialStudents, initialResponses, initialTeacherNotes } from '../mock/demoData';

const STORAGE_KEYS = {
  ROOM: 'classbridge_room',
  ACTIVITY: 'classbridge_activity',
  STUDENTS: 'classbridge_students',
  RESPONSES: 'classbridge_responses',
  NOTES: 'classbridge_notes',
};

class DataService {
  private getStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public getRoom(): Room {
    return this.getStorage<Room>(STORAGE_KEYS.ROOM, initialRoom);
  }

  public updateClassStatus(partnerSide: 'Korea Class' | 'Taiwan Class', newStatus: ProgressStatus): Room {
    const room = this.getRoom();
    if (partnerSide === 'Korea Class') {
      room.partnerAStatus = newStatus;
    } else {
      room.partnerBStatus = newStatus;
    }
    room.lastUpdated = 'Just now';
    this.setStorage(STORAGE_KEYS.ROOM, room);
    return room;
  }

  public getActivity(): Activity {
    return this.getStorage<Activity>(STORAGE_KEYS.ACTIVITY, initialActivity);
  }

  public getStudents(): StudentMembership[] {
    return this.getStorage<StudentMembership[]>(STORAGE_KEYS.STUDENTS, initialStudents);
  }

  public getResponses(): StudentResponse[] {
    return this.getStorage<StudentResponse[]>(STORAGE_KEYS.RESPONSES, initialResponses);
  }

  public submitStudentResponse(response: Omit<StudentResponse, 'id' | 'submittedAt' | 'visibilityStatus'>): StudentResponse {
    const responses = this.getResponses();
    const students = this.getStudents();

    // Check if membership exists, if not register anonymously
    let student = students.find(s => s.participantCode.toUpperCase() === response.participantCode.toUpperCase());
    if (!student) {
      student = {
        id: `m-${Date.now()}`,
        roomId: response.roomId,
        participantCode: response.participantCode.toUpperCase(),
        englishNickname: response.englishNickname,
        partnerSide: response.partnerSide,
        createdAt: new Date().toISOString().split('T')[0]
      };
      students.push(student);
      this.setStorage(STORAGE_KEYS.STUDENTS, students);
    }

    // Check if existing response exists, replace or add
    const existingIndex = responses.findIndex(r => r.membershipId === student!.id || r.participantCode.toUpperCase() === response.participantCode.toUpperCase());
    
    const newRes: StudentResponse = {
      ...response,
      id: existingIndex >= 0 ? responses[existingIndex].id : `res-${Date.now()}`,
      membershipId: student.id,
      participantCode: response.participantCode.toUpperCase(),
      submittedAt: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      visibilityStatus: 'public'
    };

    if (existingIndex >= 0) {
      responses[existingIndex] = newRes;
    } else {
      responses.push(newRes);
    }

    this.setStorage(STORAGE_KEYS.RESPONSES, responses);
    return newRes;
  }

  public getTeacherNotes(): Record<string, TeacherPrivateNote> {
    return this.getStorage<Record<string, TeacherPrivateNote>>(STORAGE_KEYS.NOTES, initialTeacherNotes);
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
    this.setStorage(STORAGE_KEYS.NOTES, notes);
  }

  public resetAllToDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.ROOM);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.RESPONSES);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
  }
}

export const dataService = new DataService();
