import React, { useState } from 'react';
import { KeyRound, User, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Language, StudentMembership } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { loginAnonymouslyStudent } from '../../firebase';

interface StudentJoinProps {
  currentLang: Language;
  onJoinSuccess: (student: StudentMembership) => void;
  onBack: () => void;
}

export const StudentJoin: React.FC<StudentJoinProps> = ({
  currentLang,
  onJoinSuccess,
  onBack,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  const [roomCode, setRoomCode] = useState('BRIDGE2026');
  const [participantCode, setParticipantCode] = useState('');
  const [englishNickname, setEnglishNickname] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Fast presets for quick demo testing
  const handleQuickPreset = (code: string, name: string) => {
    setParticipantCode(code);
    setEnglishNickname(name);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const verified = dataService.verifyStudentCredentials(roomCode, participantCode, englishNickname);

    if (!verified) {
      // Standard strict error message required by PRD Section 6
      setErrorMessage(
        currentLang === 'ko' 
          ? '교류방 정보 또는 참여코드를 확인해 주세요.' 
          : currentLang === 'zh-TW' 
          ? '請檢查交流室資訊或參與代碼。' 
          : 'Please check your exchange room code or participant code.'
      );
      return;
    }

    setIsAuthenticating(true);
    try {
      // Background Firebase Anonymous Auth
      await loginAnonymouslyStudent();
      // Securely claim participant slot with anonymous UID
      await dataService.claimParticipantSlot(roomCode, verified.participantCode, verified.englishNickname);
    } catch (err) {
      console.warn('Firebase anonymous auth offline fallback:', err);
    } finally {
      setIsAuthenticating(false);
    }

    dataService.logAuditAction(
      'login', 
      'room', 
      verified.roomId, 
      `Student verified and joined: ${verified.englishNickname} (${verified.participantCode})`,
      'student'
    );
    onJoinSuccess(verified);
  };

  return (
    <div style={{ maxWidth: '540px', margin: '20px auto' }}>
      <div className="cb-card" style={{ borderTop: '4px solid var(--color-accent)' }}>
        <button
          onClick={onBack}
          className="btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}
        >
          <ArrowLeft size={16} />
          <span>{currentLang === 'ko' ? '시작 화면으로' : currentLang === 'zh-TW' ? '返回首頁' : 'Back'}</span>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
            {t('studentJoin.title')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            {t('studentJoin.instructions')}
          </p>
        </div>

        {/* Warning & Privacy Note */}
        <div style={{ 
          background: 'var(--color-accent-soft)', 
          border: '1px solid rgba(242, 140, 120, 0.4)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '12px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <AlertCircle size={20} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.45 }}>
            {t('studentJoin.warning')}
          </div>
        </div>

        {/* Fast Demo Presets */}
        <div style={{ 
          background: 'var(--bg-subtle)', 
          padding: '12px 14px', 
          borderRadius: 'var(--radius-sm)', 
          marginBottom: '20px',
          fontSize: '0.8rem',
          border: '1px solid var(--color-border-light)'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            {currentLang === 'ko' ? '시연용 빠른 선택 (화이트리스트 학생):' : currentLang === 'zh-TW' ? '示範快速選擇（白名單學生）：' : 'Demo Presets (Whitelisted Students):'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              type="button"
              className="badge badge-neutral"
              onClick={() => handleQuickPreset('K7M4', 'Sunny')}
              style={{ cursor: 'pointer', padding: '6px 10px' }}
            >
              Sunny (K7M4)
            </button>
            <button
              type="button"
              className="badge badge-neutral"
              onClick={() => handleQuickPreset('K2R7', 'Leo')}
              style={{ cursor: 'pointer', padding: '6px 10px' }}
            >
              Leo (K2R7)
            </button>
            <button
              type="button"
              className="badge badge-neutral"
              onClick={() => handleQuickPreset('T7A4', 'Alice')}
              style={{ cursor: 'pointer', padding: '6px 10px' }}
            >
              Alice (T7A4)
            </button>
            <button
              type="button"
              className="badge badge-neutral"
              onClick={() => handleQuickPreset('T2K8', 'Kevin')}
              style={{ cursor: 'pointer', padding: '6px 10px' }}
            >
              Kevin (T2K8)
            </button>
          </div>
        </div>

        {/* Strict Error Message */}
        {errorMessage && (
          <div style={{ 
            background: '#FDF2F2', 
            border: '1px solid #F87171', 
            borderRadius: 'var(--radius-sm)', 
            padding: '12px', 
            color: '#B91C1C', 
            fontSize: '0.88rem', 
            fontWeight: 700, 
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Room Code */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              {t('studentJoin.roomCode')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="BRIDGE2026"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px 12px 38px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--color-border)',
                  fontSize: '0.95rem',
                  letterSpacing: '0.05em',
                  fontWeight: 700
                }}
              />
              <KeyRound size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Participant Code */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              {t('studentJoin.participantCode')}
            </label>
            <input
              type="text"
              value={participantCode}
              onChange={(e) => setParticipantCode(e.target.value)}
              placeholder={currentLang === 'ko' ? '예: K7M4 또는 T7A4' : currentLang === 'zh-TW' ? '例：K7M4 或 T7A4' : 'e.g. K7M4 or T7A4'}
              maxLength={6}
              style={{ 
                width: '100%', 
                padding: '12px 14px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--color-border)',
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            />
          </div>

          {/* English Nickname */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              {t('studentJoin.englishNickname')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={englishNickname}
                onChange={(e) => setEnglishNickname(e.target.value)}
                placeholder={currentLang === 'ko' ? '예: Sunny, Leo, Alice' : currentLang === 'zh-TW' ? '例：Sunny, Leo, Alice' : 'e.g. Sunny, Leo, Alice'}
                style={{ 
                  width: '100%', 
                  padding: '12px 14px 12px 38px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--color-border)',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
              />
              <User size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-accent" 
            style={{ width: '100%', padding: '14px', marginTop: '8px', fontSize: '1rem' }}
          >
            <span>{t('studentJoin.enterBtn')}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={14} />
          <span>
            {currentLang === 'ko' 
              ? '참여코드 확인 후 소속 학급이 자동으로 배정됩니다.' 
              : currentLang === 'zh-TW' 
              ? '驗證代碼後將自動判別所屬班級。' 
              : 'Class is automatically identified upon participant code verification.'}
          </span>
        </div>
      </div>
    </div>
  );
};
