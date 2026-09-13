import React, { useState, useEffect } from 'react';
import { CheckCircle2, Send, Sparkles, ThumbsUp, MessageSquare, BarChart2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Language, Activity, StudentResponse } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';

interface StudentActivityProps {
  currentLang: Language;
  student: {
    roomCode: string;
    participantCode: string;
    englishNickname: string;
    partnerSide: 'Korea Class' | 'Taiwan Class';
  };
  onBack: () => void;
}

export const StudentActivity: React.FC<StudentActivityProps> = ({
  currentLang,
  student,
  onBack,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  const activity = dataService.getActivity();
  const [selectedOption, setSelectedOption] = useState<string>('Design A');
  const [selectedFrame, setSelectedFrame] = useState<string>(activity.sentenceFrames[0].frame);
  const [reasonText, setReasonText] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedResponse, setSubmittedResponse] = useState<StudentResponse | null>(null);
  const [allResponses, setAllResponses] = useState<StudentResponse[]>([]);

  useEffect(() => {
    // Check if current student has already submitted
    const responses = dataService.getResponses();
    setAllResponses(responses);

    const existing = responses.find(
      r => r.participantCode.toUpperCase() === student.participantCode.toUpperCase()
    );

    if (existing) {
      setIsSubmitted(true);
      setSubmittedResponse(existing);
      setSelectedOption(existing.selectedOption);
      setSelectedFrame(existing.sentenceFrame);
      setReasonText(existing.userReason);
    }
  }, [student.participantCode]);

  const handleFrameClick = (frame: string) => {
    setSelectedFrame(frame);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonText.trim()) {
      alert(currentLang === 'ko' ? '이유를 영어로 작성해 주세요.' : 'Please write your reason in English.');
      return;
    }

    // Build full statement
    let fullStatement = selectedFrame
      .replace('___', selectedOption)
      .replace('___.', `${reasonText.trim()}${reasonText.endsWith('.') ? '' : '.'}`);

    if (!fullStatement.includes(selectedOption)) {
      fullStatement = `${selectedFrame} (${selectedOption}) ${reasonText}`;
    }

    const res = dataService.submitStudentResponse({
      roomId: activity.roomId,
      activityId: activity.id,
      membershipId: `m-${student.participantCode}`,
      participantCode: student.participantCode,
      englishNickname: student.englishNickname,
      partnerSide: student.partnerSide,
      selectedOption,
      sentenceFrame: selectedFrame,
      userReason: reasonText.trim(),
      fullStatement,
    });

    setSubmittedResponse(res);
    setIsSubmitted(true);
    setAllResponses(dataService.getResponses());
  };

  // Vote statistics
  const voteCounts: Record<string, { total: number; korea: number; taiwan: number }> = {
    'Design A': { total: 0, korea: 0, taiwan: 0 },
    'Design B': { total: 0, korea: 0, taiwan: 0 },
    'Design C': { total: 0, korea: 0, taiwan: 0 },
  };

  allResponses.forEach(r => {
    if (voteCounts[r.selectedOption]) {
      voteCounts[r.selectedOption].total += 1;
      if (r.partnerSide === 'Korea Class') {
        voteCounts[r.selectedOption].korea += 1;
      } else {
        voteCounts[r.selectedOption].taiwan += 1;
      }
    }
  });

  const totalVotes = allResponses.length || 1;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Student Top Bar Info */}
      <div style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid var(--color-border-light)', 
        borderRadius: 'var(--radius-md)', 
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} className="btn-outline" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                {student.englishNickname}
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                Code: {student.participantCode}
              </span>
              <span className={`badge ${student.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`}>
                {student.partnerSide === 'Korea Class' ? '🇰🇷 Korea Class' : '🇹🇼 Taiwan Class'}
              </span>
            </div>
          </div>
        </div>

        {isSubmitted && (
          <span className="badge badge-success">
            <CheckCircle2 size={14} />
            {currentLang === 'ko' ? '제출 완료' : currentLang === 'zh-TW' ? '已提交' : 'Submitted'}
          </span>
        )}
      </div>

      {/* Mission Header */}
      <div className="cb-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #FFFFFF, var(--bg-subtle))' }}>
        <span className="badge badge-accent" style={{ marginBottom: '8px' }}>
          {t('studentActivity.currentMission')}
        </span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
          {activity.title}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          {t('studentActivity.desc')}
        </p>
      </div>

      {/* Main Interaction: When NOT submitted or editing */}
      {!isSubmitted ? (
        <form onSubmit={handleSubmit}>
          {/* Step 1: Design Selection Cards */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
              {t('studentActivity.step1')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {activity.options.map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <div
                    key={opt.id}
                    className="cb-card hoverable"
                    onClick={() => setSelectedOption(opt.id)}
                    style={{
                      cursor: 'pointer',
                      border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border-light)'}`,
                      background: isSelected ? 'var(--color-accent-soft)' : 'var(--bg-card)',
                      position: 'relative',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--color-accent)' }}>
                        <CheckCircle2 size={20} />
                      </div>
                    )}
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px', textAlign: 'center' }}>
                      {opt.icon}
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
                      {opt.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                      {opt.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Sentence Frame Selection & Reason Writing */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
              {t('studentActivity.step2')}
            </h3>

            <div className="cb-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                {currentLang === 'ko' ? '사용할 문장 틀을 클릭하세요:' : currentLang === 'zh-TW' ? '點擊選擇想使用的英文句型：' : 'Click a sentence frame to use:'}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {activity.sentenceFrames.map(sf => {
                  const isFrameActive = selectedFrame === sf.frame;
                  return (
                    <button
                      key={sf.id}
                      type="button"
                      onClick={() => handleFrameClick(sf.frame)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        border: `1.5px solid ${isFrameActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isFrameActive ? 'var(--color-primary)' : 'var(--bg-subtle)',
                        color: isFrameActive ? '#fff' : 'var(--color-text)',
                        textAlign: 'left'
                      }}
                    >
                      {sf.frame.replace('___', selectedOption)}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Preview & Text Input */}
              <div style={{ 
                background: 'var(--bg-subtle)', 
                padding: '16px', 
                borderRadius: 'var(--radius-sm)', 
                marginBottom: '16px',
                borderLeft: '4px solid var(--color-primary)'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  {currentLang === 'ko' ? '문장 미리보기' : currentLang === 'zh-TW' ? '句子預覽' : 'Sentence Preview'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {selectedFrame.replace('___', selectedOption).replace('___.', '')}
                  <span style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                    {reasonText.trim() || (currentLang === 'ko' ? '[여기에 이유 입력]' : '[Your reason here]')}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  {t('studentActivity.reasonLabel')}
                </label>
                <textarea
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder={currentLang === 'ko' ? '예: it represents our traditional culture and warm friendship.' : 'e.g., it represents our friendship and warm culture.'}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-accent"
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
          >
            <Send size={20} />
            <span>{t('studentActivity.submitBtn')}</span>
          </button>
        </form>
      ) : (
        /* Submitted View with Partner Results and Public Comments */
        <div>
          {/* Success Banner */}
          <div className="cb-card" style={{ 
            background: 'var(--color-success-soft)', 
            border: '1.5px solid rgba(60, 140, 107, 0.3)', 
            padding: '24px',
            marginBottom: '28px',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              background: 'var(--color-success)', 
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' }}>
              {t('studentActivity.submittedTitle')}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: '16px' }}>
              {t('studentActivity.submittedDesc')}
            </p>

            {/* My Submission summary card */}
            <div style={{ 
              background: '#fff', 
              borderRadius: 'var(--radius-sm)', 
              padding: '16px', 
              maxWidth: '560px', 
              margin: '0 auto 16px',
              textAlign: 'left',
              border: '1px solid rgba(60, 140, 107, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                  {t('studentActivity.yourVote')}: {submittedResponse?.selectedOption}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  {submittedResponse?.submittedAt}
                </span>
              </div>
              <p style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                "{submittedResponse?.fullStatement}"
              </p>
            </div>

            <button
              onClick={() => setIsSubmitted(false)}
              className="btn-outline"
              style={{ fontSize: '0.85rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>{currentLang === 'ko' ? '의견 수정하기' : currentLang === 'zh-TW' ? '修改我的意見' : 'Edit My Response'}</span>
            </button>
          </div>

          {/* Bilateral Voting Bar Chart Results */}
          <div className="cb-card" style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <BarChart2 size={22} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {t('studentActivity.totalVotes')}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activity.options.map(opt => {
                const count = voteCounts[opt.id]?.total || 0;
                const percent = Math.round((count / totalVotes) * 100);
                const krCount = voteCounts[opt.id]?.korea || 0;
                const twCount = voteCounts[opt.id]?.taiwan || 0;

                return (
                  <div key={opt.id} style={{ background: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                        {opt.icon} {opt.title}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {count}표 ({percent}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '12px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${percent}%`, background: 'var(--color-primary)', height: '100%', transition: 'width 0.5s ease' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      <span>🇰🇷 Korea Class: {krCount}명</span>
                      <span>🇹🇼 Taiwan Class: {twCount}명</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Friends' Public Comments */}
          <div className="cb-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <MessageSquare size={22} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {t('studentActivity.publicComments')} ({allResponses.length})
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {allResponses.map(res => (
                <div 
                  key={res.id} 
                  style={{ 
                    border: '1px solid var(--color-border-light)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '14px',
                    background: res.partnerSide === 'Korea Class' ? '#FAF9F5' : '#F7FAFC'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.88rem' }}>
                        {res.englishNickname}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>
                        ({res.participantCode})
                      </span>
                    </div>
                    <span className={`badge ${res.partnerSide === 'Korea Class' ? 'badge-neutral' : 'badge-accent'}`} style={{ fontSize: '0.7rem' }}>
                      {res.partnerSide === 'Korea Class' ? '🇰🇷 KR' : '🇹🇼 TW'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '4px' }}>
                    {res.selectedOption}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text)', lineHeight: 1.45 }}>
                    "{res.fullStatement}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
