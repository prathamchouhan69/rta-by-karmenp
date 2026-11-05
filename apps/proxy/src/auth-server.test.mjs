import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dataDirectory = await mkdtemp(join(tmpdir(), 'karm-auth-test-'));
process.env.ZOHO_MODE = 'mock';
process.env.HOST = '0.0.0.0';
process.env.DATA_DIR = dataDirectory;
process.env.SETUP_CODE = 'a-long-practice-owner-code';
process.env.SESSION_SECRET = 'test-session-secret-with-more-than-thirty-two-bytes';
delete process.env.APP_ORIGIN;
const { app } = await import(`./server.mjs?auth-test=${Date.now()}`);

after(async () => {
  await rm(dataDirectory, { recursive: true, force: true });
});

describe('remote API authentication contract', () => {
  it('requires owner login before returning business data', async () => {
    const health = await app.request('/api/v1/health');
    assert.equal((await health.json()).data.authenticated, true);

    const unauthenticated = await app.request('/api/v1/contacts');
    assert.equal(unauthenticated.status, 401);

    const rejectedLogin = await app.request('/api/v1/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setup_code: 'wrong-code' })
    });
    assert.equal(rejectedLogin.status, 401);

    const login = await app.request('/api/v1/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setup_code: process.env.SETUP_CODE })
    });
    assert.equal(login.status, 200);
    const { data: { access_token: token } } = await login.json();
    const authorized = await app.request('/api/v1/contacts', { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(authorized.status, 200);
    assert.equal((await authorized.json()).data.length, 3);
  });

  it('clears the failed-attempt limit after a successful login', async () => {
    const login = async (setupCode) => app.request('/api/v1/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setup_code: setupCode })
    });

    for (let attempt = 0; attempt < 7; attempt += 1) {
      assert.equal((await login('wrong-code')).status, 401);
    }
    assert.equal((await login(process.env.SETUP_CODE)).status, 200);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      assert.equal((await login('wrong-code')).status, 401);
    }
    assert.equal((await login('wrong-code')).status, 429);
  });
});
