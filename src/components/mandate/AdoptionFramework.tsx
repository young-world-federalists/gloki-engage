import React, { useEffect, useMemo, useState } from 'react';
import { HeartHandshake, Globe, Plus, ShieldCheck } from 'lucide-react';
import { Badge, Banner, Button, Modal, ProgressBar } from '../shared';
import { useI18n } from '../../i18n';
import type { TFunction } from '../../i18n';
import { getCountryFlag, getCountryName } from '../../utils/countries';
import {
  getAdopters,
  addEndorsement,
  type EndorsementInput,
} from './MandatePage.demo';
import type { AdopterType, AdoptionLevel, MandateAdopter } from '../../services/demo/fixtures/mandate';
import styles from './AdoptionFramework.module.scss';

const ADOPTER_TYPES: AdopterType[] = ['youth-network', 'government', 'ngo', 'academic', 'intergov'];

function typeLabel(type: AdopterType, t: TFunction): string {
  switch (type) {
    case 'youth-network':
      return t('mandate.typeYouth', 'Youth network');
    case 'government':
      return t('mandate.typeGov', 'Government');
    case 'ngo':
      return t('mandate.typeNgo', 'NGO');
    case 'academic':
      return t('mandate.typeAcademic', 'Academic');
    case 'intergov':
      return t('mandate.typeIntergov', 'International body');
  }
}

/** Format a fixture `since` value (ISO `YYYY-MM`) as a localized month + year. */
function formatSince(value: string, locale: string): string {
  const d = new Date(`${value}-01T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short' });
}

interface AdoptionFrameworkProps {
  /** Resolved mandate id (fixture key), e.g. "water". */
  mandateId: string;
}

/**
 * E2 — the adoption framework. Shows who has endorsed or subscribed to the
 * mandate and the progress they're reporting, and lets the viewer add their own
 * organization (optimistic, session-local) so the mandate→action loop is felt.
 */
const AdoptionFramework: React.FC<AdoptionFrameworkProps> = ({ mandateId }) => {
  const { t, locale } = useI18n();
  const [adopters, setAdopters] = useState<MandateAdopter[]>(() => getAdopters(mandateId));
  const [modalOpen, setModalOpen] = useState(false);
  const [justAddedName, setJustAddedName] = useState<string | null>(null);

  // Re-sync if the mandate changes (e.g. navigating between mandates).
  useEffect(() => {
    setAdopters(getAdopters(mandateId));
  }, [mandateId]);

  const summary = useMemo(() => {
    const endorsed = adopters.filter((a) => a.level === 'endorsed').length;
    const subscribed = adopters.filter((a) => a.level === 'subscribed').length;
    const countries = new Set(adopters.filter((a) => a.country).map((a) => a.country)).size;
    return { total: adopters.length, endorsed, subscribed, countries };
  }, [adopters]);

  const handleSubmit = (input: EndorsementInput) => {
    const added = addEndorsement(mandateId, input);
    setAdopters((prev) => [added, ...prev]);
    setJustAddedName(added.name);
    setModalOpen(false);
  };

  return (
    <section className={styles.adoption} aria-labelledby="adoption-heading">
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <HeartHandshake size={20} aria-hidden className={styles.headingIcon} />
          <h2 id="adoption-heading" className={styles.heading}>
            {t('mandate.adoptionTitle', 'From mandate to action')}
          </h2>
        </div>
        <p className={styles.intro}>
          {t(
            'mandate.adoptionIntro',
            'Organizations endorse the mandate, subscribe to act on it, and report their progress back to the community.',
          )}
        </p>
      </header>

      <div className={styles.summary}>
        <p className={styles.summaryHeadline}>
          {t('mandate.adoptionCount', '{n} organizations have adopted this mandate', {
            n: summary.total,
          })}
        </p>
        <p className={styles.summaryBreakdown}>
          {t(
            'mandate.adoptionBreakdown',
            '{endorsed} endorsing · {subscribed} subscribed and reporting · across {countries} {countryWord}',
            {
              endorsed: summary.endorsed,
              subscribed: summary.subscribed,
              countries: summary.countries,
              countryWord: t(
                summary.countries === 1 ? 'mandate.country.one' : 'mandate.country.other',
                summary.countries === 1 ? 'country' : 'countries',
              ),
            },
          )}
        </p>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} aria-hidden />}
          onClick={() => setModalOpen(true)}
        >
          {t('mandate.adoptCta', 'Endorse / adopt')}
        </Button>
      </div>

      {justAddedName && (
        <Banner
          tone="success"
          onDismiss={() => setJustAddedName(null)}
          dismissLabel={t('common.dismiss', 'Dismiss')}
          className={styles.thanks}
        >
          {t('mandate.adoptThanks', '{name} is now listed as a supporter of this mandate.', {
            name: justAddedName,
          })}
        </Banner>
      )}

      <ul className={styles.list}>
        {adopters.map((a) => (
          <AdopterCard key={a.id} adopter={a} t={t} locale={locale} />
        ))}
      </ul>

      <EndorseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        t={t}
      />
    </section>
  );
};

// ---------------------------------------------------------------------------

interface AdopterCardProps {
  adopter: MandateAdopter;
  t: TFunction;
  locale: string;
}

const AdopterCard: React.FC<AdopterCardProps> = ({ adopter, t, locale }) => {
  const isSubscribed = adopter.level === 'subscribed';
  const isViewer = adopter.id.startsWith('endorse-');
  const pct = Math.round((adopter.progress ?? 0) * 100);

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.orgMeta}>
          <span className={styles.orgName}>{adopter.name}</span>
          <span className={styles.orgSub}>
            <span className={styles.orgType}>{typeLabel(adopter.type, t)}</span>
            <span aria-hidden className={styles.dot}>
              ·
            </span>
            {adopter.country ? (
              <span className={styles.orgLoc}>
                <span aria-hidden>{getCountryFlag(adopter.country)}</span>{' '}
                {getCountryName(adopter.country, locale)}
              </span>
            ) : (
              <span className={styles.orgLoc}>
                <Globe size={12} aria-hidden /> {t('mandate.international', 'International')}
              </span>
            )}
          </span>
        </div>
        <div className={styles.badges}>
          {isViewer && (
            <Badge tone="primary" size="sm">
              {t('mandate.you', 'You')}
            </Badge>
          )}
          {adopter.verified ? (
            <Badge tone="success" size="sm">
              <ShieldCheck size={12} aria-hidden /> {t('mandate.verifiedAdopter', 'Verified')}
            </Badge>
          ) : (
            <Badge tone="neutral" size="sm">
              {t('mandate.claimedAdopter', 'Claimed')}
            </Badge>
          )}
          <Badge tone={isSubscribed ? 'success' : 'info'} size="sm">
            {isSubscribed ? t('mandate.subscribed', 'Subscribed') : t('mandate.endorsed', 'Endorsed')}
          </Badge>
        </div>
      </div>

      {isSubscribed && (
        <div className={styles.progress}>
          <ProgressBar
            className={styles.progressTrack}
            variant="success"
            value={pct}
            label={t('mandate.progressLabel', 'Reported progress')}
          />
          <span className={styles.progressPct}>
            {t('mandate.progressPct', '{pct}% reported', { pct })}
          </span>
        </div>
      )}

      {isSubscribed && adopter.progressNote && (
        <p className={styles.note}>“{adopter.progressNote}”</p>
      )}

      <p className={styles.since}>
        {isSubscribed
          ? t('mandate.subscribedSince', 'Subscribed {since}', { since: formatSince(adopter.since, locale) })
          : t('mandate.endorsedSince', 'Endorsed {since}', { since: formatSince(adopter.since, locale) })}
      </p>
    </li>
  );
};

// ---------------------------------------------------------------------------

interface EndorseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: EndorsementInput) => void;
  t: TFunction;
}

const EndorseModal: React.FC<EndorseModalProps> = ({ isOpen, onClose, onSubmit, t }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AdopterType>('youth-network');
  const [level, setLevel] = useState<AdoptionLevel>('endorsed');
  const [note, setNote] = useState('');

  const reset = () => {
    setName('');
    setType('youth-network');
    setLevel('endorsed');
    setNote('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name,
      type,
      level,
      progressNote: level === 'subscribed' ? note : undefined,
    });
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('mandate.adoptModalTitle', 'Stand behind this mandate')}
      closeLabel={t('common.close', 'Close')}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {t('mandate.adoptSubmit', 'Add your organization')}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <p className={styles.formIntro}>
          {t(
            'mandate.adoptModalIntro',
            'Add your organization to the public record of support — endorse the mandate, or subscribe to act on it and report progress.',
          )}
        </p>

        <label className={styles.formField}>
          <span className={styles.formLabel}>{t('mandate.fieldOrgName', 'Organization name')}</span>
          <input
            className={styles.formInput}
            type="text"
            value={name}
            maxLength={80}
            placeholder={t('mandate.fieldOrgNamePlaceholder', 'e.g. Lake Region Youth Assembly')}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className={styles.formField}>
          <span className={styles.formLabel}>{t('mandate.fieldOrgType', 'Type of organization')}</span>
          <div className={styles.chipRow} role="group" aria-label={t('mandate.fieldOrgType', 'Type of organization')}>
            {ADOPTER_TYPES.map((option) => {
              const selected = type === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? `${styles.chip} ${styles.chipSelected}` : styles.chip}
                  aria-pressed={selected}
                  onClick={() => setType(option)}
                >
                  {typeLabel(option, t)}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.formField}>
          <span className={styles.formLabel}>{t('mandate.fieldLevel', 'How are you engaging?')}</span>
          <div className={styles.levelRow} role="group" aria-label={t('mandate.fieldLevel', 'How are you engaging?')}>
            <button
              type="button"
              className={level === 'endorsed' ? `${styles.level} ${styles.levelSelected}` : styles.level}
              aria-pressed={level === 'endorsed'}
              onClick={() => setLevel('endorsed')}
            >
              <span className={styles.levelTitle}>{t('mandate.endorsed', 'Endorsed')}</span>
              <span className={styles.levelDesc}>{t('mandate.levelEndorseDesc', 'Publicly support it')}</span>
            </button>
            <button
              type="button"
              className={level === 'subscribed' ? `${styles.level} ${styles.levelSelected}` : styles.level}
              aria-pressed={level === 'subscribed'}
              onClick={() => setLevel('subscribed')}
            >
              <span className={styles.levelTitle}>{t('mandate.subscribed', 'Subscribed')}</span>
              <span className={styles.levelDesc}>{t('mandate.levelSubscribeDesc', 'Act on it & report progress')}</span>
            </button>
          </div>
        </div>

        {level === 'subscribed' && (
          <label className={styles.formField}>
            <span className={styles.formLabel}>
              {t('mandate.fieldNote', 'A first progress note')}{' '}
              <span className={styles.optional}>{t('mandate.optional', 'optional')}</span>
            </span>
            <textarea
              className={styles.formTextarea}
              value={note}
              rows={2}
              maxLength={160}
              placeholder={t('mandate.fieldNotePlaceholder', 'e.g. Funding filtration units for 10 schools this term.')}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        )}
      </div>
    </Modal>
  );
};

export default AdoptionFramework;
