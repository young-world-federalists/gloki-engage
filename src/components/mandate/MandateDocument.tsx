import React, { useMemo, useState } from 'react';
import { FileText, Code2, Copy, Check, CalendarCheck, Vote, ChevronDown } from 'lucide-react';
import { Badge, SegmentedControl, InfoDisclosure } from '../shared';
import { useI18n } from '../../i18n';
import type { PublishedMandate } from '../../services/demo/fixtures/mandate';
import styles from './MandateDocument.module.scss';

type MandateView = 'plain' | 'spec';

/** "2026-04-18" → a long date in the active locale (raw value on a bad date). */
function formatRatifiedDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Static, honest platform-level Sybil-resistance statement (English in the spec;
 *  the on-screen copy is i18n'd — see mandate.verification.* keys). Mirrors the
 *  web-of-trust / one-person-one-vote copy in IdentityTrust + VoteExplainer. */
const VERIFICATION_STATEMENT =
  'One person, one vote. Gloki keeps the electorate real through a community web of trust — ' +
  'members vouch for one another in person by scanning QR codes. No ID papers, no biometrics, ' +
  'no face scans are collected, and no one can buy extra influence.';

function turnoutPct(voters: number, eligible: number): number {
  return eligible > 0 ? Math.round((voters / eligible) * 100) : 0;
}

/** The structured, machine-readable projection of the mandate. */
function buildSpec(mandate: PublishedMandate) {
  return {
    id: mandate.id,
    title: mandate.title,
    version: mandate.specVersion,
    status: mandate.status,
    ratified_on: mandate.ratifiedOn,
    jurisdictions: mandate.countries,
    articles: mandate.articles.map((a) => ({ id: a.id, title: a.title, commitment: a.body })),
    indicators: mandate.indicators.map((i) => ({
      metric: i.label,
      target: i.target,
      baseline: i.baseline ?? '',
      cadence: i.cadence ?? '',
    })),
    provenance: {
      participants: mandate.provenance.participants,
      countries: mandate.provenance.countries,
      deliberation_months: mandate.provenance.deliberationMonths,
      vote_winner: mandate.provenance.voteWinner,
      conviction_backers: mandate.provenance.convictionBackers,
      turnout: {
        voters: mandate.provenance.voters,
        eligible: mandate.provenance.eligible,
        percent: turnoutPct(mandate.provenance.voters, mandate.provenance.eligible),
      },
      verification: VERIFICATION_STATEMENT,
    },
    adoption: {
      endorsements: mandate.adopters.filter((a) => a.level === 'endorsed').length,
      subscriptions: mandate.adopters.filter((a) => a.level === 'subscribed').length,
      claimed: mandate.adopters.filter((a) => !a.verified).length,
      verified: mandate.adopters.filter((a) => a.verified).length,
    },
  };
}

interface MandateDocumentProps {
  mandate: PublishedMandate;
}

/**
 * E1 — the published Mandate artifact. A credible, institution-grade document
 * with a plain-language reading and a machine-readable spec projection, framed
 * by a provenance strip that shows the mandate was *earned* through
 * deliberation, the vote, and sustained conviction — not merely asserted.
 */
const MandateDocument: React.FC<MandateDocumentProps> = ({ mandate }) => {
  const { t, locale } = useI18n();
  const [view, setView] = useState<MandateView>('plain');
  const [copied, setCopied] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);

  const specJson = useMemo(() => JSON.stringify(buildSpec(mandate), null, 2), [mandate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(specJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked (insecure context) — leave the spec on screen to copy by hand */
    }
  };

  const ratified = formatRatifiedDate(mandate.ratifiedOn, locale);

  return (
    <article className={styles.document} aria-label={t('mandate.docLabel', 'Published mandate')}>
      {/* One brand label everywhere (S23): the same "Gloki Mandate" the hero
          card leads with — not a second name ("A global community mandate"). The
          participants / countries / conviction stats + the provenance line lived
          here AND in the hero card above; dropped as dups so the document reads as
          the formal text (title → who ratified → the commitments), not a second
          stats card. */}
      <header className={styles.masthead}>
        <div className={styles.eyebrowRow}>
          <p className={styles.eyebrow}>{t('mandate.card.brand', 'Gloki Mandate')}</p>
          {mandate.status === 'ratified' ? (
            <Badge tone="success" size="sm">{t('mandate.statusRatified', 'Ratified')}</Badge>
          ) : (
            <Badge tone="warning" size="sm">{t('mandate.statusPending', 'Pending ratification')}</Badge>
          )}
        </div>
        <h2 className={styles.title}>{mandate.title}</h2>
        {/* The date only exists once ratification has happened — showing it next to a
            "Pending ratification" badge contradicted the badge (S17). Now on its own line
            under the title; the status badge sits top-right in the eyebrow row (S32 F3). */}
        {mandate.status === 'ratified' && (
          <span className={styles.ratified}>
            <CalendarCheck size={14} aria-hidden />
            {t('mandate.ratifiedOn', 'Ratified {date}', { date: ratified })}
          </span>
        )}
      </header>

      {view === 'plain' && (
        <div className={styles.plain}>
          <p className={styles.preamble}>{mandate.preamble}</p>

          <section className={styles.section} aria-labelledby="mandate-commitments">
            <h2 id="mandate-commitments" className={styles.sectionTitle}>
              {t('mandate.commitmentsTitle', 'What we commit to')}
            </h2>
            <ol className={styles.articles}>
              {mandate.articles.map((a) => (
                <li key={a.id} className={styles.article}>
                  {a.title && <h3 className={styles.articleTitle}>{a.title}</h3>}
                  <p className={styles.articleBody}>{a.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.section} aria-labelledby="mandate-indicators">
            <h2 id="mandate-indicators" className={styles.sectionTitle}>
              <button
                type="button"
                className={styles.discloseToggle}
                aria-expanded={showIndicators}
                aria-controls="mandate-indicators-panel"
                onClick={() => setShowIndicators((v) => !v)}
              >
                {t('mandate.indicatorsTitle', 'How we’ll know it’s working')}
                <ChevronDown
                  size={18}
                  aria-hidden
                  className={`${styles.chevron}${showIndicators ? ` ${styles.chevronOpen}` : ''}`}
                />
              </button>
            </h2>
            <div id="mandate-indicators-panel" hidden={!showIndicators}>
              <dl className={styles.indicators}>
              {mandate.indicators.map((ind) => (
                <div key={ind.label} className={styles.indicator}>
                  <dt className={styles.indicatorLabel}>{ind.label}</dt>
                  {/* Always emit the <dd> (a pending placeholder when there's no
                      target) so every <dt> has its required pair and the <dl>
                      stays well-formed. */}
                  <dd className={styles.indicatorTarget}>
                    {ind.target || t('mandate.indicatorPending', 'Target not yet set')}
                    {(ind.baseline || ind.cadence) && (
                      <span className={styles.indicatorMeta}>
                        {ind.baseline && (
                          <span className={styles.indicatorMetaItem}>
                            {t('mandate.indicatorBaseline', 'From {baseline}', { baseline: ind.baseline })}
                          </span>
                        )}
                        {ind.cadence && (
                          <span className={styles.indicatorMetaItem}>
                            {t('mandate.indicatorCadence', 'Measured {cadence}', { cadence: ind.cadence })}
                          </span>
                        )}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
              </dl>
            </div>
          </section>
        </div>
      )}

      {view === 'spec' && (
        <div className={styles.spec}>
          <div className={styles.specBar}>
            <span className={styles.specName}>
              <Code2 size={14} aria-hidden /> mandate.spec.json · v{mandate.specVersion}
            </span>
            <button type="button" className={styles.copyBtn} onClick={handleCopy}>
              {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
              {copied ? t('mandate.copied', 'Copied') : t('mandate.copyJson', 'Copy JSON')}
            </button>
          </div>
          <pre
            className={styles.specCode}
            tabIndex={0}
            aria-label={t('mandate.specCodeLabel', 'Machine-readable mandate specification')}
          >
            {specJson}
          </pre>
          <p className={styles.specNote}>
            {t(
              'mandate.specNote',
              'A structured version institutions can ingest, validate, and track against.',
            )}
          </p>
          <span className={styles.srStatus} role="status" aria-live="polite">
            {copied ? t('mandate.copied', 'Copied') : ''}
          </span>
        </div>
      )}

      {/* Provenance chin (S32 F4/F5, D7): the turnout line + Sybil-resistance (i) and the
          plain/spec view toggle sit in the document card's two-tone chin. Trade-off accepted:
          the toggle now follows the content it swaps (reverses W4 4.7's turnout-up-high). */}
      <div className={styles.provChin}>
        <div className={styles.turnout}>
          <Vote size={16} aria-hidden className={styles.turnoutIcon} />
          <p className={styles.turnoutText}>
            {t('mandate.turnoutLine', '{voters} of {eligible} eligible members voted ({pct}%)', {
              voters: mandate.provenance.voters.toLocaleString(),
              eligible: mandate.provenance.eligible.toLocaleString(),
              pct: turnoutPct(mandate.provenance.voters, mandate.provenance.eligible),
            })}
          </p>
          <InfoDisclosure
            label={t('mandate.verification.title', 'How we keep the vote real')}
            className={styles.verifyInfo}
          >
            <p>{t('mandate.verification.body', VERIFICATION_STATEMENT)}</p>
          </InfoDisclosure>
        </div>

        <SegmentedControl<MandateView>
          ariaLabel={t('mandate.viewToggle', 'Mandate view')}
          fullWidth
          value={view}
          onChange={setView}
          options={[
            {
              value: 'plain',
              label: t('mandate.viewPlain', 'Plain language'),
              icon: <FileText size={16} />,
            },
            {
              value: 'spec',
              label: t('mandate.viewSpec', 'Machine-readable spec'),
              icon: <Code2 size={16} />,
            },
          ]}
        />
      </div>
    </article>
  );
};

export default MandateDocument;
