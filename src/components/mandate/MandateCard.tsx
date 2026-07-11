import React, { useState } from 'react';
import { ShieldCheck, Heart, Share2, ArrowRight } from 'lucide-react';
import { Button, Badge } from '../shared';
import { useI18n } from '../../i18n';
import { getCountryName } from '../../utils/countries';
import type { PublishedMandate } from '../../services/demo/fixtures/mandate';
import styles from './MandateCard.module.scss';

/** The scroll target id MandatePage puts on the full document. */
export const MANDATE_DOC_ANCHOR_ID = 'mandate-document';

/** ISO alpha-2 → flag emoji (regional indicator pair). */
function flagOf(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + (code.toUpperCase().charCodeAt(0) - 65),
    base + (code.toUpperCase().charCodeAt(1) - 65),
  );
}

const COUNTRY_PREVIEW = 4;

export interface MandateCardProps {
  mandate: PublishedMandate;
  /** Route ids — used to build a clean, pubkey-free share link (S11 P2). */
  communityId: string;
  mandateId: string;
  /** Primary CTA → the initiative's mandate stage where conviction staking lives. */
  onShowSupport: () => void;
  /** "View full" → scroll/route to the full published document. */
  onViewFull: () => void;
}

/**
 * The scannable, shareable hero atop the published mandate. One label-left list:
 * the problem, the winning solution (the mandate), and its provenance (reach,
 * jurisdiction, conviction). The primary action drives engagement (conviction),
 * not reading; the full document is one understated "View full" away.
 */
const MandateCard: React.FC<MandateCardProps> = ({ mandate, communityId, mandateId, onShowSupport, onViewFull }) => {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const { provenance } = mandate;

  const share = async () => {
    // Route by community + initiative ids only — never leak the pubkey that rides
    // in the /initiative/:host/:agent/… path (S11 P2). BrowserRouter basename =
    // import.meta.env.BASE_URL; the /mandate/:communityId/:mandateId route resolves
    // without any key.
    const base = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL.slice(0, -1)
      : import.meta.env.BASE_URL;
    const url = `${window.location.origin}${base}/mandate/${communityId}/${mandateId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: mandate.title, text: mandate.problem, url });
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked (insecure context) */
    }
  };

  const countries = mandate.countries;
  const shown = showAllCountries ? countries : countries.slice(0, COUNTRY_PREVIEW);

  return (
    <section className={styles.card} aria-label={t('mandate.card.aria', 'Mandate summary')}>
      <div className={styles.eyebrow}>
        <ShieldCheck size={15} aria-hidden className={styles.eyebrowIcon} />
        <span className={styles.brand}>{t('mandate.card.brand', 'Gloki Mandate')}</span>
        {mandate.status !== 'ratified' && (
          <Badge tone="warning" size="sm" className={styles.pending}>
            {t('mandate.statusPending', 'Pending ratification')}
          </Badge>
        )}
      </div>

      <h1 className={styles.title}>{mandate.title}</h1>

      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt className={styles.rowLabel}>{t('mandate.card.problemLabel', 'Problem')}</dt>
          <dd className={`${styles.rowValue} ${styles.problem}`}>{mandate.problem}</dd>
        </div>

        <div className={`${styles.row} ${styles.mandateRow}`}>
          <dt className={styles.rowLabel}>
            <span>{t('mandate.card.mandateLabel', 'Mandate')}</span>
            <button type="button" className={styles.linkBtn} onClick={onViewFull}>
              {t('mandate.card.viewFull', 'View full')}
              <ArrowRight size={16} aria-hidden />
            </button>
          </dt>
          <dd className={styles.rowValue}>
            <span className={styles.solBox}>{provenance.voteWinner}</span>
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.rowLabel}>{t('mandate.card.reachLabel', 'Reach')}</dt>
          <dd className={styles.rowValue}>
            {t('mandate.card.reachValue', '{people} people across {countries} countries', {
              people: provenance.participants.toLocaleString(),
              countries: provenance.countries,
            })}
            <span className={styles.note}>{t('mandate.card.reachNote', 'over a year of open deliberation')}</span>
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.rowLabel}>{t('mandate.card.jurisdictionLabel', 'Jurisdiction')}</dt>
          <dd className={styles.rowValue}>
            <ul className={styles.countries}>
              {shown.map((c) => (
                <li key={c} className={styles.country}>
                  <span className={styles.flag} aria-hidden>{flagOf(c)}</span>
                  {getCountryName(c, locale)}
                </li>
              ))}
            </ul>
            {countries.length > COUNTRY_PREVIEW && (
              <button type="button" className={styles.linkBtn} onClick={() => setShowAllCountries((v) => !v)}>
                {showAllCountries
                  ? t('mandate.card.viewLess', 'View less')
                  : t('mandate.card.viewAll', 'View all')}
                <ArrowRight size={16} aria-hidden />
              </button>
            )}
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.rowLabel}>{t('mandate.card.convictionLabel', 'Conviction')}</dt>
          <dd className={styles.rowValue}>
            {t('mandate.card.convictionValue', 'Backed by {n}', { n: provenance.convictionBackers.toLocaleString() })}
            <span className={styles.note}>{t('mandate.card.convictionNote', 'in sustained conviction')}</span>
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Button variant="primary" size="md" className={styles.supportBtn} leftIcon={<Heart size={16} aria-hidden />} onClick={onShowSupport}>
          {t('mandate.card.showSupport', 'Back this mandate')}
        </Button>
        <Button variant="secondary" size="md" className={styles.shareBtn} leftIcon={<Share2 size={16} aria-hidden />} onClick={share}>
          {copied ? t('mandate.copied', 'Copied') : t('mandate.card.share', 'Share')}
        </Button>
      </div>
      <span className={styles.srStatus} role="status" aria-live="polite">
        {copied ? t('mandate.card.copiedStatus', 'Link copied to clipboard') : ''}
      </span>
    </section>
  );
};

export default MandateCard;
