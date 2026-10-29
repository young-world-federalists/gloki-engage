import React, { useState, useEffect, useEffectEvent, useRef } from 'react';
import { QrCode, Camera, CheckCircle } from 'lucide-react';
import styles from './JoinCommunity.module.scss';
import { Scanner } from '@yudiel/react-qr-scanner';
import { decodeCommunityInvitation } from '../../services/encodeDecode';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchContracts } from '../../store/slices/userSlice';
import { eventStreamService } from '../../services/eventStream';
import type { BlockchainEvent } from '../../services/eventStream';
import { useNavigate } from 'react-router-dom';
import { joinContract } from '../../services/api';
import { useT } from '../../i18n';
import { useAlert } from '../shared/useAlert';
import { Banner, Button } from '../shared';

// How long to wait for the community's node to confirm a join.
const JOIN_TIMEOUT_MS = 30000;

// No longer using CommunityInvite type; use plain object with server, agent, contract
const JoinCommunity: React.FC = () => {
  const t = useT();
  const { showAlert, alertElement } = useAlert();
  // The Digital Agent profile — the same id a community's creator registers
  // (CreateCommunityPage), so get_partners can resolve every member's name.
  const { publicKey, serverUrl, digitalAgentContractId } = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [scannedData, setScannedData] = useState<string>('');
  const [parsedInvite, setParsedInvite] = useState<{ server: string; agent: string; contract: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  // Store decoded data for display and editing
  const [decodedData, setDecodedData] = useState('');
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearJoinTimeout = () => {
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current);
      joinTimeoutRef.current = null;
    }
  };

  useEffect(() => clearJoinTimeout, []);

  const failJoin = (message: string) => {
    clearJoinTimeout();
    setIsJoining(false);
    setJoinSuccess(false);
    showAlert(
      t('join.failed', "Couldn't join this community: {error}", { error: message }),
      { title: t('common.errorTitle', 'Something went wrong') },
    );
  };

  // Joined (or already a member): refresh the contract list, which now holds
  // the community, and go to the communities page.
  const finishJoin = async () => {
    clearJoinTimeout();
    setIsResetting(true);
    setIsJoining(false);
    try {
      if (serverUrl && publicKey) {
        await dispatch(fetchContracts());
      }
    } catch (error) {
      console.error('Failed to refresh contracts:', error);
      // Continue with the flow even if refresh fails
    }
    setScannedData('');
    setParsedInvite(null); // This disables the button
    setDecodedData('');
    setJoinSuccess(false);
    setIsResetting(false);
    navigate('/identity/communities', { replace: true });
  };

  // The joiner's node confirms the join with `a2a_connect`; `reply: false`
  // means the community's node refused it.
  const onA2AConnect = useEffectEvent((event: BlockchainEvent) => {
    if (!isJoining || !parsedInvite) return;
    if (event.reply === false) {
      failJoin(t('join.refused', 'The community refused the request.'));
      return;
    }
    void finishJoin();
  });
  useEffect(() => {
    const handler = (event: BlockchainEvent) => onA2AConnect(event);
    eventStreamService.addEventListener('a2a_connect', handler);
    return () => eventStreamService.removeEventListener('a2a_connect', handler);
  }, []);

  const handleScanQR = () => {
    setShowScanner(true);
  };

  const handleScanResult = (codes: { rawValue: string }[]) => {
    if (codes && codes.length > 0 && codes[0].rawValue) {
      const result = codes[0].rawValue;
      setShowScanner(false);
      
      // Use the shared decoding function
      const decoded = decodeCommunityInvitation(result);
      if (decoded) {
        setParsedInvite(decoded);
        setDecodedData(JSON.stringify(decoded, null, 2));
      } else {
        setParsedInvite(null);
        setDecodedData('');
      }
      setScannedData(result);
    }
  };

  const handleScannerClose = () => {
    setShowScanner(false);
  };

  const handleJoinCommunity = async () => {
    if (!parsedInvite || !serverUrl || !publicKey) return;
    const { server, agent, contract } = parsedInvite;
    if (!server || !agent || !contract) return;
    setIsJoining(true);
    setJoinSuccess(false);
    try {
      const ack = await joinContract({
        serverUrl: serverUrl,
        publicKey: publicKey,
        address: server,
        agent,
        contract,
        profile: digitalAgentContractId || ''
      });
      // Only a real join returns an ack id and confirms later. null means this
      // agent already holds the contract; a demo join resolves at once.
      if (typeof ack !== 'string') {
        await finishJoin();
        return;
      }
      // Otherwise the button stays busy until a2a_connect arrives.
      clearJoinTimeout();
      joinTimeoutRef.current = setTimeout(() => {
        failJoin(t('join.timeout', "The community's server didn't answer. Check the join details and try again."));
      }, JOIN_TIMEOUT_MS);
    } catch (error) {
      failJoin(error instanceof Error ? error.message : String(error));
    }
  };

  // When user manually enters data, treat it as decoded JSON with only the three fields
  const handleManualInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setDecodedData(value);
    try {
      const parsed = JSON.parse(value);
      if (parsed.server && parsed.agent && parsed.contract) {
        setParsedInvite(parsed);
      } else {
        setParsedInvite(null);
      }
    } catch {
      setParsedInvite(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* The title renders in the AppHeader block (D3); the intro leads the content. */}
        <p className={styles.introLine}>{t('join.intro', 'To join a community, ask a member to share their invite QR code or credential JSON with you. You can scan the code or paste the JSON below.')}</p>
        <div className={styles.scanSection}>
          <div className={styles.scanArea}>
            {showScanner ? (
              <div className={styles.scannerModal}>
                <Scanner
                  onScan={handleScanResult}
                  onError={() => {}}
                  styles={{ container: { width: '100%', height: 320, background: '#000' } }}
                />
                <Button variant="secondary" onClick={handleScannerClose} style={{ marginTop: 16 }}>
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            ) : (
              <div className={styles.qrPlaceholder}>
                <QrCode size={64} />
                <p>{t('join.scannerPlaceholder', 'QR code scanner placeholder')}</p>
                <Button variant="primary" leftIcon={<Camera size={20} />} onClick={handleScanQR}>
                  {t('join.scanQr', 'Scan QR Code')}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.joinActions}>
          <Button
            variant="primary"
            leftIcon={<CheckCircle size={16} />}
            loading={isJoining || isResetting}
            disabled={
              !parsedInvite ||
              !parsedInvite?.server ||
              !parsedInvite?.agent ||
              !parsedInvite?.contract
            }
            onClick={handleJoinCommunity}
          >
            {isJoining
              ? t('join.joining', 'Joining… Waiting for confirmation')
              : isResetting
                ? t('join.resetting', 'Resetting…')
                : t('join.cta', 'Join Community')}
          </Button>
        </div>

        <div className={styles.manualInputSection}>
          <h3>{t('join.manualTitle', 'Manual Input')}</h3>
          <p className={styles.tutorialText}>
            {t('join.manualHelp', 'Paste the community credential JSON that was shared with you. It should contain three fields:')}{' '}
            <code>server</code>, <code>agent</code>, <code>contract</code>.
          </p>
          <div className="form-group">
            <label htmlFor="qrData">{t('join.credentialsLabel', 'Community Credentials (JSON)')}</label>
            <textarea
              id="qrData"
              value={decodedData}
              onChange={handleManualInput}
              placeholder={'{\n  "server": "https://...",\n  "agent": "abc123...",\n  "contract": "def456..."\n}'}
              className={`input-field ${styles.scrollXNoWrap}`}
              rows={6}
            />
          </div>
        </div>

        {joinSuccess && (
          <Banner tone="success" title={t('join.successTitle', 'Successfully joined community!')}>
            {t('join.successBody', 'You can now access the community from your Communities page.')}
          </Banner>
        )}

        {scannedData && !parsedInvite && (
          <Banner tone="error" title={t('join.invalidTitle', 'Invalid QR Code Data')}>
            {t('join.invalidBody', "The scanned data doesn't contain valid community credentials.")}
          </Banner>
        )}
      </div>
      {alertElement}
    </div>
  );
};

export default JoinCommunity; 