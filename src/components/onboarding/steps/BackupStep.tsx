import React, { useState } from 'react';
import { Copy, Download, KeyRound } from 'lucide-react';
import { Button } from '../../shared';
import { useT } from '../../../i18n';
import styles from './steps.module.scss';

interface Props {
  publicKey: string;
  onContinue: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

/**
 * S42 — the beta's first onboarding step: save a backup of the key you just
 * signed in with. The copy says only what the code does: on `ui` the key is
 * typed in to sign in and nothing is signed or encrypted with it, so it is
 * described as working like a password — no stronger claim until that changes.
 */
const BackupStep: React.FC<Props> = ({ publicKey, onContinue, headingRef }) => {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const downloadKey = () => {
    const blob = new Blob([`${t('beta.backup.fileHeading', 'Your Gloki key')}\n${publicKey}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gloki-key.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.step}>
      <div className={styles.hero} aria-hidden>
        <KeyRound size={48} />
      </div>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('beta.backup.title', 'Save your key')}
      </h1>
      <p className={styles.lead}>
        {t(
          'beta.backup.lead',
          'This key is the only way back into your account. Gloki cannot reset it, and anyone who has it can sign in as you.',
        )}
      </p>

      <div className={styles.keyBox}>
        <span className={styles.fieldLabel}>{t('beta.backup.keyLabel', 'Your key')}</span>
        <code className={styles.keyText}>{publicKey}</code>
      </div>

      <div className={styles.keyActions}>
        <Button variant="secondary" leftIcon={<Copy size={16} aria-hidden />} onClick={() => void copyKey()}>
          {t('beta.backup.copy', 'Copy key')}
        </Button>
        <Button variant="secondary" leftIcon={<Download size={16} aria-hidden />} onClick={downloadKey}>
          {t('beta.backup.download', 'Download as text')}
        </Button>
      </div>
      <p className={styles.keyStatus} role="status" aria-live="polite">
        {copied ? t('beta.backup.copied', 'Copied to the clipboard.') : ''}
      </p>

      <p className={styles.consentNote}>
        {t('beta.backup.honest', 'Right now the key works like a password: whoever types it in is you. Keep it somewhere private.')}
      </p>

      <label className={styles.checkRow}>
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        <span>{t('beta.backup.confirm', 'I have saved my key somewhere safe')}</span>
      </label>

      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onContinue} disabled={!saved}>
          {t('common.continue', 'Continue')}
        </Button>
      </div>
    </section>
  );
};

export default BackupStep;
