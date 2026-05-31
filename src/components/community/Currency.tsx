import React, { useState, useEffect } from 'react';
import { Coins, Send } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchUserBalance } from '../../store/slices/currencySlice';
import { useT } from '../../i18n';
import styles from './Currency.module.scss';
import { transfer } from '../../services/contracts/community';

interface CurrencyProps {
  communityId: string;
}

const Currency: React.FC<CurrencyProps> = ({ communityId }) => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { publicKey, serverUrl } = useAppSelector((state) => state.user);
  const { communityMembers, membersLoading } = useAppSelector((state) => state.communities);
  const { userBalance, parameters, loading: balanceLoading } = useAppSelector((state) => state.currency);

  const symbol = t('currency.symbol', 'points');

  // Read-only community-set daily rates (shown as observable info, not editable).
  const medianMintRate = parameters?.medians?.mint || 0;
  const medianBurnRate = parameters?.medians?.burn || 0;

  // Membership / loading guards.
  const allMembers: string[] = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : [];
  const isMember = publicKey && allMembers.includes(publicKey);
  const isMembersLoading = membersLoading[communityId] || false;

  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (publicKey && serverUrl && communityId) {
      dispatch(fetchUserBalance({ serverUrl, publicKey, contractId: communityId }));
    }
  }, [communityId, publicKey, serverUrl, dispatch]);

  const handlePayment = async () => {
    if (!selectedMember || !amount || parseFloat(amount) <= 0) return;

    const paymentAmount = parseFloat(amount);
    if (userBalance !== null && paymentAmount > userBalance) {
      alert(t('currency.insufficient', 'Insufficient balance'));
      return;
    }

    if (serverUrl && publicKey && communityId) {
      await transfer(serverUrl, publicKey, communityId, selectedMember, paymentAmount);
    }

    setAmount('');
    setSelectedMember('');
  };

  if (isMembersLoading || balanceLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{t('currency.title', 'Community Support Points')}</h2>
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
          <h2>{t('currency.title', 'Community Support Points')}</h2>
          <p>{t('currency.notMember', 'You are not yet a member of this community.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{t('currency.title', 'Community Support Points')}</h2>
        <p>{t('currency.subtitle', 'Signal what matters and support fellow members')}</p>
      </div>

      <div className={styles.explainer}>
        <div className={styles.explainerIcon}>
          <Coins size={24} />
        </div>
        <div className={styles.explainerText}>
          <h3>{t('currency.explainerTitle', 'How Support Points Work')}</h3>
          <p>
            {t(
              'currency.explainerBody1',
              'Support points are a shared way to signal what matters — back initiatives, support proposals, and send points to fellow members.',
            )}
          </p>
          <p>
            {t(
              'currency.explainerBody2',
              'The community sets how points flow. Check your balance below and send support to any member.',
            )}
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.balanceSection}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceHeader}>
              <Coins size={24} />
              <h3>{t('currency.yourBalance', 'Your Support Points')}</h3>
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
            <h3>{t('currency.sendTitle', 'Send Support')}</h3>
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
                <button onClick={handlePayment} className={`send-button ${styles.sendButton}`}>
                  <Send size={16} />
                  {t('currency.sendButton', 'Send Support')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Currency;
