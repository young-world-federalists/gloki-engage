import React, { useState } from 'react';
import { User, Building2, Server, type LucideIcon } from 'lucide-react';
import { GlokiMark, LanguageSwitcher } from '../../components/shared';
import { useT } from '../../i18n';
import type { AccountKind } from '../../services/interfaces';
import { getBetaDoor, setBetaDoor } from '../../components/onboarding/betaDoor';
import { ACCOUNT_KINDS, accountKindLabel } from '../../components/onboarding/accountKinds';
import LoginPage from '../LoginPage';
import styles from './BetaDoorsPage.module.scss';

const DOOR_ICONS: Record<AccountKind, LucideIcon> = {
  person: User,
  organisation: Building2,
  contributor: Server,
};

/**
 * S42 — the beta's first screen, shown in place of the login page while the
 * visitor is signed out. Two sentences on what Gloki is and three doors. Each
 * door records the choice (betaDoor.ts) and opens the keys screen, which is the
 * existing LoginPage trimmed for the beta; onboarding reads the choice back.
 */
const BetaDoorsPage: React.FC = () => {
  const t = useT();
  const [showKeys, setShowKeys] = useState(() => getBetaDoor() !== null);

  const choose = (kind: AccountKind | null) => {
    setBetaDoor(kind);
    setShowKeys(true);
  };

  if (showKeys) {
    return (
      <LoginPage
        onBack={() => {
          setBetaDoor(null);
          setShowKeys(false);
        }}
      />
    );
  }

  const doorHints: Record<AccountKind, string> = {
    person: t('beta.doors.person.hint', 'One account, vouched for by people who know you.'),
    organisation: t('beta.doors.organisation.hint', 'Speak for a group. Declared, not checked, in this test.'),
    contributor: t('beta.doors.contributor.hint', 'Host a small server that keeps a copy of the network.'),
  };
  const doorLabels: Record<AccountKind, string> = {
    person: t('beta.doors.person', 'Join as a person'),
    organisation: t('beta.doors.organisation', 'Join as an organisation'),
    contributor: t('beta.doors.contributor', 'Contribute a node'),
  };

  return (
    <div className={styles.page}>
      <main id="main" className={styles.card}>
        <div className={styles.langRow}>
          <LanguageSwitcher />
        </div>
        <div className={styles.hero} aria-hidden>
          <GlokiMark size={56} />
        </div>
        <h1 className={styles.title}>{t('beta.doors.title', 'Gloki')}</h1>
        <p className={styles.lead}>
          {t(
            'beta.doors.lead1',
            'Gloki is a network of people who vouch for each other, with a key instead of a password and no company in the middle.',
          )}
        </p>
        <p className={styles.lead}>
          {t(
            'beta.doors.lead2',
            'This test version is the network only: get a key, have people who know you vouch for you, and talk in one shared forum.',
          )}
        </p>

        <div className={styles.doors} role="group" aria-label={t('beta.doors.groupLabel', 'How do you want to join?')}>
          {ACCOUNT_KINDS.map((kind) => {
            const Icon = DOOR_ICONS[kind];
            return (
              <button key={kind} type="button" className={styles.door} onClick={() => choose(kind)}>
                <Icon size={24} aria-hidden className={styles.doorIcon} />
                <span className={styles.doorText}>
                  <span className={styles.doorTitle}>{doorLabels[kind]}</span>
                  <span className={styles.doorHint}>{doorHints[kind]}</span>
                </span>
                <span className={styles.srOnly}>{accountKindLabel(t, kind)}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className={styles.signIn} onClick={() => choose(null)}>
          {t('beta.doors.haveKey', 'I already have a key')}
        </button>
      </main>
    </div>
  );
};

export default BetaDoorsPage;
