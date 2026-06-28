import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../AppHeader';
import MandateCard, { MANDATE_DOC_ANCHOR_ID } from './MandateCard';
import MandateDocument from './MandateDocument';
import AdoptionFramework from './AdoptionFramework';
import { useMandate } from '../../hooks/useMandate';
import cs from '../../pages/Container.module.scss';
import styles from './MandatePage.module.scss';

/**
 * Lane E — Mandate & Impact. Routed at `/mandate/:communityId/:mandateId/*`.
 *
 * The published Mandate artifact (E1) + adoption framework (E2). `useMandate`
 * derives the articles/indicators from the winning solution's spine (S6 consume),
 * falling back to the hand-authored fixture. FOR OURI: `:mandateId` is the
 * initiative contract id; the derivation reads the same qv/approval contracts the
 * vote card uses (see useMandate).
 */
const MandatePage: React.FC = () => {
  const navigate = useNavigate();
  const { communityId, mandateId } = useParams<{ communityId: string; mandateId: string }>();
  const { mandate } = useMandate(mandateId);

  const onViewFull = () => {
    const el = document.getElementById(MANDATE_DOC_ANCHOR_ID);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Decision B: route to where conviction staking lives — the community page
  // auto-expands the initiative card (MandateStage → ConvictionStaking).
  const onShowSupport = () => {
    if (communityId && mandateId) navigate(`/community/${communityId}?initiative=${mandateId}`);
  };

  return (
    <div className={cs.container}>
      <AppHeader showBack onBack={() => navigate(-1)} />

      <main id="main" tabIndex={-1} className={cs.content}>
        <div className={cs.main}>
          <div className={styles.page}>
            <MandateCard mandate={mandate} onShowSupport={onShowSupport} onViewFull={onViewFull} />
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
