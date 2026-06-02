import React, { useMemo, useState } from 'react';
import { FileText, Code2, Copy, Check, Globe, Users, TrendingUp, CalendarCheck } from 'lucide-react';
import { Badge, CountryPresence, SegmentedControl } from '../shared';
import { useT } from '../../i18n';
import type { PublishedMandate } from '../../services/demo/fixtures/mandate';
import styles from './MandateDocument.module.scss';

type MandateView = 'plain' | 'spec';

/** "2026-04-18" → "18 April 2026" (falls back to the raw value on a bad date). */
function formatRatifiedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
    indicators: mandate.indicators.map((i) => ({ metric: i.label, target: i.target })),
    provenance: {
      participants: mandate.provenance.participants,
      countries: mandate.provenance.countries,
      deliberation_months: mandate.provenance.deliberationMonths,
      vote_winner: mandate.provenance.voteWinner,
      conviction_backers: mandate.provenance.convictionBackers,
    },
    adoption: {
      endorsements: mandate.adopters.filter((a) => a.level === 'endorsed').length,
      subscriptions: mandate.adopters.filter((a) => a.level === 'subscribed').length,
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
  const t = useT();
  const [view, setView] = useState<MandateView>('plain');
  const [copied, setCopied] = useState(false);

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

  const ratified = formatRatifiedDate(mandate.ratifiedOn);

  return (
    <article className={styles.document} aria-label={t('mandate.docLabel', 'Published mandate')}>
      <header className={styles.masthead}>
        <p className={styles.eyebrow}>{mandate.subtitle}</p>
        <h1 className={styles.title}>{mandate.title}</h1>
        <div className={styles.metaRow}>
          <Badge tone="success" size="sm">
            {t('mandate.statusRatified', 'Ratified')}
          </Badge>
          <span className={styles.ratified}>
            <CalendarCheck size={14} aria-hidden />
            {t('mandate.ratifiedOn', 'Ratified {date}', { date: ratified })}
          </span>
        </div>
        <CountryPresence
          countries={mandate.countries}
          size="sm"
          label={t('mandate.jurisdictions', '{n} countries', { n: mandate.countries.length })}
        />
        <p className={styles.provenanceLine}>
          {t(
            'mandate.provenanceLine',
            'Deliberated by {participants} young people across {countries} countries over {months} months.',
            {
              participants: mandate.provenance.participants,
              countries: mandate.provenance.countries,
              months: mandate.provenance.deliberationMonths,
            },
          )}
        </p>
      </header>

      <ul className={styles.legitimacy} aria-label={t('mandate.legitimacyLabel', 'How this mandate was earned')}>
        <li className={styles.stat}>
          <Users size={16} aria-hidden className={styles.statIcon} />
          <span className={styles.statValue}>{mandate.provenance.participants}</span>
          <span className={styles.statLabel}>{t('mandate.statParticipants', 'participants')}</span>
        </li>
        <li className={styles.stat}>
          <Globe size={16} aria-hidden className={styles.statIcon} />
          <span className={styles.statValue}>{mandate.provenance.countries}</span>
          <span className={styles.statLabel}>{t('mandate.statCountries', 'countries')}</span>
        </li>
        <li className={styles.stat}>
          <TrendingUp size={16} aria-hidden className={styles.statIcon} />
          <span className={styles.statValue}>{mandate.provenance.convictionBackers}</span>
          <span className={styles.statLabel}>{t('mandate.statBackers', 'conviction backers')}</span>
        </li>
      </ul>

      <SegmentedControl<MandateView>
        ariaLabel={t('mandate.viewToggle', 'Mandate view')}
        fullWidth
        value={view}
        onChange={setView}
        options={[
          {
            value: 'plain',
            label: t('mandate.viewPlain', 'Plain language'),
            icon: <FileText size={15} />,
          },
          {
            value: 'spec',
            label: t('mandate.viewSpec', 'Machine-readable spec'),
            icon: <Code2 size={15} />,
          },
        ]}
      />

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
                  <h3 className={styles.articleTitle}>{a.title}</h3>
                  <p className={styles.articleBody}>{a.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.section} aria-labelledby="mandate-indicators">
            <h2 id="mandate-indicators" className={styles.sectionTitle}>
              {t('mandate.indicatorsTitle', 'How we’ll know it’s working')}
            </h2>
            <dl className={styles.indicators}>
              {mandate.indicators.map((ind) => (
                <div key={ind.label} className={styles.indicator}>
                  <dt className={styles.indicatorLabel}>{ind.label}</dt>
                  <dd className={styles.indicatorTarget}>{ind.target}</dd>
                </div>
              ))}
            </dl>
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
              {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
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
    </article>
  );
};

export default MandateDocument;
