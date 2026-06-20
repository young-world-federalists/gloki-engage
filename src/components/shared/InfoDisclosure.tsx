import React, { useState } from 'react';
import clsx from 'clsx';
import { Info } from 'lucide-react';
import Modal from './Modal';
import { useT } from '../../i18n';
import styles from './InfoDisclosure.module.scss';

export interface InfoDisclosureProps {
  /** Accessible label for the (i) trigger, translated (e.g. "How this stage works"). */
  label: string;
  /** Modal heading, translated. Defaults to `label`. */
  title?: React.ReactNode;
  /** The rules / how-it-works / explainer prose, shown inside the focus-trapped Modal. */
  children: React.ReactNode;
  /** Extra class on the trigger button (positioning). */
  className?: string;
  /** Modal size. */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * The single disclosure standard (Wave 2): a small, ≥44px `(i)` icon-button that
 * opens the focus-trapped {@link Modal} with rules/explainer/how-it-works prose.
 * Place it next to the thing it explains. Keep the *number* (threshold, tally,
 * cost) inline and visible — only the *explanation* goes behind the `(i)`.
 *
 * Tap-only by design (no auto-open): the trigger is a visible, labelled
 * affordance. `aria-expanded` reflects the Modal state; `aria-haspopup="dialog"`
 * announces it opens a dialog.
 */
const InfoDisclosure: React.FC<InfoDisclosureProps> = ({ label, title, children, className, size = 'sm' }) => {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={clsx(styles.trigger, className)}
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Info size={18} aria-hidden />
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={title ?? label}
        size={size}
        closeLabel={t('common.close', 'Close')}
      >
        {children}
      </Modal>
    </>
  );
};

export default InfoDisclosure;
