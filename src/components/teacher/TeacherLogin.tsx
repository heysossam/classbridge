import React, { useState } from 'react';
import { GraduationCap, ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { TEACHER_CODES } from '../../mock/demoData';

interface TeacherLoginProps {
  currentLang: Language;
  onLoginSuccess: (side: 'Korea Class' | 'Taiwan Class') => void;
  onBack: () => void;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({
  currentLang,
  onLoginSuccess,
  onBack,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);
  const room = dataService.getRoom();
  const [authCode, setAuthCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleQuickCode = (code: string) => {
    setAuthCode(code);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const verified = dataService.verifyTeacherCode(authCode);
    if (!verified) {
      setErrorMessage(
        currentLang === 'ko' 
          ? '올바른 교사 시연 코드를 입력하세요.' 
          : currentLang === 'zh-TW' 
          ? '請輸入有效的教師示範代碼。' 
          : 'Please enter a valid teacher code.'
      );
      return;
    }

    onLoginSuccess(verified);
  };

  return (
    <div style={{ maxWidth: '560px', margin: '20px auto' }}>
      <div className="cb-card" style={{ borderTop: '4px solid var(--color-primary)' }}>
        <button 
          onClick={onBack} 
          className="btn-outline" 
          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}
        >
          <ArrowLeft size={16} />
          <span>{currentLang === 'ko' ? '시작 화면으로' : currentLang === 'zh-TW' ? '返回首頁' : 'Back'}</span>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '54px', 
            height: '54px', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--color-secondary-light)', 
            color: 'var(--color-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <GraduationCap size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
            {t('roles.teacher')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            {currentLang === 'ko' && '교사용 시연 코드를 입력하거나 빠른 프리셋으로 입장하세요.'}
            {currentLang === 'en' && 'Enter your teacher demo code or use quick presets to enter.'}
            {currentLang === 'zh-TW' && '請輸入教師示範代碼或使用快速預設進入。'}
          </p>
        </div>

        {/* Assigned Room Card */}
        <div style={{ 
          background: 'var(--bg-subtle)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '14px 16px', 
          marginBottom: '20px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: '2px' }}>
            {currentLang === 'ko' ? '배정된 참여 교류방' : 'Assigned Exchange Room'}
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
            {room.title}
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            Code: {room.joinCode}
          </span>
        </div>

        {/* Quick Demo Presets */}
        <div style={{ 
          background: 'var(--bg-subtle)', 
          padding: '12px 14px', 
          borderRadius: 'var(--radius-sm)', 
          marginBottom: '20px',
          fontSize: '0.8rem'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            {currentLang === 'ko' ? '시연용 빠른 선택 (교사 인증 코드):' : currentLang === 'zh-TW' ? '示範快速選擇（教師代碼）：' : 'Demo Teacher Codes:'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="badge badge-neutral"
              onClick={() => handleQuickCode(TEACHER_CODES.KOREA)}
              style={{ cursor: 'pointer', padding: '6px 12px' }}
            >
              🇰🇷 Korea Teacher ({TEACHER_CODES.KOREA})
            </button>
            <button
              type="button"
              className="badge badge-accent"
              onClick={() => handleQuickCode(TEACHER_CODES.TAIWAN)}
              style={{ cursor: 'pointer', padding: '6px 12px' }}
            >
              🇹🇼 Taiwan Teacher ({TEACHER_CODES.TAIWAN})
            </button>
          </div>
        </div>

        {errorMessage && (
          <div style={{ background: '#FDF2F2', border: '1px solid #F87171', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#B91C1C', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              {currentLang === 'ko' ? '교사 인증 코드' : currentLang === 'zh-TW' ? '教師驗證代碼' : 'Teacher Access Code'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder={currentLang === 'ko' ? '예: K-TEACH-2026 또는 T-TEACH-2026' : currentLang === 'zh-TW' ? '例：K-TEACH-2026 或 T-TEACH-2026' : 'e.g. K-TEACH-2026 or T-TEACH-2026'}
                style={{ 
                  width: '100%', 
                  padding: '12px 14px 12px 38px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--color-border)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em'
                }}
              />
              <KeyRound size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '6px' }}
          >
            <span>{currentLang === 'ko' ? '교사 대시보드 입장' : currentLang === 'zh-TW' ? '進入教師儀表板' : 'Enter Teacher Dashboard'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={16} />
          <span>
            {currentLang === 'ko' 
              ? '교사 인증 및 데이터 접근 권한이 분리됩니다' 
              : currentLang === 'zh-TW' 
              ? '具備教師身分驗證與權限隔離機制' 
              : 'Role-based Teacher Access'}
          </span>
        </div>
      </div>
    </div>
  );
};
