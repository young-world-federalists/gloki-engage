import React from 'react';
import { Plus, X } from 'lucide-react';
import type { SourceLink } from '../../utils/sources';
import { useT } from '../../i18n';
import styles from './SourcesInput.module.scss';

export interface SourcesInputProps {
  /** Current rows. Empty rows are allowed while editing; caller filters on submit. */
  value: SourceLink[];
  onChange: (next: SourceLink[]) => void;
  /** Max rows offered (default 5). */
  max?: number;
  /** Optional label + hint above the rows (already translated). */
  label?: string;
  hint?: string;
}

// Repeatable {url, optional label} composer, matching the CreateInitiativePage
// evidence-row pattern. Emits SourceLink[]; the caller filters/sanitises on
// submit (via normalizeSources). Tokens-only, 44px targets, dark-aware.
const SourcesInput: React.FC<SourcesInputProps> = ({ value, onChange, max = 5, label, hint }) => {
  const t = useT();
  const rows = value.length > 0 ? value : [{ url: '' }];

  const update = (i: number, patch: Partial<SourceLink>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, { url: '' }]);
  const remove = (i: number) => {
    const next = rows.filter((_, j) => j !== i);
    onChange(next.length > 0 ? next : [{ url: '' }]);
  };

  return (
    <div className={styles.wrap}>
      {label && <p className={styles.label}>{label}</p>}
      {hint && <p className={styles.hint}>{hint}</p>}
      {rows.map((row, i) => (
        <div key={i} className={styles.row}>
          <div className={styles.inputs}>
            <input
              className={styles.url}
              type="url"
              inputMode="url"
              placeholder={t('sources.urlPlaceholder', 'https://…')}
              value={row.url}
              maxLength={500}
              aria-label={t('sources.urlLabel', 'Source link')}
              onChange={(e) => update(i, { url: e.target.value })}
            />
            <input
              className={styles.name}
              type="text"
              placeholder={t('sources.labelPlaceholder', 'Label (optional)')}
              value={row.label ?? ''}
              maxLength={120}
              aria-label={t('sources.labelFieldLabel', 'Source label (optional)')}
              onChange={(e) => update(i, { label: e.target.value })}
            />
          </div>
          {rows.length > 1 && (
            <button
              type="button"
              className={styles.remove}
              onClick={() => remove(i)}
              aria-label={t('sources.remove', 'Remove source')}
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>
      ))}
      {rows.length < max && (
        <button type="button" className={styles.add} onClick={add}>
          <Plus size={14} aria-hidden />
          <span>{t('sources.add', 'Add another source')}</span>
        </button>
      )}
    </div>
  );
};

export default SourcesInput;
