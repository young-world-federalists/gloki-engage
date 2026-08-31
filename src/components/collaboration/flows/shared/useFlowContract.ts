import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { setContract, setDeploying, clearDeploying, buildFlowContractsScope } from './flowContractsSlice';
import { deployContract, joinContract, contractWrite, contractRead } from '../../../../services/api';
import { normalizeStageContract } from '../../../../services/contracts/initiative';
import { isDemoContract } from '../../../../services/demo/demoRegistry';
import type { IMethod } from '../../../../services/interfaces';

interface UseFlowContractResult {
  contractId: string | null;
  isReady: boolean;
  isDeploying: boolean;
  hasError: boolean;
  errorMessage: string;
  statusMessage: string;
  retry: () => void;
}

const DEPLOY_TIMEOUT_MS = 30_000;

export function useFlowContract(
  instanceId: string,
  contractName: string,
  contractFileName: string,
  contractCode: string,
  parentContractId?: string,
  stageKey?: string,
): UseFlowContractResult {
  const dispatch = useAppDispatch();
  const contractId = useAppSelector((s) => s.flowContracts.contracts[instanceId] ?? null);
  const isDeploying = useAppSelector((s) => s.flowContracts.deploying[instanceId] ?? false);
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const storageScope = useAppSelector((s) => s.flowContracts.storageScope);
  const expectedScope = serverUrl && publicKey ? buildFlowContractsScope(serverUrl, publicKey) : null;
  const scopeReady = expectedScope !== null && storageScope === expectedScope;
  const attempted = useRef(false);
  const failed = useRef(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const isShared = !!parentContractId && !!stageKey;
  // A real (non-demo) parent contract implements every stage's methods on
  // itself — there is no separate sub-contract to look up or deploy, unlike
  // demo parents which always split concerns across per-stage sub-contracts.
  // Resolving straight to the parent id here is what lets every stage
  // component work unchanged against a single consolidated real contract.
  const isSingleContract = isShared && !!parentContractId && !isDemoContract(parentContractId);

  const retry = useCallback(() => {
    failed.current = false;
    attempted.current = false;
    setHasError(false);
    setErrorMessage('');
    setStatusMessage('');
  }, []);

  // ── Stale deploying recovery ────────────────────────────────────────────────
  // If Redux says deploying but we haven't attempted in this mount, the flag
  // is stale from a previous session/mount. Clear it so we can retry.
  useEffect(() => {
    if (isDeploying && !attempted.current && !contractId) {
      console.log(`[FlowContract] Clearing stale deploying flag for ${instanceId}`);
      dispatch(clearDeploying({ instanceId }));
    }
  }, [isDeploying, contractId, instanceId, dispatch]);

  // ── Single-contract mode (real, non-demo parents) ───────────────────────────
  // No lookup, no deploy, no network call — the parent IS the contract every
  // stage reads/writes. Just point instanceId at it directly.
  useEffect(() => {
    if (!isSingleContract || !parentContractId) return;
    if (contractId === parentContractId) return;
    dispatch(setContract({ instanceId, contractId: parentContractId }));
  }, [isSingleContract, parentContractId, contractId, instanceId, dispatch]);

  // ── Per-user deploy mode ───────────────────────────────────────────────────
  useEffect(() => {
    if (isShared) return;
    if (contractId || isDeploying || attempted.current || failed.current) return;
    if (!serverUrl || !publicKey) return;
    if (!scopeReady) return;

    attempted.current = true;
    dispatch(setDeploying({ instanceId }));
    setStatusMessage('Deploying contract to the network...');
    console.log(`[FlowContract] Deploying ${contractName} for ${instanceId}...`);

    // Deploy timeout — force error if promise doesn't settle
    const timeoutId = setTimeout(() => {
      if (!failed.current) {
        console.warn(`[FlowContract] TIMEOUT: Deploy of ${contractName} for ${instanceId} did not complete within ${DEPLOY_TIMEOUT_MS / 1000}s`);
        failed.current = true;
        setHasError(true);
        setErrorMessage('Setup timed out. The server may be slow or offline. Try again later.');
        setStatusMessage('');
        dispatch(clearDeploying({ instanceId }));
      }
    }, DEPLOY_TIMEOUT_MS);

    deployContract({
      serverUrl,
      publicKey,
      name: `${contractName}_${instanceId}`,
      contract: contractFileName,
      code: contractCode,
    })
      .then((response) => {
        clearTimeout(timeoutId);
        if (failed.current) return;
        const id = (response as { id?: string }).id || (response as string);
        setStatusMessage('');
        dispatch(setContract({ instanceId, contractId: id }));
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (failed.current) return;
        console.error(`[FlowContract] ERROR deploying ${contractName} for ${instanceId}:`, err);
        failed.current = true;
        setHasError(true);
        setErrorMessage(`Failed to deploy: ${err instanceof Error ? err.message : 'Unknown error'}. Check your server connection.`);
        setStatusMessage('');
        dispatch(clearDeploying({ instanceId }));
      });

    return () => { clearTimeout(timeoutId); };
  }, [isShared, instanceId, contractId, isDeploying, serverUrl, publicKey, contractName, contractFileName, contractCode, dispatch, hasError, scopeReady]);

  // ── Shared contract mode (demo parents — sub-contract lookup/deploy) ────────
  useEffect(() => {
    if (!isShared || isSingleContract) return;
    if (contractId || isDeploying || attempted.current || failed.current) return;
    if (!serverUrl || !publicKey || !parentContractId) return;
    if (!scopeReady) return;

    attempted.current = true;
    dispatch(setDeploying({ instanceId }));
    setStatusMessage('Looking up existing contract...');
    console.log(`[FlowContract] Setting up shared ${contractName} for ${instanceId} (parent: ${parentContractId}, stage: ${stageKey})...`);

    // Deploy timeout
    const timeoutId = setTimeout(() => {
      if (!failed.current) {
        console.warn(`[FlowContract] TIMEOUT: Shared setup of ${contractName} for ${instanceId} did not complete within ${DEPLOY_TIMEOUT_MS / 1000}s`);
        failed.current = true;
        setHasError(true);
        setErrorMessage('Setup timed out. The server may be slow or offline. Try again later.');
        setStatusMessage('');
        dispatch(clearDeploying({ instanceId }));
      }
    }, DEPLOY_TIMEOUT_MS);

    (async () => {
      try {
        // Probe the parent directly for `get_stage_contract`. On communities
        // created before the stage-contract registry was added, this method
        // does not exist and the server throws — treat that as unsupported
        // and fail fast WITHOUT deploying. The previous code deployed a
        // fresh sub-contract first and only discovered the missing registry
        // afterwards, leaving an orphan immutable contract on every visit.
        let stored: ReturnType<typeof normalizeStageContract>;
        try {
          const raw = await contractRead({
            serverUrl,
            publicKey,
            contractId: parentContractId,
            method: { name: 'get_stage_contract', values: { stage_key: stageKey } } as IMethod,
          });
          stored = normalizeStageContract(raw);
        } catch (err) {
          clearTimeout(timeoutId);
          if (failed.current) return;
          console.warn(`[FlowContract] Parent ${parentContractId} does not expose get_stage_contract for ${stageKey} — unsupported:`, err);
          failed.current = true;
          setHasError(true);
          setErrorMessage("This feature isn't available on this community — it was created before this feature was added. New communities support it.");
          setStatusMessage('');
          dispatch(clearDeploying({ instanceId }));
          return;
        }
        if (failed.current) return; // Timeout already fired

        const existing = stored ?? undefined;

        if (existing?.contractId) {
          if (existing.address && existing.agent) {
            setStatusMessage('Joining shared contract...');
            // Sub-contract exists → join it
            try {
              await joinContract({
                serverUrl,
                publicKey,
                address: existing.address,
                agent: existing.agent,
                contract: existing.contractId,
              });
            } catch {
              // May fail if already joined — that's OK
            }
          }
          if (failed.current) return;
          setStatusMessage('');
          dispatch(setContract({ instanceId, contractId: existing.contractId }));
        } else {
          setStatusMessage('No existing contract found — deploying new one...');
          // No sub-contract yet → deploy and store info on parent
          const response = await deployContract({
            serverUrl,
            publicKey,
            name: `${contractName}_${instanceId}`,
            contract: contractFileName,
            code: contractCode,
          });
          if (failed.current) return;

          const newId = (response as { id?: string }).id || (response as string);
          setStatusMessage('Registering contract with community...');

          // Register once via a dedicated contract method so generic detail writes cannot overwrite it.
          const registration = await contractWrite({
            serverUrl,
            publicKey,
            contractId: parentContractId,
            method: {
              name: 'register_stage_contract',
              values: {
                stage_key: stageKey,
                contract_id: newId,
                address: serverUrl,
                agent: publicKey,
              },
            } as IMethod,
          });
          if (failed.current) return;

          const registrationObj = registration && typeof registration === 'object'
            ? registration as { contractId?: string; address?: string; agent?: string; error?: string }
            : undefined;

          if (registrationObj?.error) {
            clearTimeout(timeoutId);
            if (failed.current) return;
            console.warn(`[FlowContract] Registration rejected for ${stageKey} on ${parentContractId}:`, registrationObj.error);
            failed.current = true;
            setHasError(true);
            setErrorMessage(`This feature isn't available on this community or initiative. ${registrationObj.error}`);
            setStatusMessage('');
            dispatch(clearDeploying({ instanceId }));
            return;
          }

          // Old communities lack `register_stage_contract` entirely — the server
          // returns null. Without a registered sub-contract, every member would
          // silently deploy their own orphan, so fail fast with a clear message
          // rather than letting the orphan become the active contract.
          const registeredContractId = typeof registrationObj?.contractId === 'string' ? registrationObj.contractId : '';
          if (!registeredContractId) {
            clearTimeout(timeoutId);
            if (failed.current) return;
            console.warn(`[FlowContract] Registration missing contractId for ${stageKey} on ${parentContractId}. Old community?`, registrationObj);
            failed.current = true;
            setHasError(true);
            setErrorMessage("This feature isn't available on this community — it was created before this feature was added. New communities support it.");
            setStatusMessage('');
            dispatch(clearDeploying({ instanceId }));
            return;
          }

          const registered = registrationObj;
          const finalContractId = registeredContractId;

          if (registered?.contractId && registered.contractId !== newId && registered.address && registered.agent) {
            setStatusMessage('Joining shared contract...');
            try {
              await joinContract({
                serverUrl,
                publicKey,
                address: registered.address,
                agent: registered.agent,
                contract: registered.contractId,
              });
            } catch {
              // Another client may have won the registration race; join their contract.
            }
          }

          setStatusMessage('');
          dispatch(setContract({ instanceId, contractId: finalContractId }));
        }
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        if (failed.current) return;
        console.error(`[FlowContract] ERROR setting up shared contract for ${instanceId}:`, err);
        failed.current = true;
        setHasError(true);
        setErrorMessage(`Failed to set up: ${err instanceof Error ? err.message : 'Unknown error'}. Check your server connection.`);
        setStatusMessage('');
        dispatch(clearDeploying({ instanceId }));
      }
    })();

    return () => { clearTimeout(timeoutId); };
  }, [isShared, isSingleContract, instanceId, contractId, isDeploying, serverUrl, publicKey, parentContractId, stageKey, contractName, contractFileName, contractCode, dispatch, hasError, scopeReady]);

  return {
    contractId,
    isReady: contractId !== null,
    isDeploying,
    hasError,
    errorMessage,
    statusMessage,
    retry,
  };
}
