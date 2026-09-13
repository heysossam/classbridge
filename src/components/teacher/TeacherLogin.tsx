import React, { useState } from 'react';
import { 
  GraduationCap, ArrowRight, ShieldCheck, ArrowLeft, 
  KeyRound, AlertCircle, CheckCircle2, UserCheck, LogIn, ShieldAlert, Eye 
} from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { TEACHER_CODES } from '../../mock/demoData';
import { loginWithGoogle, logoutFirebaseUser, checkAuthorizedUser, isFirebaseConfigured } from '../../firebase';

interface TeacherLoginProps {
  currentLang: Language;
  onLoginSuccess: (side: 'Korea Class' | 'Taiwan Class') => void;
  onBack: () => void;
  onEnterReviewerMode?: () => void;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({
  currentLang,
  onLoginSuccess,
  onBack,
  onEnterReviewerMode,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);
  const room = dataService.getRoom();
  const [authCode, setAuthCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showReviewerInvitation, setShowReviewerInvitation] = useState<boolean>(false);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ displayName: string | null; email: string | null; assignedSide?: 'Korea Class' | 'Taiwan Class' } | null>(null);
  const [selectedClassSide, setSelectedClassSide] = useState<'Korea Class' | 'Taiwan Class'>('Korea Class');

  const handleQuickCode = (code: string) => {
    setAuthCode(code);
    setErrorMessage('');
  };

  // Google Authentication with strict authorizedUsers/{uid} verification
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setShowReviewerInvitation(false);
    setIsLoggingInGoogle(true);
    try {
      const user = await loginWithGoogle();
      
      // Step: Query Firestore authorizedUsers/{uid}
      const authResult = await checkAuthorizedUser(user.uid);

      if (!authResult.isAuthorized || (authResult.role !== 'teacher' && authResult.role !== 'admin')) {
        // Automatically logout unauthorized user immediately
        await logoutFirebaseUser();
        // Requirement 3-B: Show reviewer demo invitation instead of a harsh block
        setShowReviewerInvitation(true);
        return;
      }

      // Check roomIds if role === 'teacher' (Requirement A: assigned room check)
      if (authResult.role === 'teacher' && authResult.roomIds && authResult.roomIds.length > 0 && !authResult.roomIds.includes(room.id)) {
        await logoutFirebaseUser();
        setErrorMessage(
          currentLang === 'ko'
            ? `담당 교류방(${room.id})에 배정되지 않은 교사 계정입니다.`
            : `Account is not assigned to this exchange room (${room.id}).`
        );
        return;
      }

      setGoogleUser({
        displayName: authResult.displayName || user.displayName,
        email: user.email,
        assignedSide: authResult.assignedSide
      });

      if (authResult.assignedSide) {
        setSelectedClassSide(authResult.assignedSide);
      }

      dataService.logAuditAction(
        'login', 
        'room', 
        room.id, 
        `Authorized teacher logged in via Google: ${user.email} (${authResult.role})`
      );
    } catch (err: any) {
      console.warn('Google login issue:', err);
      if (err.message === 'FIREBASE_NOT_CONFIGURED') {
        setErrorMessage(currentLang === 'ko' ? 'Firebase 설정이 필요합니다. .env.local을 확인하세요.' : 'Firebase is not configured.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage(
          currentLang === 'ko' ? '로그인 팝업이 닫혔습니다.' : 'Google sign-in popup was closed.'
        );
      } else {
        setErrorMessage(
          currentLang === 'ko' 
            ? 'Google 로그인 처리 중 문제가 발생했습니다.' 
            : 'Google Sign-in failed.'
        );
      }
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleConfirmGoogleClass = () => {
    onLoginSuccess(selectedClassSide);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 운영 환경 보호: Firebase가 설정된 프로덕션 환경에서는 인증 우회용 시연 코드 불가
    if (!import.meta.env.DEV && isFirebaseConfigured()) {
      setErrorMessage(
        currentLang === 'ko'
          ? '운영 환경에서는 인증 우회용 교사 시연 코드를 사용할 수 없습니다. 등록된 Google 교사 계정으로 로그인해 주세요.'
          : 'Demo teacher codes are disabled in production. Please sign in with your authorized Google teacher account.'
      );
      return;
    }

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

    dataService.logAuditAction('login', 'room', room.id, `Teacher logged in via demo code: ${authCode}`);
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
            {currentLang === 'ko' && 'Google 인증(인가된 교사) 또는 시연 코드로 안전하게 로그인하세요.'}
            {currentLang === 'en' && 'Sign in with authorized Google Teacher Account or demo code.'}
            {currentLang === 'zh-TW' && '使用授權的 Google 教師帳號或示範代碼登入。'}
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
            Room Code: {room.joinCode}
          </span>
        </div>

        {errorMessage && (
          <div style={{ 
            background: '#FDF2F2', 
            border: '1px solid #F87171', 
            borderRadius: 'var(--radius-sm)', 
            padding: '12px', 
            color: '#B91C1C', 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Requirement 3-B: Reviewer Demo Invitation for Unregistered Google Users */}
        {showReviewerInvitation && (
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
            border: '1.5px solid #3B82F6',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1D4ED8', fontWeight: 700, marginBottom: '6px' }}>
              <Eye size={20} />
              <span>{currentLang === 'ko' ? '평가자 읽기 전용 체험 모드 안내' : 'Reviewer Read-Only Mode'}</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#1E3A8A', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              {currentLang === 'ko'
                ? '등록된 교사 계정은 아니지만, 평가를 위한 읽기 전용 체험 화면을 이용할 수 있습니다.'
                : 'Your Google account is not registered as an official teacher, but you can explore the read-only preview mode for evaluation.'}
            </p>
            <button
              type="button"
              onClick={onEnterReviewerMode}
              className="btn-primary"
              style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#2563EB', borderColor: '#2563EB' }}
            >
              <span>{currentLang === 'ko' ? '평가자 체험하기' : 'Enter Reviewer Demo'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Google Authenticated State */}
        {googleUser ? (
          <div style={{ 
            background: 'var(--color-secondary-light)', 
            border: '1px solid var(--color-secondary)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '16px', 
            marginBottom: '20px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)', fontWeight: 700, marginBottom: '6px' }}>
              <CheckCircle2 size={18} />
              <span>{currentLang === 'ko' ? '교사 인가 확인 완료 (authorizedUsers)' : 'Authorized Teacher Verified'}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '14px' }}>
              <strong>{googleUser.displayName || 'Teacher'}</strong> ({googleUser.email})
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                {currentLang === 'ko' ? '담당 학급 선택' : 'Select Class Side'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedClassSide('Korea Class')}
                  className={`btn-outline ${selectedClassSide === 'Korea Class' ? 'badge-neutral' : ''}`}
                  style={{ 
                    padding: '10px', 
                    fontWeight: 700, 
                    borderColor: selectedClassSide === 'Korea Class' ? 'var(--color-primary)' : 'var(--color-border)',
                    background: selectedClassSide === 'Korea Class' ? '#fff' : 'transparent'
                  }}
                >
                  🇰🇷 Korea Class
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClassSide('Taiwan Class')}
                  className={`btn-outline ${selectedClassSide === 'Taiwan Class' ? 'badge-accent' : ''}`}
                  style={{ 
                    padding: '10px', 
                    fontWeight: 700,
                    borderColor: selectedClassSide === 'Taiwan Class' ? 'var(--color-accent)' : 'var(--color-border)',
                    background: selectedClassSide === 'Taiwan Class' ? '#fff' : 'transparent'
                  }}
                >
                  🇹🇼 Taiwan Class
                </button>
              </div>
            </div>

            <button
              onClick={handleConfirmGoogleClass}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              <span>{currentLang === 'ko' ? '선택한 학급으로 대시보드 입장' : 'Enter Dashboard with Selected Class'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* Google Sign In Button */
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingInGoogle}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                color: '#374151',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'background-color 0.12s ease, box-shadow 0.12s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isLoggingInGoogle ? 'Google 교사 인가 확인 중...' : (currentLang === 'ko' ? 'Google 교사 로그인 (인가 계정 전용)' : 'Sign in with Google Teacher Account')}</span>
            </button>
            <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
              * Firestore <code>authorizedUsers</code>에 등록된 교사 UID만 접근이 허용됩니다.
            </div>
          </div>
        )}

        {/* Demo Preset & Code section: Available only in DEV or when Firebase is unconfigured */}
        {(import.meta.env.DEV || !isFirebaseConfigured()) ? (
          <>
            <div style={{ position: 'relative', textAlign: 'center', margin: '20px 0' }}>
              <div style={{ borderTop: '1px solid var(--color-border)', position: 'absolute', top: '50%', width: '100%', left: 0 }}></div>
              <span style={{ position: 'relative', background: '#fff', padding: '0 12px', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {currentLang === 'ko' ? '또는 [데모 모드 시연 코드]로 입장' : 'OR Enter via Demo Preset Code'}
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  {currentLang === 'ko' ? '교사 시연 코드' : currentLang === 'zh-TW' ? '教師示範代碼' : 'Teacher Access Code'}
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
          </>
        ) : (
          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            border: '1px dashed var(--color-border)',
            marginTop: '10px'
          }}>
            <ShieldAlert size={22} style={{ display: 'inline-block', marginBottom: '6px', color: 'var(--color-secondary)' }} />
            <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
              {currentLang === 'ko' ? '운영 보안 정책 적용 중' : 'Production Security Enforced'}
            </div>
            <div>
              {currentLang === 'ko' 
                ? '운영 환경에서는 인증 우회용 시연 코드가 비활성화되며, Google 인가 계정 로그인만 허용됩니다.'
                : 'In production, demo bypass codes are disabled. Only authorized Google accounts can sign in.'}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={16} />
          <span>
            {currentLang === 'ko' 
              ? 'Firestore authorizedUsers 인가 검증으로 보호됩니다' 
              : currentLang === 'zh-TW' 
              ? '具備 authorizedUsers 授權驗證機制' 
              : 'Protected by authorizedUsers Access Control'}
          </span>
        </div>
      </div>
    </div>
  );
};
