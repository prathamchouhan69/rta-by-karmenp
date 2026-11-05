import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createAgentBrowserReader } from '../src/agents/browserReader.js';

test('public page reader uses agent-browser read with host and output boundaries', async () => {
  let invocation;
  const reader = createAgentBrowserReader({
    allowedDomains: ['example.com'],
    executablePath: '/agent-browser.js',
    run: async (...args) => {
      invocation = args;
      return JSON.stringify({ success: true, data: { text: 'Public page content' } });
    },
  });
  const result = await reader('https://example.com/article');
  assert.deepEqual(result, { source: 'https://example.com/article', text: 'Public page content', truncated: false });
  assert.equal(invocation[0], '/agent-browser.js');
  assert.ok(invocation[1].includes('--content-boundaries'));
  assert.ok(invocation[1].includes('--max-output'));
  assert.ok(invocation[1].includes('--allowed-domains'));
  assert.ok(invocation[1].includes('read'));
  assert.equal(invocation[1][invocation[1].indexOf('read') + 1], 'https://example.com/article');
  assert.equal(existsSync(invocation[2]), false, 'the per-call temporary home is cleaned after the read');
});

test('public page reader refuses unapproved, insecure, local, credentialed, custom-port and parameterized URLs before launch', async () => {
  let launches = 0;
  const reader = createAgentBrowserReader({
    allowedDomains: ['example.com'],
    executablePath: '/agent-browser.js',
    run: async () => { launches += 1; return '{}'; },
  });
  for (const url of [
    'http://example.com/',
    'https://sub.example.com/',
    'https://127.0.0.1/',
    'https://localhost/',
    'https://user:pass@example.com/',
    'https://example.com:8443/',
    'https://example.com/?q=search',
    'https://example.com/#section',
    'https://example.com/ABCDE1234F',
  ]) await assert.rejects(reader(url), /HTTPS|allowlist|query parameters|sensitive information/);
  assert.equal(launches, 0);
});

test('public page reader refuses malformed responses and bounds text returned to Flux', async () => {
  const invalid = createAgentBrowserReader({
    allowedDomains: ['example.com'],
    executablePath: '/agent-browser.js',
    run: async () => 'not json',
  });
  await assert.rejects(invalid('https://example.com/'), /invalid response/);

  const bounded = createAgentBrowserReader({
    allowedDomains: ['example.com'],
    executablePath: '/agent-browser.js',
    run: async () => JSON.stringify({ success: true, data: { text: 'x'.repeat(12_100) } }),
  });
  const result = await bounded('https://example.com/');
  assert.equal(result.text.length, 12_000);
  assert.equal(result.truncated, true);
});
