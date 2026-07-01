import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Button, Banner } from '../shared';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { getInitiativeRoles, isAuthorOrCoAuthor } from '../../services/initiativeRoles';
import { getRatification, saveRatification } from '../../services/mandateRatification';
import { isMandateRatified, type PublishedMandate, type MandateRatification } from '../../services/demo/fixtures/mandate';
import styles from './RatificationPanel.module.scss';

interface RatificationPanelProps {
  /** The initiative contract id (== route :mandateId). */
  initiativeId: string;
  /** The resolved mandate — its indicators seed the editable rows. */
  mandate: PublishedMandate;
  /** Called after a successful save so the page can re-derive the mandate. */
  onSaved: () => void;
}

type Row = { label: string; target: string; baseline: string; cadence: string };

/**
 * P4 — "Prepare for ratification". Host/expert-only. Lists each of the
 * mandate's indicators and lets the initiative's host, co-authors or endorsed
 * experts enter the target, today's baseline, and the measurement cadence that
 * make the mandate ratifiable. Writes one JSON property on the initiative
 * contract; the demo seam emits no write events, so the parent re-fetches.
 */
const RatificationPanel: React.FC<RatificationPanelProps> = ({ initiativeId, mandate, onSaved }) => {
  const { t } = useI18n();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [canEdit, setCanEdit] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);

  // Gate: host, co-author, or endorsed expert of this initiative.
  useEffect(() => {
    let cancelled = false;
    if (!serverUrl || !publicKey || !initiativeId) return;
    getInitiativeRoles(serverUrl, publicKey, initiativeId).then((roles) => {
      if (cancelled) return;
      const allowed = isAuthorOrCoAuthor(roles, publicKey) || roles.experts.includes(publicKey);
      setCanEdit(allowed);
    });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, initiativeId]);

  // Seed editable rows from the mandate's indicators (already merged with any
  // stored ratification data by useMandate).
  useEffect(() => {
    setRows(mandate.indicators.map((i) => ({
      label: i.label,
      target: i.target ?? '',
      baseline: i.baseline ?? '',
      cadence: i.cadence ?? '',
    })));
  }, [mandate.indicators]);

  const allComplete = useMemo(
    () => isMandateRatified(rows.map((r) => ({ label: r.label, target: r.target, baseline: r.baseline, cadence: r.cadence }))),
    [rows],
  );

  if (!canEdit || rows.length === 0) return null;

  const update = (idx: number, field: keyof Omit<Row, 'label'>, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    setSavedAt(false);
  };

  const handleSave = async () => {
    if (!serverUrl || !publicKey) return;
    setSaving(true);
    try {
      const data: MandateRatification = {
        indicators: Object.fromEntries(
          rows.map((r) => [r.label, { target: r.target.trim(), baseline: r.baseline.trim(), cadence: r.cadence.trim() }]),
        ),
      };
      await saveRatification(serverUrl, publicKey, initiativeId, data);
      // Re-read to confirm the write landed (no contract_write events in demo).
      await getRatification(serverUrl, publicKey, initiativeId);
      setSavedAt(true);
      onSaved();
    } catch {
      /* leave the form intact so the host can retry */
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="ratify-heading">
      <header className={styles.head}>
        <ClipboardCheck size={18} aria-hidden className={styles.headIcon} />
        <h2 id="ratify-heading" className={styles.heading}>
          {t('mandate.ratify.title', 'Prepare for ratification')}
        </h2>
      </header>
      <p className={styles.intro}>
        {t('mandate.ratify.intro', 'As a host or expert, set each indicator’s target, today’s baseline, and how often it’s measured. A mandate is only marked ratified once every indicator is complete.')}
      </p>

      <ul className={styles.rows}>
        {rows.map((r, idx) => (
          <li key={r.label} className={styles.row}>
            <span className={styles.rowLabel}>{r.label}</span>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('mandate.ratify.target', 'Target')}</span>
              <input
                className={styles.input} type="text" value={r.target} maxLength={120}
                placeholder={t('mandate.ratify.targetPlaceholder', 'e.g. 500 communities by 2028')}
                onChange={(e) => update(idx, 'target', e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('mandate.ratify.baseline', 'Baseline today')}</span>
              <input
                className={styles.input} type="text" value={r.baseline} maxLength={120}
                placeholder={t('mandate.ratify.baselinePlaceholder', 'e.g. About 40 today')}
                onChange={(e) => update(idx, 'baseline', e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('mandate.ratify.cadence', 'Measured')}</span>
              <input
                className={styles.input} type="text" value={r.cadence} maxLength={80}
                placeholder={t('mandate.ratify.cadencePlaceholder', 'e.g. Quarterly')}
                onChange={(e) => update(idx, 'cadence', e.target.value)}
              />
            </label>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <p className={styles.status}>
          {allComplete
            ? t('mandate.ratify.ready', 'All indicators complete — this mandate reads as ratified.')
            : t('mandate.ratify.incomplete', 'Fill every field to ratify. Partial entries are saved as pending.')}
        </p>
        <Button
          variant="primary" size="sm" onClick={handleSave} disabled={saving}
          leftIcon={saving ? <Loader2 size={16} className={styles.spin} aria-hidden /> : <ClipboardCheck size={16} aria-hidden />}
        >
          {saving ? t('mandate.ratify.saving', 'Saving…') : t('mandate.ratify.save', 'Save ratification details')}
        </Button>
      </div>

      {savedAt && (
        <Banner tone="success" className={styles.saved}>
          {t('mandate.ratify.saved', 'Saved. The published mandate has been updated.')}
        </Banner>
      )}
    </section>
  );
};

export default RatificationPanel;
