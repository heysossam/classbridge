import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Language, Activity } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';

interface DangerousDeleteModalProps {
  currentLang: Language;
  activity: Activity;
  onClose: () => void;
  onDeleted: () => void;
}

export const DangerousDeleteModal: React.FC<DangerousDeleteModalProps> = ({
  currentLang,
  activity,
  onClose,
  onDeleted,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);
  const [typedTitle, setTypedTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isMatched = typedTitle.trim() === activity.title.trim();

  const handleDelete = () => {
    if (!isMatched) return;
    const result = dataService.softDeleteActivity(activity.id, 'teacher', '교사 요청에 따른 휴지통 이동');
    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }
    onDeleted();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(23, 76, 79, 0.5)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '20px'
    }}>
      <div 
        className="cb-card modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          width: '100%', maxWidth: '500px',
          background: '#fff', borderRadius: 'var(--radius-lg)',
          border: '2px solid #EF4444',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: '#FEE2E2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>
              {t('activity.deleteConfirmTitle')}
            </h3>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ padding: '4px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '16px', fontSize: '0.88rem', color: '#991B1B', lineHeight: 1.5 }}>
          {t('activity.deleteWarning')}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
            삭제 대상 활동 제목:
          </label>
          <div style={{ 
            padding: '8px 12px', 
            background: 'var(--bg-subtle)', 
            border: '1px dashed var(--color-border)', 
            borderRadius: 'var(--radius-xs)',
            fontWeight: 700, 
            color: 'var(--color-primary)',
            fontSize: '0.95rem',
            userSelect: 'all'
          }}>
            {activity.title}
          </div>
        </div>

        {errorMessage && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '8px 12px', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '14px' }}>
            {errorMessage}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            확인을 위해 활동 제목을 동일하게 입력해 주세요:
          </label>
          <input
            type="text"
            value={typedTitle}
            onChange={(e) => setTypedTitle(e.target.value)}
            placeholder={t('activity.typeTitlePlaceholder')}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: isMatched ? '2px solid #DC2626' : '1px solid var(--color-border)',
              fontSize: '0.95rem',
              fontWeight: 600
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-outline"
            style={{ padding: '8px 18px', fontSize: '0.9rem' }}
          >
            {t('activity.cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isMatched}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              fontSize: '0.9rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: isMatched ? '#DC2626' : '#E5E7EB',
              color: isMatched ? '#fff' : '#9CA3AF',
              cursor: isMatched ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.12s ease, color 0.12s ease'
            }}
          >
            <Trash2 size={16} />
            <span>{t('activity.dangerDeleteBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
