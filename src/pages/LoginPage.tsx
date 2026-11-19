import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Server, ArrowRight, Building2 } from 'lucide-react';
import { useT } from '../i18n';
import { Button, InfoDisclosure, LanguageSwitcher, StageStrip } from '../components/shared';
import OrganizationSignIn, { type OrganizationSignInInput } from '../components/organization/OrganizationSignIn';
import { saveOrganization, clearOrganization } from '../services/organizationActor';
import { notifyOrganizationChanged } from '../hooks/useOrganization';
import { isBeta, SHOW_LANGUAGES } from '../appMode';
import { getBetaDoor } from '../components/onboarding/betaDoor';
import { openNode } from '../services/ibc';
import { APPLICATION_SERVER_URL } from '../services/applicationServer';
import styles from './LoginPage.module.scss';

// The node the login suggests: the application account's own node.
const DEFAULT_SERVER_URL = APPLICATION_SERVER_URL;

interface LoginPageProps {
  /** S42 — beta only: the doors page renders this as its sign-in screen and owns "Back". */
  onBack?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack }) => {
  const { login, isLoading } = useAuth();
  const t = useT();
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [serverUrlHistory, setServerUrlHistory] = useState<string[]>(() => {
    const history = localStorage.getItem('serverUrlHistory');
    let historyArray: string[] = [];

    if (history) {
      try {
        historyArray = JSON.parse(history);
      } catch {
        historyArray = [];
      }
    }

    return historyArray.includes(DEFAULT_SERVER_URL)
      ? [DEFAULT_SERVER_URL, ...historyArray.filter(url => url !== DEFAULT_SERVER_URL)]
      : [DEFAULT_SERVER_URL, ...historyArray];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(() => localStorage.getItem('loginError'));
  const [serverUrlError, setServerUrlError] = useState<string | null>(null);
  const [orgOpen, setOrgOpen] = useState(false);
  // S43 (critique P1) — beta newcomer path. A door recorded on the doors page
  // means "I'm new": the node's page creates the identity; choosing another
  // node moves behind a disclosure.
  const door = isBeta ? getBetaDoor() : null;
  const newcomer = door !== null;
  const [showServer, setShowServer] = useState(!isBeta);

  // Clear the stored error after its initial value has been loaded into state.
  useEffect(() => {
    localStorage.removeItem('loginError');
  }, []);

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

  const isValid = serverUrl.length > 0 && validateServerUrl(serverUrl) === null;

  // Prepare the app's key for the chosen node before the click, so the click
  // opens the node's page at once (browsers allow a popup only right after a click).
  const prepareNode = (url: string) => {
    if (validateServerUrl(url) === null && url) openNode(url).catch(() => {});
  };
  useEffect(() => {
    prepareNode(DEFAULT_SERVER_URL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleServerUrlSelect = (url: string) => {
    setServerUrl(url);
    setShowHistory(false);
    prepareNode(url);
  };

  /**
   * S33 — organization sign-in. An organization signs in on its node like a
   * person does; what makes it an organization is the local record saved
   * alongside it, which `useOrganization` gates on.
   */
  const handleOrgLogin = async (input: OrganizationSignInInput) => {
    try {
      setLoginError(null);
      const url = serverUrl || DEFAULT_SERVER_URL;
      // Save the org record only AFTER login resolves. Writing it first meant a
      // reload or closed tab mid-init left `gloki.organization` with no `user`,
      // and the next PERSON to sign in inherited an organization session.
      await login(url);
      saveOrganization({ name: input.name.trim(), type: input.type, country: input.country });
      notifyOrganizationChanged();
    } catch (error) {
      // Don't strand a half-made organization session on a failed login.
      clearOrganization();
      notifyOrganizationChanged();
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };

  const signIn = async () => {
    try {
      setLoginError(null);
      // Signing in as a person clears any organization record left behind by
      // an abandoned org sign-in — otherwise this person would silently be
      // treated as an organization and find every stage blocked.
      clearOrganization();
      notifyOrganizationChanged();

      // Save server URL to history
      const newHistory = [serverUrl, ...serverUrlHistory.filter(url => url !== serverUrl)].slice(0, 10);
      setServerUrlHistory(newHistory);
      localStorage.setItem('serverUrlHistory', JSON.stringify(newHistory));

      await login(serverUrl);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };

  const handleLogin = async () => {
    if (isValid) await signIn();
  };

  const doorLead: Record<string, string> = {
    person: t('beta.node.door.person', 'Joining as a person. Gloki has no passwords: your node creates your identity with a passkey.'),
    organisation: t('beta.node.door.organisation', 'Joining as an organisation. Gloki has no passwords: your node creates your identity with a passkey.'),
    contributor: t('beta.node.door.contributor', 'Joining as a node contributor. Gloki has no passwords: your node creates your identity with a passkey.'),
  };

  return (
    <div className={`${styles.container} ${isBeta ? styles.containerBeta : ''}`}>
      <div className={styles.card}>
        {/* Pre-auth language switcher (a11y finding #11) — reachable before
            any English copy, so non-English speakers can switch first. */}
        {SHOW_LANGUAGES && (
          <div className={styles.langRow}>
            <LanguageSwitcher />
          </div>
        )}
        <div className={styles.header}>
          {/* Task-first: the login action is screen one; the warm-up explainer
              prose lives behind the (i) next to the title. */}
          <div className={styles.titleRow}>
            <h1>{isBeta ? t('beta.node.title', 'Your node') : t('login.title', 'Welcome to Gloki')}</h1>
            <InfoDisclosure
              className={styles.infoTrigger}
              size="md"
              label={t('login.help.title', 'How Gloki works')}
            >
              <div className={styles.helpBody}>
                <p>{t('login.help.node', 'Gloki has no passwords. Your node — your own digital agent on the network — keeps your identity, and you approve what Gloki does in your name with a passkey on your device. New here? Your node creates your identity.')}</p>
                <p>{t('login.help.server', 'The default node is already set for you. Use another one if you run your own.')}</p>
              </div>
            </InfoDisclosure>
          </div>
          <p>
            {newcomer && door
              ? doorLead[door]
              : isBeta
                ? t('beta.node.lead', 'Gloki has no passwords. Sign in on your node with your passkey, or create your identity there.')
                : t('login.subtitle', 'Global direct democracy — your voice, alongside people across the world.')}
          </p>
        </div>

        {/* The five governance stages — pipeline context before the user even
            logs in (Wave 5c). The login card's mobile padding is trimmed in
            LoginPage.module.scss so all five labelled stages fit at 360px.
            S42: hidden in the beta, which has no pipeline. */}
        {!isBeta && <StageStrip />}

        <div className={styles.form}>
          {isBeta && !showServer && (
            <Button type="button" variant="ghost" fullWidth onClick={() => setShowServer(true)} disabled={isLoading}>
              {t('beta.node.serverToggle', 'Use a different node')}
            </Button>
          )}
          {showServer && <div className={styles.inputGroup}>
            <label htmlFor="serverUrl">
              <Server size={20} />
              {t('login.node.label', 'Your node')}
              <span className={styles.fieldHint}>{t('login.node.hint', 'The default node is already selected. Most people never need to change this.')}</span>
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
                onBlur={() => {
                  setServerUrlError(validateServerUrl(serverUrl));
                  prepareNode(serverUrl);
                }}
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
          </div>}

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

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleLogin}
            disabled={!isValid}
            loading={isLoading}
            rightIcon={!isLoading ? <ArrowRight size={20} /> : undefined}
            className={styles.loginButton}
          >
            {isLoading
              ? t('login.connecting', 'Connecting…')
              : newcomer
                ? t('beta.node.create', 'Create my identity on my node')
                : t('login.connect', 'Sign in with my node')}
          </Button>

          {/* S42 — beta: the doors page owns the way back. */}
          {onBack && (
            <Button type="button" variant="ghost" fullWidth onClick={onBack} disabled={isLoading}>
              {t('common.back', 'Back')}
            </Button>
          )}

          {/* S33 — the other kind of actor. Organizations don't deliberate or
              vote; they respond to mandates communities have already decided.
              Kept as a quiet secondary path so the person flow stays primary.
              S42: hidden in the beta — "organisation" is one of its doors. */}
          {!isBeta && <div className={styles.orgRow}>
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
          </div>}
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
