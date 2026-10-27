import React, { useState } from 'react';
import { User, Building2, Server, type LucideIcon } from 'lucide-react';
import { Button } from '../../shared';
import { useT } from '../../../i18n';
import type { AccountKind } from '../../../services/interfaces';
import { ACCOUNT_KINDS, accountKindLabel } from '../accountKinds';
import styles from './steps.module.scss';

interface Props {
  value: AccountKind | null;
  onContinue: (kind: AccountKind) => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  /** S43: true when `value` came from the doors page, so the lead says so. */
  fromDoor?: boolean;
}

const KIND_ICONS: Record<AccountKind, LucideIcon> = {
  person: User,
  organisation: Building2,
  contributor: Server,
};

/**
 * S42 — which of three things this account is. Preselected from the door the
 * newcomer chose; the paragraph under the cards says what each kind means in
 * this test. Contributor has no node runtime to point at, so choosing it only
 * records interest (the stored `accountKind`), nothing more.
 */
const KindStep: React.FC<Props> = ({ value, onContinue, onBack, headingRef, fromDoor }) => {
  const t = useT();
  const [kind, setKind] = useState<AccountKind | null>(value);

  const descriptions: Record<AccountKind, string> = {
    person: t('beta.kind.person.desc', 'One account for one person.'),
    organisation: t('beta.kind.organisation.desc', 'An account that speaks for a group.'),
    contributor: t('beta.kind.contributor.desc', 'Someone who hosts a node for the network.'),
  };
  const notes: Record<AccountKind, string> = {
    person: t(
      'beta.kind.person.note',
      'People who know you vouch for you. That, and nothing you pay or upload, is what makes your voice count.',
    ),
    organisation: t(
      'beta.kind.organisation.note',
      'In this test an organisation is declared, not checked: you say who you are, and nothing verifies it yet.',
    ),
    contributor: t(
      'beta.kind.contributor.note',
      'A node is a small server that keeps a copy of the network, so no single company holds it. The node software is not ready yet. Choosing this records your interest, and we will tell you when there is something to run.',
    ),
  };

  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('beta.kind.title', 'Who is this account for?')}
      </h1>
      <p className={styles.lead}>
        {fromDoor
          ? t('beta.kind.leadDoor', 'You chose this at the door. Change it if it is not right, or later from your profile.')
          : t('beta.kind.lead', 'Pick the one that fits. You can change it later from your profile.')}
      </p>

      <div className={styles.kindList} role="radiogroup" aria-label={t('beta.kind.title', 'Who is this account for?')}>
        {ACCOUNT_KINDS.map((k) => {
          const Icon = KIND_ICONS[k];
          const on = kind === k;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              className={`${styles.kindCard} ${on ? styles.kindCardOn : ''}`}
              onClick={() => setKind(k)}
            >
              <Icon size={22} aria-hidden className={styles.kindIcon} />
              <span className={styles.kindText}>
                <span className={styles.kindTitle}>{accountKindLabel(t, k)}</span>
                <span className={styles.kindDesc}>{descriptions[k]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {kind && <p className={styles.kindNote}>{notes[kind]}</p>}

      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={() => kind && onContinue(kind)} disabled={!kind}>
          {t('common.continue', 'Continue')}
        </Button>
        <div className={styles.secondaryActions}>
          <Button variant="ghost" onClick={onBack}>
            {t('common.back', 'Back')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default KindStep;
