import React from 'react';
import clsx from 'clsx';
import { Gauge } from 'lucide-react';
import { useT } from '../../../i18n';
import { useDataSaver } from './useDataSaver';
import styles from './DataSaverToggle.module.scss';

export interface DataSaverToggleProps {
  className?: string;
}

/**
 * Accessible switch for data-saver mode. Reads/writes the shared `useDataSaver`
 * store, so flipping it instantly affects every `SmartImage` (and any other
 * consumer) across the app.
 */
const DataSaverToggle: React.FC<DataSaverToggleProps> = ({ className }) => {
  const t = useT();
  const { dataSaver, toggle } = useDataSaver();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dataSaver}
      onClick={toggle}
      className={clsx(styles.toggle, dataSaver && styles.on, className)}
    >
      <span className={styles.icon} aria-hidden>
        <Gauge size={18} />
      </span>
      <span className={styles.text}>
        <span className={styles.label}>{t('connectivity.dataSaver', 'Data saver')}</span>
        <span className={styles.hint}>
          {t('connectivity.dataSaverHint', 'Use less data — hide heavy images')}
        </span>
      </span>
      <span className={styles.track} aria-hidden>
        <span className={styles.knob} />
      </span>
    </button>
  );
};

export default DataSaverToggle;
