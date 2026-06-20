import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PackageOpen, AlertTriangle, ArrowLeft } from 'lucide-react';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import { Button } from '../../components/shared';
import { FLOW_REGISTRY, FLOW_GROUPS, getFlow } from '../../components/collaboration/flows/registry';
import type { FlowDefinition } from '../../components/collaboration/flows/types';
import { removeContract } from '../../components/collaboration/flows/shared/flowContractsSlice';
import { fetchCommunityMembers } from '../../store/slices/communitiesSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useT } from '../../i18n';
import cs from '../Container.module.scss';
import styles from './CollaborationPage.module.scss';

export type CollaborationType = 'initiative' | 'wish' | 'agreement' | 'collab';

interface CollaborationTab {
  instanceId: string;
  flowId: string;
}

const TABS_STORAGE_KEY = 'collaborationTabs';

/** Add-Tab menu group name (English, from the registry) → i18n key. */
const GROUP_KEYS: Record<string, string> = {
  'Decision Making': 'collab.group.decisionMaking',
  Teamwork: 'collab.group.teamwork',
  Planning: 'collab.group.planning',
};

function loadTabs(collaborationId: string): CollaborationTab[] {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, CollaborationTab[]>;
    return all[collaborationId] ?? [];
  } catch {
    return [];
  }
}

function saveTabs(collaborationId: string, tabs: CollaborationTab[]) {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, CollaborationTab[]>) : {};
    all[collaborationId] = tabs;
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage full or unavailable
  }
}

// Drop any persisted tabs whose flowId is no longer registered. Persists the
// cleaned list back to localStorage so the stale entry doesn't reappear.
function loadValidTabs(collaborationId: string): CollaborationTab[] {
  const raw = loadTabs(collaborationId);
  const valid = raw.filter((t) => getFlow(t.flowId) !== undefined);
  if (valid.length !== raw.length) {
    const dropped = raw.length - valid.length;
    console.warn(`[CollaborationPage] Dropped ${dropped} stale flow tab(s) from localStorage for ${collaborationId}`);
    saveTabs(collaborationId, valid);
  }
  return valid;
}

interface CollaborationPageProps {
  type: CollaborationType;
  title: string;
  subtitle?: string;
  collaborationId: string;
  communityId: string;
}

const CollaborationPage: React.FC<CollaborationPageProps> = ({
  type,
  title,
  collaborationId,
  communityId,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const t = useT();
  const labelOf = (flow: FlowDefinition) => t(`collab.flow.${flow.id}`, flow.label);
  const { publicKey, serverUrl } = useAppSelector((s) => s.user);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);

  // Ensure community members (and their profiles) are loaded — they may not be
  // if the user navigated directly to the collaboration URL or refreshed the page.
  useEffect(() => {
    if (publicKey && serverUrl && communityId && !communityMembers[communityId]) {
      dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
    }
  }, [publicKey, serverUrl, communityId, communityMembers, dispatch]);

  const [tabs, setTabs] = useState<CollaborationTab[]>(() => loadValidTabs(collaborationId));
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(
    () => { const saved = loadValidTabs(collaborationId); return saved.length > 0 ? saved[0].instanceId : null; },
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAddMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);

  const updateTabs = useCallback((updater: (prev: CollaborationTab[]) => CollaborationTab[]) => {
    setTabs((prev) => {
      const next = updater(prev);
      saveTabs(collaborationId, next);
      return next;
    });
  }, [collaborationId]);

  const addTab = (flowId: string) => {
    const newTab: CollaborationTab = { instanceId: crypto.randomUUID(), flowId };
    updateTabs((prev) => [...prev, newTab]);
    setActiveInstanceId(newTab.instanceId);
    setShowAddMenu(false);
  };

  const removeTab = (instanceId: string) => {
    updateTabs((prev) => {
      const next = prev.filter((t) => t.instanceId !== instanceId);
      if (activeInstanceId === instanceId) {
        setActiveInstanceId(next.length > 0 ? next[next.length - 1].instanceId : null);
      }
      return next;
    });
    dispatch(removeContract({ instanceId }));
  };

  const activeTab = tabs.find((t) => t.instanceId === activeInstanceId);
  const activeFlow = activeTab ? getFlow(activeTab.flowId) : null;
  const ActiveComponent = activeFlow?.component ?? null;

  const unknownFlowId = activeTab && !activeFlow ? activeTab.flowId : null;
  useEffect(() => {
    if (unknownFlowId) {
      console.warn('[CollaborationPage] Unknown flowId on active tab:', unknownFlowId);
    }
  }, [unknownFlowId]);

  return (
    <div className={cs.container}>
      {/* CollaborationPage always renders inside CommunityView, which provides the
          single AppHeader (community name) + <main> landmark. So this is a
          header-less sub-route: just a back affordance + the collab title. */}
      <div className={cs.content}>
        <div className={styles.collabHeader}>
          <button
            type="button"
            className={styles.collabBack}
            onClick={() => navigate(`/community/${communityId}/collab`)}
            aria-label={t('common.back', 'Back')}
          >
            <ArrowLeft size={20} aria-hidden />
          </button>
          <h2 className={styles.collabTitle}>{title}</h2>
        </div>
        <nav className={cs.nav}>
          {tabs.map((tab) => {
            const flow = getFlow(tab.flowId);
            if (!flow) return null;
            const isActive = tab.instanceId === activeInstanceId;
            return (
              <button
                key={tab.instanceId}
                className={`${cs.navItem} ${isActive ? cs.active : ''} ${styles.tabItem}`}
                onClick={() => setActiveInstanceId(tab.instanceId)}
              >
                <flow.icon size={20} />
                <span>{labelOf(flow)}</span>
                <span
                  className={styles.removeBtn}
                  role="button"
                  aria-label={t('collab.removeTab', 'Remove {label} tab', { label: labelOf(flow) })}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.instanceId);
                  }}
                >
                  ×
                </span>
              </button>
            );
          })}

          <div className={styles.addTabWrapper} ref={menuRef}>
            <button
              className={`${cs.navItem} ${styles.addTabBtn}`}
              onClick={() => setShowAddMenu((v) => !v)}
              title={t('collab.addFlowTab', 'Add a flow tab')}
            >
              <Plus size={20} />
              <span>{t('collab.add', 'Add')}</span>
            </button>
            {showAddMenu && (
              <div className={styles.addTabMenu}>
                {/* Only show collab-appropriate flows (exclude initiative-only governance flows) */}
                {FLOW_GROUPS.map((group) => {
                  const flows = FLOW_REGISTRY.filter(f => f.group === group && f.context !== 'initiative');
                  if (flows.length === 0) return null;
                  return (
                    <React.Fragment key={group}>
                      <div className={styles.addTabMenuGroupHeader}>
                        {t(GROUP_KEYS[group], group)}
                      </div>
                      {flows.map((flow) => {
                        const available = flow.isAvailable?.(tabs.map(t => t.flowId)) ?? true;
                        return (
                          <button
                            key={flow.id}
                            className={`${styles.addTabMenuItem} ${!available ? styles.addTabMenuItemDisabled : ''}`}
                            onClick={() => { if (available) addTab(flow.id); }}
                            disabled={!available}
                            title={!available ? t('collab.unavailableWithTabs', 'Not available with current tabs') : undefined}
                          >
                            <flow.icon size={16} />
                            {labelOf(flow)}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className={cs.main}>
          {ActiveComponent && activeTab ? (
            <ErrorBoundary fallbackMessage={t('collab.flowError', 'This flow hit an error. Your other tabs are unaffected.')}>
              <ActiveComponent
                instanceId={activeTab.instanceId}
                collaborationId={collaborationId}
                collaborationType={type}
                parentContractId={communityId}
                stageKey={`${activeTab.flowId}_${collaborationId}`}
              />
            </ErrorBoundary>
          ) : activeTab && !activeFlow ? (
            <div className={styles.unknownFlowCard}>
              <AlertTriangle size={32} className={styles.unknownFlowIcon} />
              <h3 className={styles.emptyStateTitle}>{t('collab.unknownFlow', 'Unknown flow')}</h3>
              <p>
                <code>{activeTab.flowId}</code>{' '}
                {t('collab.unknownFlowBody', '— your saved view may be stale. Choose another tab, or add a new flow.')}
              </p>
              <Button variant="primary" onClick={() => removeTab(activeTab.instanceId)}>
                {t('collab.removeThisTab', 'Remove this tab')}
              </Button>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <PackageOpen size={48} className={styles.emptyStateIcon} />
              <h3 className={styles.emptyStateTitle}>{t('collab.noToolsTitle', 'No tools added yet')}</h3>
              <p>
                {t('collab.noToolsBody', 'Add a flow like Discussion, Task Board, or Shared Document to start collaborating.')}
              </p>
              <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowAddMenu(true)}>
                {t('collab.addFirstFlow', 'Add your first flow')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;
