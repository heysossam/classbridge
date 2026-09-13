import React, { useState } from 'react';
import { Shield, ArrowLeft, RefreshCw, Power, CheckCircle, AlertTriangle } from 'lucide-react';
import { Language, Room } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';

interface AdminViewProps {
  currentLang: Language;
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentLang, onBack }) => {
  const t = (key: string) => getTranslation(currentLang, key);
  const [room, setRoom] = useState<Room>(dataService.getRoom());
  const [isActive, setIsActive] = useState<boolean>(true);
  const [resetMessage, setResetMessage] = useState<string>('');

  const handleResetData = () => {
    if (window.confirm(t('admin.resetConfirm'))) {
      dataService.resetAllToDemo();
      setResetMessage(currentLang === 'ko' ? '데모 데이터가 기본값으로 초기화되었습니다.' : 'Demo data reset successfully.');
      setRoom(dataService.getRoom());
      setTimeout(() => setResetMessage(''), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <div className="cb-card" style={{ borderTop: '4px solid #333' }}>
        <button
          onClick={onBack}
          className="btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}
        >
          <ArrowLeft size={16} />
          <span>{currentLang === 'ko' ? '시작 화면으로 돌아가기' : 'Back to Start'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Shield size={24} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {t('admin.title')}
          </h2>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          {t('admin.notice')}
        </p>

        {resetMessage && (
          <div style={{ background: 'var(--color-success-soft)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--color-success)', fontSize: '0.88rem', fontWeight: 600, marginBottom: '16px' }}>
            {resetMessage}
          </div>
        )}

        {/* Room Management Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '12px' }}>
            {t('admin.roomList')}
          </h3>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                    {room.title}
                  </span>
                  <span className="badge badge-neutral">Code: {room.joinCode}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  생성일: 2026-09-10 · 파트너: {room.partnerALabel} ↔ {room.partnerBLabel}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`badge ${isActive ? 'badge-success' : 'badge-neutral'}`}>
                  {isActive ? '활성 상태' : '비활성'}
                </span>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className="btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Power size={14} />
                  <span>{t('admin.statusToggle')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Reset Section */}
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
            {t('admin.resetDemo')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
            시연 도중 학생이 제출한 응답, 새로 작성된 메모 등을 초기 데모 상태로 깨끗이 되돌립니다.
          </p>
          <button
            onClick={handleResetData}
            className="btn-accent"
            style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} />
            <span>{t('admin.resetDemo')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
