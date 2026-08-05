import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Key, Server, ArrowRight, RefreshCw, Building2 } from 'lucide-react';
import { useT } from '../i18n';
import { InfoDisclosure, LanguageSwitcher, StageStrip } from '../components/shared';
import OrganizationSignIn, { type OrganizationSignInInput } from '../components/organization/OrganizationSignIn';
import { saveOrganization, clearOrganization } from '../services/organizationActor';
import { notifyOrganizationChanged } from '../hooks/useOrganization';
import styles from './LoginPage.module.scss';

const DEFAULT_SERVER_URL = 'https://gdi.gloki.contact';

/** A fresh 64-char identity key — the shape `validatePublicKey` requires. */
function generateKeyString(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const t = useT();
  const [publicKey, setPublicKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [serverUrlHistory, setServerUrlHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [publicKeyError, setPublicKeyError] = useState<string | null>(null);
  const [serverUrlError, setServerUrlError] = useState<string | null>(null);
  const [orgOpen, setOrgOpen] = useState(false);

  // Check for stored error messages on component mount
  useEffect(() => {
    const storedError = localStorage.getItem('loginError');
    if (storedError) {
      setLoginError(storedError);
      localStorage.removeItem('loginError'); // Clear the stored error
    }
  }, []);

  useEffect(() => {
    // Default server URL
    const defaultServer = 'https://gdi.gloki.contact';

    // Load server URL history from localStorage
    const history = localStorage.getItem('serverUrlHistory');
    let historyArray: string[] = [];

    if (history) {
      try {
        historyArray = JSON.parse(history);
      } catch (error) {
        historyArray = [];
      }
    }

    // Always ensure default server is in the list
    if (!historyArray.includes(defaultServer)) {
      historyArray = [defaultServer, ...historyArray];
    } else {
      // Move default server to the top if it's already in the list
      historyArray = [defaultServer, ...historyArray.filter(url => url !== defaultServer)];
    }

    setServerUrlHistory(historyArray);
    if (!serverUrl) {
      setServerUrl(defaultServer);
    }
  }, []);

  const validatePublicKey = (value: string): string | null => {
    if (value.length === 0) return null;
    if (!/^[A-Za-z0-9]{64}$/.test(value))
      return t('login.key.error', 'Your identity key must be exactly 64 alphanumeric characters (letters and digits only).');
    return null;
  };

  const validateServerUrl = (value: string): string | null => {
    if (value.length === 0) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:')
        return t('login.server.errorProtocol', 'Server URL must use http or https.');
      return null;
    } catch {
      return t('login.server.errorInvalid', 'Please enter a valid URL (e.g. https://your-server.com).');
    }
  };

  useEffect(() => {
    const pkErr = validatePublicKey(publicKey);
    const srvErr = validateServerUrl(serverUrl);
    setIsValid(
      publicKey.length > 0 && pkErr === null &&
      serverUrl.length > 0 && srvErr === null
    );
  }, [publicKey, serverUrl]);

  const generateRandomKey = () => {
    setPublicKey(generateKeyString());
  };

  const handleServerUrlSelect = (url: string) => {
    setServerUrl(url);
    setShowHistory(false);
  };

  /**
   * S33 — organization sign-in. An organization still needs a key + server to
   * reach the network (auth is key-based for every actor), so we mint one the
   * same way the person flow does; what makes it an organization is the local
   * record saved alongside it, which `useOrganization` gates on.
   */
  const handleOrgLogin = async (input: OrganizationSignInInput) => {
    try {
      setLoginError(null);
      const key = generateKeyString();
      const url = serverUrl || DEFAULT_SERVER_URL;
      saveOrganization({ name: input.name.trim(), type: input.type, country: input.country });
      notifyOrganizationChanged();
      await login(key, url);
    } catch (error) {
      // Don't strand a half-made organization session on a failed login.
      clearOrganization();
      notifyOrganizationChanged();
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };

  const handleLogin = async () => {
    if (isValid) {
      try {
        setLoginError(null);

        // Save server URL to history
        const newHistory = [serverUrl, ...serverUrlHistory.filter(url => url !== serverUrl)].slice(0, 10);
        setServerUrlHistory(newHistory);
        localStorage.setItem('serverUrlHistory', JSON.stringify(newHistory));

        await login(publicKey, serverUrl);
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Pre-auth language switcher (a11y finding #11) — reachable before
            any English copy, so non-English speakers can switch first. */}
        <div className={styles.langRow}>
          <LanguageSwitcher />
        </div>
        <div className={styles.header}>
          {/* Task-first: the login action is screen one; the warm-up explainer
              prose lives behind the (i) next to the title. */}
          <div className={styles.titleRow}>
            <h1>{t('login.title', 'Welcome to Gloki')}</h1>
            <InfoDisclosure
              className={styles.infoTrigger}
              size="md"
              label={t('login.help.title', 'How Gloki works')}
            >
              <div className={styles.helpBody}>
                <p>{t('login.help.keys', 'Gloki uses a key instead of a password. This key is your identity across every community — generate a fresh one below, or paste an existing key to reconnect.')}</p>
                <p>{t('login.help.server', 'The server connects you to a Gloki network. The default is already set for you.')}</p>
              </div>
            </InfoDisclosure>
          </div>
          <p>{t('login.subtitle', 'Global direct democracy — your voice, alongside people across the world.')}</p>
        </div>

        {/* The five governance stages — pipeline context before the user even
            logs in (Wave 5c). The login card's mobile padding is trimmed in
            LoginPage.module.scss so all five labelled stages fit at 360px. */}
        <StageStrip />

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="publicKey">
              <Key size={20} />
              {t('login.key.label', 'Your Identity Key')}
              <span className={styles.fieldHint}>{t('login.key.hint', "A 64-character code that's yours alone — your identity across every community. New here? Tap generate.")}</span>
            </label>
            <div className={styles.inputWithButton}>
              <input
                id="publicKey"
                type="text"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                onBlur={() => setPublicKeyError(validatePublicKey(publicKey))}
                placeholder={t('login.key.placeholder', 'Enter your public key')}
                className="input-field"
              />
              <button
                type="button"
                onClick={generateRandomKey}
                className={styles.generateButton}
                title={t('login.generate', 'Generate a new identity key')}
                aria-label={t('login.generate', 'Generate a new identity key')}
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {publicKeyError && <div className={styles.fieldError} role="alert">{publicKeyError}</div>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="serverUrl">
              <Server size={20} />
              {t('login.server.label', 'Server URL')}
              <span className={styles.fieldHint}>{t('login.server.hint', "The default network is already selected. Most people never need to change this.")}</span>
            </label>
            <div
              className={styles.inputWithDropdown}
              onBlur={(e) => {
                // Close only when focus leaves the field + dropdown entirely, so keyboard
                // users can Tab into the history options without the list vanishing.
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setShowHistory(false);
              }}
            >
              <input
                id="serverUrl"
                type="url"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setShowHistory(false);
                }}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setServerUrlError(validateServerUrl(serverUrl))}
                placeholder={t('login.server.placeholder', 'https://your-server.com')}
                className="input-field"
                autoComplete="off"
              />
              {showHistory && serverUrlHistory.length > 0 && (
                <div className={styles.historyDropdown}>
                  {serverUrlHistory.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      className={styles.historyItem}
                      // onMouseDown fires before the input's blur (mouse, browser-safe);
                      // onClick covers keyboard activation (Enter/Space) once focused.
                      onMouseDown={() => handleServerUrlSelect(url)}
                      onClick={() => handleServerUrlSelect(url)}
                    >
                      {url}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {serverUrlError && <div className={styles.fieldError} role="alert">{serverUrlError}</div>}
          </div>

          {loginError && (
            <div className={`${styles.errorMessage} ${loginError.includes('server') ? styles.serverError : styles.generalError}`} role="alert">
              <div className={styles.errorIcon} aria-hidden="true">⚠️</div>
              <div className={styles.errorContent}>
                <div className={styles.errorTitle}>
                  {loginError.includes('connect to the server') || loginError.includes('unreachable') ? t('login.error.connection', 'Connection Error') :
                   loginError.includes('recognize the API') || loginError.includes('incorrect') ? t('login.error.invalidServer', 'Invalid Server') : t('login.error.generic', 'Login Error')}
                </div>
                <div className={styles.errorDescription}>{loginError}</div>
                {(loginError.includes('unreachable') || loginError.includes('connection')) && (
                  <button
                    onClick={() => setLoginError(null)}
                    className={styles.retryButton}
                  >
                    {t('common.retry', 'Try again')}
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={!isValid || isLoading}
            className={styles.loginButton}
          >
            <span>{isLoading ? t('login.connecting', 'Connecting…') : t('login.getStarted', 'Get Started')}</span>
            {!isLoading && <ArrowRight size={20} />}
          </button>

          {/* S33 — the other kind of actor. Organizations don't deliberate or
              vote; they respond to mandates communities have already decided.
              Kept as a quiet secondary path so the person flow stays primary. */}
          <div className={styles.orgRow}>
            <span className={styles.orgDivider}>{t('login.or', 'or')}</span>
            <button
              type="button"
              className={styles.orgButton}
              onClick={() => setOrgOpen(true)}
              disabled={isLoading}
            >
              <Building2 size={18} aria-hidden />
              {t('login.orgCta', 'Sign in as an organization')}
            </button>
            <p className={styles.orgHint}>
              {t('login.orgHint', 'For bodies that want to endorse or act on finished mandates — not to take part in the vote.')}
            </p>
          </div>
        </div>
      </div>

      <OrganizationSignIn
        isOpen={orgOpen}
        onClose={() => setOrgOpen(false)}
        onSubmit={handleOrgLogin}
        submitting={isLoading}
      />
    </div>
  );
};

export default LoginPage;
