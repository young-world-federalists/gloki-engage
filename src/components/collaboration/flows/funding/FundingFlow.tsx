import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Heart, Target, Users, List, PieChart, Plus, ArrowLeft, AlertCircle } from 'lucide-react';

import { useEventStream } from '../../../../hooks/useEventStream';
import { useT } from '../../../../i18n';
import { Button, Modal } from '../../../shared';
import * as api from './fundingApi';
import styles from './FundingFlow.module.scss';

// This component is rendered by the Community Funds page (Currency.tsx), not by
// the flow registry — so its props are what the page can supply, and every
// fundingApi call is (serverUrl, currentUser, fundContractId, …).
export interface FundingFlowProps {
  fundContractId: string;
  communityId: string;
  currentUser: string;
  serverUrl: string;
  onBack: () => void;
}

export interface FundingSetupConfig {
  name: string;
  description: string;
  goal: number | null;
}

// ---------------------------------------------------------------------------
// Setup dialog (exported; owns its shared Modal so the page only toggles isOpen)
// ---------------------------------------------------------------------------
export const FundingSetupDialog: React.FC<{
  isOpen: boolean;
  onDone: (config: FundingSetupConfig) => void;
  onCancel: () => void;
}> = ({ isOpen, onDone, onCancel }) => {
  const t = useT();
  const symbol = t('currency.symbol', 'points');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [error, setError] = useState('');

  // Reset the form each time the dialog is reopened.
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setGoalInput('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError(t('funds.setupNameRequired', 'Please give the fund a name.'));
      return;
    }
    const goal = goalInput.trim() ? Number(goalInput) : null;
    if (goalInput.trim() && (goal === null || isNaN(goal) || goal <= 0)) {
      setError(t('funds.setupGoalInvalid', 'Goal must be a positive number.'));
      return;
    }
    onDone({ name: name.trim(), description: description.trim(), goal });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={t('funds.setupTitle', 'Set up a fund')}
      closeLabel={t('common.close', 'Close')}
      footer={
        <div className={styles.dialogActions}>
          <Button variant="secondary" onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} leftIcon={<Heart size={16} />}>
            {t('funds.setupLaunch', 'Launch fund')}
          </Button>
        </div>
      }
    >
      <div className={styles.dialogContent}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="fund-name">
            {t('funds.setupNameLabel', 'Fund name')}
          </label>
          <input
            id="fund-name"
            className={styles.input}
            type="text"
            placeholder={t('funds.setupNamePlaceholder', 'e.g. Community Garden Renovation')}
            value={name}
            autoFocus
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="fund-desc">
            {t('funds.setupDescLabel', 'Description')}{' '}
            <span className={styles.optional}>{t('funds.optional', '(optional)')}</span>
          </label>
          <textarea
            id="fund-desc"
            className={styles.textarea}
            rows={3}
            placeholder={t('funds.setupDescPlaceholder', 'What will the funds be used for?')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="fund-goal">
            {t('funds.setupGoalLabel', 'Target goal')}{' '}
            <span className={styles.optional}>
              {t('funds.setupGoalOptional', '(optional, in {symbol})', { symbol })}
            </span>
          </label>
          <input
            id="fund-goal"
            className={styles.input}
            type="number"
            min={1}
            placeholder={t('funds.setupGoalPlaceholder', 'e.g. 500')}
            value={goalInput}
            onChange={(e) => {
              setGoalInput(e.target.value);
              setError('');
            }}
          />
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
const ProgressBar: React.FC<{ raised: number; goal: number | null }> = ({ raised, goal }) => {
  const t = useT();
  const symbol = t('currency.symbol', 'points');
  const pct = goal ? Math.min((raised / goal) * 100, 100) : null;
  const complete = pct !== null && pct >= 100;
  return (
    <div className={styles.progressSection}>
      <div className={styles.progressNumbers}>
        <span className={styles.raised}>
          {raised.toLocaleString()} <span className={styles.symbol}>{symbol}</span>
        </span>
        {goal && (
          <span className={styles.goal}>
            {t('funds.ofGoal', 'of {n} {symbol} goal', { n: goal.toLocaleString(), symbol })}
          </span>
        )}
      </div>
      {goal && (
        <div className={styles.track}>
          <div
            className={`${styles.fill} ${complete ? styles.fillComplete : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {goal && pct !== null && (
        <div className={styles.pct}>{t('funds.pctReached', '{n}% reached', { n: pct.toFixed(0) })}</div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Contribution form
// ---------------------------------------------------------------------------
const ContributeForm: React.FC<{
  serverUrl: string;
  currentUser: string;
  fundContractId: string;
  communityInfo: api.CommunityInfo | null;
  reload?: () => Promise<void>;
}> = ({ serverUrl, currentUser, fundContractId, communityInfo, reload }) => {
  const t = useT();
  const symbol = t('currency.symbol', 'points');
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePay = async () => {
    const amount = Number(amountInput);
    if (!amount || amount <= 0) {
      setError(t('funds.amountPositive', 'Amount must be positive.'));
      return;
    }
    setSubmitting(true);
    try {
      await api.contribute(serverUrl, currentUser, fundContractId, currentUser, amount, communityInfo ?? undefined);
      if (reload) await reload();
      setAmountInput('');
      setError('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('funds.contributeFailed', 'Failed to record contribution.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.contributeCard}>
      <h3 className={styles.cardTitle}>{t('funds.contributeTitle', 'Contribute')}</h3>
      <div className={styles.contributeRow}>
        <input
          className={styles.input}
          type="number"
          min={1}
          step={1}
          aria-label={t('funds.contributeAmountLabel', 'Contribution amount in {symbol}', { symbol })}
          placeholder={t('funds.contributeAmountPlaceholder', 'Amount in {symbol}', { symbol })}
          value={amountInput}
          onChange={(e) => {
            setAmountInput(e.target.value);
            setError('');
            setSuccess(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handlePay();
          }}
        />
        <Button
          variant="primary"
          size="md"
          onClick={handlePay}
          loading={submitting}
          disabled={!amountInput || Number(amountInput) <= 0}
          leftIcon={<Heart size={16} />}
        >
          {t('funds.contributeAction', 'Contribute')}
        </Button>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {success && <p className={styles.successMsg}>{t('funds.contributeThanks', 'Thank you for your contribution!')}</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Contributions list
// ---------------------------------------------------------------------------
const ContributionsList: React.FC<{
  contributions: api.Contribution[];
  currentUser: string;
}> = ({ contributions, currentUser }) => {
  const t = useT();
  const symbol = t('currency.symbol', 'points');
  if (contributions.length === 0) {
    return <p className={styles.noData}>{t('funds.noContributions', 'No contributions yet. Be the first!')}</p>;
  }
  const sorted = [...contributions].sort((a, b) => b.timestamp - a.timestamp);
  const fmt = (ts: number) => new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const label = (id: string) => (id === currentUser ? t('funds.you', 'You') : id);

  return (
    <div className={styles.contributionsList}>
      {sorted.map((c) => (
        <div key={c.id} className={styles.contributionRow}>
          <div className={styles.contributorInfo}>
            <span className={`${styles.avatar} ${c.participantId === currentUser ? styles.avatarMe : ''}`} aria-hidden>
              {label(c.participantId)[0].toUpperCase()}
            </span>
            <div>
              <span className={styles.contributorName}>{label(c.participantId)}</span>
              <span className={styles.contributionTime}>{fmt(c.timestamp)}</span>
            </div>
          </div>
          <span className={styles.contributionAmount}>
            +{c.amount} <span className={styles.symbol}>{symbol}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Budget — allocation tab
// ---------------------------------------------------------------------------
const AllocationTab: React.FC<{
  serverUrl: string;
  currentUser: string;
  fundContractId: string;
  items: api.BudgetItem[];
  allocations: api.ParticipantAllocation[];
  myAllocation: Record<string, number>;
  onMyAllocationChange: (updated: Record<string, number>) => void;
  onSaveAllocation: () => Promise<void>;
  reload?: () => Promise<void>;
}> = ({ serverUrl, currentUser, fundContractId, items, allocations, myAllocation, onMyAllocationChange, onSaveAllocation, reload }) => {
  const t = useT();
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const used = api.myPointsUsed(allocations, currentUser);
  const remaining = api.TOTAL_POINTS - used;
  const overBudget = remaining < 0;

  const handleAdd = async () => {
    const name = inputText.trim();
    if (!name) return;
    setAdding(true);
    try {
      await api.addItem(serverUrl, currentUser, fundContractId, currentUser, name);
      if (reload) await reload();
      setInputText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('funds.addItemFailed', 'Failed to add item.'));
    } finally {
      setAdding(false);
    }
  };

  const handlePoints = (itemId: string, val: string) => {
    const n = val === '' ? 0 : Math.max(0, Math.min(api.TOTAL_POINTS, Number(val)));
    onMyAllocationChange({ ...myAllocation, [itemId]: n });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveAllocation();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.allocationTab}>
      <div className={`${styles.pointsCounter} ${overBudget ? styles.overBudget : remaining === 0 ? styles.exact : ''}`}>
        <span className={styles.pointsUsed}>{used}</span>
        <span className={styles.pointsSep}>{t('funds.pointsUsedOf', '/ {total} points used', { total: api.TOTAL_POINTS })}</span>
        {remaining > 0 && (
          <span className={styles.pointsRemaining}>{t('funds.pointsRemaining', '({n} remaining)', { n: remaining })}</span>
        )}
        {remaining === 0 && <span className={styles.pointsDone}>{t('funds.pointsFull', '✓ fully allocated')}</span>}
        {overBudget && (
          <span className={styles.pointsOver}>{t('funds.pointsOver', '({n} over limit!)', { n: Math.abs(remaining) })}</span>
        )}
      </div>

      <div className={styles.addForm}>
        <input
          className={styles.addInput}
          type="text"
          aria-label={t('funds.addItemLabel', 'Add a budget item')}
          placeholder={t('funds.addItemPlaceholder', 'Add a budget item…')}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <Button variant="primary" size="md" onClick={handleAdd} loading={adding} leftIcon={<Plus size={16} />}>
          {t('funds.addItemAction', 'Add')}
        </Button>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}

      {items.length === 0 ? (
        <p className={styles.noData}>{t('funds.noItems', 'No items yet. Add one above.')}</p>
      ) : (
        <div className={styles.itemList}>
          {items.map((item) => {
            const pts = myAllocation[item.id] ?? 0;
            const pct = api.TOTAL_POINTS > 0 ? (pts / api.TOTAL_POINTS) * 100 : 0;
            return (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <div className={styles.itemBarTrack}>
                    <div className={styles.itemBarFill} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                <div className={styles.pointsInput}>
                  <input
                    type="number"
                    min={0}
                    max={api.TOTAL_POINTS}
                    step={10}
                    className={styles.ptsField}
                    aria-label={t('funds.allocationPointsFor', 'Points for {name}', { name: item.name })}
                    value={pts === 0 ? '' : pts}
                    placeholder="0"
                    onChange={(e) => handlePoints(item.id, e.target.value)}
                  />
                  <span className={styles.ptsLabel}>{t('funds.ptsAbbrev', 'pts')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.saveRow}>
        <Button variant="primary" size="md" onClick={handleSave} loading={saving}>
          {t('funds.saveAllocationAction', 'Save allocation')}
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Budget — results tab
// ---------------------------------------------------------------------------
const ResultsTab: React.FC<{
  items: api.BudgetItem[];
  allocations: api.ParticipantAllocation[];
}> = ({ items, allocations }) => {
  const t = useT();
  const aggregated = useMemo(() => api.getAggregated(items, allocations), [items, allocations]);

  if (aggregated.length === 0) {
    return <p className={styles.noData}>{t('funds.noResults', 'No items yet. Add some in the My allocation tab.')}</p>;
  }

  return (
    <div className={styles.resultsTab}>
      <div className={styles.resultsList}>
        {aggregated.map((row, idx) => (
          <div key={row.item.id} className={styles.resultRow}>
            <span className={styles.resultRank}>#{idx + 1}</span>
            <div className={styles.resultInfo}>
              <div className={styles.resultNameRow}>
                <span className={styles.resultName}>{row.item.name}</span>
                <span className={styles.resultPct}>{row.percentage.toFixed(1)}%</span>
              </div>
              <div className={styles.resultBarTrack}>
                <div className={styles.resultBarFill} style={{ width: `${row.percentage}%` }} />
              </div>
            </div>
            <div className={styles.resultAmount}>
              <span className={styles.resultAmountValue}>{row.totalPoints}</span>
              <span className={styles.resultAmountSymbol}>{t('funds.ptsAbbrev', 'pts')}</span>
            </div>
          </div>
        ))}
      </div>
      <p className={styles.resultsNote}>
        {t('funds.resultsNote', 'Percentages are normalized across all items based on total points allocated.')}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
const FundingFlow: React.FC<FundingFlowProps> = ({ fundContractId, communityId, currentUser, serverUrl, onBack }) => {
  void communityId; // reserved: page resolves the community→fund mapping
  const t = useT();
  const symbol = t('currency.symbol', 'points');

  const [fund, setFund] = useState<api.FundState | null>(null);
  const [communityInfo, setCommunityInfo] = useState<api.CommunityInfo | null>(null);
  const [budgetState, setBudgetState] = useState<api.BudgetState | null>(null);
  const [myAllocation, setMyAllocation] = useState<Record<string, number>>({});
  const [budgetTab, setBudgetTab] = useState<'allocation' | 'results'>('allocation');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tracks whether we've seeded myAllocation from the server for this fund.
  // SSE reloads must NOT overwrite in-progress local edits.
  const myAllocationInitialized = useRef(false);
  useEffect(() => {
    myAllocationInitialized.current = false;
  }, [fundContractId]);

  // Always-current ref so handleSaveAllocation never needs myAllocation as a dep.
  const myAllocationRef = useRef(myAllocation);
  myAllocationRef.current = myAllocation;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fundState, info, budget] = await Promise.all([
        api.loadFund(serverUrl, currentUser, fundContractId),
        api.loadCommunityInfo(serverUrl, currentUser, fundContractId),
        api.loadBudget(serverUrl, currentUser, fundContractId),
      ]);
      setFund(fundState);
      setCommunityInfo(info);
      setBudgetState(budget);
      if (!myAllocationInitialized.current) {
        const mine = budget.allocations.find((a) => a.participantId === currentUser)?.allocation ?? {};
        setMyAllocation(mine);
        myAllocationInitialized.current = true;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('funds.loadFailed', 'Failed to load funding data.'));
    } finally {
      setLoading(false);
    }
  }, [serverUrl, currentUser, fundContractId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEventStream(
    'contract_write',
    useCallback(
      (event) => {
        if (event.contract === fundContractId) void load();
      },
      [fundContractId, load],
    ),
  );

  const handleSaveAllocation = useCallback(async () => {
    await api.saveMyAllocation(serverUrl, currentUser, fundContractId, myAllocationRef.current);
    await load();
  }, [serverUrl, currentUser, fundContractId, load]);

  const backButton = (
    <div className={styles.backRow}>
      <Button variant="ghost" size="md" onClick={onBack} leftIcon={<ArrowLeft size={16} />}>
        {t('funds.backToFunds', 'Back to funds')}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.activeFund}>
        {backButton}
        <div className={styles.stateBox}>
          <p className={styles.stateMessage}>{t('funds.loadingFund', 'Loading fund…')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.activeFund}>
        {backButton}
        <div className={styles.stateBox}>
          <AlertCircle size={28} className={styles.stateError} aria-hidden />
          <p className={`${styles.stateMessage} ${styles.stateError}`}>{error}</p>
          <Button variant="secondary" size="md" onClick={load}>
            {t('common.retry', 'Try again')}
          </Button>
        </div>
      </div>
    );
  }

  if (!fund || fund.config === null || !budgetState) {
    return (
      <div className={styles.activeFund}>
        {backButton}
        <div className={styles.stateBox}>
          <p className={styles.stateMessage}>{t('funds.notConfigured', 'This fund has not been set up yet.')}</p>
        </div>
      </div>
    );
  }

  const raised = api.totalRaised(fund.contributions);
  const myContrib = api.contributionByUser(fund.contributions, currentUser);
  const contributors = new Set(fund.contributions.map((c) => c.participantId)).size;

  const allocationsWithMine: api.ParticipantAllocation[] = [
    ...budgetState.allocations.filter((a) => a.participantId !== currentUser),
    { participantId: currentUser, allocation: myAllocation },
  ];

  return (
    <div className={styles.activeFund}>
      {backButton}

      {/* Fund header */}
      <div className={styles.descriptionCard}>
        <h2 className={styles.fundName}>{fund.config.name}</h2>
        {fund.config.description && <p className={styles.description}>{fund.config.description}</p>}
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Heart size={20} className={styles.statIcon} aria-hidden />
          <span className={styles.statValue}>{raised.toLocaleString()}</span>
          <span className={styles.statLabel}>{t('funds.statTotalRaised', 'Total raised ({symbol})', { symbol })}</span>
        </div>
        <div className={styles.statCard}>
          <Users size={20} className={styles.statIcon} aria-hidden />
          <span className={styles.statValue}>{contributors}</span>
          <span className={styles.statLabel}>{t('funds.statContributors', 'Contributors')}</span>
        </div>
        {fund.config.goal && (
          <div className={styles.statCard}>
            <Target size={20} className={styles.statIcon} aria-hidden />
            <span className={styles.statValue}>{fund.config.goal.toLocaleString()}</span>
            <span className={styles.statLabel}>{t('funds.statGoal', 'Goal ({symbol})', { symbol })}</span>
          </div>
        )}
        {myContrib > 0 && (
          <div className={`${styles.statCard} ${styles.statCardMe}`}>
            <Heart size={20} className={styles.statIcon} aria-hidden />
            <span className={styles.statValue}>{myContrib.toLocaleString()}</span>
            <span className={styles.statLabel}>{t('funds.statYourContribution', 'Your contribution')}</span>
          </div>
        )}
      </div>

      <ProgressBar raised={raised} goal={fund.config.goal ?? null} />

      <ContributeForm
        serverUrl={serverUrl}
        currentUser={currentUser}
        fundContractId={fundContractId}
        communityInfo={communityInfo}
        reload={load}
      />

      <div className={styles.historySection}>
        <h3 className={styles.cardTitle}>{t('funds.contributionsTitle', 'Contributions')}</h3>
        <ContributionsList contributions={fund.contributions} currentUser={currentUser} />
      </div>

      {/* Budget allocation section */}
      <div className={styles.sectionDivider}>
        <div className={styles.sectionDividerLine} />
        <span className={styles.sectionDividerLabel}>{t('funds.budgetAllocation', 'Budget allocation')}</span>
        <div className={styles.sectionDividerLine} />
      </div>

      <div className={styles.budgetSection}>
        <div className={styles.tabBar} role="tablist" aria-label={t('funds.budgetTabsLabel', 'Budget views')}>
          <button
            type="button"
            role="tab"
            id="budget-tab-allocation"
            aria-selected={budgetTab === 'allocation'}
            aria-controls="budget-panel-allocation"
            className={`${styles.tab} ${budgetTab === 'allocation' ? styles.activeTab : ''}`}
            onClick={() => setBudgetTab('allocation')}
          >
            <List size={16} aria-hidden /> {t('funds.tabAllocation', 'My allocation')}
          </button>
          <button
            type="button"
            role="tab"
            id="budget-tab-results"
            aria-selected={budgetTab === 'results'}
            aria-controls="budget-panel-results"
            className={`${styles.tab} ${budgetTab === 'results' ? styles.activeTab : ''}`}
            onClick={() => setBudgetTab('results')}
          >
            <PieChart size={16} aria-hidden /> {t('funds.tabResults', 'Results')}
          </button>
        </div>

        {budgetTab === 'allocation' && (
          <div role="tabpanel" id="budget-panel-allocation" aria-labelledby="budget-tab-allocation">
            <AllocationTab
              serverUrl={serverUrl}
              currentUser={currentUser}
              fundContractId={fundContractId}
              items={budgetState.items}
              allocations={allocationsWithMine}
              myAllocation={myAllocation}
              onMyAllocationChange={setMyAllocation}
              onSaveAllocation={handleSaveAllocation}
              reload={load}
            />
          </div>
        )}
        {budgetTab === 'results' && (
          <div role="tabpanel" id="budget-panel-results" aria-labelledby="budget-tab-results">
            <ResultsTab items={budgetState.items} allocations={allocationsWithMine} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FundingFlow;
