import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, TrendingUp, Check, Pencil } from 'lucide-react';
import { useFlowContract } from '../shared/useFlowContract';
import * as api from './convictionApi';
import { useAppSelector } from '../../../../store/hooks';
import { getCountryColor } from '../../../../utils/countries';
import { useI18n } from '../../../../i18n';
import { CountryFlag, InfoDisclosure } from '../../../shared';
import { formatDateTime } from '../../../../utils/formatDateTime';
import {
  CONVICTION_CAPS,
  CONVICTION_MODEL,
  convictionCap,
  isConvictionDuration,
  type ConvictionDuration,
  type ConvictionStakeRead,
  type ConvictionTotal,
} from '../../../../services/convictionModel';
import styles from './ConvictionStaking.module.scss';

const convictionCode = '';

interface ConvictionStakingProps {
  instanceId: string;
  parentContractId?: string;
  stageKey?: string;
  compact?: boolean;
}

const MAX_STRENGTH = CONVICTION_CAPS['1y'];
const DURATIONS: Array<{ value: ConvictionDuration; label: string; labelKey: string }> = [
  { value: '1w', label: '1 week', labelKey: 'mechanisms.conviction.dur1w' },
  { value: '1m', label: '1 month', labelKey: 'mechanisms.conviction.dur1m' },
  { value: '3m', label: '3 months', labelKey: 'mechanisms.conviction.dur3m' },
  { value: '6m', label: '6 months', labelKey: 'mechanisms.conviction.dur6m' },
  { value: '1y', label: '1 year', labelKey: 'mechanisms.conviction.dur1y' },
];

const ConvictionStaking: React.FC<ConvictionStakingProps> = ({
  instanceId, parentContractId, stageKey, compact = false,
}) => {
  const { t, locale } = useI18n();
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    instanceId, 'conviction_staking', 'conviction_contract.py', convictionCode, parentContractId, stageKey,
  );
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);
  const myCountry = publicKey && profiles[publicKey]?.country ? profiles[publicKey].country : 'OTHER';

  const [myStake, setMyStake] = useState<ConvictionStakeRead | null>(null);
  const [totalConviction, setTotalConviction] = useState<ConvictionTotal>({ total: 0, count: 0 });
  const [countryBreakdown, setCountryBreakdown] = useState<Record<string, number>>({});
  const [duration, setDuration] = useState<ConvictionDuration>('1m');
  const [submitting, setSubmitting] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  // S33: a commitment is changeable, not frozen. `editing` swaps the summary
  // back to the picker, pre-set to what you already chose.
  const [editing, setEditing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      const [stake, total, byCountry] = await Promise.all([
        api.getMyStake(serverUrl, publicKey, contractId),
        api.getTotalConviction(serverUrl, publicKey, contractId),
        api.getConvictionByCountry(serverUrl, publicKey, contractId),
      ]);
      setMyStake(stake || null);
      setTotalConviction(total || { total: 0, count: 0 });
      setCountryBreakdown(byCountry || {});
    } catch (err) {
      console.error('Failed to fetch conviction data:', err);
    } finally {
      setHasLoadedData(true);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => {
    if (isReady) fetchData();
  }, [isReady, fetchData]);

  // Conviction changes with elapsed time even when nobody writes to the
  // contract. Refresh occasionally, and when the tab becomes visible again.
  useEffect(() => {
    if (!isReady || !hasLoadedData) return undefined;
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void fetchData();
    };
    const intervalId = window.setInterval(refreshWhenVisible, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [isReady, hasLoadedData, fetchData]);

  const selectedDuration = DURATIONS.find((d) => d.value === duration) || DURATIONS[1];
  const selectedCap = CONVICTION_CAPS[selectedDuration.value];
  const isAccrual = totalConviction.model === CONVICTION_MODEL;
  const strengthFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    [locale],
  );
  const formatStrength = (value: number) => strengthFormatter.format(value);

  const handleStake = async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setSubmitting(true);
    try {
      // Amount is always 1 — time is the only lever, never quantity. Changing an
      // existing commitment goes through `update_stake`, which leaves the amount
      // alone; calling `stake` twice would add to it.
      if (myStake) {
        await api.updateStake(serverUrl, publicKey, contractId, duration, myCountry);
      } else {
        await api.stake(serverUrl, publicKey, contractId, 1, duration, myCountry);
      }
      await fetchData();
      setEditing(false);
    } catch (err) {
      console.error('Failed to back this:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    setSubmitting(true);
    try {
      await api.withdrawStake(serverUrl, publicKey, contractId);
      await fetchData();
      setEditing(false);
    } catch (err) {
      console.error('Failed to withdraw backing:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = () => {
    if (myStake && isConvictionDuration(myStake.duration)) setDuration(myStake.duration);
    setEditing(true);
  };

  /**
   * The answer to "how much conviction do I have?" — there is no bank. One
   * backing per person; length is the only lever. Prose behind the (i), the
   * numbers stay inline (DESIGN_SYSTEM disclosure rule).
   */
  const howItWorks = (
    <InfoDisclosure
      label={t('mechanisms.conviction.howLabel', 'How backing works')}
      title={t('mechanisms.conviction.howTitle', 'How backing works')}
    >
      <p>{t('mechanisms.conviction.how1', 'Everyone gets one backing per mandate. There is no budget and nothing to spend — you cannot back something twice to make it count for more.')}</p>
      <p>{isAccrual
        ? t('mechanisms.conviction.how2', 'Strength starts at 1 and gains 1 point for every 30 days you keep backing, up to the maximum for your chosen commitment.')
        : t('mechanisms.conviction.legacyIntro', 'This community uses the earlier model: the full strength of your chosen commitment applies immediately.')}
      </p>
      <p>{isAccrual
        ? t('mechanisms.conviction.how3', 'You can change or withdraw at any time. Committing for longer keeps your original start date; shortening restarts your strength at 1.')
        : t('mechanisms.conviction.legacyHow3', 'You can change or withdraw at any time. Committing for longer keeps your original backing date; shortening restarts that date.')}
      </p>
    </InfoDisclosure>
  );

  if (hasError) return (
    <div className={styles.loading}>
      <p>{errorMessage || t('mechanisms.conviction.setupError', 'Failed to set up backing.')}</p>
      <button onClick={retry} className={styles.retryBtn}>{t('common.retry', 'Try again')}</button>
    </div>
  );
  if (isDeploying || !isReady || !hasLoadedData) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>{statusMessage || t('mechanisms.conviction.settingUp', 'Setting up backing…')}</p>
    </div>
  );

  const maxConviction = Math.max(...Object.values(countryBreakdown), 1);

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* Pick how long to back — or, once committed, your commitment summary. */}
      {myStake && !editing ? (() => {
        const mine = DURATIONS.find((d) => d.value === myStake.duration) || DURATIONS[0];
        const cap = convictionCap(myStake.duration);
        const accruedWeight = typeof myStake.weight === 'number' && Number.isFinite(myStake.weight)
          ? myStake.weight
          : null;
        const legacyAmount = Number.isFinite(myStake.amount) ? myStake.amount : 1;
        const myWeight = isAccrual ? accruedWeight : legacyAmount * cap;
        const share = myWeight !== null && totalConviction.total > 0
          ? (myWeight / totalConviction.total) * 100
          : 0;
        const strengthPercent = isAccrual && myWeight !== null
          ? Math.min(100, Math.max(0, (myWeight / cap) * 100))
          : (cap / MAX_STRENGTH) * 100;
        const since = Number(myStake.timestamp);
        return (
          <div className={styles.commitment}>
            <h4 className={styles.sectionTitle}>
              <Check size={16} /> {t('mechanisms.conviction.yourCommitment', 'Your commitment')}
              {howItWorks}
            </h4>
            <p className={styles.commitmentLine}>
              {t('mechanisms.conviction.backingFor', 'You’re backing this for {duration}.', {
                duration: t(mine.labelKey, mine.label),
              })}
            </p>
            {(!isAccrual || myWeight !== null) && (
              <div className={styles.strengthMeter} aria-hidden="true">
                <div className={styles.strengthTrack}>
                  <div className={styles.strengthFill} style={{ width: `${strengthPercent}%` }} />
                </div>
              </div>
            )}
            {myWeight !== null && (
              <p className={styles.strengthLabel}>
                {isAccrual
                  ? t('mechanisms.conviction.currentStrength', 'Current strength: {current} of {max}', {
                    current: formatStrength(myWeight),
                    max: formatStrength(cap),
                  })
                  : t('mechanisms.conviction.legacyStrength', 'Current strength: {strength} (applied immediately)', {
                    strength: formatStrength(myWeight),
                  })}
              </p>
            )}
            {Number.isFinite(since) && since > 0 && (
              <p className={styles.sinceLine}>
                {t('mechanisms.conviction.backingSince', 'Backing since {date}', {
                  date: formatDateTime(since, locale),
                })}
              </p>
            )}
            {myWeight !== null && totalConviction.total > 0 && (
              <p className={styles.shareLine}>
                {t('mechanisms.conviction.yourShare', 'Your share of the community’s support: {share}%', {
                  share: share.toFixed(1),
                })}
              </p>
            )}
            {/* A commitment you can revisit — it was never meant to be frozen (S33). */}
            <div className={styles.commitmentActions}>
              <button
                type="button"
                className={styles.changeBtn}
                onClick={startEditing}
                disabled={submitting}
              >
                <Pencil size={15} aria-hidden />
                {t('mechanisms.conviction.change', 'Change how long')}
              </button>
              <button
                type="button"
                className={styles.withdrawBtn}
                onClick={handleWithdraw}
                disabled={submitting}
              >
                {t('mechanisms.conviction.withdraw', 'Withdraw backing')}
              </button>
            </div>
          </div>
        );
      })() : (
        <div className={styles.stakeForm}>
          <h4 className={styles.sectionTitle}>
            <Clock size={16} />
            {editing
              ? t('mechanisms.conviction.editHeading', 'Change how long you’ll back this')
              : t('mechanisms.conviction.heading', 'How long will you back this?')}
            {howItWorks}
          </h4>
          <p className={styles.intro}>
            {isAccrual
              ? t('mechanisms.conviction.intro', 'Every backing starts at 1 strength and gains 1 point for every 30 days it is held, up to the maximum for your commitment.')
              : t('mechanisms.conviction.legacyIntro', 'This community uses the earlier model: the full strength of your chosen commitment applies immediately.')}
          </p>
          {!isAccrual && (
            <p className={styles.legacyNotice}>
              {t('mechanisms.conviction.legacyNotice', 'This community uses the earlier instant-strength model.')}
            </p>
          )}

          <div
            className={styles.durationPicker}
            role="radiogroup"
            aria-label={t('mechanisms.conviction.heading', 'How long will you back this?')}
          >
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={duration === d.value}
                className={`${styles.durationOption} ${duration === d.value ? styles.durationActive : ''}`}
                onClick={() => setDuration(d.value)}
                disabled={submitting}
              >
                {t(d.labelKey, d.label)}
              </button>
            ))}
          </div>

          <div className={styles.strengthMeter}>
            <div className={styles.strengthTrack}>
              <div
                className={styles.strengthFill}
                style={{ width: `${(selectedCap / MAX_STRENGTH) * 100}%` }}
              />
            </div>
            <span className={styles.strengthLabel}>
              {isAccrual
                ? t('mechanisms.conviction.maxStrength', 'Maximum strength: {strength}', {
                  strength: formatStrength(selectedCap),
                })
                : t('mechanisms.conviction.legacyStrength', 'Current strength: {strength} (applied immediately)', {
                  strength: formatStrength(selectedCap),
                })}
            </span>
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.stakeBtn}
              onClick={handleStake}
              disabled={submitting || (editing && myStake?.duration === duration)}
            >
              {submitting
                ? t('mechanisms.conviction.backing', 'Backing…')
                : editing
                  ? t('mechanisms.conviction.saveChange', 'Save change')
                  : t('mechanisms.conviction.back', 'Back this')}
            </button>
            {editing && (
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setEditing(false)}
                disabled={submitting}
              >
                {t('common.cancel', 'Cancel')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Community aggregate */}
      <div className={styles.aggregate}>
        <h4 className={styles.sectionTitle}>
          <TrendingUp size={16} /> {t('mechanisms.conviction.communityTitle', 'Community backing')}
        </h4>
        <div className={styles.aggregateStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalConviction.count}</span>
            <span className={styles.statLabel}>{t('mechanisms.conviction.backers', 'Backers')}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatStrength(totalConviction.total)}</span>
            <span className={styles.statLabel}>{t('mechanisms.conviction.combinedStrength', 'Combined strength')}</span>
          </div>
        </div>

        {/* Country breakdown — felt transnational collaboration. */}
        {Object.keys(countryBreakdown).length > 0 && (
          <div className={styles.countryBreakdown}>
            {Object.entries(countryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([country, weight]) => (
                <div key={country} className={styles.countryRow}>
                  <span className={styles.countryName}>
                    <CountryFlag code={country} showName size="sm" />
                  </span>
                  <div className={styles.countryBar}>
                    <div
                      className={styles.countryFill}
                      style={{
                        width: `${(weight / maxConviction) * 100}%`,
                        backgroundColor: getCountryColor(country),
                      }}
                    />
                  </div>
                  <span className={styles.countryWeight}>{formatStrength(weight)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvictionStaking;
