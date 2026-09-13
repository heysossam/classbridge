import React, { useState, useEffect } from 'react';
import { 
  Shield, ArrowLeft, Power, Lock, Trash2, Undo2, 
  AlertTriangle, History, FolderOpen, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { Language, Room, Activity, AuditLog } from '../../types';
import { getTranslation } from '../../services/i18n';
import { dataService } from '../../services/dataService';
import { auth } from '../../firebase';

interface AdminViewProps {
  currentLang: Language;
  onBack: () => void;
}

type AdminTab = 'trash' | 'audit' | 'room';

export const AdminView: React.FC<AdminViewProps> = ({ currentLang, onBack }) => {
  const t = (key: string) => getTranslation(currentLang, key);
  const [activeTab, setActiveTab] = useState<AdminTab>('trash');
  const [room, setRoom] = useState<Room>(() => dataService.getRoom());
  const [isActive, setIsActive] = useState<boolean>(true);

  // Trash Activities & Audit Logs
  const [trashActivities, setTrashActivities] = useState<Activity[]>(() => dataService.getTrashActivities());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => dataService.getAuditLogs());
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const reloadData = () => {
    setTrashActivities(dataService.getTrashActivities());
    setAuditLogs(dataService.getAuditLogs());
    setRoom(dataService.getRoom());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleRestore = (act: Activity) => {
    const adminIdentifier = auth.currentUser?.email || 'admin-user';
    const result = dataService.restoreTrashActivity(act.id, adminIdentifier);
    if (result.success) {
      setActionMessage({ type: 'success', text: `활동 '${act.title}'이(가) 정상 복원되었습니다.` });
      reloadData();
    } else {
      setActionMessage({ type: 'error', text: result.message });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '20px auto' }}>
      <div className="cb-card" style={{ borderTop: '4px solid #1E293B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={onBack}
            className="btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>{currentLang === 'ko' ? '시작 화면으로 돌아가기' : 'Back to Start'}</span>
          </button>

          <span className="badge badge-neutral" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} />
            <span>Authenticated Admin ({auth.currentUser?.email || 'Admin'})</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Shield size={28} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {currentLang === 'ko' ? '서비스 관리자 콘솔' : 'ClassBridge Admin Console'}
          </h2>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          {currentLang === 'ko' 
            ? '안전한 수업 활동 복원 및 감사 로그(Audit Logs) 추적을 수행합니다. (영구 삭제는 데이터 안전 정책에 따라 지원하지 않습니다)' 
            : 'Manage trash recovery and tamper-proof audit trails. Permanent deletion is disabled by safety policy.'}
        </p>

        {actionMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            background: actionMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${actionMessage.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: actionMessage.type === 'success' ? '#065F46' : '#991B1B',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('trash')}
            className={`btn-outline ${activeTab === 'trash' ? 'btn-primary' : ''}`}
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.88rem', 
              fontWeight: 700,
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Trash2 size={16} />
            <span>휴지통 보관 활동 ({trashActivities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`btn-outline ${activeTab === 'audit' ? 'btn-primary' : ''}`}
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.88rem', 
              fontWeight: 700,
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <History size={16} />
            <span>감사 로그 (Audit Logs)</span>
          </button>

          <button
            onClick={() => setActiveTab('room')}
            className={`btn-outline ${activeTab === 'room' ? 'btn-primary' : ''}`}
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.88rem', 
              fontWeight: 700,
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <FolderOpen size={16} />
            <span>교류방 상태</span>
          </button>
        </div>

        {/* Tab 1: Trash Activities & Recovery */}
        {activeTab === 'trash' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                휴지통 보관 목록 (관리자 복원 전용)
              </div>
              <button 
                onClick={reloadData}
                className="btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} />
                <span>새로고침</span>
              </button>
            </div>

            {trashActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)' }}>
                <Trash2 size={36} color="var(--color-text-light)" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  휴지통이 비어 있습니다.
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                  교사가 삭제(보관) 처리한 활동이 이곳에 안전하게 보존되며, 필요 시 즉시 복원할 수 있습니다.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {trashActivities.map((act) => (
                  <div 
                    key={act.id} 
                    style={{ 
                      border: '1px solid #CBD5E1', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '16px', 
                      background: 'var(--bg-card)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                          {act.title}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          보관일: {act.deletedAt ? new Date(act.deletedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        처리자: {act.deletedBy || '교사'} · 사유: {act.deletionReason || '보관 요청'} · 배정: {act.targetSide}
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => handleRestore(act)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Undo2 size={16} />
                        <span>활동 복원하기</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Audit Logs */}
        {activeTab === 'audit' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                보안 및 감사 로그 (최신순 200건)
              </div>
              <button 
                onClick={reloadData}
                className="btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} />
                <span>새로고침</span>
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                기록된 감사 로그가 없습니다.
              </div>
            ) : (
              <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>시각</th>
                      <th style={{ padding: '10px' }}>종류</th>
                      <th style={{ padding: '10px' }}>대상</th>
                      <th style={{ padding: '10px' }}>사용자</th>
                      <th style={{ padding: '10px' }}>상세 내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span className={`badge ${
                            log.action === 'soft_delete' ? 'badge-accent' :
                            log.action === 'restore' ? 'badge-success' : 'badge-neutral'
                          }`} style={{ fontSize: '0.7rem' }}>
                            {log.action.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{log.targetType}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--color-text-muted)' }}>
                          {log.userEmail || log.userId}
                        </td>
                        <td style={{ padding: '8px 10px' }}>{log.details || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Room Status */}
        {activeTab === 'room' && (
          <div>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg-subtle)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                      {room.title}
                    </span>
                    <span className="badge badge-neutral">Code: {room.joinCode}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    파트너: {room.partnerALabel} ↔ {room.partnerBLabel} · 최종 갱신: {room.lastUpdated}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`badge ${isActive ? 'badge-success' : 'badge-neutral'}`}>
                    {isActive ? '운영 중' : '일시정지'}
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
        )}

        {/* Safe Mode Notice: Total Reset is completely removed from operational UI */}
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '18px', marginTop: '20px', fontSize: '0.82rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} color="var(--color-primary)" />
          <span>운영 데이터 보호 원칙: 학생 제출물, 댓글 및 관찰 기록은 절대 초기화되거나 유실되지 않으며 안전하게 보존됩니다.</span>
        </div>
      </div>
    </div>
  );
};
