import test from 'node:test';
import assert from 'node:assert/strict';
import { gatewaySettings } from './config.mjs';

test('production requires an exact public HTTPS origin', () => {
  const settings = gatewaySettings({
    NODE_ENV: 'production',
    APP_ORIGIN: 'https://app.karmos.in',
  });
  assert.equal(settings.appOrigin, 'https://app.karmos.in');

  for (const appOrigin of [
    '',
    'http://app.karmos.in',
    'https://localhost',
    'https://127.0.0.1',
    'https://app.karmos.in/path',
    'https://app.karmos.in?next=/',
    'https://app.karmos.in:8443',
    'https://app.example.com',
    'https://*.karmos.in',
    'https://singlelabel',
  ]) {
    assert.throws(
      () => gatewaySettings({ NODE_ENV: 'production', APP_ORIGIN: appOrigin }),
      /exact public HTTPS origin/,
      appOrigin || 'missing origin',
    );
  }
});
