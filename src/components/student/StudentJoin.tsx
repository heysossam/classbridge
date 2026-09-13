import React, { useState } from 'react';
import { KeyRound, User, School, AlertCircle, ArrowRight } from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../services/i18n';

interface StudentJoinProps {
  currentLang: Language;
  onJoinSuccess: (studentData: {
    roomCode: string;
    participantCode: string;
    englishNickname: string;
    partnerSide: 'Korea Class' | 'Taiwan Class';
  }) => void;
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
  const [partnerSide, setPartnerSide] = useState<'Korea Class' | 'Taiwan Class'>('Korea Class');
  const [error, setError] = useState('');

  // Sample quick fill for demonstration
  const handleQuickDemo = (code: string, name: string, side: 'Korea Class' | 'Taiwan Class') => {
    setParticipantCode(code);
    setEnglishNickname(name);
    setPartnerSide(side);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError(currentLang === 'ko' ? '교류방 코드를 입력하세요.' : 'Please enter room code.');
      return;
    }
    if (!participantCode.trim()) {
      setError(currentLang === 'ko' ? '참여코드를 입력하세요.' : 'Please enter participant code.');
      return;
    }
    if (!englishNickname.trim()) {
      setError(currentLang === 'ko' ? '영어 닉네임을 입력하세요.' : 'Please enter English nickname.');
      return;
    }

    onJoinSuccess({
      roomCode: roomCode.trim().toUpperCase(),
      participantCode: participantCode.trim().toUpperCase(),
      englishNickname: englishNickname.trim(),
      partnerSide,
    });
  };

  return (
    <div style={{ maxWidth: '540px', margin: '20px auto' }}>
      <div className="cb-card" style={{ borderTop: '4px solid var(--color-accent)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
            {t('studentJoin.title')}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            {t('studentJoin.instructions')}
          </p>
        </div>

        {/* Warning Banner */}
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

        {/* Demo Fast Preset Bar */}
        <div style={{ 
          background: 'var(--bg-subtle)', 
          padding: '10px 14px', 
          borderRadius: 'var(--radius-sm)', 
          marginBottom: '20px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
            {currentLang === 'ko' ? '시연용 빠른 선택:' : currentLang === 'zh-TW' ? '示範快速選擇:' : 'Demo Presets:'}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="badge badge-accent"
              onClick={() => handleQuickDemo('K7M4', 'Sunny', 'Korea Class')}
              style={{ cursor: 'pointer' }}
            >
              Sunny (K7M4)
            </button>
            <button
              type="button"
              className="badge badge-neutral"
              onClick={() => handleQuickDemo('T9Q2', 'Ruby', 'Taiwan Class')}
              style={{ cursor: 'pointer' }}
            >
              Ruby (T9Q2)
            </button>
            <button
              type="button"
              className="badge badge-neutral"
              onClick={() => handleQuickDemo('K2R7', 'Owen', 'Korea Class')}
              style={{ cursor: 'pointer' }}
            >
              Owen (K2R7)
            </button>
          </div>
        </div>

        {error && (
          <div style={{ color: '#D9381E', fontSize: '0.85rem', marginBottom: '14px', fontWeight: 600 }}>
            {error}
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
                placeholder={t('studentJoin.roomCodePlaceholder')}
                style={{ 
                  width: '100%', 
                  padding: '12px 14px 12px 38px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--color-border)',
                  fontSize: '0.95rem',
                  letterSpacing: '0.05em',
                  fontWeight: 600
                }}
              />
              <KeyRound size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Participant Side Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              {t('studentJoin.selectSide')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPartnerSide('Korea Class')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${partnerSide === 'Korea Class' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: partnerSide === 'Korea Class' ? 'var(--color-secondary-light)' : 'var(--bg-card)',
                  color: partnerSide === 'Korea Class' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🇰🇷</span> {t('studentJoin.koreaClass')}
              </button>

              <button
                type="button"
                onClick={() => setPartnerSide('Taiwan Class')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${partnerSide === 'Taiwan Class' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: partnerSide === 'Taiwan Class' ? 'var(--color-accent-soft)' : 'var(--bg-card)',
                  color: partnerSide === 'Taiwan Class' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🇹🇼</span> {t('studentJoin.taiwanClass')}
              </button>
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
              placeholder={t('studentJoin.participantCodePlaceholder')}
              maxLength={6}
              style={{ 
                width: '100%', 
                padding: '12px 14px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--color-border)',
                fontSize: '1rem',
                fontWeight: 600,
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
                placeholder={t('studentJoin.englishNicknamePlaceholder')}
                style={{ 
                  width: '100%', 
                  padding: '12px 14px 12px 38px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--color-border)',
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              />
              <User size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-accent" 
            style={{ width: '100%', padding: '14px', marginTop: '10px', fontSize: '1rem' }}
          >
            <span>{t('studentJoin.enterBtn')}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
