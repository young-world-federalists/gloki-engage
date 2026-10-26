import React, { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import ThreadedDiscussion from '../components/collaboration/flows/discussion/ThreadedDiscussion';
import { useT } from '../i18n';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMemberProfile } from '../store/slices/communitiesSlice';
import { getForumContractId, getForumParticipants } from '../services/forum';
import styles from './Container.module.scss';

/**
 * S42 — `/forum`, the beta's second screen: one shared threaded conversation
 * for everyone in the test, mounted once on the contract the forum seam
 * returns. No communities, no stages, no vote on posts — post, reply, like.
 * Anyone signed in can post; verification gates nothing here yet.
 */
const ForumPage: React.FC = () => {
  const t = useT();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const [contractId, setContractId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getForumContractId().then((id) => {
      if (!cancelled) setContractId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // S43 — bylines. The forum has no community whose member list would fill
  // `state.communities.profiles`, so ask the seam for the authors and run the
  // same fetchMemberProfile flow a community runs for its partners. Rows with
  // no profile pointer (the signed-in user, unknown keys) are skipped and keep
  // ThreadedDiscussion's "You" / truncated-key fallbacks. Runs once per
  // contract; a profile already in the store is simply overwritten with itself.
  useEffect(() => {
    if (!contractId || !serverUrl || !publicKey) return;
    let cancelled = false;
    void getForumParticipants({ serverUrl, publicKey, contractId })
      .then((partners) => {
        if (cancelled) return;
        for (const partner of partners) {
          if (!partner.address || !partner.agent || !partner.profile) continue;
          void dispatch(fetchMemberProfile({
            memberServerUrl: partner.address,
            memberPublicKey: partner.agent,
            memberContractId: partner.profile,
            memberAgent: partner.agent,
          }));
        }
      })
      .catch((err) => console.error('[ForumPage] Failed to load participants:', err));
    return () => {
      cancelled = true;
    };
  }, [contractId, serverUrl, publicKey, dispatch]);

  return (
    <div className={styles.container}>
      <AppHeader
        title={t('beta.forum.title', 'Forum')}
        subtitle={t('beta.forum.subtitle', 'One conversation, shared by everyone in this test.')}
      />
      <main id="main" tabIndex={-1} className={styles.content}>
        <div className={styles.main}>
          {contractId ? (
            <ThreadedDiscussion
              contractId={contractId}
              canParticipate
              variant="forum"
              emptyHint={t('beta.forum.empty', 'Be the first to post.')}
            />
          ) : (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>{t('common.loading', 'Loading…')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForumPage;
