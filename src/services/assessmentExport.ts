import { dataService } from './dataService';
import { generateComprehensiveEvaluation } from './evaluationEngine';

/**
 * Escapes a cell value for CSV (handles quotes, newlines, commas)
 */
function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports Process-based Assessment Evidence as an Excel-compatible UTF-8 BOM CSV.
 * Guaranteed exclusion of Student Real Names, School Names, Grade/Class, Emails, Firebase UIDs,
 * and Confidential Teacher Private Notes.
 */
export function generateAssessmentCSVContent(): { csvContent: string; filename: string; rowCount: number } {
  const room = dataService.getRoom();
  const students = dataService.getStudents();
  const activities = dataService.getActivities(true).filter(a => a.status !== 'archived');
  const allSubmissions = dataService.getSubmissions();
  const allComments = dataService.getComments();

  // 16 Mandatory Columns
  const headers = [
    '교류방',
    '학급 구분(Korea/Taiwan)',
    '영어 닉네임',
    '개인 참여코드',
    '활동명',
    '활동 유형',
    '제출 여부',
    '제출일',
    '학생 작성 원문',
    '학생 작성 영어 설명',
    '댓글 참여 수',
    '좋아요 수',
    '교사 피드백',
    '과정중심평가 참고 평어',
    '교사 최종 확인 여부',
    '참고 평어 안내'
  ];

  const rows: string[][] = [];

  students.forEach(student => {
    // Activities applicable to this student's side
    const applicableActivities = activities.filter(
      a => a.targetSide === 'Both' || a.targetSide === student.partnerSide
    );

    // Get comprehensive evaluation for rubric draft statement
    const evidence = dataService.getComprehensiveEvidence(student.id);
    const evalResult = evidence ? generateComprehensiveEvaluation(evidence, 'ko') : null;
    const rubricStatement = evalResult ? evalResult.sentence : '활동 참여 관찰 중';

    applicableActivities.forEach(act => {
      const sub = allSubmissions.find(
        s => (s.membershipId === student.id || s.participantCode.toUpperCase() === student.participantCode.toUpperCase()) &&
             s.activityId === act.id
      );

      const isSubmitted = !!sub;
      const submittedAt = sub ? sub.submittedAt : '-';
      const originalText = sub ? (sub.type === 'poll' && sub.selectedOptions ? `[선택: ${sub.selectedOptions.join(', ')}] ${sub.content}` : sub.content) : '-';
      const englishDescription = sub?.translationEn || '-';

      // Count comments for this submission or by this student on this activity
      const commentsCount = sub ? allComments.filter(c => c.submissionId === sub.id).length : 0;
      const likesCount = sub ? (sub.likesCount || 0) : 0;

      // Teacher feedback for this submission
      const feedback = sub ? dataService.getTeacherFeedback(sub.id) : null;
      const feedbackContent = feedback?.content || '미작성';

      // Final confirmation status: considered confirmed if teacher provided feedback or reviewed
      const isConfirmed = (feedback && feedback.isPublished) ? '확인완료' : '검토전';

      const row: string[] = [
        room.title,
        student.partnerSide === 'Korea Class' ? 'Korea Class' : 'Taiwan Class',
        student.englishNickname,
        student.participantCode,
        act.title,
        act.type,
        isSubmitted ? '제출' : '미제출',
        submittedAt,
        originalText,
        englishDescription,
        String(commentsCount),
        String(likesCount),
        feedbackContent,
        rubricStatement,
        isConfirmed,
        'AI·규칙 기반 참고 문구이며 교사의 확인과 수정이 필요함'
      ];

      rows.push(row);
    });
  });

  // Build CSV content with UTF-8 BOM
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(','))
  ].join('\r\n');

  const today = new Date().toISOString().slice(0, 10);
  const filename = `ClassBridge_평가자료_${today}.csv`;

  return { csvContent, filename, rowCount: rows.length };
}

/**
 * Exports Process-based Assessment Evidence as an Excel-compatible UTF-8 BOM CSV.
 * Guaranteed exclusion of Student Real Names, School Names, Grade/Class, Emails, Firebase UIDs,
 * and Confidential Teacher Private Notes.
 */
export function exportAssessmentToCSV(): void {
  const room = dataService.getRoom();
  const { csvContent, filename } = generateAssessmentCSVContent();

  // Trigger browser-only client-side download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  dataService.logAuditAction('update', 'room', room.id, 'Teacher downloaded assessment CSV evaluation export');
}
