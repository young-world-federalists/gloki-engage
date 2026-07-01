import React from 'react';
import { InfoDisclosure } from '../../shared';
import { useT } from '../../../i18n';
import styles from './VotePreview.module.scss';

/**
 * S11 P2 — the "how this vote works" explainer, visible BEFORE the gate so the
 * mechanism is auditable without participating. QV cost-curve + conviction time
 * dimension, reconciled with 1p1v (keep both — do not re-open). Reuses the shared
 * InfoDisclosure (i)→Modal standard; the numbers stay inline in the prose.
 */
const VoteExplainer: React.FC = () => {
  const t = useT();
  return (
    <div className={styles.explainer}>
      <span className={styles.explainerLabel}>
        {t('mechanisms.qv.explainer.inline', 'How this vote works')}
      </span>
      <InfoDisclosure
        label={t('mechanisms.qv.explainer.label', 'How this vote works')}
        title={t('mechanisms.qv.explainer.title', 'How this vote works')}
        size="md"
      >
        <p>{t('mechanisms.qv.explainer.equalSay', 'Everyone here gets the same set of hearts — one person, the same say. No one can buy more.')}</p>
        <p>{t('mechanisms.qv.explainer.cost', 'You spread those hearts across the solutions you care about. Piling them onto one costs more than sharing them out: 1 heart costs 1 point, 2 hearts cost 4, 3 hearts cost 9. So backing several things you believe in goes further than shouting for just one.')}</p>
        <p>{t('mechanisms.qv.explainer.conviction', 'Support also builds over time — the longer a solution holds its backing, the more settled the community’s conviction behind it.')}</p>
      </InfoDisclosure>
    </div>
  );
};

export default VoteExplainer;
