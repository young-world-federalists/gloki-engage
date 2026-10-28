// Scratch IBC-node stub for the S46 integration walk. Speaks the subset of the real API the
// server-side login + Digital Agent profile path uses: bare-boolean is_exist_agent,
// register_agent, get_contracts, deploy_contract / contract_write (ack id + SSE echo on
// /stream), contract_read (get_profile; anything else → null). State is in memory.
// Usage: node node-stub.cjs [port]   — agent 'a'×64 starts registered with a profile.
const http = require('http');
const PORT = Number(process.argv[2] || 3011);
const RETURNING = 'a'.repeat(64);

const agents = new Map(); // pk -> { contracts: [{id,name,contract}], profiles: {id: profile} }
agents.set(RETURNING, {
  contracts: [{ id: 'stub-profile-a', name: 'unique-gloki-engage-digital-agent-contract', contract: 'digital_agent_contract.py' }],
  profiles: { 'stub-profile-a': { displayName: 'Amara Walker', photo: '', country: 'KE', languages: ['en'] } },
});
const streams = new Set();
let seq = 0;
const log = [];

const send = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
};
const emit = (evt) => {
  setTimeout(() => { for (const s of streams) s.write(`data: ${JSON.stringify(evt)}\n\n`); }, 50);
};

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/stream') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' });
    res.write(': ok\n\n');
    streams.add(res);
    req.on('close', () => streams.delete(res));
    return;
  }
  if (url.pathname === '/__log') return send(res, 200, log);
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const json = body ? JSON.parse(body) : {};
    const parts = url.pathname.split('/').filter(Boolean); // ibc, app, pk, [cid, method]
    const action = url.searchParams.get('action');
    const pk = parts[2];
    log.push({ action, pk: pk && pk.slice(0, 8), method: parts[4] || null, values: json.values || null });
    const agent = agents.get(pk);
    switch (action) {
      case 'is_exist_agent': return send(res, 200, !!agent);
      case 'register_agent': agents.set(pk, agent || { contracts: [], profiles: {} }); return send(res, 200, true);
      case 'get_contracts': return send(res, 200, agent ? agent.contracts : []);
      case 'deploy_contract': {
        const a = agent || { contracts: [], profiles: {} };
        agents.set(pk, a);
        const id = `stub-${++seq}`;
        a.contracts.push({ id, name: json.name, contract: json.contract });
        emit({ action: 'deploy_contract', request: id, reply: id });
        return send(res, 200, id);
      }
      case 'contract_write': {
        const [, , , cid, method] = parts;
        const ack = `ack-${++seq}`;
        if (method === 'set_profile' && agent) {
          const v = json.values;
          agent.profiles[cid] = { displayName: v.display_name, photo: v.photo, country: v.country, languages: v.languages };
        }
        emit({ action: 'contract_write', contract: cid, request: ack, reply: null });
        return send(res, 200, ack);
      }
      case 'contract_read': {
        const [, , , cid, method] = parts;
        if (method === 'get_profile') return send(res, 200, (agent && agent.profiles[cid]) || null);
        return send(res, 200, null);
      }
      default: return send(res, 404, { error: `unknown action ${action}` });
    }
  });
}).listen(PORT, () => console.log(`stub on :${PORT}`));
