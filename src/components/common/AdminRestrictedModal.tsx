import React, { useState } from 'react';
import { ShieldAlert, LogIn, KeyRound, AlertCircle, X } from 'lucide-react';
import { Language } from '../../types';
import { loginWithGoogle, logoutFirebaseUser, checkAuthorizedUser } from '../../firebase';
import { dataService } from '../../services/dataService';

interface AdminRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAuthenticated: () => void;
  currentLang?: Language;
}

export const AdminRestrictedModal: React.FC<AdminRestrictedModalProps> = ({
  isOpen,
  onClose,
  onAdminAuthenticated,
  currentLang = 'ko'
}) => {
  const [adminKey, setAdminKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAdminLogin = async () => {
    setErrorMessage('');
    setIsLoggingIn(true);
    try {
      const user = await loginWithGoogle();
      
      // Strict role check: must be admin in authorizedUsers/{uid}
      const authResult = await checkAuthorizedUser(user.uid);

      if (!authResult.isAuthorized || authResult.role !== 'admin') {
        await logoutFirebaseUser();
        setErrorMessage(
          currentLang === 'ko'
            ? '관리자(admin) 권한이 부여된 Google 계정이 아닙니다. (Firestore authorizedUsers에 role: "admin", active: true로 등록된 계정만 입장 가능합니다. 평가자 체험 모드에서는 관리자 화면을 열람할 수 없습니다)'
            : 'Access denied. Only registered accounts with role: "admin" and active: true can access the admin view.'
        );
        return;
      }

      dataService.logAuditAction('login', 'room', 'room-kr-tw-01', `Admin authenticated via Google: ${user.email}`, 'admin');
      onAdminAuthenticated();
      onClose();
    } catch (err: any) {
      console.warn('Admin Google login failed:', err);
      if (err.message === 'FIREBASE_NOT_CONFIGURED') {
        setErrorMessage(currentLang === 'ko' ? 'Firebase 설정이 필요합니다. .env.local 설정을 확인하세요.' : 'Firebase is not configured.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage(currentLang === 'ko' ? '로그인 창이 닫혔습니다. 다시 시도해 주세요.' : 'Sign-in popup was closed.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage(currentLang === 'ko' ? '네트워크 연결을 확인한 후 다시 시도해 주세요.' : 'Network error. Please check your connection.');
      } else {
        setErrorMessage(currentLang === 'ko' ? 'Google 관리자 로그인 처리 중 문제가 발생했습니다. 계정 권한을 확인해 주세요.' : 'Sign-in failed. Please verify your account authorization.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDevKeyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!import.meta.env.DEV) return;
    if (adminKey.trim().toUpperCase() === 'ADMIN2026') {
      dataService.logAuditAction('login', 'room', 'room-kr-tw-01', 'Admin authenticated via dev passkey', 'admin');
      onAdminAuthenticated();
      onClose();
    } else {
      setErrorMessage('유효하지 않은 개발용 관리자 보안키입니다.');
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(23, 76, 79, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div 
        className="cb-card modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--color-border-light)',
          padding: '28px',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'var(--color-accent-soft)',
            color: 'var(--color-accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={28} />
          </div>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <h3 style={{
          fontSize: '1.35rem',
          fontWeight: 800,
          color: 'var(--color-primary)',
          marginBottom: '8px',
          letterSpacing: '-0.02em'
        }}>
          서비스 관리자 보안 인증
        </h3>

        <p style={{
          fontSize: '0.88rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
          marginBottom: '20px'
        }}>
          휴지통 복원 및 감사 로그(Audit Logs)는 Firestore <code>authorizedUsers</code>에 <code>role: "admin"</code>으로 등록된 계정만 입장할 수 있습니다.
        </p>

        {errorMessage && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 12px', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Admin Login */}
        <button
          type="button"
          onClick={handleGoogleAdminLogin}
          disabled={isLoggingIn}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #D1D5DB',
            background: '#FFFFFF',
            color: '#374151',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            marginBottom: '16px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{isLoggingIn ? '관리자 권한 확인 중...' : 'Google 계정으로 관리자 로그인'}</span>
        </button>

        {/* Development Mode Only Bypass */}
        {import.meta.env.DEV && (
          <>
            <div style={{ position: 'relative', textAlign: 'center', margin: '14px 0' }}>
              <div style={{ borderTop: '1px solid var(--color-border)', position: 'absolute', top: '50%', width: '100%', left: 0 }}></div>
              <span style={{ position: 'relative', background: '#fff', padding: '0 8px', fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                [DEV ONLY] 개발용 키: ADMIN2026
              </span>
            </div>

            <form onSubmit={handleDevKeyLogin} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="개발용 키 입력"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 34px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9rem'
                  }}
                />
                <KeyRound size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '10px 16px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
              >
                입장
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
