import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Language } from '../../types';

interface AdminRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: Language;
}

export const AdminRestrictedModal: React.FC<AdminRestrictedModalProps> = ({
  isOpen,
  onClose,
  currentLang = 'ko'
}) => {
  if (!isOpen) return null;

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
          maxWidth: '440px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--color-border-light)',
          padding: '28px',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-accent-soft)',
          color: 'var(--color-accent)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <ShieldAlert size={30} />
        </div>

        <h3 style={{
          fontSize: '1.35rem',
          fontWeight: 800,
          color: 'var(--color-primary)',
          marginBottom: '12px',
          letterSpacing: '-0.02em'
        }}>
          관리자 외 접근 제한
        </h3>

        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
          marginBottom: '24px',
          wordBreak: 'keep-all'
        }}>
          이 영역은 승인된 서비스 관리자만 이용할 수 있습니다. 관리자 인증은 Firebase 연결 후 활성화됩니다.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
            justifyContent: 'center'
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
};
