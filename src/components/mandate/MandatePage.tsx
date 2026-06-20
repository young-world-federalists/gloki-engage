import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../AppHeader';
import { getPublishedMandate } from './MandatePage.demo';
import MandateCard, { MANDATE_DOC_ANCHOR_ID } from './MandateCard';
import MandateDocument from './MandateDocument';
import AdoptionFramework from './AdoptionFramework';
import cs from '../../pages/Container.module.scss';
import styles from './MandatePage.module.scss';

/**
 * Lane E — Mandate & Impact. Routed at `/mandate/:communityId/:mandateId/*`.
 *
 * The published Mandate artifact (E1) plus the adoption framework (E2): the
 * collective output participants can point to, and its bridge to real-world
 * adoption. Resolves the mandate from the initiative's title, falling back to
 * the flagship water mandate so the page always renders a credible artifact.
 */
const MandatePage: React.FC = () => {
  const navigate = useNavigate();
  // UI-only mockup: the page renders the flagship water mandate artifact.
  // SEAM (Ouri): resolve the real initiative title here once the backend is
  // wired so the mandate shows its own initiative's title — see the data-layer
  // seam in ARCHITECTURE.md. (The prior redux read never populated in the
  // mockup, so getPublishedMandate always used the flagship fallback.)
  const mandate = getPublishedMandate(undefined);

  return (
    <div className={cs.container}>
      <AppHeader showBack onBack={() => navigate(-1)} />

      <main id="main" tabIndex={-1} className={cs.content}>
        <div className={cs.main}>
          <div className={styles.page}>
            <MandateCard mandate={mandate} />
            <div id={MANDATE_DOC_ANCHOR_ID} className={styles.docAnchor}>
              <MandateDocument mandate={mandate} />
            </div>
            <AdoptionFramework mandateId={mandate.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MandatePage;
