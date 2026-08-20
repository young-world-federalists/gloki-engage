import React from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import ErrorBoundary from '../shared/ErrorBoundary';
import ConvictionStaking from '../collaboration/flows/voting/ConvictionStaking';
import StageGate from '../community/StageGate';
import { useT } from '../../i18n';
import { useOrganization } from '../../hooks/useOrganization';
import styles from './MandateBacking.module.scss';

export interface MandateBackingProps {
  /** The initiative contract id — the mandate route's `:mandateId` (same value). */
  mandateId: string;
  /** Owning community — needed to apply the same stage permissions the community page applies. */
  communityId: string;
  /** How many people are backing this — the LIVE count, resolved by the page. */
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
const MandateBacking: React.FC<MandateBackingProps> = ({ mandateId, communityId, backers, expanded, onToggle }) => {
  const t = useT();
  const { isOrganization } = useOrganization();
  const panelId = 'mandate-backing-panel';

  // S33 — backing is a person's act (one commitment each, weighted only by time).
  // An organization's way of standing behind a mandate is endorsing or
  // subscribing, just below. Show the count, not the control.
  if (isOrganization) {
    return (
      <section className={styles.backing} aria-labelledby="backing-heading">
        <header className={styles.header}>
          <div className={styles.headingRow}>
            <Heart size={20} aria-hidden className={styles.headingIcon} />
            <h2 id="backing-heading" className={styles.heading}>
              {t('mandate.backing.title', 'Back this mandate')}
            </h2>
          </div>
        </header>
        <p className={styles.summary}>
          {t('mandate.backing.count', '{n} people are backing this mandate', { n: backers.toLocaleString() })}
        </p>
        <p className={styles.orgNote}>
          {t(
            'mandate.backing.orgNote',
            'Backing is how individual people sustain a mandate. Your organization stands behind it by endorsing or subscribing below.',
          )}
        </p>
      </section>
    );
  }

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
        {/* Mount only when open — see the deploy note above.
            StageGate is NOT optional here: the community-page path wraps the
            identical control (`MandateEngage` → StageGate stage="mandate"), and
            the mandate stage defaults to 'verified'. Without this, opening the
            published mandate would be an ungated route to a gated action. */}
        {expanded && (
          <ErrorBoundary fallbackMessage={t('mandate.stakeError', 'Conviction staking encountered an error.')}>
            <StageGate communityId={communityId} stage="mandate">
              <ConvictionStaking
                instanceId={`${mandateId}_conviction`}
                parentContractId={mandateId}
                stageKey="convictionContractId"
              />
            </StageGate>
          </ErrorBoundary>
        )}
      </div>
    </section>
  );
};

export default MandateBacking;
