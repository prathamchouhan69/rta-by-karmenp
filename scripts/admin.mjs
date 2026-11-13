#!/usr/bin/env node
// KARM OS Admin CLI
// User/role management, feature flags, system operations
// Usage: node scripts/admin.mjs <command> [options]

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from '../apps/proxy/src/postgres-store.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

async function getDbPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL required');
  }
  return createPool(databaseUrl);
}

async function createUser(pool, username, password, role = 'user') {
  const { randomBytes, createHash } = await import('node:crypto');
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, salt, role, created_at) 
     VALUES ($1, $2, $3, $4, NOW()) 
     RETURNING id, username, role, created_at`,
    [username, hash, salt, role]
  );
  return result.rows[0];
}

async function listUsers(pool) {
  const result = await pool.query(
    `SELECT id, username, role, active, created_at, last_login FROM users ORDER BY created_at`
  );
  return result.rows;
}

async function setUserRole(pool, username, role) {
  const validRoles = ['owner', 'admin', 'user', 'viewer'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
  
  const result = await pool.query(
    `UPDATE users SET role = $1 WHERE username = $2 RETURNING id, username, role`,
    [role, username]
  );
  if (result.rowCount === 0) throw new Error(`User not found: ${username}`);
  return result.rows[0];
}

async function setUserActive(pool, username, active) {
  const result = await pool.query(
    `UPDATE users SET active = $1 WHERE username = $2 RETURNING id, username, active`,
    [active, username]
  );
  if (result.rowCount === 0) throw new Error(`User not found: ${username}`);
  return result.rows[0];
}

async function resetPassword(pool, username, newPassword) {
  const { randomBytes, createHash } = await import('node:crypto');
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(newPassword + salt).digest('hex');
  
  const result = await pool.query(
    `UPDATE users SET password_hash = $1, salt = $2 WHERE username = $3 RETURNING id, username`,
    [hash, salt, username]
  );
  if (result.rowCount === 0) throw new Error(`User not found: ${username}`);
  return result.rows[0];
}

async function deleteUser(pool, username) {
  if (username === 'owner') throw new Error('Cannot delete owner user');
  const result = await pool.query(
    `DELETE FROM users WHERE username = $1 RETURNING username`,
    [username]
  );
  if (result.rowCount === 0) throw new Error(`User not found: ${username}`);
  return result.rows[0];
}

async function createFlag(pool, key, description, enabled = false, rollout = 100) {
  const result = await pool.query(
    `INSERT INTO feature_flags (key, description, enabled, rollout_percentage, created_at) 
     VALUES ($1, $2, $3, $4, NOW()) 
     RETURNING *`,
    [key, description, enabled, rollout]
  );
  return result.rows[0];
}

async function listFlags(pool) {
  const result = await pool.query(`SELECT * FROM feature_flags ORDER BY created_at`);
  return result.rows;
}

async function setFlag(pool, key, enabled, rollout) {
  const updates = [];
  const values = [];
  let paramIndex = 1;
  
  if (enabled !== undefined) {
    updates.push(`enabled = $${paramIndex++}`);
    values.push(enabled);
  }
  if (rollout !== undefined) {
    updates.push(`rollout_percentage = $${paramIndex++}`);
    values.push(rollout);
  }
  if (updates.length === 0) throw new Error('No changes specified');
  
  updates.push(`updated_at = NOW()`);
  values.push(key);
  
  const result = await pool.query(
    `UPDATE feature_flags SET ${updates.join(', ')} WHERE key = $${paramIndex} RETURNING *`,
    values
  );
  if (result.rowCount === 0) throw new Error(`Flag not found: ${key}`);
  return result.rows[0];
}

async function deleteFlag(pool, key) {
  const result = await pool.query(
    `DELETE FROM feature_flags WHERE key = $1 RETURNING key`,
    [key]
  );
  if (result.rowCount === 0) throw new Error(`Flag not found: ${key}`);
  return result.rows[0];
}

async function checkFlag(pool, key, userId = null) {
  const result = await pool.query(`SELECT * FROM feature_flags WHERE key = $1`, [key]);
  if (result.rowCount === 0) return { enabled: false, reason: 'not_found' };
  
  const flag = result.rows[0];
  if (!flag.enabled) return { enabled: false, reason: 'disabled' };
  
  if (flag.rollout_percentage < 100 && userId) {
    // Deterministic rollout based on user ID
    const { createHash } = await import('node:crypto');
    const hash = parseInt(createHash('md5').update(`${key}:${userId}`).digest('hex').slice(0, 8), 16);
    const bucket = hash % 100;
    if (bucket >= flag.rollout_percentage) {
      return { enabled: false, reason: 'rollout' };
    }
  }
  
  return { enabled: true, reason: 'active' };
}

async function systemStatus(pool) {
  const checks = [];
  
  // Database
  try {
    await pool.query('SELECT 1');
    checks.push({ component: 'database', status: 'healthy' });
  } catch (e) {
    checks.push({ component: 'database', status: 'unhealthy', error: e.message });
  }
  
  // Users count
  try {
    const users = await pool.query('SELECT count(*) as total, count(*) filter (where active) as active FROM users');
    checks.push({ component: 'users', status: 'healthy', data: users.rows[0] });
  } catch (e) {
    checks.push({ component: 'users', status: 'unhealthy', error: e.message });
  }
  
  // Flags count
  try {
    const flags = await pool.query('SELECT count(*) as total, count(*) filter (where enabled) as enabled FROM feature_flags');
    checks.push({ component: 'feature_flags', status: 'healthy', data: flags.rows[0] });
  } catch (e) {
    checks.push({ component: 'feature_flags', status: 'unhealthy', error: e.message });
  }
  
  // Audit log size
  try {
    const audit = await pool.query('SELECT count(*) as total FROM audit_log');
    checks.push({ component: 'audit_log', status: 'healthy', data: audit.rows[0] });
  } catch (e) {
    checks.push({ component: 'audit_log', status: 'unhealthy', error: e.message });
  }
  
  return checks;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const subcommand = args[1];
  const params = args.slice(2);
  
  const pool = await getDbPool();
  
  try {
    switch (command) {
      case 'user':
        switch (subcommand) {
          case 'create':
            if (params.length < 2) throw new Error('Usage: admin.mjs user create <username> <password> [role]');
            console.log(await createUser(pool, params[0], params[1], params[2]));
            break;
          case 'list':
            console.table(await listUsers(pool));
            break;
          case 'role':
            if (params.length < 2) throw new Error('Usage: admin.mjs user role <username> <role>');
            console.log(await setUserRole(pool, params[0], params[1]));
            break;
          case 'activate':
            if (params.length < 1) throw new Error('Usage: admin.mjs user activate <username>');
            console.log(await setUserActive(pool, params[0], true));
            break;
          case 'deactivate':
            if (params.length < 1) throw new Error('Usage: admin.mjs user deactivate <username>');
            console.log(await setUserActive(pool, params[0], false));
            break;
          case 'password':
            if (params.length < 2) throw new Error('Usage: admin.mjs user password <username> <new_password>');
            console.log(await resetPassword(pool, params[0], params[1]));
            break;
          case 'delete':
            if (params.length < 1) throw new Error('Usage: admin.mjs user delete <username>');
            console.log(await deleteUser(pool, params[0]));
            break;
          default:
            console.log('User commands: create, list, role, activate, deactivate, password, delete');
        }
        break;
        
      case 'flag':
        switch (subcommand) {
          case 'create':
            if (params.length < 1) throw new Error('Usage: admin.mjs flag create <key> [description] [enabled] [rollout]');
            console.log(await createFlag(pool, params[0], params[1] || '', params[2] === 'true', parseInt(params[3]) || 100));
            break;
          case 'list':
            console.table(await listFlags(pool));
            break;
          case 'enable':
            if (params.length < 1) throw new Error('Usage: admin.mjs flag enable <key> [rollout]');
            console.log(await setFlag(pool, params[0], true, params[1] ? parseInt(params[1]) : undefined));
            break;
          case 'disable':
            if (params.length < 1) throw new Error('Usage: admin.mjs flag disable <key>');
            console.log(await setFlag(pool, params[0], false));
            break;
          case 'rollout':
            if (params.length < 2) throw new Error('Usage: admin.mjs flag rollout <key> <percentage>');
            console.log(await setFlag(pool, params[0], undefined, parseInt(params[1])));
            break;
          case 'check':
            if (params.length < 1) throw new Error('Usage: admin.mjs flag check <key> [user_id]');
            console.log(await checkFlag(pool, params[0], params[1] || null));
            break;
          case 'delete':
            if (params.length < 1) throw new Error('Usage: admin.mjs flag delete <key>');
            console.log(await deleteFlag(pool, params[0]));
            break;
          default:
            console.log('Flag commands: create, list, enable, disable, rollout, check, delete');
        }
        break;
        
      case 'status':
        const status = await systemStatus(pool);
        console.table(status);
        const unhealthy = status.filter(s => s.status === 'unhealthy');
        if (unhealthy.length) process.exit(1);
        break;
        
      default:
        console.log(`
KARM OS Admin CLI

Usage: node scripts/admin.mjs <command> [subcommand] [options]

Commands:
  user       - User management
    create <username> <password> [role]  Create new user
    list                                 List all users
    role <username> <role>               Set user role
    activate <username>                  Activate user
    deactivate <username>                Deactivate user
    password <username> <new_password>   Reset password
    delete <username>                    Delete user (not owner)

  flag       - Feature flags
    create <key> [description] [enabled] [rollout]  Create flag
    list                                 List all flags
    enable <key> [rollout]               Enable flag
    disable <key>                        Disable flag
    rollout <key> <percentage>           Set rollout percentage
    check <key> [user_id]                Check flag for user
    delete <key>                         Delete flag

  status     - System health check
`);
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});