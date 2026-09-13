import React from 'react';
import { Globe, ArrowLeft, Shield } from 'lucide-react';
import { Language, UserRole } from '../../types';
import { getTranslation } from '../../services/i18n';

interface HeaderProps {
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
  currentRole: UserRole | null;
  onExitRole: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onSelectLang,
  currentRole,
  onExitRole,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="logo-link" onClick={onExitRole} title="Go to Start Screen">
          <div className="logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              {/* Bridge icon symbolizing connection */}
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
  );
};
