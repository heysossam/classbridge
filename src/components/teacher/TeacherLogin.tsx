import React, { useState } from 'react';
import { GraduationCap, ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';

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
  const [selectedSide, setSelectedSide] = useState<'Korea Class' | 'Taiwan Class'>('Korea Class');

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

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            {currentLang === 'ko' && '구글 교사 인증 또는 시연용 원클릭 데모 교사로 입장하세요.'}
            {currentLang === 'en' && 'Sign in with Google or enter with one-click teacher demo mode.'}
            {currentLang === 'zh-TW' && '使用 Google 教師帳號登入或以示範教師身分快速進入。'}
          </p>
        </div>

        {/* Assigned Exchange Room Card */}
        <div style={{ 
          background: 'var(--bg-subtle)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '16px', 
          marginBottom: '24px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: '4px' }}>
            {currentLang === 'ko' ? '배정된 참여 교류방' : currentLang === 'zh-TW' ? '已配對之交流室' : 'Assigned Exchange Room'}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
            {room.title}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
              Code: {room.joinCode}
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              {room.partnerALabel} ↔ {room.partnerBLabel}
            </span>
          </div>
        </div>

        {/* Demo Teacher Role Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px' }}>
            {currentLang === 'ko' ? '시연 담당 학급 교사 선택:' : currentLang === 'zh-TW' ? '選擇示範之執教班級：' : 'Select Class Teacher Persona:'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              onClick={() => setSelectedSide('Korea Class')}
              style={{
                cursor: 'pointer',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${selectedSide === 'Korea Class' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: selectedSide === 'Korea Class' ? 'var(--color-secondary-light)' : 'var(--bg-card)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>🇰🇷 Korea Class</span>
                {selectedSide === 'Korea Class' && <CheckCircle2 size={18} color="var(--color-primary)" />}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {currentLang === 'ko' ? '한국 파트너 교사 시점' : 'Korean Teacher View'}
              </div>
            </div>

            <div
              onClick={() => setSelectedSide('Taiwan Class')}
              style={{
                cursor: 'pointer',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${selectedSide === 'Taiwan Class' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: selectedSide === 'Taiwan Class' ? 'var(--color-accent-soft)' : 'var(--bg-card)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.95rem' }}>🇹🇼 Taiwan Class</span>
                {selectedSide === 'Taiwan Class' && <CheckCircle2 size={18} color="var(--color-accent)" />}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {currentLang === 'ko' ? '대만 파트너 교사 시점' : 'Taiwanese Teacher View'}
              </div>
            </div>
          </div>
        </div>

        {/* Enter Button */}
        <button
          onClick={() => onLoginSuccess(selectedSide)}
          className="btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '14px' }}
        >
          <span>
            {currentLang === 'ko' ? `${selectedSide === 'Korea Class' ? 'Korea Class' : 'Taiwan Class'} 대시보드 입장` : 'Enter Dashboard'}
          </span>
          <ArrowRight size={18} />
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={16} />
          <span>{currentLang === 'ko' ? '교사용 권한으로 안전하게 접속됩니다' : 'Protected by Teacher Role Access'}</span>
        </div>
      </div>
    </div>
  );
};
