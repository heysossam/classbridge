import React from 'react';
import { GraduationCap, Users, ShieldAlert, Sparkles, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { Language, UserRole } from '../../types';
import { getTranslation } from '../../services/i18n';

interface StartScreenProps {
  currentLang: Language;
  onSelectRole: (role: UserRole) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  currentLang,
  onSelectRole,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingTop: '20px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'var(--color-secondary-light)', 
          color: 'var(--color-secondary)',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          <Sparkles size={16} />
          <span>{t('app.tagline')}</span>
        </div>

        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 800, 
          color: 'var(--color-primary)', 
          letterSpacing: '-0.03em',
          lineHeight: 1.25,
          marginBottom: '16px'
        }}>
          {t('start.welcome')}
        </h1>

        <p style={{ 
          fontSize: '1.15rem', 
          color: 'var(--color-text-muted)', 
          maxWidth: '640px', 
          margin: '0 auto',
          wordBreak: 'keep-all'
        }}>
          {currentLang === 'ko' && '시차와 시간표 제약 없이 각자의 속도로 영어로 소통하고, 교사는 과정중심평가 수행 근거를 한눈에 확인합니다.'}
          {currentLang === 'en' && 'Connect classrooms across time zones at your own pace in English, while teachers seamlessly manage process-based assessment evidence.'}
          {currentLang === 'zh-TW' && '擺脫時差與課表限制，讓臺韓學生以自己的節奏用英語交流，教師一站式掌握歷程導向評量實證。'}
        </p>
      </div>

      {/* Two Main Cards: Teacher vs Student */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* Student Card */}
        <div 
          className="cb-card hoverable" 
          onClick={() => onSelectRole('student')}
          style={{ 
            cursor: 'pointer', 
            border: '2px solid rgba(242, 140, 120, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div>
            <div style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--color-accent-soft)', 
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <Users size={28} />
            </div>

            <span className="badge badge-accent" style={{ marginBottom: '10px' }}>
              {currentLang === 'ko' ? '학생 전용' : currentLang === 'zh-TW' ? '學生專用' : 'For Students'}
            </span>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
              {t('roles.student')}
            </h2>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
              {t('roles.studentDesc')}
            </p>
          </div>

          <button 
            className="btn-accent" 
            style={{ width: '100%', fontSize: '1rem' }}
          >
            <span>{t('start.studentBtn')}</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Teacher Card */}
        <div 
          className="cb-card hoverable" 
          onClick={() => onSelectRole('teacher')}
          style={{ 
            cursor: 'pointer', 
            border: '2px solid rgba(79, 124, 172, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, var(--color-secondary-light) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div>
            <div style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--color-secondary-light)', 
              color: 'var(--color-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <GraduationCap size={28} />
            </div>

            <span className="badge badge-neutral" style={{ marginBottom: '10px' }}>
              {currentLang === 'ko' ? '교사 전용 대시보드' : currentLang === 'zh-TW' ? '教師專用看板' : 'For Teachers'}
            </span>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
              {t('roles.teacher')}
            </h2>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
              {t('roles.teacherDesc')}
            </p>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', fontSize: '1rem' }}
          >
            <span>{t('start.teacherBtn')}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Features & Privacy Notice */}
      <div style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid var(--color-border-light)', 
        borderRadius: 'var(--radius-md)', 
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
          <div style={{ color: 'var(--color-success)', flexShrink: 0 }}>
            <ShieldAlert size={22} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
            {t('app.privacyNotice')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-success">
            {currentLang === 'ko' ? '실명 비수집' : currentLang === 'zh-TW' ? '不蒐集真名' : 'No Real Names'}
          </span>
          <span className="badge badge-neutral">
            {currentLang === 'ko' ? '무작위 코드 인증' : currentLang === 'zh-TW' ? '隨機代碼登入' : 'Random Code'}
          </span>
          <span className="badge badge-neutral">
            {currentLang === 'ko' ? '비실시간 교류' : currentLang === 'zh-TW' ? '非同步交流' : 'Asynchronous'}
          </span>
        </div>
      </div>

      {/* Admin Link at the very bottom */}
      <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
        <button
          onClick={() => onSelectRole('admin')}
          style={{ 
            fontSize: '0.78rem', 
            color: 'var(--color-text-light)', 
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {t('app.adminLink')}
        </button>
      </div>
    </div>
  );
};
