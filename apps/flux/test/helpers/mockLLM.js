import http from 'node:http';
// A pretend OpenAI-compatible gateway. `script[modelId]` is a list of behaviours consumed in order (last one repeats).
export async function startMockLLM({ script = {}, models = [] } = {}) {
  const calls = []; const used = {};
  const server = http.createServer(async (req, res) => {
    let body = ''; for await (const c of req) body += c;
    const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (req.url === '/models') return send(200, { data: models });
    const b = JSON.parse(body); calls.push({ auth: req.headers.authorization, body: b });
    const list = script[b.model] || [{ text: 'ok' }]; const i = Math.min(used[b.model] = (used[b.model] ?? -1) + 1, list.length - 1); const s = list[i];
    if (s.status) return send(s.status, { error: { message: s.message || 'fail', code: s.status } });
    send(200, { model: s.answeredBy || b.model, choices: [{ message: { content: s.text } }], usage: { prompt_tokens: 1, completion_tokens: 1 } });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, calls, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }) };
}
