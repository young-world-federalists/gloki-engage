import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Plus, Check } from 'lucide-react';

import type { FlowProps } from '../types';
import { useFlowContract } from '../shared/useFlowContract';
import CountryBadge from '../shared/CountryBadge';
import * as api from './concernsApi';
import type { Concern, Resolution } from './concernsApi';
import { useAppSelector } from '../../../../store/hooks';
import { useT } from '../../../../i18n';
const concernsContractCode = '';import styles from './ConcernsFlow.module.scss';

// ---------------------------------------------------------------------------
// Add concern form
// ---------------------------------------------------------------------------
const AddConcernForm: React.FC<{
  onAdd: (text: string, severity: string) => Promise<void>;
}> = ({ onAdd }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!text.trim() || text.trim().length > 1000) {
      setError('Concern must be between 1 and 1000 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(text.trim(), severity);
      setText(''); setSeverity('medium'); setError(''); setOpen(false);
    } catch {
      setError('Failed to submit concern.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button className={styles.addBtn} onClick={() => setOpen(true)}>
        <Plus size={15} /> {t('concerns.raise', 'Raise a concern')}
      </button>
    );
  }

  return (
    <div className={styles.addForm}>
      <textarea
        className={styles.addDescInput}
        rows={2}
        placeholder={t('concerns.describePlaceholder', 'Describe your concern *')}
        value={text}
        autoFocus
        maxLength={1000}
        onChange={(e) => { setText(e.target.value); setError(''); }}
      />
      <div className={styles.severityRow}>
        {(['low', 'medium', 'high'] as const).map((s) => (
          <button
            key={s}
            className={`${styles.severityBtn} ${severity === s ? styles.severityBtnActive : ''}`}
            onClick={() => setSeverity(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      <div className={styles.addFormActions}>
        <button className={styles.btnConfirm} onClick={submit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <button className={styles.btnCancel} onClick={() => { setOpen(false); setError(''); }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Concern card
// ---------------------------------------------------------------------------
const ConcernCard: React.FC<{
  concern: Concern;
  resolutions: Resolution[];
  isAuthor: boolean;
  profiles: Record<string, { country?: string }>;
  onResolve: () => Promise<void>;
  onAddResolution: (text: string) => Promise<void>;
}> = ({ concern, resolutions, isAuthor, profiles, onResolve, onAddResolution }) => {
  const t = useT();
  const [resText, setResText] = useState('');
  const [showResForm, setShowResForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const severityColor = concern.severity === 'high' ? 'rgba(220,38,38,0.85)'
    : concern.severity === 'medium' ? 'rgba(220,38,38,0.5)'
    : 'rgba(220,38,38,0.25)';

  const handleSubmitResolution = async () => {
    if (!resText.trim()) return;
    setSubmitting(true);
    try {
      await onAddResolution(resText.trim());
      setResText(''); setShowResForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`${styles.card} ${concern.resolved ? styles.card_resolved : styles.card_active}`}
      style={!concern.resolved ? { borderLeftColor: severityColor } : undefined}
    >
      {/* Severity badge */}
      {!concern.resolved && (
        <div className={styles.weightBadge} style={{ background: severityColor }} title={concern.severity}>
          {concern.severity[0].toUpperCase()}
        </div>
      )}

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>{concern.text}</span>
          <span className={styles.cardCreator}>
            {concern.author.slice(0, 8)}...
            <CountryBadge countryCode={profiles[concern.author]?.country} />
          </span>
        </div>

        {/* Resolutions */}
        {resolutions.length > 0 && (
          <div className={styles.resolutionList}>
            {resolutions.map((r, i) => (
              <div key={i} className={styles.resolution}>
                <span className={styles.resolutionText}>{r.text}</span>
                <span className={styles.resolutionAuthor}>
                  — {r.author.slice(0, 8)}...
                  <CountryBadge countryCode={profiles[r.author]?.country} />
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {!concern.resolved && (
          <div className={styles.voteButtons}>
            <button className={styles.voteBtn} onClick={() => setShowResForm((v) => !v)}>
              Propose Resolution
            </button>
            {isAuthor && (
              <button className={`${styles.voteBtn} ${styles.voteBtn_resolved}`} onClick={onResolve}>
                <Check size={14} /> Mark Resolved
              </button>
            )}
          </div>
        )}

        {showResForm && (
          <div className={styles.addForm} style={{ marginTop: 8 }}>
            <input
              className={styles.addTitleInput}
              type="text"
              placeholder={t('concerns.resolutionPlaceholder', 'Propose a resolution...')}
              value={resText}
              maxLength={500}
              onChange={(e) => setResText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitResolution(); }}
            />
            <div className={styles.addFormActions}>
              <button className={styles.btnConfirm} onClick={handleSubmitResolution} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button className={styles.btnCancel} onClick={() => setShowResForm(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------
const CollapsibleSection: React.FC<{
  label: string;
  count: number;
  colorClass: string;
  children: React.ReactNode;
}> = ({ label, count, colorClass, children }) => {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <div className={styles.section}>
      <button className={`${styles.sectionToggle} ${colorClass}`} onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        {label}
        <span className={styles.sectionCount}>{count}</span>
      </button>
      {open && <div className={styles.sectionCards}>{children}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
const ConcernsFlow: React.FC<FlowProps> = ({ instanceId, parentContractId, stageKey }) => {
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    instanceId, 'concern_resolution', 'concerns_contract.py', concernsContractCode, parentContractId, stageKey,
  );
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [resolutionsMap, setResolutionsMap] = useState<Record<string, Resolution[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setLoading(true);
    try {
      const raw = await api.getConcerns(serverUrl, publicKey, contractId);
      const concernsObj = (raw as Record<string, Concern>) || {};
      const concernList = Object.values(concernsObj);
      setConcerns(concernList);

      const resMap: Record<string, Resolution[]> = {};
      await Promise.all(
        concernList.map(async (c) => {
          try {
            const res = await api.getResolutions(serverUrl, publicKey, contractId, c.id);
            resMap[c.id] = (res as Resolution[]) || [];
          } catch {
            resMap[c.id] = [];
          }
        }),
      );
      setResolutionsMap(resMap);
    } catch (err) {
      console.error('Failed to fetch concerns:', err);
    } finally {
      setLoading(false);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => { if (isReady) fetchData(); }, [isReady, fetchData]);

  const handleAddConcern = async (text: string, severity: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.addConcern(serverUrl, publicKey, contractId, text, severity);
    await fetchData();
  };

  const handleResolve = async (concernId: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.resolveConcern(serverUrl, publicKey, contractId, concernId);
    await fetchData();
  };

  const handleAddResolution = async (concernId: string, text: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.addResolution(serverUrl, publicKey, contractId, concernId, text);
    await fetchData();
  };

  if (hasError) return (
    <div className={styles.loading}>
      <p>{errorMessage || 'Failed to set up concerns.'}</p>
      <button onClick={retry} style={{ marginTop: 8, padding: '6px 16px', cursor: 'pointer' }}>Retry</button>
    </div>
  );
  if (isDeploying || !isReady) return (
    <div className={styles.loading}>{statusMessage || 'Setting up concerns...'}</div>
  );
  if (loading && concerns.length === 0) return <div className={styles.loading}>Loading...</div>;

  const active = concerns.filter((c) => !c.resolved);
  const resolved = concerns.filter((c) => c.resolved);

  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  active.sort(
    (a, b) =>
      (severityOrder[a.severity] ?? 1) - (severityOrder[b.severity] ?? 1) ||
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <AlertTriangle size={18} className={styles.headerIcon} />
        <span>{active.length} active concern{active.length !== 1 ? 's' : ''}</span>
      </div>

      <AddConcernForm onAdd={handleAddConcern} />

      {active.length === 0 ? (
        <p className={styles.noData}>No active concerns. The floor is open — raise one above.</p>
      ) : (
        <div className={styles.concernList}>
          {active.map((c) => (
            <ConcernCard
              key={c.id}
              concern={c}
              resolutions={resolutionsMap[c.id] || []}
              isAuthor={publicKey === c.author}
              profiles={profiles}
              onResolve={() => handleResolve(c.id)}
              onAddResolution={(text) => handleAddResolution(c.id, text)}
            />
          ))}
        </div>
      )}

      <CollapsibleSection label="Resolved" count={resolved.length} colorClass={styles.toggleResolved}>
        <div className={styles.concernList}>
          {resolved.map((c) => (
            <ConcernCard
              key={c.id}
              concern={c}
              resolutions={resolutionsMap[c.id] || []}
              isAuthor={publicKey === c.author}
              profiles={profiles}
              onResolve={() => handleResolve(c.id)}
              onAddResolution={(text) => handleAddResolution(c.id, text)}
            />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default ConcernsFlow;
