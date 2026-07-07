import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import CountryBadge from '../../collaboration/flows/shared/CountryBadge';
import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
const chatContractCode = '';import { getTopics, createTopic } from './chatApi';
import type { ChatTopic } from './chatApi';
import { useI18n } from '../../../i18n';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { displayNameFor } from '../../../utils/displayName';
import styles from './ChatTopicList.module.scss';

interface ChatTopicListProps {
  communityId: string;
}

const POLL_INTERVAL_MS = 10_000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ChatTopicList: React.FC<ChatTopicListProps> = ({ communityId }) => {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const serverUrl = useAppSelector((state) => state.user.serverUrl);
  const publicKey = useAppSelector((state) => state.user.publicKey);
  const profiles = useAppSelector((state) => state.communities.profiles);

  const instanceId = `chat_${communityId}`;
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } =
    useFlowContract(
      instanceId,
      'chat',
      'chat_contract.py',
      chatContractCode,
      communityId,
      'chatContractId',
    );

  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const cancelledRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      const list = await getTopics(serverUrl, publicKey, contractId);
      if (!cancelledRef.current) setTopics(list);
    } catch (err) {
      console.error('[ChatTopicList] Failed to fetch topics:', err);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => {
    cancelledRef.current = false;
    if (!isReady) return;
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, [isReady, refresh]);

  const handleCreate = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || !publicKey || !serverUrl || !contractId || creating) return;
    setCreating(true);
    try {
      await createTopic(serverUrl, publicKey, contractId, trimmed);
      setNewTitle('');
      await refresh();
    } catch (err) {
      console.error('[ChatTopicList] Failed to create topic:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
  };

  if (hasError) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <AlertTriangle size={36} />
          <p>{errorMessage}</p>
          <p className={styles.caveat}>
            {t('chat.onChainCaveat', "Chat is hosted on-chain and only available on communities created after 2026-04-22. Older communities can't host sub-contracts yet.")}
          </p>
          <button className={styles.newTopicBtn} onClick={retry}>{t('common.retry', 'Try again')}</button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <MessageSquare size={36} />
          <p>{statusMessage || (isDeploying ? t('chat.settingUp', 'Setting up chat…') : t('common.loading', 'Loading…'))}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* The section title + intro render in the AppHeader title block (S23). */}

      {/* New topic input */}
      <div className={styles.inputBar}>
        <input
          className={styles.titleInput}
          type="text"
          placeholder={t('chat.newTopicPlaceholder', 'Start a new topic…')}
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={creating}
        />
        <button
          className={styles.newTopicBtn}
          onClick={handleCreate}
          disabled={!newTitle.trim() || !publicKey || creating}
        >
          {creating ? t('chat.creating', 'Creating…') : t('chat.newTopic', 'New Topic')}
        </button>
      </div>

      {/* Topic list */}
      {topics.length === 0 ? (
        <div className={styles.empty}>
          <MessageSquare size={36} />
          <p>{t('chat.noTopics', 'No topics yet. Start a conversation!')}</p>
        </div>
      ) : (
        <div className={styles.topicList}>
          {topics.map(topic => {
            const profile = profiles?.[topic.author];
            const displayName = displayNameFor(profile, topic.author);
            const countryCode = profile?.country;

            return (
              <button
                key={topic.id}
                className={styles.topicCard}
                onClick={() => navigate(`/community/${communityId}/chat/${topic.id}`)}
              >
                <div className={styles.topicTitle}>{topic.title}</div>
                <div className={styles.topicMeta}>
                  <span className={styles.author}>
                    {displayName}
                    <CountryBadge countryCode={countryCode} />
                  </span>
                  <span className={styles.metaDivider}>·</span>
                  <span className={styles.msgCount}>
                    <MessageSquare size={12} />
                    {topic.messageCount}
                  </span>
                  <span className={styles.metaDivider}>·</span>
                  <span className={styles.timeAgo}>
                    {formatTimeAgo(t, topic.lastActivity, { maxDays: 7 }) ||
                      new Date(topic.lastActivity).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatTopicList;
