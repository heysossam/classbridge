import React, { useState } from 'react';
import { Shield, ArrowLeft, Power, Lock } from 'lucide-react';
import { Language, Room } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';

/**
 * TODO: Firebase 연동 후 서비스 관리자 접근 제어
 * - Firebase Google Authentication 연동 후, 지정된 관리자 UID(예: adminUIDs.includes(currentUser.uid))만
 *   관리자 화면에 접근할 수 있도록 인가(Authorization) 가드를 활성화할 예정입니다.
 * - 본 컴포넌트는 마운트 시 어떠한 데이터(학생 제출, 교사 활동, 메모 등)도 생성, 수정, 삭제, 초기화하지 않습니다.
 * - 본 MVP에서는 의도치 않은 데이터 유실을 방지하기 위해 데이터 초기화(reset) 버튼이 UI에서 완전히 제거되었습니다.
 */
interface AdminViewProps {
  currentLang: Language;
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentLang, onBack }) => {
  const t = (key: string) => getTranslation(currentLang, key);
  // Pure read-only state initialization on mount - no data modification
  const [room] = useState<Room>(() => dataService.getRoom());
  const [isActive, setIsActive] = useState<boolean>(true);

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

        {/* Room Management Section */}
        <div style={{ marginBottom: '24px' }}>
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

        {/* Safe Mode Data Protection Notice */}
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '18px', fontSize: '0.82rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} color="var(--color-primary)" />
          <span>안전한 데이터 보호를 위해 클라이언트 데이터 리셋 기능은 비활성화되었습니다. 모든 학생 제출물 및 교사 메모는 안전하게 보존됩니다.</span>
        </div>
      </div>
    </div>
  );
};
