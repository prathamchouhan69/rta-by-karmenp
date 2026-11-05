import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAuth, createLoginLimiter } from './auth.mjs';
import { ZohoApiError, ZohoBooksClient, selectZohoOrganization, validateZohoConfig } from './zoho-client.mjs';

describe('API authentication', () => {
  it('issues and verifies signed expiring bearer tokens', () => {
    const auth = createAuth({ setupCode: 'a-secure-owner-code', secret: 's'.repeat(48), required: true });
    assert.equal(auth.authenticateSetupCode('a-secure-owner-code'), true);
    assert.equal(auth.authenticateSetupCode('wrong-code'), false);
    const token = auth.issueToken().access_token;
    assert.equal(auth.verifyToken(token), true);
    const signatureStart = token.indexOf('.') + 1;
    const tamperedToken = `${token.slice(0, signatureStart)}${token[signatureStart] === 'a' ? 'b' : 'a'}${token.slice(signatureStart + 1)}`;
    assert.equal(auth.verifyToken(tamperedToken), false);
  });

  it('requires a strong session secret when enabled', () => {
    assert.throws(() => createAuth({ setupCode: 'a-secure-owner-code', secret: 'short', required: true }), /32 bytes/);
    assert.throws(() => createAuth({ setupCode: null, secret: null, required: true }), /required/);
  });

  it('limits consecutive failed logins without counting successful requests', () => {
    const limiter = createLoginLimiter({ maxAttempts: 2 });
    assert.equal(limiter.beginAttempt('client'), true);
    assert.equal(limiter.beginAttempt('client'), true);
    assert.equal(limiter.beginAttempt('client'), false);
    limiter.clear('client');
    assert.equal(limiter.beginAttempt('client'), true);
  });
});

describe('Zoho Books client', () => {
  const credentials = {
    ZOHO_DC: 'in',
    ZOHO_CLIENT_ID: 'client-id',
    ZOHO_CLIENT_SECRET: 'client-secret',
    ZOHO_REFRESH_TOKEN: 'refresh-token',
    ZOHO_ORG_ID: 'org-id'
  };

  it('validates configured data centers and required credentials', () => {
    assert.equal(validateZohoConfig(credentials).apiHost, 'www.zohoapis.in');
    assert.throws(() => validateZohoConfig({ ...credentials, ZOHO_DC: 'invalid' }), /Unsupported ZOHO_DC/);
    assert.throws(() => validateZohoConfig({ ...credentials, ZOHO_ORG_ID: '' }), /ZOHO_ORG_ID/);
  });

  it('selects only the configured organization', () => {
    const organizations = [{ organization_id: 'other' }, { organization_id: 'org-id', name: 'KARM Enterprises' }];
    assert.deepEqual(selectZohoOrganization(organizations, 'org-id'), organizations[1]);
    assert.equal(selectZohoOrganization(organizations, 'missing'), null);
    assert.equal(selectZohoOrganization(null, 'org-id'), null);
  });

  it('refreshes OAuth once after a 401 and retries the Books request', async () => {
    const calls = [];
    const fetchImpl = async (input, init) => {
      const url = new URL(input);
      calls.push({ url, init });
      if (url.hostname === 'accounts.zoho.in') {
        return new Response(JSON.stringify({ access_token: `access-${calls.length}`, expires_in: 3600 }), { status: 200 });
      }
      if (calls.filter((call) => call.url.hostname === 'www.zohoapis.in').length === 1) {
        return new Response(JSON.stringify({ code: 57, message: 'invalid token' }), { status: 401 });
      }
      return new Response(JSON.stringify({ code: 0, contacts: [{ contact_id: 'c1' }] }), { status: 200 });
    };
    const client = new ZohoBooksClient(credentials, fetchImpl);
    const result = await client.request('GET', 'contacts', { query: { per_page: 10 } });
    assert.equal(result.contacts[0].contact_id, 'c1');
    assert.equal(calls.filter((call) => call.url.hostname === 'accounts.zoho.in').length, 2);
    assert.equal(calls.at(-1).url.searchParams.get('organization_id'), 'org-id');
  });

  it('surfaces Zoho errors without returning response secrets', async () => {
    const fetchImpl = async (input) => new URL(input).hostname === 'accounts.zoho.in'
      ? new Response(JSON.stringify({ access_token: 'token', expires_in: 3600 }), { status: 200 })
      : new Response(JSON.stringify({ code: 1038, message: 'Organization is inactive' }), { status: 400 });
    const client = new ZohoBooksClient(credentials, fetchImpl);
    await assert.rejects(client.request('GET', 'contacts'), (error) => {
      assert.ok(error instanceof ZohoApiError);
      assert.match(error.message, /Organization is inactive/);
      assert.doesNotMatch(error.message, /token|client-secret|refresh-token/i);
      return true;
    });
  });
});
