import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertTriangle, MessageSquare } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import CountryBadge from '../../collaboration/flows/shared/CountryBadge';
import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
const chatContractCode = '';import { getMessages, addMessage, getTopics } from './chatApi';
import type { ChatMessage, ChatTopic as ChatTopicType } from './chatApi';
import { useT } from '../../../i18n';
import styles from './ChatTopic.module.scss';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const POLL_INTERVAL_MS = 5_000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ChatTopic: React.FC = () => {
  const t = useT();
  const { communityId, topicId } = useParams<{ communityId: string; topicId: string }>();
  const navigate = useNavigate();

  const serverUrl = useAppSelector((state) => state.user.serverUrl);
  const publicKey = useAppSelector((state) => state.user.publicKey);
  const profiles = useAppSelector((state) => state.communities.profiles);

  const instanceId = communityId ? `chat_${communityId}` : 'chat_unknown';
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } =
    useFlowContract(
      instanceId,
      'chat',
      'chat_contract.py',
      chatContractCode,
      communityId,
      'chatContractId',
    );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [topic, setTopic] = useState<ChatTopicType | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const cancelledRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshMessages = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId || !topicId) return;
    try {
      const list = await getMessages(serverUrl, publicKey, contractId, topicId);
      if (!cancelledRef.current) setMessages(list);
    } catch (err) {
      console.error('[ChatTopic] Failed to fetch messages:', err);
    }
  }, [serverUrl, publicKey, contractId, topicId]);

  const refreshTopic = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId || !topicId) return;
    try {
      const topics = await getTopics(serverUrl, publicKey, contractId);
      const found = topics.find(t => t.id === topicId) ?? null;
      if (!cancelledRef.current) setTopic(found);
    } catch (err) {
      console.error('[ChatTopic] Failed to fetch topic:', err);
    }
  }, [serverUrl, publicKey, contractId, topicId]);

  useEffect(() => {
    cancelledRef.current = false;
    if (!isReady) return;
    refreshTopic();
    refreshMessages();
    const interval = setInterval(refreshMessages, POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, [isReady, refreshTopic, refreshMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!communityId || !topicId) {
    return <div className={styles.notFound}>{t('chat.topicNotFound', 'Topic not found.')}</div>;
  }

  if (hasError) {
    return (
      <div className={styles.notFound}>
        <AlertTriangle size={36} />
        <p>{errorMessage}</p>
        <p className={styles.notFoundHint}>
          {t('chat.onChainCaveat', "Chat is hosted on-chain and only available on communities created after 2026-04-22. Older communities can't host sub-contracts yet.")}
        </p>
        <button className={styles.backBtn} onClick={retry}>{t('common.retry', 'Try again')}</button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className={styles.notFound}>
        <MessageSquare size={36} />
        <p>{statusMessage || (isDeploying ? t('chat.settingUp', 'Setting up chat…') : t('common.loading', 'Loading…'))}</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className={styles.notFound}>
        <p>Topic not found.</p>
        <button
          className={styles.backBtn}
          onClick={() => navigate(`/community/${communityId}/chat`)}
        >
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>
    );
  }

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !publicKey || !serverUrl || !contractId || sending) return;

    // Optimistic append
    const optimistic: ChatMessage = {
      id: `optimistic_${Date.now()}`,
      topicId,
      author: publicKey,
      text: trimmed,
      timestamp: Date.now(),
    };
    const snapshot = messages;
    setMessages([...snapshot, optimistic]);
    setInputText('');
    setSending(true);

    try {
      await addMessage(serverUrl, publicKey, contractId, topicId, trimmed);
      await refreshMessages();
    } catch (err) {
      console.error('[ChatTopic] Failed to send message:', err);
      // Rollback
      if (!cancelledRef.current) setMessages(snapshot);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(`/community/${communityId}/chat`)}
          title={t('chat.backTitle', 'Back to Chat')}
          aria-label={t('chat.backAria', 'Back to chat topics')}
        >
          <ArrowLeft size={18} />
        </button>
        <span className={styles.topicTitle}>{topic.title}</span>
      </div>

      {/* Message stream */}
      <div className={styles.messageStream}>
        {messages.length === 0 && (
          <div className={styles.emptyStream}>
            <p>{t('chat.noMessages', 'No messages yet. Say something!')}</p>
          </div>
        )}

        {messages.map(msg => {
          const isOwn = msg.author === publicKey;
          const profile = profiles?.[msg.author];
          const fullName = profile
            ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
            : null;
          const displayName = isOwn
            ? t('deliberation.you', 'You')
            : fullName || msg.author.slice(0, 12) + '…';
          const countryCode = profile?.country;

          return (
            <div
              key={msg.id}
              className={`${styles.message} ${isOwn ? styles.mine : ''}`}
            >
              <div className={styles.messageMeta}>
                <span className={styles.authorName}>
                  {displayName}
                  <CountryBadge countryCode={countryCode} />
                </span>
                <span className={styles.timestamp}>{formatTime(msg.timestamp)}</span>
              </div>
              <div className={styles.messageText}>{msg.text}</div>
            </div>
          );
        })}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className={styles.inputBar}>
        <textarea
          className={styles.textarea}
          rows={1}
          placeholder={t('chat.messagePlaceholder', 'Write a message…')}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!inputText.trim() || !publicKey || sending}
          title={t('chat.send', 'Send')}
          aria-label={t('chat.sendAria', 'Send message')}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatTopic;
