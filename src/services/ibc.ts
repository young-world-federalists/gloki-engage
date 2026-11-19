// The app's one connection to the user's own ibc node (ibc-go), through the
// @ouripoupko/ibc client. The app never holds the user's keys: it has a key of
// its own, and the user approves on their node's page (a popup) whatever the
// app may not do silently. THE ONLY module that talks to IbcApp.
//
// A contract is read from the user's own copy when they hold it (as a partner
// or a guest); otherwise from its host's public copy. A write needs a copy, so
// writing to a contract the user doesn't hold joins it as a guest first.
import {
  Ibc,
  IbcApp,
  approve,
  checksum,
  needsApproval,
  toHex,
  type CallOptions,
  type ContractSummary,
  type IbcEvent,
  type Sources,
} from '@ouripoupko/ibc';

/** Where a contract lives: a node, and the agent there whose copy is read. */
export interface ContractHost {
  server: string;
  agent: string;
}

/** What it takes to join a contract: its Solidity source, and its root contract's name in it. */
export interface ContractSource {
  source: Sources;
  contractName: string;
}

let app: IbcApp | null = null;
let held: Map<string, ContractSummary> | null = null;
let heldLoading: Promise<Map<string, ContractSummary>> | null = null;

const eventListeners = new Set<(event: IbcEvent) => void>();
let detach: (() => void) | null = null;

const sameAgent = (a: string | null | undefined, b: string | null | undefined): boolean =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();

/**
 * The client's error, as the app shows it: a revert reads as the contract
 * wrote it. Approvals open straight from clicks (see Approvals), but a popup
 * blocker can still refuse the window: the user clicks again to continue.
 */
function contractError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (message === 'the approval window was blocked') {
    return new Error('Your browser blocked the approval window of your node. Click again to continue.', { cause: err });
  }
  return new Error(message.replace(/^execution reverted: /, ''), { cause: err });
}

// ─── Approvals ──────────────────────────────────────────────────────────────
//
// The node's approval page opens only straight from a click: browsers block a
// window opened later. So an approval opens at once only within the click's
// own task. One that comes after anything was waited for (a reply from a
// node, an approval before it) first asks the user for one more click, in a
// short dialog (ApprovalPrompt) whose button opens the page.

let clickTask = false;
let approvedSinceClick = false;

if (typeof document !== 'undefined') {
  document.addEventListener(
    'click',
    (e) => {
      if (!e.isTrusted) return;
      clickTask = true;
      setTimeout(() => {
        clickTask = false;
      });
      if (!(e.target instanceof Element && e.target.closest('[data-approval-prompt]'))) approvedSinceClick = false;
    },
    true,
  );
}

/**
 * Shows the dialog asking for one more click; `again` when the user approved
 * something since their own click. Its button calls `proceed` from its click;
 * closing it calls `dismiss`.
 */
type ApprovalPrompter = (again: boolean, proceed: () => void, dismiss: () => void) => void;
let prompter: ApprovalPrompter | null = null;

/** The dialog that asks for one more click (one at a time; ApprovalPrompt mounts it). */
export function setApprovalPrompter(p: ApprovalPrompter | null): void {
  prompter = p;
}

/** Runs `open` (which opens the node's approval page) straight from a click: this one, or the dialog's. */
function approval<T>(open: () => Promise<T>): Promise<T> {
  const run = () => open().finally(() => {
    approvedSinceClick = true;
  });
  if (clickTask || !prompter) return run();
  const ask = prompter;
  return new Promise<T>((resolve, reject) => {
    ask(
      approvedSinceClick,
      () => run().then(resolve, reject),
      () => reject(new Error('the approval window was closed')),
    );
  });
}

function connected(): IbcApp {
  if (!app?.ibc || !app.agent) throw new Error('Not signed in to a node');
  return app;
}

function attachStream(a: IbcApp): void {
  detach?.();
  detach = a.onEvent((event) => {
    if (event.action === 'deploy_contract' || event.action === 'join_contract') held = null;
    for (const listener of eventListeners) listener(event);
  });
}

// ─── Session ────────────────────────────────────────────────────────────────

/**
 * Prepares the app's key for a node (made the first time, kept by the
 * browser). Call it before the sign-in click, so the click opens the node's
 * page at once: browsers allow a popup only right after a click.
 */
export async function openNode(node: string): Promise<void> {
  const origin = new URL(node).origin;
  if (app?.node === origin) return;
  detach?.();
  detach = null;
  app?.ibc?.close();
  held = null;
  app = await IbcApp.open(origin);
}

/** From a click: the user signs in (or creates an identity) on their node. Resolves with their agent id. */
export async function signIn(node: string): Promise<string> {
  await openNode(node);
  const agent = checksum(await approval(() => app!.connect()).catch((err) => {
    throw contractError(err);
  }));
  attachStream(app!);
  return agent;
}

/** Restores a session without asking: true if this browser's app still acts for `agent` on `node`. */
export async function resume(node: string, agent: string): Promise<boolean> {
  await openNode(node);
  if (!app?.ibc || !sameAgent(app.agent, agent)) return false;
  attachStream(app);
  return true;
}

/** The signed-in agent's id, or null. */
export function currentAgent(): string | null {
  return app?.agent ? checksum(app.agent) : null;
}

/** Forgets the session in this browser: the app's key and the agent it acted for. */
export async function signOut(): Promise<void> {
  detach?.();
  detach = null;
  app?.ibc?.close();
  app = null;
  held = null;
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('ibc-app');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

// ─── Contracts the user holds ───────────────────────────────────────────────

/** The user's contracts on their node (as a partner or a guest). */
export async function myContracts(refresh = false): Promise<ContractSummary[]> {
  return [...(await holdings(refresh)).values()];
}

async function holdings(refresh = false): Promise<Map<string, ContractSummary>> {
  if (held && !refresh) return held;
  if (!heldLoading) {
    heldLoading = connected().ibc!.contracts()
      .then((list) => {
        held = new Map(list.map((c) => [c.id, c]));
        return held;
      })
      .finally(() => {
        heldLoading = null;
      });
  }
  return heldLoading;
}

async function holds(contract: string): Promise<boolean> {
  return (await holdings()).has(contract);
}

// ─── Calls ──────────────────────────────────────────────────────────────────

/** A read: of the user's own copy if they hold the contract, otherwise of `host`'s public copy. */
export async function read(
  contract: string,
  method: string,
  values: Record<string, unknown> = {},
  { at, host }: CallOptions & { host?: ContractHost } = {},
): Promise<unknown> {
  try {
    if (await holds(contract)) return await ownRead(contract, method, values, { at });
    if (host) return await politePublicRead(host, contract, method, values, { at });
  } catch (err) {
    throw contractError(err);
  }
  throw new Error('no such contract');
}

/** A read of the user's copy: silent if they allowed it, otherwise approved on their node's page. */
async function ownRead(contract: string, method: string, values: Record<string, unknown>, { at }: CallOptions): Promise<unknown> {
  const a = connected();
  try {
    return await a.ibc!.read(contract, method, values, { at });
  } catch (err) {
    if (!needsApproval(err)) throw err;
  }
  const { value } = await approval(() => approve(a.node, { type: 'read', contract, method, values, ...(at ? { at } : {}), appKey: appKeyOf(a) }));
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 1 && 'error' in value) {
    throw new Error(String(value.error));
  }
  return value;
}

const appKeyOf = (a: IbcApp): string => toHex(a.ibc!.appKey!.publicKey);

// A node limits public reads per client (a burst of 20, then 10 a second).
// Pages read the same things from several components at once, so identical
// public reads within a moment share one request; and a refused one waits
// and tries again.
const PUBLIC_READ_SHARE_MS = 2000;
const recentPublicReads = new Map<string, { at: number; value: Promise<unknown> }>();

function politePublicRead(
  host: ContractHost,
  contract: string,
  method: string,
  values: Record<string, unknown>,
  { at }: CallOptions,
): Promise<unknown> {
  const key = JSON.stringify([host.server, host.agent, contract, at ?? '', method, values]);
  const recent = recentPublicReads.get(key);
  if (recent && Date.now() - recent.at < PUBLIC_READ_SHARE_MS) return recent.value;
  const value = retriedPublicRead(host, contract, method, values, { at });
  recentPublicReads.set(key, { at: Date.now(), value });
  value.catch(() => recentPublicReads.delete(key));
  return value;
}

async function retriedPublicRead(
  host: ContractHost,
  contract: string,
  method: string,
  values: Record<string, unknown>,
  { at }: CallOptions,
): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await Ibc.publicRead(host.server, host.agent, contract, method, values, { at });
    } catch (err) {
      const busy = /too many public reads|busy with public reads/.test(err instanceof Error ? err.message : '');
      if (!busy || attempt >= 6) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
}

/** A public read of `host`'s copy: no signature, no session needed. */
export async function publicRead(
  host: ContractHost,
  contract: string,
  method: string,
  values: Record<string, unknown> = {},
  { at }: CallOptions = {},
): Promise<unknown> {
  try {
    return await politePublicRead(host, contract, method, values, { at });
  } catch (err) {
    throw contractError(err);
  }
}

/**
 * A transaction, signed silently by the user's node if they allowed it, or
 * approved on their node's page. Resolves with the function's result. When
 * the user doesn't hold the contract yet, `guest` joins it first.
 */
export async function write(
  contract: string,
  method: string,
  values: Record<string, unknown> = {},
  { at, guest }: CallOptions & { guest?: { host: ContractHost } & ContractSource } = {},
): Promise<unknown> {
  const a = connected();
  if (guest && !(await holds(contract))) await join(contract, guest.host, guest, { guest: true });
  try {
    try {
      return await a.ibc!.writeSilently(contract, method, values, { at });
    } catch (err) {
      if (!needsApproval(err)) throw err;
    }
    const { reply, error } = await approval(() => approve(a.node, { type: 'call', contract, method, values, ...(at ? { at } : {}), appKey: appKeyOf(a) }));
    if (typeof error === 'string' && error) throw new Error(error);
    return reply;
  } catch (err) {
    throw contractError(err);
  } finally {
    for (const key of recentPublicReads.keys()) if (key.includes(`"${contract}"`)) recentPublicReads.delete(key);
  }
}

/**
 * Deploys a contract from its source: the user's node compiles it and the
 * user approves. `isPublic` proposes letting anyone read the user's copy.
 * Resolves with the new contract's id once it is live.
 */
export async function deploy({
  source,
  contractName,
  name,
  args,
  isPublic = false,
}: ContractSource & { name: string; args: Record<string, unknown>; isPublic?: boolean }): Promise<string> {
  try {
    const a = connected();
    return await approval(() => a.deploy({ source, contract: contractName, name, constructor: args, public: isPublic }));
  } catch (err) {
    throw contractError(err);
  } finally {
    held = null;
  }
}

/**
 * Joins a contract through a member's node, as a partner or as a guest; the
 * user approves on their node's page. Resolves once the user's node holds it.
 */
export async function join(
  contract: string,
  host: ContractHost,
  { source, contractName }: ContractSource,
  { guest = false }: { guest?: boolean } = {},
): Promise<void> {
  const a = connected();
  const outcomes = new Map<string, IbcEvent>();
  let waiting: { id: string; resolve: (event: IbcEvent) => void } | null = null;
  const off = a.onEvent((event) => {
    if (event.action !== 'join_contract') return;
    if (waiting && event.request === waiting.id) waiting.resolve(event);
    else outcomes.set(event.request, event);
  });
  try {
    const id = await approval(() => a.join(contract, host.server, host.agent, { source, contractName, guest })).catch((err) => {
      throw contractError(err);
    });
    const outcome = outcomes.get(id) ?? (await new Promise<IbcEvent>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('The join did not complete in time')), 120_000);
      waiting = { id, resolve: (event) => { clearTimeout(timer); resolve(event); } };
    }));
    if (outcome.reply !== true) throw new Error(outcome.reason || 'The join was refused');
  } finally {
    off();
    held = null;
  }
}

// ─── Events ─────────────────────────────────────────────────────────────────

/** Every event of the contracts the user holds. Returns a function that stops listening. */
export function onEvent(listener: (event: IbcEvent) => void): () => void {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

export type { IbcEvent };
