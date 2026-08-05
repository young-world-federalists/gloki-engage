import React from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import ErrorBoundary from '../shared/ErrorBoundary';
import ConvictionStaking from '../collaboration/flows/voting/ConvictionStaking';
import { useT } from '../../i18n';
import styles from './MandateBacking.module.scss';

export interface MandateBackingProps {
  /** The initiative contract id — the mandate route's `:mandateId` (same value). */
  mandateId: string;
  /** Backers already counted in the mandate's provenance, shown while collapsed. */
  backers: number;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * S33 — backing a mandate without leaving the mandate page.
 *
 * Before this, the hero's "Back this mandate" navigated to the community page and
 * relied on the initiative card auto-expanding into `MandateStage`. Same control,
 * three screens away.
 *
 * This is NOT a copy of that surface: `ConvictionStaking` resolves its contract in
 * shared mode from `parentContractId` + `stageKey`, and the mandate route's
 * `:mandateId` IS the initiative contract id — so the same `instanceId` triple
 * resolves the same contract here and on the community page. Backing in one place
 * shows in the other.
 *
 * **The staking control mounts only once expanded**, and that is load-bearing:
 * `useFlowContract` DEPLOYS a sub-contract when the parent has none registered, so
 * mounting it eagerly would make simply reading a published mandate write to the
 * chain. Expanding is a deliberate act — the same authorization the community page
 * has.
 */
const MandateBacking: React.FC<MandateBackingProps> = ({ mandateId, backers, expanded, onToggle }) => {
  const t = useT();
  const panelId = 'mandate-backing-panel';

  return (
    <section className={styles.backing} aria-labelledby="backing-heading">
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <Heart size={20} aria-hidden className={styles.headingIcon} />
          <h2 id="backing-heading" className={styles.heading}>
            {t('mandate.backing.title', 'Back this mandate')}
          </h2>
        </div>
        <p className={styles.intro}>
          {t(
            'mandate.backing.intro',
            'Backing is how people keep standing behind a mandate after the vote — the longer you commit, the more your support counts.',
          )}
        </p>
      </header>

      {/* The number stays visible while the control folds (DESIGN_SYSTEM
          disclosure rule: prose folds, numbers don't). */}
      <p className={styles.summary}>
        {t('mandate.backing.count', '{n} people are backing this mandate', {
          n: backers.toLocaleString(),
        })}
      </p>

      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        {expanded
          ? t('mandate.backing.hide', 'Hide backing')
          : t('mandate.backing.show', 'Add or change your backing')}
        <ChevronDown
          size={18}
          aria-hidden
          className={`${styles.chevron}${expanded ? ` ${styles.chevronOpen}` : ''}`}
        />
      </button>

      <div id={panelId} className={styles.panel} hidden={!expanded}>
        {/* Mount only when open — see the deploy note above. */}
        {expanded && (
          <ErrorBoundary fallbackMessage={t('mandate.stakeError', 'Conviction staking encountered an error.')}>
            <ConvictionStaking
              instanceId={`${mandateId}_conviction`}
              parentContractId={mandateId}
              stageKey="convictionContractId"
            />
          </ErrorBoundary>
        )}
      </div>
    </section>
  );
};

export default MandateBacking;
