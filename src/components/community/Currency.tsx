import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Coins, Send, TrendingUp, TrendingDown, Star, Plus } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchUserBalance } from '../../store/slices/currencySlice';
import { useEventStream } from '../../hooks/useEventStream';
import { useT } from '../../i18n';
import styles from './Currency.module.scss';
import {
  transfer,
  setParameters,
  getAccountDetails,
  getAllAllocations,
  setAllocation,
  getDistributionStatus,
  distributeCommons,
} from '../../services/contracts/community';
import type { IDistributionStatus } from '../../services/contracts/community';
import { useAlert } from '../shared/useAlert';
import { Button, InfoDisclosure } from '../shared';
import { contractRead, contractWrite, deployContract } from '../../services/api';
import fundingContractSrc from '../../assets/contracts/funding_flow_contract.py?raw';
import FundingFlow, {
  FundingSetupDialog,
  type FundingSetupConfig,
} from '../collaboration/flows/funding/FundingFlow';

interface CurrencyProps {
  communityId: string;
}

// Funds are allocated against a fixed 1000-point budget per member.
const ALLOCATION_BUDGET = 1000;
// The commons treasury is a reserved account key in the contract.
const COMMONS_ACCOUNT = 'centralAccount';

const Currency: React.FC<CurrencyProps> = ({ communityId }) => {
  const t = useT();
  const { showAlert, alertElement } = useAlert();
  const dispatch = useAppDispatch();
  const { publicKey, serverUrl } = useAppSelector((state) => state.user);
  const { communityMembers, membersLoading } = useAppSelector((state) => state.communities);
  const { userBalance, parameters, loading: balanceLoading } = useAppSelector((state) => state.currency);

  const symbol = t('currency.symbol', 'points');

  // Read-only community-set daily rates (the community takes the median of members' preferences).
  const medianMintRate = parameters?.medians?.mint || 0;
  const medianBurnRate = parameters?.medians?.burn || 0;

  // This member's own stored monetary-policy preferences (the community medians them).
  const userMintPreference = parameters?.parameters?.mint || 0;
  const userBurnPreference = parameters?.parameters?.burn || 0;
  const userCommonsMintPreference = parameters?.parameters?.commons_mint || 0;

  // Membership / loading guards.
  const allMembers: string[] = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : [];
  const isMember = publicKey && allMembers.includes(publicKey);
  const isMembersLoading = membersLoading[communityId] || false;

  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');

  // Monetary-policy preference inputs (empty = "use stored value").
  const [mintPreference, setMintPreference] = useState('');
  const [burnPreference, setBurnPreference] = useState('');
  const [commonsMintPreference, setCommonsMintPreference] = useState('');
  const [mintFocused, setMintFocused] = useState(false);
  const [burnFocused, setBurnFocused] = useState(false);
  const [commonsMintFocused, setCommonsMintFocused] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Fund list + allocation state.
  const [accountDetails, setAccountDetails] = useState<Record<string, { type: string; balance: number }>>({});
  const [allAllocations, setAllAllocations] = useState<Record<string, Record<string, number>>>({});
  const [distributionStatus, setDistributionStatus] = useState<IDistributionStatus | null>(null);
  const [myAllocation, setMyAllocation] = useState<Record<string, number>>({});
  const [allocationLoading, setAllocationLoading] = useState(true);
  const [allocationSaving, setAllocationSaving] = useState(false);
  const [distributing, setDistributing] = useState(false);
  // A row click opens the per-fund detail (FundingFlow); back clears it.
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  // fund account name -> its funding-flow contract id (persisted on the community
  // as `fund_<name>` properties when a fund is created).
  const [fundContractMap, setFundContractMap] = useState<Record<string, string>>({});
  const [setupOpen, setSetupOpen] = useState(false);
  const myAllocationInitialized = useRef(false);
  const myAllocationRef = useRef(myAllocation);
  myAllocationRef.current = myAllocation;

  // Clear the preference inputs whenever fresh parameters arrive (placeholder shows stored value).
  useEffect(() => {
    if (parameters) {
      setMintPreference('');
      setBurnPreference('');
      setCommonsMintPreference('');
    }
  }, [parameters]);

  // True once any preference input differs from the stored value.
  const hasPreferenceChanges =
    (mintPreference !== '' && mintPreference !== userMintPreference.toString()) ||
    (burnPreference !== '' && burnPreference !== userBurnPreference.toString()) ||
    (commonsMintPreference !== '' && commonsMintPreference !== userCommonsMintPreference.toString());

  useEffect(() => {
    if (publicKey && serverUrl && communityId) {
      dispatch(fetchUserBalance({ serverUrl, publicKey, contractId: communityId }));
    }
  }, [communityId, publicKey, serverUrl, dispatch]);

  // Re-initialise the allocation editor when switching communities.
  useEffect(() => {
    myAllocationInitialized.current = false;
    setAllocationLoading(true);
  }, [communityId]);

  const loadAllocationData = useCallback(async () => {
    if (!publicKey || !serverUrl || !communityId) return;
    try {
      const [details, allAllocs, status, properties] = await Promise.all([
        getAccountDetails(serverUrl, publicKey, communityId),
        getAllAllocations(serverUrl, publicKey, communityId),
        getDistributionStatus(serverUrl, publicKey, communityId),
        contractRead({
          serverUrl,
          publicKey,
          contractId: communityId,
          method: { name: 'get_properties', values: {} },
        }),
      ]);
      setAccountDetails(details);
      setAllAllocations(allAllocs);
      setDistributionStatus(status);
      // Build "fund account name -> funding contract id" from `fund_<name>` keys.
      const props = (properties && typeof properties === 'object' ? properties : {}) as Record<string, unknown>;
      const map: Record<string, string> = {};
      for (const [key, value] of Object.entries(props)) {
        if (key.startsWith('fund_') && typeof value === 'string') {
          map[key.slice('fund_'.length)] = value;
        }
      }
      setFundContractMap(map);
      if (!myAllocationInitialized.current) {
        setMyAllocation(allAllocs[publicKey] ?? {});
        myAllocationInitialized.current = true;
      }
    } catch (e) {
      console.error('Failed to load allocation data:', e);
    } finally {
      setAllocationLoading(false);
    }
  }, [publicKey, serverUrl, communityId]);

  useEffect(() => {
    void loadAllocationData();
  }, [loadAllocationData]);

  useEventStream(
    'contract_write',
    useCallback(
      (event) => {
        if (event.contract === communityId) void loadAllocationData();
      },
      [communityId, loadAllocationData],
    ),
  );

  const handlePayment = async () => {
    if (!selectedMember || !amount || parseFloat(amount) <= 0) return;

    const paymentAmount = parseFloat(amount);
    if (userBalance !== null && paymentAmount > userBalance) {
      showAlert(
        t('currency.insufficientBody', "You don't have enough points to send that amount."),
        { title: t('currency.insufficient', 'Insufficient balance') },
      );
      return;
    }

    if (serverUrl && publicKey && communityId) {
      await transfer(serverUrl, publicKey, communityId, selectedMember, paymentAmount);
      dispatch(fetchUserBalance({ serverUrl, publicKey, contractId: communityId }));
      await loadAllocationData();
    }

    setAmount('');
    setSelectedMember('');
  };

  const handleUpdatePreferences = async () => {
    if (!serverUrl || !publicKey || !communityId) return;

    // Use the edited value where present, otherwise keep the stored one.
    const mintValue = mintPreference !== '' ? parseFloat(mintPreference) : userMintPreference;
    const burnValue = burnPreference !== '' ? parseFloat(burnPreference) : userBurnPreference;
    const commonsMintValue =
      commonsMintPreference !== '' ? parseFloat(commonsMintPreference) : userCommonsMintPreference;

    if (isNaN(mintValue) || isNaN(burnValue) || isNaN(commonsMintValue)) {
      showAlert(
        t('funds.policyInvalidBody', 'Please enter valid numbers for the mint, burn, and commons minting rates.'),
        { title: t('funds.policyInvalidTitle', 'Invalid rates') },
      );
      return;
    }

    setSavingPreferences(true);
    try {
      await setParameters(serverUrl, publicKey, communityId, mintValue, burnValue, commonsMintValue);
      dispatch(fetchUserBalance({ serverUrl, publicKey, contractId: communityId }));
    } catch (error) {
      console.error('Failed to update parameters:', error);
      showAlert(
        t('funds.policySaveFailedBody', 'Could not save your preferences. Please try again.'),
        { title: t('funds.policySaveFailedTitle', 'Save failed') },
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleRevertPreferences = () => {
    setMintPreference('');
    setBurnPreference('');
    setCommonsMintPreference('');
    setMintFocused(false);
    setBurnFocused(false);
    setCommonsMintFocused(false);
  };

  // Share of the commons each account would receive, from the community's pooled allocations.
  const collectivePercentages = useMemo(() => {
    const totals: Record<string, number> = {};
    let grandTotal = 0;
    for (const memberAlloc of Object.values(allAllocations)) {
      for (const [account, points] of Object.entries(memberAlloc)) {
        totals[account] = (totals[account] ?? 0) + points;
        grandTotal += points;
      }
    }
    if (grandTotal === 0) return {} as Record<string, number>;
    return Object.fromEntries(Object.entries(totals).map(([acc, pts]) => [acc, (pts / grandTotal) * 100]));
  }, [allAllocations]);

  const totalAllocated = useMemo(
    () => Object.values(myAllocation).reduce((s, v) => s + v, 0),
    [myAllocation],
  );

  const fundAccounts = useMemo(
    () =>
      Object.entries(accountDetails)
        .filter(([, info]) => info.type === 'fund')
        .map(([name, info]) => ({ name, ...info })),
    [accountDetails],
  );

  const commonsBalance = accountDetails[COMMONS_ACCOUNT]?.balance ?? 0;
  const isOverBudget = totalAllocated > ALLOCATION_BUDGET;
  const selectedFundContractId = selectedFundId ? fundContractMap[selectedFundId] : undefined;

  const handleSetAccountPoints = (account: string, raw: string) => {
    const points = Math.max(0, Math.round(Number(raw) || 0));
    setMyAllocation((prev) => ({ ...prev, [account]: points }));
  };

  const handleSaveAllocation = useCallback(async () => {
    if (!publicKey || !serverUrl || !communityId) return;
    setAllocationSaving(true);
    try {
      await setAllocation(serverUrl, publicKey, communityId, myAllocationRef.current);
      await loadAllocationData();
    } catch (e) {
      console.error('Failed to save allocation:', e);
      showAlert(
        t('funds.allocationSaveFailedBody', 'Could not save your allocation. Please try again.'),
        { title: t('funds.allocationSaveFailedTitle', 'Save failed') },
      );
    } finally {
      setAllocationSaving(false);
    }
  }, [publicKey, serverUrl, communityId, showAlert, t, loadAllocationData]);

  const handleDistribute = async () => {
    if (!publicKey || !serverUrl || !communityId) return;
    setDistributing(true);
    try {
      await distributeCommons(serverUrl, publicKey, communityId);
      await loadAllocationData();
    } catch (e) {
      console.error('Failed to distribute:', e);
      showAlert(
        t('funds.distributeFailedBody', 'Could not pay the commons out to the funds. Please try again.'),
        { title: t('funds.distributeFailedTitle', 'Payment failed') },
      );
    } finally {
      setDistributing(false);
    }
  };

  // Deploy a per-fund funding contract, wire it to the community, register the
  // fund account, and persist the account-name -> contract-id mapping so the
  // list can open the detail. Dual write keeps balances in sync.
  const handleCreateFund = async (config: FundingSetupConfig) => {
    if (!serverUrl || !publicKey || !communityId) return;
    try {
      const { id } = await deployContract({
        serverUrl,
        publicKey,
        name: config.name,
        contract: 'funding_flow_contract.py',
        code: fundingContractSrc,
      });
      await contractWrite({
        serverUrl,
        publicKey,
        contractId: id,
        method: { name: 'set_config', values: { config } },
      });
      await contractWrite({
        serverUrl,
        publicKey,
        contractId: id,
        method: {
          name: 'set_community_and_fund',
          values: {
            community_server: serverUrl,
            community_agent: publicKey,
            community_id: communityId,
            fund_account_name: config.name,
          },
        },
      });
      await contractWrite({
        serverUrl,
        publicKey,
        contractId: communityId,
        method: { name: 'create_fund_account', values: { name: config.name, owner: publicKey } },
      });
      await contractWrite({
        serverUrl,
        publicKey,
        contractId: communityId,
        method: { name: 'set_property', values: { key: `fund_${config.name}`, value: id } },
      });
      setSetupOpen(false);
      await loadAllocationData();
    } catch (e) {
      console.error('Failed to create fund:', e);
      showAlert(
        t('funds.createFailedBody', 'Could not create the fund. Please try again.'),
        { title: t('funds.createFailedTitle', 'Create failed') },
      );
    }
  };

  if (isMembersLoading || balanceLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{t('funds.title', 'Community Funds')}</h1>
          <p>
            {isMembersLoading
              ? t('currency.loadingMembers', 'Loading community members...')
              : t('currency.loadingBalance', 'Loading balance...')}
          </p>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{t('funds.title', 'Community Funds')}</h1>
          <p>{t('currency.notMember', 'You are not yet a member of this community.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1>{t('funds.title', 'Community Funds')}</h1>
          <InfoDisclosure
            label={t('funds.explainerTitle', 'How Community Funds Work')}
            title={t('funds.explainerTitle', 'How Community Funds Work')}
          >
            <p>
              {t(
                'funds.explainerBody1',
                'Support points are a shared way to signal what matters — back initiatives, support solutions, and send points to fellow members.',
              )}
            </p>
            <p>
              {t(
                'funds.explainerBody2',
                'The community also pools points into funds. Set your preferred minting rates, choose how much of the commons each fund should receive, and pay the commons out when it builds up.',
              )}
            </p>
          </InfoDisclosure>
        </div>
        <p>{t('funds.subtitle', 'Manage shared funds and signal what matters')}</p>
      </div>

      <div className={styles.content}>
        <div className={styles.balanceSection}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceHeader}>
              <Coins size={24} />
              <h2>{t('currency.yourBalance', 'Your Support Points')}</h2>
            </div>
            <div className={styles.balanceAmount}>
              <span className={styles.amount}>{userBalance !== null ? userBalance : '-'}</span>
              <span className={styles.currency}>{symbol}</span>
            </div>
            <div className={styles.balanceStats}>
              <div className={styles.statRow}>
                <div className={styles.stat}>
                  <span className={styles.label}>{t('currency.addedRate', 'Points added across the community')}</span>
                  <span className={styles.value}>{t('currency.perDay', '{n}/day', { n: medianMintRate })}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>{t('currency.removedRate', 'Points removed across the community')}</span>
                  <span className={styles.value}>{t('currency.perDay', '{n}/day', { n: medianBurnRate })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actionsSection}>
          <div className={styles.actionCard}>
            <h2>{t('currency.sendTitle', 'Send Support')}</h2>
            <div className={styles.paymentForm}>
              <div className="form-group">
                <label htmlFor="memberSelect">{t('currency.selectMember', 'Select Member')}</label>
                <select
                  id="memberSelect"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="input-field"
                >
                  <option value="">{t('currency.chooseMember', 'Choose a member...')}</option>
                  {allMembers
                    .filter((member) => member !== publicKey)
                    .map((member, index) => (
                      <option key={member} value={member}>
                        {t('currency.memberLabel', 'Member {n}', { n: index + 1 })} ({member.slice(0, 8)}...)
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="paymentAmount">{t('currency.amountLabel', 'Amount ({symbol})', { symbol })}</label>
                <input
                  id="paymentAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('currency.amountPlaceholder', 'Enter amount')}
                  className="input-field"
                  min="1"
                  max={userBalance || undefined}
                />
                <div className={styles.balanceInfo}>
                  <span>
                    {t('currency.available', 'Available: {n} {symbol}', {
                      n: userBalance !== null ? userBalance : '-',
                      symbol,
                    })}
                  </span>
                </div>
              </div>
              <div className="form-actions">
                <Button
                  variant="primary"
                  onClick={handlePayment}
                  className={styles.fullWidthAction}
                  leftIcon={<Send size={16} />}
                >
                  {t('currency.sendButton', 'Send Support')}
                </Button>
              </div>
            </div>
          </div>

          {/* ── Monetary-policy preferences ─────────────────────────────── */}
          <div className={styles.actionCard}>
            <div className={styles.titleRow}>
              <h2>{t('funds.policyTitle', 'Your Monetary Policy')}</h2>
              <InfoDisclosure
                label={t('funds.policyExplainerTitle', 'How monetary policy works')}
                title={t('funds.policyExplainerTitle', 'How monetary policy works')}
              >
                <p>
                  {t(
                    'funds.policyExplainerBody',
                    'Each member sets their preferred rates. The community uses the median across everyone, so no single member controls the money supply.',
                  )}
                </p>
              </InfoDisclosure>
            </div>
            <div className={styles.preferences}>
              <div className={styles.preferenceItem}>
                <label htmlFor="mintPreference">{t('funds.mintRateLabel', 'Mint rate ({symbol}/day)', { symbol })}</label>
                <input
                  id="mintPreference"
                  type="number"
                  value={mintPreference}
                  onChange={(e) => setMintPreference(e.target.value)}
                  onFocus={() => setMintFocused(true)}
                  onBlur={() => setMintFocused(false)}
                  placeholder={!mintFocused && mintPreference === '' ? userMintPreference.toString() : ''}
                  className={`input-field ${styles.inputField}`}
                  min="0"
                  step="any"
                />
                <TrendingUp size={16} className={styles.mintIcon} aria-hidden />
              </div>
              <div className={styles.preferenceItem}>
                <label htmlFor="burnPreference">{t('funds.burnRateLabel', 'Burn rate (% per day)')}</label>
                <input
                  id="burnPreference"
                  type="number"
                  value={burnPreference}
                  onChange={(e) => setBurnPreference(e.target.value)}
                  onFocus={() => setBurnFocused(true)}
                  onBlur={() => setBurnFocused(false)}
                  placeholder={!burnFocused && burnPreference === '' ? userBurnPreference.toString() : ''}
                  className={`input-field ${styles.inputField}`}
                  min="0"
                  max="100"
                  step="any"
                />
                <TrendingDown size={16} className={styles.burnIcon} aria-hidden />
              </div>
              <div className={styles.preferenceItem}>
                <label htmlFor="commonsMintPreference">
                  {t('funds.commonsMintLabel', 'Commons minting ({symbol}/day)', { symbol })}
                </label>
                <input
                  id="commonsMintPreference"
                  type="number"
                  value={commonsMintPreference}
                  onChange={(e) => setCommonsMintPreference(e.target.value)}
                  onFocus={() => setCommonsMintFocused(true)}
                  onBlur={() => setCommonsMintFocused(false)}
                  placeholder={
                    !commonsMintFocused && commonsMintPreference === '' ? userCommonsMintPreference.toString() : ''
                  }
                  className={`input-field ${styles.inputField}`}
                  min="0"
                  step="any"
                />
                <TrendingUp size={16} className={styles.mintIcon} aria-hidden />
              </div>
            </div>
            <div className={styles.preferenceActions}>
              <Button
                variant="primary"
                onClick={handleUpdatePreferences}
                disabled={!hasPreferenceChanges}
                loading={savingPreferences}
              >
                {t('funds.policySave', 'Save preferences')}
              </Button>
              <Button variant="secondary" onClick={handleRevertPreferences} disabled={!hasPreferenceChanges}>
                {t('funds.policyRevert', 'Revert changes')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Funds ───────────────────────────────────────────────────────── */}
      {selectedFundId && selectedFundContractId ? (
        <div className={styles.fundsCard}>
          <FundingFlow
            fundContractId={selectedFundContractId}
            communityId={communityId}
            currentUser={publicKey || ''}
            serverUrl={serverUrl || ''}
            onBack={() => {
              setSelectedFundId(null);
              // The demo seam emits no contract_write events, so a contribution
              // made in the detail won't have refreshed the list. Re-fetch the
              // fund balances, commons, allocation %s, and personal balance.
              void loadAllocationData();
              if (serverUrl && publicKey && communityId) {
                dispatch(fetchUserBalance({ serverUrl, publicKey, contractId: communityId }));
              }
            }}
          />
        </div>
      ) : (
      <div className={styles.fundsCard}>
        <div className={styles.fundsHeader}>
          <h2>{t('funds.fundsTitle', 'Funds')}</h2>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setSetupOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            {t('funds.createFund', 'Create fund')}
          </Button>
        </div>

        {allocationLoading ? (
          <p className={styles.fundsLoading}>{t('funds.loadingAccounts', 'Loading funds…')}</p>
        ) : (
          <ul className={styles.fundList}>
            {/* Commons treasury — the shared pool funds draw from. */}
            <li className={`${styles.fundRow} ${styles.fundRowCommons}`}>
              <span className={styles.fundName}>
                <Star size={14} className={styles.commonsIcon} aria-hidden />
                {t('funds.commonsTreasury', 'Commons Treasury')}
              </span>
              <span className={styles.fundBalance}>
                {t('funds.balanceWithSymbol', '{n} {symbol}', { n: commonsBalance, symbol })}
              </span>
              <span className={styles.fundPct}>
                {t('funds.communitySharePct', '{n}%', {
                  n: (collectivePercentages[COMMONS_ACCOUNT] ?? 0).toFixed(1),
                })}
              </span>
            </li>

            {fundAccounts.length === 0 ? (
              <li className={styles.noFunds}>
                {t('funds.noFunds', 'No funds yet. Funds let the community pool points toward a shared goal.')}
              </li>
            ) : (
              fundAccounts.map((fund) => (
                <li key={fund.name}>
                  <button
                    type="button"
                    className={styles.fundRowButton}
                    onClick={() => {
                      if (fundContractMap[fund.name]) {
                        setSelectedFundId(fund.name);
                      } else {
                        showAlert(
                          t('funds.detailUnavailableBody', 'This fund has no detail view yet.'),
                          { title: t('funds.detailUnavailableTitle', 'Fund detail unavailable') },
                        );
                      }
                    }}
                  >
                    <span className={styles.fundName} title={fund.name}>
                      {fund.name}
                    </span>
                    <span className={styles.fundBalance}>
                      {t('funds.balanceWithSymbol', '{n} {symbol}', { n: fund.balance, symbol })}
                    </span>
                    <span className={styles.fundPct}>
                      {t('funds.communitySharePct', '{n}%', {
                        n: (collectivePercentages[fund.name] ?? 0).toFixed(1),
                      })}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      )}

      {/* ── Community allocation ─────────────────────────────────────────── */}
      <div className={styles.allocationCard}>
        <div className={styles.allocationHeader}>
          <div className={styles.titleRow}>
            <h2>{t('funds.allocationTitle', 'Community Allocation')}</h2>
            <InfoDisclosure
              label={t('funds.allocationExplainerTitle', 'How allocation works')}
              title={t('funds.allocationExplainerTitle', 'How allocation works')}
            >
              <p>
                {t(
                  'funds.allocationExplainerBody',
                  'Spread up to {budget} points across the funds and the Commons Treasury. Everyone’s points are pooled — the community share of each fund decides what slice of the commons it receives when the commons is paid out.',
                  { budget: ALLOCATION_BUDGET },
                )}
              </p>
            </InfoDisclosure>
          </div>
          {distributionStatus && (
            <div className={styles.distributionStatus}>
              <span className={styles.statusText}>
                {t('funds.distributionStatus', 'Day {day} · {n} payments made', {
                  day: distributionStatus.days_since_creation,
                  n: distributionStatus.payment_count,
                })}
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={handleDistribute}
                disabled={!distributionStatus.can_distribute}
                loading={distributing}
                title={
                  distributionStatus.can_distribute
                    ? t('funds.payToFundsHint', 'Pay the commons balance out to the funds')
                    : t('funds.payToFundsUnavailable', 'No new payment available today')
                }
              >
                {t('funds.payToFunds', 'Pay to Funds')}
              </Button>
            </div>
          )}
        </div>

        {allocationLoading ? (
          <p className={styles.allocationLoading}>{t('funds.loadingAccounts', 'Loading funds…')}</p>
        ) : (
          <>
            <div className={`${styles.allocationRow} ${styles.allocationHeadings}`}>
              <span className={styles.colAccount}>{t('funds.colAccount', 'Account')}</span>
              <span className={styles.colPct}>{t('funds.colCommunityShare', 'Community %')}</span>
              <span className={styles.colPts}>{t('funds.colMyPoints', 'My points')}</span>
            </div>

            {/* Commons (treasury) row — pinned to the top, marked uniquely. */}
            <div className={`${styles.allocationRow} ${styles.allocationRowCommons}`}>
              <span className={styles.colAccount}>
                <Star size={13} className={styles.commonsIcon} aria-hidden />
                {t('funds.commonsTreasury', 'Commons Treasury')}
              </span>
              <span className={styles.colPct}>
                {t('funds.communitySharePct', '{n}%', {
                  n: (collectivePercentages[COMMONS_ACCOUNT] ?? 0).toFixed(1),
                })}
              </span>
              <input
                type="number"
                className={`input-field ${styles.colPtsInput}`}
                aria-label={t('funds.allocationPointsFor', 'Points for {name}', {
                  name: t('funds.commonsTreasury', 'Commons Treasury'),
                })}
                value={myAllocation[COMMONS_ACCOUNT] ?? 0}
                onChange={(e) => handleSetAccountPoints(COMMONS_ACCOUNT, e.target.value)}
                min={0}
                max={ALLOCATION_BUDGET}
              />
            </div>

            {/* Fund rows. */}
            {fundAccounts.length === 0 ? (
              <p className={styles.noFunds}>
                {t('funds.noFundsAllocation', 'No funds to allocate to yet. Create a fund to get started.')}
              </p>
            ) : (
              fundAccounts.map((fund) => (
                <div key={fund.name} className={styles.allocationRow}>
                  <span className={styles.colAccount} title={fund.name}>
                    {fund.name}
                  </span>
                  <span className={styles.colPct}>
                    {t('funds.communitySharePct', '{n}%', {
                      n: (collectivePercentages[fund.name] ?? 0).toFixed(1),
                    })}
                  </span>
                  <input
                    type="number"
                    className={`input-field ${styles.colPtsInput}`}
                    aria-label={t('funds.allocationPointsFor', 'Points for {name}', { name: fund.name })}
                    value={myAllocation[fund.name] ?? 0}
                    onChange={(e) => handleSetAccountPoints(fund.name, e.target.value)}
                    min={0}
                    max={ALLOCATION_BUDGET}
                  />
                </div>
              ))
            )}

            <div className={styles.allocationFooter}>
              <span className={`${styles.allocationTotal} ${isOverBudget ? styles.allocationTotalOver : ''}`}>
                {t('funds.allocationTotal', '{total} / {budget} points', {
                  total: totalAllocated,
                  budget: ALLOCATION_BUDGET,
                })}
              </span>
              <Button
                variant="primary"
                onClick={handleSaveAllocation}
                disabled={isOverBudget}
                loading={allocationSaving}
              >
                {t('funds.saveAllocation', 'Save my allocation')}
              </Button>
            </div>
          </>
        )}
      </div>

      <FundingSetupDialog
        isOpen={setupOpen}
        onDone={handleCreateFund}
        onCancel={() => setSetupOpen(false)}
      />

      {alertElement}
    </div>
  );
};

export default Currency;
