import React, { useState } from 'react';
import { Button, Modal, SearchableSelect } from '../shared';
import { useT } from '../../i18n';
import { COUNTRIES } from '../../utils/countries';
import type { AdopterType } from '../../services/demo/fixtures/mandate';
import styles from './OrganizationSignIn.module.scss';

const ORG_TYPES: AdopterType[] = ['youth-network', 'government', 'ngo', 'academic', 'intergov'];

export interface OrganizationSignInInput {
  name: string;
  type: AdopterType;
  country?: string;
}

export interface OrganizationSignInProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: OrganizationSignInInput) => void;
  submitting?: boolean;
}

/**
 * S33 — how an organization gets into Gloki.
 *
 * Deliberately shorter than the member flow: no onboarding, no vouching, no
 * trust ladder, because none of that applies. An organization is a name, a
 * kind, and optionally a country — enough to appear honestly on a mandate's
 * public record of support.
 */
const OrganizationSignIn: React.FC<OrganizationSignInProps> = ({ isOpen, onClose, onSubmit, submitting }) => {
  const t = useT();
  const [name, setName] = useState('');
  const [type, setType] = useState<AdopterType>('ngo');
  const [country, setCountry] = useState('');

  const typeLabel = (option: AdopterType): string => {
    switch (option) {
      case 'youth-network': return t('mandate.typeYouth', 'Youth network');
      case 'government': return t('mandate.typeGov', 'Government');
      case 'ngo': return t('mandate.typeNgo', 'NGO');
      case 'academic': return t('mandate.typeAcademic', 'Academic');
      case 'intergov': return t('mandate.typeIntergov', 'International body');
    }
  };

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleClose = () => {
    setName('');
    setType('ngo');
    setCountry('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('org.signIn.title', 'Sign in as an organization')}
      closeLabel={t('common.close', 'Close')}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            variant="primary"
            onClick={() => onSubmit({ name, type, country: country || undefined })}
            disabled={!canSubmit}
          >
            {submitting ? t('login.connecting', 'Connecting…') : t('org.signIn.submit', 'Continue')}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <p className={styles.intro}>
          {t(
            'org.signIn.intro',
            'Organizations use Gloki for one thing: responding to mandates communities have already decided. You can read everything, and endorse or subscribe to a finished mandate — but you don’t deliberate or vote. That stays one person, one vote.',
          )}
        </p>

        <label className={styles.field}>
          <span className={styles.label}>{t('org.signIn.nameLabel', 'Organization name')}</span>
          <input
            className={styles.input}
            type="text"
            value={name}
            maxLength={80}
            placeholder={t('mandate.fieldOrgNamePlaceholder', 'e.g. Lake Region Youth Assembly')}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>{t('mandate.fieldOrgType', 'Type of organization')}</span>
          <div className={styles.chipRow} role="group" aria-label={t('mandate.fieldOrgType', 'Type of organization')}>
            {ORG_TYPES.map((option) => {
              const selected = type === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? `${styles.chip} ${styles.chipSelected}` : styles.chip}
                  aria-pressed={selected}
                  onClick={() => setType(option)}
                >
                  {typeLabel(option)}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            {t('org.signIn.countryLabel', 'Where you’re based')}{' '}
            <span className={styles.optional}>{t('mandate.optional', 'optional')}</span>
          </span>
          <SearchableSelect
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }))}
            value={country}
            onChange={setCountry}
            placeholder={t('org.signIn.countryPlaceholder', 'Search countries — leave empty if international')}
          />
        </div>
      </div>
    </Modal>
  );
};

export default OrganizationSignIn;
