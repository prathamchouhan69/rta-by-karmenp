import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { redactText } from '../util/redact.js';

const require = createRequire(import.meta.url);
const MAX_OUTPUT = 128 * 1024;
const MAX_TEXT = 12_000;

function validateUrl(value, allowedDomains) {
  let url;
  try { url = new URL(String(value ?? '')); } catch { throw new Error('Provide a valid public HTTPS page URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443') {
    throw new Error('Only public HTTPS pages on the standard port can be read');
  }
  const hostname = url.hostname.toLowerCase();
  if (!allowedDomains.includes(hostname)) throw new Error('This page host is not on Flux’s public web allowlist');
  if (url.search || url.hash) throw new Error('Page URLs must not contain query parameters or fragments');
  let decodedPath;
  try { decodedPath = decodeURIComponent(url.pathname); } catch { throw new Error('Page URL path is malformed'); }
  if (redactText(decodedPath).text !== decodedPath) throw new Error('Page URL appears to contain sensitive information');
  return { url, source: `${url.origin}${url.pathname}` };
}

function runCli(bin, args, cwd, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...args], {
      cwd,
      env: { PATH: process.env.PATH || '', HOME: cwd, TMPDIR: cwd, LANG: 'C.UTF-8', AGENT_BROWSER_NO_VERSION_CHECK: '1' },
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    let output = '';
    let outputSize = 0;
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new Error('Public page reading timed out'));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      outputSize += chunk.length;
      if (outputSize > MAX_OUTPUT) {
        child.kill('SIGKILL');
        finish(new Error('Public page output exceeded the limit'));
        return;
      }
      output += chunk.toString('utf8');
    });
    child.on('error', () => finish(new Error('agent-browser could not be started')));
    child.on('close', (code) => {
      if (code !== 0) finish(new Error('agent-browser could not read this page'));
      else finish(null, output);
    });
  });
}

export function createAgentBrowserReader({ allowedDomains = [], run = runCli, executablePath = null } = {}) {
  const domains = [...new Set(allowedDomains.map((domain) => String(domain).trim().toLowerCase()).filter(Boolean))];
  if (!domains.length) return null;
  const bin = executablePath || require.resolve('agent-browser/bin/agent-browser.js');

  return async function readPublicPage(value) {
    const { url, source } = validateUrl(value, domains);
    const home = await mkdtemp(join(tmpdir(), 'flux-agent-browser-'));
    try {
      const args = [
        ...domains.flatMap((domain) => ['--allowed-domains', domain]),
        '--content-boundaries',
        '--max-output', String(MAX_TEXT),
        'read', url.href, '--timeout', '12000', '--json',
      ];
      const raw = await run(bin, args, home, 15_000);
      let result;
      try { result = JSON.parse(raw); } catch { throw new Error('agent-browser returned an invalid response'); }
      if (result?.success === false) throw new Error('agent-browser could not read this page');
      const data = result?.data ?? result;
      const text = data?.markdown ?? data?.text ?? data?.content;
      if (typeof text !== 'string' || !text.trim()) throw new Error('The page did not contain readable text');
      return { source, text: text.slice(0, MAX_TEXT), truncated: text.length > MAX_TEXT };
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  };
}
