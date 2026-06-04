import React, { useState } from 'react';
import { ShieldCheck, Globe2, Flame, Share2, ArrowDown, CalendarCheck } from 'lucide-react';
import { Badge, Button, CountryPresence } from '../shared';
import { useT } from '../../i18n';
import JourneyRecap from './JourneyRecap';
import type { PublishedMandate } from '../../services/demo/fixtures/mandate';
import styles from './MandateCard.module.scss';

/** The scroll target id MandatePage puts on the full document (B2 keeps in sync). */
export const MANDATE_DOC_ANCHOR_ID = 'mandate-document';

function formatRatifiedOn(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export interface MandateCardProps {
  mandate: PublishedMandate;
}

/**
 * The scannable, shareable hero atop the published mandate: what the community
 * decided, and why it's legitimate, at a glance. Three trust signals are shown
 * as visibly distinct things — Reach (transnational), Mandate (verified + one
 * person, one vote), and Conviction (sustained staking) — so time-weighted
 * conviction never reads as weighted voting. Pure UI over the existing mandate.
 */
const MandateCard: React.FC<MandateCardProps> = ({ mandate }) => {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const { provenance } = mandate;

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: mandate.title, text: mandate.subtitle, url });
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

  const readFull = () => {
    const el = document.getElementById(MANDATE_DOC_ANCHOR_ID);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className={styles.card} aria-label={t('mandate.card.aria', 'Mandate summary')}>
      <div className={styles.eyebrowRow}>
        <span className={styles.eyebrow}>{mandate.subtitle}</span>
        <Badge tone="success" size="sm">
          <ShieldCheck size={12} aria-hidden /> {t('mandate.card.ratified', 'Ratified')}
        </Badge>
      </div>
      <p className={styles.ratifiedOn}>
        <CalendarCheck size={13} aria-hidden />
        {t('mandate.card.ratifiedOn', 'Ratified {date}', { date: formatRatifiedOn(mandate.ratifiedOn) })}
      </p>

      <h1 className={styles.title}>{mandate.title}</h1>

      <div className={styles.decided}>
        <span className={styles.decidedLabel}>{t('mandate.card.decided', 'What we decided')}</span>
        <p className={styles.decidedText}>{provenance.voteWinner}</p>
      </div>

      {/* Three legitimacy signals — never conflated. */}
      <div className={styles.signals}>
        <div className={styles.signal}>
          <span className={styles.signalIcon}><Globe2 size={18} aria-hidden /></span>
          <span className={styles.signalLabel}>{t('mandate.card.reachLabel', 'Reach')}</span>
          <span className={styles.signalValue}>
            {t('mandate.card.reachValue', '{people} people · {countries} countries', {
              people: provenance.participants.toLocaleString(),
              countries: provenance.countries,
            })}
          </span>
          <CountryPresence countries={mandate.countries} size="sm" max={5} className={styles.signalFlags} />
        </div>

        <div className={styles.signal}>
          <span className={styles.signalIcon}><ShieldCheck size={18} aria-hidden /></span>
          <span className={styles.signalLabel}>{t('mandate.card.mandateLabel', 'Mandate')}</span>
          <span className={styles.signalValue}>{t('mandate.card.mandateValue', 'Decided by verified members')}</span>
          <span className={styles.signalNote}>{t('mandate.card.oneVote', 'One person, one vote')}</span>
        </div>

        <div className={styles.signal}>
          <span className={styles.signalIcon}><Flame size={18} aria-hidden /></span>
          <span className={styles.signalLabel}>{t('mandate.card.convictionLabel', 'Conviction')}</span>
          <span className={styles.signalValue}>
            {t('mandate.card.convictionValue', 'Backed by {n}', { n: provenance.convictionBackers.toLocaleString() })}
          </span>
          <span className={styles.signalNote}>{t('mandate.card.convictionNote', 'in sustained conviction')}</span>
        </div>
      </div>

      {/* The journey that produced it. */}
      <JourneyRecap compact />

      <div className={styles.actions}>
        <Button variant="primary" leftIcon={<Share2 size={16} aria-hidden />} onClick={share}>
          {copied ? t('mandate.copied', 'Copied') : t('mandate.card.share', 'Share')}
        </Button>
        <Button variant="secondary" rightIcon={<ArrowDown size={16} aria-hidden />} onClick={readFull}>
          {t('mandate.card.readFull', 'Read the full mandate')}
        </Button>
      </div>
      <span className={styles.srStatus} role="status" aria-live="polite">
        {copied ? t('mandate.card.copiedStatus', 'Link copied to clipboard') : ''}
      </span>
    </section>
  );
};

export default MandateCard;
