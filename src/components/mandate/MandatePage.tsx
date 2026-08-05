import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../AppHeader';
import MandateCard, { MANDATE_DOC_ANCHOR_ID } from './MandateCard';
import MandateDocument from './MandateDocument';
import AdoptionFramework from './AdoptionFramework';
import MandateBacking from './MandateBacking';
import RatificationPanel from './RatificationPanel';
import { useMandate } from '../../hooks/useMandate';
import { useLiveBackers } from '../../hooks/useLiveBackers';
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
  const [ratifyToken, setRatifyToken] = React.useState(0);
  const { mandate } = useMandate(mandateId, communityId, ratifyToken);
  const [backingOpen, setBackingOpen] = React.useState(false);
  // One live read, shared by the hero card and the backing panel below it, so
  // the page can never show two different backer counts (S33 review).
  const liveBackers = useLiveBackers(mandateId, backingOpen ? 1 : 0);
  const backers = liveBackers ?? mandate.provenance.convictionBackers;
  const backingRef = React.useRef<HTMLDivElement>(null);

  const onViewFull = () => {
    const el = document.getElementById(MANDATE_DOC_ANCHOR_ID);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // S33: backing happens HERE now. It used to navigate to the community page and
  // lean on the initiative card auto-expanding into MandateStage — the same
  // control, three screens away. The panel below resolves the same shared
  // conviction contract, so this is one surface moved, not a second copy.
  const onShowSupport = () => {
    setBackingOpen(true);
    // Let the panel render before scrolling to it.
    window.requestAnimationFrame(() => {
      backingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className={cs.container}>
      <AppHeader showBack onBack={() => navigate(-1)} />

      <main id="main" tabIndex={-1} className={cs.content}>
        <div className={cs.main}>
          <div className={styles.page}>
            <MandateCard mandate={mandate} communityId={communityId ?? ''} mandateId={mandateId ?? ''} backers={backers} onShowSupport={onShowSupport} onViewFull={onViewFull} />
            {mandateId && (
              <div ref={backingRef} className={styles.backingAnchor}>
                <MandateBacking
                  mandateId={mandateId}
                  communityId={communityId ?? ''}
                  backers={backers}
                  expanded={backingOpen}
                  onToggle={() => setBackingOpen((v) => !v)}
                />
              </div>
            )}
            {mandateId && (
              <RatificationPanel
                initiativeId={mandateId}
                mandate={mandate}
                onSaved={() => setRatifyToken((n) => n + 1)}
              />
            )}
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
