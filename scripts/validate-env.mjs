#!/usr/bin/env node
// Environment validation and setup script for KARM OS
// Usage: node scripts/validate-env.mjs [--fix] [--env-file=.env.production]

import { readFile, writeFile, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const REQUIRED_SECRETS = [
  { key: 'POSTGRES_PASSWORD', minLength: 32, description: 'PostgreSQL password' },
  { key: 'CADDY_DOMAIN', minLength: 1, description: 'Public DNS hostname' },
  { key: 'SETUP_CODE', minLength: 32, description: 'Owner setup code' },
  { key: 'SESSION_SECRET', minLength: 32, description: 'Session signing secret' },
  { key: 'FLUX_AUTH_SECRET', minLength: 32, description: 'Flux auth secret' },
  { key: 'FLUX_APPROVAL_SECRET', minLength: 32, description: 'Flux approval secret' },
  { key: 'FLUX_AUDIT_KEY', minLength: 32, description: 'Flux audit HMAC key' },
  { key: 'FLUX_OWNER_PASSWORD', minLength: 12, description: 'Flux owner password' },
];

const REQUIRED_DISTINCT = ['FLUX_AUTH_SECRET', 'FLUX_APPROVAL_SECRET', 'FLUX_AUDIT_KEY'];

const OPTIONAL_SECRETS = [
  { key: 'OPENROUTER_API_KEY', description: 'OpenRouter API key for model gateway' },
  { key: 'OMNIROUTE_API_KEY', description: 'OmniRoute API key for model gateway' },
  { key: 'BACKUP_ENCRYPTION_KEY', minLength: 32, description: 'Backup encryption key' },
  { key: 'METRICS_TOKEN', description: 'Prometheus metrics token' },
  { key: 'ZOHO_CLIENT_ID', description: 'Zoho OAuth client ID' },
  { key: 'ZOHO_CLIENT_SECRET', description: 'Zoho OAuth client secret' },
  { key: 'ZOHO_REFRESH_TOKEN', description: 'Zoho OAuth refresh token' },
  { key: 'ZOHO_ORG_ID', description: 'Zoho organization ID' },
];

function generateSecret(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

async function loadEnvFile(envFile) {
  const envPath = resolve(PROJECT_ROOT, envFile);
  try {
    const content = await readFile(envPath, 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
    return env;
  } catch {
    return {};
  }
}

async function validateEnv(env, fix = false) {
  const errors = [];
  const warnings = [];
  const updates = {};

  // Check required secrets
  for (const { key, minLength, description } of REQUIRED_SECRETS) {
    const value = env[key] || process.env[key];
    if (!value || value.startsWith('replace-with-') || value.length < minLength) {
      errors.push(`${key}: ${description} - missing or too short (min ${minLength} chars)`);
      if (fix) {
        updates[key] = generateSecret(Math.max(minLength, 32));
        console.log(`  [FIX] Generated ${key}`);
      }
    }
  }

  // Check distinct secrets
  const distinctValues = new Set();
  for (const key of REQUIRED_DISTINCT) {
    const value = env[key] || process.env[key] || updates[key];
    if (value && distinctValues.has(value)) {
      errors.push(`${key}: must be different from other Flux secrets`);
      if (fix) {
        updates[key] = generateSecret(32);
        console.log(`  [FIX] Regenerated ${key} to be distinct`);
      }
    }
    if (value) distinctValues.add(value);
  }

  // Check optional secrets
  for (const { key, minLength, description } of OPTIONAL_SECRETS) {
    const value = env[key] || process.env[key];
    if (!value || value.startsWith('replace-with-')) {
      warnings.push(`${key}: ${description} - not configured`);
    } else if (minLength && value.length < minLength) {
      warnings.push(`${key}: ${description} - too short (min ${minLength} chars)`);
    }
  }

  // Check Zoho live mode requirements
  const zohoMode = env.ZOHO_MODE || process.env.ZOHO_MODE || 'mock';
  if (zohoMode === 'live') {
    const zohoRequired = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN', 'ZOHO_ORG_ID'];
    for (const key of zohoRequired) {
      const value = env[key] || process.env[key];
      if (!value || value.startsWith('replace-with-')) {
        errors.push(`${key}: required for ZOHO_MODE=live`);
      }
    }
  }

  return { errors, warnings, updates };
}

async function writeEnvFile(envFile, env, updates) {
  const envPath = resolve(PROJECT_ROOT, envFile);
  let content = await readFile(envPath, 'utf8').catch(() => '');

  // Apply updates
  for (const [key, value] of Object.entries(updates)) {
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    const replacement = `${key}=${value}`;
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
    } else {
      content += `\n${replacement}`;
    }
  }

  await writeFile(envPath, content);
  console.log(`Updated ${envFile}`);
}

async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const envFileArg = args.find(a => a.startsWith('--env-file='));
  const envFile = envFileArg ? envFileArg.split('=')[1] : '.env.production';

  console.log(`Validating environment: ${envFile}`);
  console.log('='.repeat(60));

  const env = await loadEnvFile(envFile);
  const { errors, warnings, updates } = await validateEnv(env, fix);

  if (errors.length) {
    console.log('\n❌ ERRORS:');
    for (const error of errors) console.log(`  - ${error}`);
  }

  if (warnings.length) {
    console.log('\n⚠️  WARNINGS:');
    for (const warning of warnings) console.log(`  - ${warning}`);
  }

  if (!errors.length && !warnings.length) {
    console.log('\n✅ All environment checks passed');
  }

  if (fix && Object.keys(updates).length) {
    console.log('\nApplying fixes...');
    await writeEnvFile(envFile, env, updates);
    console.log('Done. Review the generated secrets before deploying.');
  } else if (fix) {
    console.log('\nNo fixes needed.');
  }

  if (errors.length && !fix) {
    console.log('\nRun with --fix to auto-generate missing secrets');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});