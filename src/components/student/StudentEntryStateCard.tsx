import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Language } from '../../types';

interface StudentLoadingCardProps {
  currentLang?: Language;
}

export const StudentLoadingCard: React.FC<StudentLoadingCardProps> = ({ currentLang = 'ko' }) => {
  return (
    <div 
      style={{ 
        maxWidth: '440px', 
        width: '100%', 
        margin: '60px auto', 
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div 
        className="cb-card" 
        style={{ 
          width: '100%', 
          textAlign: 'center', 
          padding: '40px 28px',
          borderTop: '4px solid var(--color-accent)',
          boxShadow: 'var(--shadow-md)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Loader2 
            size={36} 
            color="var(--color-accent)" 
            style={{ 
              animation: 'spin 1s linear infinite'
            }} 
          />
        </div>

        {/* Prominent message matching primary language */}
        <h3 
          style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: 'var(--color-primary)', 
            marginBottom: '14px',
            letterSpacing: '-0.01em'
          }}
        >
          {currentLang === 'zh-TW' 
            ? '正在進入交流教室…' 
            : currentLang === 'en' 
            ? 'Entering the exchange room…' 
            : '교류방에 들어가고 있어요…'}
        </h3>

        {/* Trilingual subtexts as required by specification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          {currentLang !== 'ko' && <div>교류방에 들어가고 있어요…</div>}
          {currentLang !== 'en' && <div>Entering the exchange room…</div>}
          {currentLang !== 'zh-TW' && <div>正在進入交流教室…</div>}
        </div>
      </div>
    </div>
  );
};

interface StudentErrorCardProps {
  currentLang?: Language;
  errorMessage?: string;
  onRetry: () => void;
}

export const StudentErrorCard: React.FC<StudentErrorCardProps> = ({
  currentLang = 'ko',
  errorMessage,
  onRetry
}) => {
  const defaultMsg = currentLang === 'zh-TW'
    ? '未能進入。請確認參與代碼後再試一次。'
    : currentLang === 'en'
    ? 'Failed to enter. Please check your participant code and try again.'
    : '입장하지 못했습니다. 참여코드를 확인하고 다시 시도해 주세요.';

  const displayMessage = errorMessage || defaultMsg;

  return (
    <div 
      style={{ 
        maxWidth: '460px', 
        width: '100%', 
        margin: '60px auto', 
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div 
        className="cb-card" 
        style={{ 
          width: '100%', 
          textAlign: 'center', 
          padding: '36px 28px',
          borderTop: '4px solid #DC2626',
          boxShadow: 'var(--shadow-md)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <AlertCircle size={40} color="#DC2626" />
        </div>

        <h3 
          style={{ 
            fontSize: '1.15rem', 
            fontWeight: 700, 
            color: '#B91C1C', 
            marginBottom: '10px',
            lineHeight: 1.45
          }}
        >
          {displayMessage}
        </h3>

        {currentLang === 'ko' && (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Failed to enter. Please check your participant code and try again.
          </p>
        )}

        <button
          type="button"
          onClick={onRetry}
          className="btn-accent"
          style={{ 
            width: '100%', 
            padding: '12px 20px', 
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: currentLang === 'ko' ? '0' : '16px'
          }}
        >
          <RefreshCw size={16} />
          <span>
            {currentLang === 'zh-TW' ? '重試' : currentLang === 'en' ? 'Try Again' : '다시 시도'}
          </span>
        </button>
      </div>
    </div>
  );
};
