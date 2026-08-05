import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ScrollText, ArrowRight } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { Badge, CountryFlag, EmptyState } from '../components/shared';
import { useAllInitiatives } from '../hooks/useAllInitiatives';
import { useOrganization } from '../hooks/useOrganization';
import { useI18n } from '../i18n';
import cs from './Container.module.scss';
import styles from './OrganizationHome.module.scss';

/**
 * S33 — the organization's whole app.
 *
 * An organization signs in to do exactly one thing: respond to mandates that
 * communities have already decided. So this lists finished mandates and nothing
 * else — no problems to weigh in on, no solutions to back, no ballots. They can
 * still open and read any of it; they just can't act on it (see `StageGate`).
 *
 * The list is built from `useAllInitiatives`, which is READ-ONLY (`contractRead`
 * + community thunks). It deliberately does NOT use `useMandate`: that hook
 * resolves two stage contracts in shared mode and DEPLOYS them when they're
 * missing, so calling it once per row would write a contract per listed mandate.
 */
const OrganizationHome: React.FC = () => {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { organization } = useOrganization();
  const { initiatives, isLoading } = useAllInitiatives();

  const mandates = useMemo(
    () => initiatives.filter((i) => i.stage === 'mandate'),
    [initiatives],
  );

  const orgTypeLabel = (type: string): string => {
    switch (type) {
      case 'government': return t('mandate.typeGov', 'Government');
      case 'ngo': return t('mandate.typeNgo', 'NGO');
      case 'academic': return t('mandate.typeAcademic', 'Academic');
      case 'intergov': return t('mandate.typeIntergov', 'International body');
      default: return t('mandate.typeYouth', 'Youth network');
    }
  };

  return (
    <div className={cs.container}>
      <AppHeader
        title={t('org.home.title', 'Mandates to act on')}
        subtitle={t(
          'org.home.subtitle',
          'Communities have decided these. Endorse the ones you stand behind, or subscribe to act on one and report your progress.',
        )}
      />

      <main id="main" tabIndex={-1} className={cs.content}>
        <div className={cs.main}>
          {organization && (
            <section className={styles.identity} aria-label={t('org.home.signedInAs', 'Signed in as')}>
              <Building2 size={20} aria-hidden className={styles.identityIcon} />
              <div className={styles.identityText}>
                <p className={styles.orgName}>{organization.name}</p>
                <p className={styles.orgMeta}>
                  <span>{orgTypeLabel(organization.type)}</span>
                  {organization.country && (
                    <>
                      <span aria-hidden>·</span>
                      <CountryFlag code={organization.country} showName size="sm" />
                    </>
                  )}
                </p>
              </div>
              <Badge tone="info" size="sm">{t('org.badge', 'Organization')}</Badge>
            </section>
          )}

          {mandates.length === 0 ? (
            <EmptyState
              icon={<ScrollText size={32} aria-hidden />}
              title={
                isLoading
                  ? t('org.home.loading', 'Looking for finished mandates…')
                  : t('org.home.emptyTitle', 'No finished mandates yet')
              }
              message={
                isLoading
                  ? undefined
                  : t(
                      'org.home.emptyBody',
                      'When a community finishes deliberating and ratifies a mandate, it appears here for organizations to endorse.',
                    )
              }
            />
          ) : (
            <ul className={styles.list}>
              {mandates.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={styles.card}
                    onClick={() => navigate(`/mandate/${m.communityId}/${m.id}`)}
                  >
                    <span className={styles.cardEyebrow}>
                      <ScrollText size={14} aria-hidden />
                      {m.communityName}
                    </span>
                    <span className={styles.cardTitle}>{m.title}</span>
                    {m.description && <span className={styles.cardBody}>{m.description}</span>}
                    <span className={styles.cardCta}>
                      {t('org.home.openMandate', 'Read it and respond')}
                      <ArrowRight size={16} aria-hidden />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className={styles.footnote}>
            {t(
              'org.home.footnote',
              'Organizations don’t take part in deliberation or voting — that stays one person, one vote. You can read everything; you act only on finished mandates.',
            )}
          </p>
          <p className={styles.footnote} lang={locale}>
            {t('org.home.browse', 'You can still browse communities and follow how a mandate was reached.')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default OrganizationHome;
