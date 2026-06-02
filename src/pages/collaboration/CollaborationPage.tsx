import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PackageOpen, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import { Button } from '../../components/shared';
import { FLOW_REGISTRY, FLOW_GROUPS, getFlow } from '../../components/collaboration/flows/registry';
import { removeContract } from '../../components/collaboration/flows/shared/flowContractsSlice';
import { fetchCommunityMembers } from '../../store/slices/communitiesSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cs from '../Container.module.scss';
import styles from './CollaborationPage.module.scss';

export type CollaborationType = 'initiative' | 'wish' | 'agreement' | 'collab';

interface CollaborationTab {
  instanceId: string;
  flowId: string;
}

const TABS_STORAGE_KEY = 'collaborationTabs';

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
  subtitle,
  collaborationId,
  communityId,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
      <PageHeader
        showBackButton={true}
        backButtonText="Back to Community"
        onBackClick={() => navigate(`/community/${communityId}/collaborations`)}
        title={title}
        subtitle={subtitle}
        layout="two-row"
      />

      <div className={cs.content}>
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
                <span>{flow.label}</span>
                <span
                  className={styles.removeBtn}
                  role="button"
                  aria-label={`Remove ${flow.label} tab`}
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
              title="Add a flow tab"
            >
              <Plus size={20} />
              <span>Add</span>
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
                        {group}
                      </div>
                      {flows.map((flow) => {
                        const available = flow.isAvailable?.(tabs.map(t => t.flowId)) ?? true;
                        return (
                          <button
                            key={flow.id}
                            className={`${styles.addTabMenuItem} ${!available ? styles.addTabMenuItemDisabled : ''}`}
                            onClick={() => { if (available) addTab(flow.id); }}
                            disabled={!available}
                            title={!available ? 'Not available with current tabs' : undefined}
                          >
                            <flow.icon size={16} />
                            {flow.label}
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
            <ErrorBoundary fallbackMessage="This flow hit an error. Your other tabs are unaffected.">
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
              <h3 className={styles.emptyStateTitle}>Unknown flow</h3>
              <p>
                <code>{activeTab.flowId}</code> — your saved view may be stale.
                Choose another tab, or add a new flow.
              </p>
              <Button variant="primary" onClick={() => removeTab(activeTab.instanceId)}>
                Remove this tab
              </Button>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <PackageOpen size={48} className={styles.emptyStateIcon} />
              <h3 className={styles.emptyStateTitle}>No tools added yet</h3>
              <p>
                Add a flow like Discussion, Task Board, or Shared Document to start
                collaborating.
              </p>
              <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowAddMenu(true)}>
                Add your first flow
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;
