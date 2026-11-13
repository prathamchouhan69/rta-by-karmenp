#!/usr/bin/env node
// Secrets Manager - Unified interface for multiple secret backends
// Supports: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, 1Password, .env file
// Usage: node scripts/secrets.mjs <get|set|list|rotate> [options]

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

class SecretsManager {
  constructor() {
    this.provider = process.env.SECRETS_PROVIDER || 'file';
    this.config = this.loadConfig();
  }

  loadConfig() {
    const config = {};
    switch (this.provider) {
      case 'vault':
        config.addr = process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
        config.token = process.env.VAULT_TOKEN;
        config.path = process.env.VAULT_PATH || 'secret/data/karm';
        break;
      case 'aws':
        config.region = process.env.AWS_REGION || 'us-east-1';
        config.prefix = process.env.AWS_SECRETS_PREFIX || 'karm/';
        break;
      case 'azure':
        config.vaultUrl = process.env.AZURE_KEYVAULT_URL;
        config.tenantId = process.env.AZURE_TENANT_ID;
        config.clientId = process.env.AZURE_CLIENT_ID;
        config.clientSecret = process.env.AZURE_CLIENT_SECRET;
        break;
      case '1password':
        config.vault = process.env.OP_VAULT || 'KARM';
        config.account = process.env.OP_ACCOUNT;
        break;
      case 'file':
      default:
        config.path = process.env.SECRETS_FILE || resolve(PROJECT_ROOT, '.env.production');
        break;
    }
    return config;
  }

  async get(key) {
    switch (this.provider) {
      case 'vault': return this.vaultGet(key);
      case 'aws': return this.awsGet(key);
      case 'azure': return this.azureGet(key);
      case '1password': return this.opGet(key);
      default: return this.fileGet(key);
    }
  }

  async set(key, value) {
    switch (this.provider) {
      case 'vault': return this.vaultSet(key, value);
      case 'aws': return this.awsSet(key, value);
      case 'azure': return this.azureSet(key, value);
      case '1password': return this.opSet(key, value);
      default: return this.fileSet(key, value);
    }
  }

  async list() {
    switch (this.provider) {
      case 'vault': return this.vaultList();
      case 'aws': return this.awsList();
      case 'azure': return this.azureList();
      case '1password': return this.opList();
      default: return this.fileList();
    }
  }

  async rotate(key, generator) {
    const newValue = generator ? generator() : this.generateSecret(32);
    await this.set(key, newValue);
    return newValue;
  }

  generateSecret(bytes = 32) {
    return randomBytes(bytes).toString('hex');
  }

  // File backend (default)
  async fileGet(key) {
    const content = await readFile(this.config.path, 'utf8').catch(() => '');
    const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim() : null;
  }

  async fileSet(key, value) {
    let content = await readFile(this.config.path, 'utf8').catch(() => '');
    const line = `${key}=${value}`;
    if (new RegExp(`^${key}=`, 'm').test(content)) {
      content = content.replace(new RegExp(`^${key}=.*$`, 'm'), line);
    } else {
      content += `\n${line}`;
    }
    await writeFile(this.config.path, content);
  }

  async fileList() {
    const content = await readFile(this.config.path, 'utf8').catch(() => '');
    const keys = [];
    for (const line of content.split('\n')) {
      const match = line.match(/^(\w+)=/);
      if (match) keys.push(match[1]);
    }
    return keys;
  }

  // HashiCorp Vault
  async vaultRequest(method, path, body) {
    const { default: fetch } = await import('node:fetch');
    const url = `${this.config.addr}/v1/${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        'X-Vault-Token': this.config.token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`Vault ${method} ${path}: ${response.statusText}`);
    return response.json();
  }

  async vaultGet(key) {
    const data = await this.vaultRequest('GET', this.config.path);
    return data.data?.data?.[key] || null;
  }

  async vaultSet(key, value) {
    const current = await this.vaultRequest('GET', this.config.path).catch(() => ({ data: { data: {} } }));
    const secrets = { ...current.data?.data, [key]: value };
    await this.vaultRequest('POST', this.config.path, { data: secrets });
  }

  async vaultList() {
    const listPath = this.config.path.replace('/data/', '/metadata/');
    const data = await this.vaultRequest('LIST', listPath);
    return data.data?.keys || [];
  }

  // AWS Secrets Manager
  async awsGet(key) {
    const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
    const client = new SecretsManagerClient({ region: this.config.region });
    const cmd = new GetSecretValueCommand({ SecretId: `${this.config.prefix}${key}` });
    const response = await client.send(cmd);
    return response.SecretString ? JSON.parse(response.SecretString)[key] : null;
  }

  async awsSet(key, value) {
    const { SecretsManagerClient, PutSecretValueCommand, CreateSecretCommand } = await import('@aws-sdk/client-secrets-manager');
    const client = new SecretsManagerClient({ region: this.config.region });
    const secretId = `${this.config.prefix}${key}`;
    try {
      await client.send(new PutSecretValueCommand({ SecretId: secretId, SecretString: JSON.stringify({ [key]: value }) }));
    } catch {
      await client.send(new CreateSecretCommand({ Name: secretId, SecretString: JSON.stringify({ [key]: value }) }));
    }
  }

  async awsList() {
    const { SecretsManagerClient, ListSecretsCommand } = await import('@aws-sdk/client-secrets-manager');
    const client = new SecretsManagerClient({ region: this.config.region });
    const cmd = new ListSecretsCommand({ Filters: [{ Key: 'name', Values: [`${this.config.prefix}*`] }] });
    const response = await client.send(cmd);
    return (response.SecretList || []).map(s => s.Name.replace(this.config.prefix, ''));
  }

  // Azure Key Vault
  async azureGet(key) {
    const { SecretClient } = await import('@azure/keyvault-secrets');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const client = new SecretClient(this.config.vaultUrl, new DefaultAzureCredential());
    const secret = await client.getSecret(key);
    return secret.value;
  }

  async azureSet(key, value) {
    const { SecretClient } = await import('@azure/keyvault-secrets');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const client = new SecretClient(this.config.vaultUrl, new DefaultAzureCredential());
    await client.setSecret(key, value);
  }

  async azureList() {
    const { SecretClient } = await import('@azure/keyvault-secrets');
    const { DefaultAzureCredential } = await import('@azure/identity');
    const client = new SecretClient(this.config.vaultUrl, new DefaultAzureCredential());
    const secrets = [];
    for await (const secret of client.listPropertiesOfSecrets()) {
      secrets.push(secret.name);
    }
    return secrets;
  }

  // 1Password CLI
  async opGet(key) {
    const { stdout } = await this.opRun('item', 'get', key, '--vault', this.config.vault, '--format', 'json');
    const item = JSON.parse(stdout);
    return item.fields?.find(f => f.label === 'password')?.value || item.fields?.[0]?.value;
  }

  async opSet(key, value) {
    await this.opRun('item', 'create', '--vault', this.config.vault, '--category', 'Password', `--title=${key}`, `password=${value}`);
  }

  async opList() {
    const { stdout } = await this.opRun('item', 'list', '--vault', this.config.vault, '--format', 'json');
    const items = JSON.parse(stdout);
    return items.map(i => i.title);
  }

  opRun(...args) {
    return new Promise((resolve, reject) => {
      const proc = spawn('op', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr)));
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const key = args[1];
  const value = args[2];

  const sm = new SecretsManager();

  try {
    switch (command) {
      case 'get':
        if (!key) throw new Error('Key required');
        const val = await sm.get(key);
        if (val === null) throw new Error(`Key not found: ${key}`);
        console.log(val);
        break;
      case 'set':
        if (!key || !value) throw new Error('Key and value required');
        await sm.set(key, value);
        console.log(`Set ${key}`);
        break;
      case 'list':
        const keys = await sm.list();
        console.log(keys.join('\n'));
        break;
      case 'rotate':
        if (!key) throw new Error('Key required');
        const newVal = await sm.rotate(key);
        console.log(`Rotated ${key}: ${newVal}`);
        break;
      case 'generate':
        const bytes = parseInt(key) || 32;
        console.log(sm.generateSecret(bytes));
        break;
      default:
        console.log('Usage: secrets.mjs <get|set|list|rotate|generate> [key] [value]');
        console.log('Providers: file (default), vault, aws, azure, 1password');
        console.log('Set SECRETS_PROVIDER env var to choose');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();