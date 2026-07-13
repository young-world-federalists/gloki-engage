import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useI18n } from '../../i18n';
import AppHeader from '../AppHeader';
import { EmptyState, UserIdentity, ContextCard } from '../shared';
import { displayNameFor } from '../../utils/displayName';
import { contractRead } from '../../services/api';
import type { IMethod } from '../../services/interfaces';
import { useFlowContract } from './flows/shared/useFlowContract';
import { getMessages, addMessage } from '../community/chat/chatApi';
import type { ChatMessage } from '../community/chat/chatApi';
import cs from '../../pages/Container.module.scss';
import styles from './SuggestionDmView.module.scss';

// One implicit thread per DM contract — the flat chat mechanic only needs a topic
// id string (no topic record). The DM contract itself is keyed per requester via
// useFlowContract per-user mode, scoped to the initiative.
const DM_TOPIC = 'dm';

interface SuggestionDmViewProps {
  communityId: string;
  initiativeId: string;
}

/**
 * Full-page 1:1 "suggestion to the author" DM. Reuses the flat chat contract
 * (chatApi) as a private per-requester contract. One-way in the single-user demo
 * (the author is a seeded persona). FOR OURI: the real DM is a 1:1 contract keyed
 * by the unordered {author, requester} pair.
 */
const SuggestionDmView: React.FC<SuggestionDmViewProps> = ({ initiativeId }) => {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { authorKey, authorName } = (location.state as { authorKey?: string; authorName?: string }) || {};

  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const { contractId, isReady } = useFlowContract(`dm-${initiativeId}`, 'chat', 'chat_contract.py', '');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<{ title?: string; description?: string }>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);

  // The problem being acted on stays visible (§5 rule 11). The header h1 is the
  // author's name, so the ContextCard carries the problem's title + summary.
  // Self-fetch get_details on the initiative contract (mirrors InitiativeView) so
  // no context has to be threaded through the launching engage panel.
  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let alive = true;
    contractRead({
      serverUrl, publicKey, contractId: initiativeId,
      method: { name: 'get_details', values: {} } as IMethod,
    })
      .then((details: Record<string, unknown>) => {
        if (!alive) return;
        setProblem({
          title: typeof details?.title === 'string' ? details.title : undefined,
          description: typeof details?.description === 'string' ? details.description : undefined,
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [serverUrl, publicKey, initiativeId]);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      const list = await getMessages(serverUrl, publicKey, contractId, DM_TOPIC);
      if (!cancelled.current) setMessages(list);
    } catch (err) {
      console.error('[SuggestionDmView] Failed to fetch messages:', err);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => {
    cancelled.current = false;
    if (isReady) refresh();
    return () => { cancelled.current = true; };
  }, [isReady, refresh]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const authorProfile = authorKey ? profiles?.[authorKey] : undefined;
  const authorDisplay =
    authorName ||
    displayNameFor(authorProfile) ||
    t('suggest.author', 'the author');

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !publicKey || !serverUrl || !contractId || sending) return;
    const optimistic: ChatMessage = {
      id: `optimistic_${Date.now()}`, topicId: DM_TOPIC, author: publicKey, text: trimmed, timestamp: Date.now(),
    };
    const snapshot = messages;
    setMessages([...snapshot, optimistic]);
    setInput('');
    setSending(true);
    try {
      await addMessage(serverUrl, publicKey, contractId, DM_TOPIC, trimmed);
      await refresh();
    } catch (err) {
      console.error('[SuggestionDmView] Failed to send:', err);
      if (!cancelled.current) setMessages(snapshot);
    } finally {
      setSending(false);
    }
  };

  return (
    // Full-height flex column so the composer anchors at the bottom (ChatTopic
    // pattern) instead of floating mid-page under the empty state (S18 W1, M4).
    <div className={`${cs.container} ${styles.dm}`}>
      <AppHeader showBack onBack={() => navigate(-1)} title={authorDisplay} eyebrow={t('suggest.eyebrow', 'Suggestion')} />
      <main id="main" tabIndex={-1} className={`${cs.content} ${styles.dmMain}`}>
        <div className={styles.thread}>
          {messages.length === 0 ? (
            <EmptyState
              compact
              icon={<Send size={28} aria-hidden />}
              title={t('suggest.emptyTitle', 'Send a private suggestion')}
              message={t('suggest.empty', 'Your suggestion goes privately to {name}.', { name: authorDisplay })}
            />
          ) : (
            messages.map((m) => {
              const isOwn = m.author === publicKey;
              const p = profiles?.[m.author];
              const nm = isOwn
                ? t('deliberation.you', 'You')
                : displayNameFor(p) || authorDisplay;
              return (
                <div key={m.id} className={`${styles.message} ${isOwn ? styles.mine : ''}`}>
                  <div className={styles.meta}>
                    <UserIdentity name={nm} countryCode={p?.country} size="sm" />
                    <span className={styles.time}>
                      {new Date(m.timestamp).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className={styles.text}>{m.text}</div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </main>
      {/* The problem being acted on stays visible as a "you're responding to" bar
          directly above the composer (D1, DESIGN_SYSTEM §5 rule 11). Sibling of
          <main> so it hugs the input; the wrapper (not the card) carries the
          page-column so the card border stays inset from the screen edge. */}
      {(problem.title || problem.description) && (
        <div className={styles.contextBar}>
          <ContextCard
            title={problem.title}
            body={problem.description}
            ariaLabel={t('context.suggest.aria', 'The problem you are suggesting on')}
          />
        </div>
      )}
      <div className={styles.inputBar}>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder={t('suggest.placeholder', 'Write your suggestion…')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={sending}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!input.trim() || !publicKey || sending}
          aria-label={t('suggest.send', 'Send suggestion')}
        >
          <Send size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
};

export default SuggestionDmView;
