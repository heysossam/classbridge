import React from 'react';
import { Globe, ArrowLeft, Shield, Flame, Database, AlertCircle } from 'lucide-react';
import { Language, UserRole } from '../../types';
import { getTranslation } from '../../services/i18n';
import { isFirebaseConfigured } from '../../firebase';
import { dataService } from '../../services/dataService';

interface HeaderProps {
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
  currentRole: UserRole | null;
  onExitRole: () => void;
  isReviewerMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onSelectLang,
  currentRole,
  onExitRole,
  isReviewerMode = false,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);
  const isConfigured = isFirebaseConfigured();
  const isReviewerActive = isReviewerMode || dataService.getIsReviewerMode();
  const isFirebaseLive = !isReviewerActive && dataService.isFirebaseMode();

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-link" onClick={onExitRole} title="Go to Start Screen">
            <div className="logo-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19h16" />
                <path d="M4 15c4-6 12-6 16 0" />
                <path d="M12 9v10" />
                <circle cx="6" cy="15" r="1.5" fill="currentColor" />
                <circle cx="18" cy="15" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="logo-text">
                {t('app.title')}
                <span className="logo-subtext">ClassBridge</span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            {/* Mode Badge */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {isReviewerActive ? (
                <span 
                  className="badge badge-neutral" 
                  title="Reviewer Demo Mode Active (Read-Only Demo Data)"
                  style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE' }}
                >
                  <Database size={12} color="#2563EB" />
                  <span>{t('app.modeReviewer')}</span>
                </span>
              ) : isFirebaseLive ? (
                <span 
                  className="badge badge-success" 
                  title="Firebase Firestore Cloud Real-time Synced"
                  style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                >
                  <Flame size={12} color="#10B981" />
                  <span>{t('app.modeFirebase')}</span>
                </span>
              ) : (
                <span 
                  className="badge badge-neutral" 
                  title="LocalStorage Demo Mode Active"
                  style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                >
                  <Database size={12} color="#6B7280" />
                  <span>{t('app.modeDemo')}</span>
                </span>
              )}
            </div>

            {currentRole && (
              <button
                onClick={onExitRole}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} />
                <span>{currentLang === 'ko' ? '나가기' : currentLang === 'zh-TW' ? '返回首頁' : 'Exit'}</span>
              </button>
            )}

            <div className="lang-selector">
              <button
                className={`lang-btn ${currentLang === 'ko' ? 'active' : ''}`}
                onClick={() => onSelectLang('ko')}
              >
                한국어
              </button>
              <button
                className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
                onClick={() => onSelectLang('en')}
              >
                English
              </button>
              <button
                className={`lang-btn ${currentLang === 'zh-TW' ? 'active' : ''}`}
                onClick={() => onSelectLang('zh-TW')}
              >
                繁體中文
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notice Banner if Firebase is not yet configured via .env.local */}
      {!isConfigured && (
        <div style={{
          background: '#FFFBEB',
          borderBottom: '1px solid #FCD34D',
          color: '#92400E',
          padding: '8px 16px',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 600
        }}>
          <AlertCircle size={16} />
          <span>{t('app.firebaseConfigNotice')}</span>
        </div>
      )}
    </>
  );
};
