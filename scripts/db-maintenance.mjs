#!/usr/bin/env node
// Database maintenance script for KARM OS
// Performs: VACUUM ANALYZE, index stats, table sizes, bloat check
// Usage: node scripts/db-maintenance.mjs [--analyze] [--vacuum] [--stats]

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

async function getDatabaseUrl() {
  // Try to load from .env.production
  try {
    const content = await readFile(resolve(PROJECT_ROOT, '.env.production'), 'utf8');
    for (const line of content.split('\n')) {
      const [key, ...valueParts] = line.split('=');
      if (key?.trim() === 'DATABASE_URL' && valueParts.length) {
        return valueParts.join('=').trim();
      }
    }
  } catch {
    // Fall back to environment
  }
  return process.env.DATABASE_URL;
}

async function runPsqlCommand(dbUrl, command, description) {
  console.log(`\n${description}...`);
  const proc = spawn('psql', [dbUrl, '-c', command], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Promise((resolve, reject) => {
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0) {
        console.log(stdout.trim());
        resolve(stdout.trim());
      } else {
        console.error(stderr.trim());
        reject(new Error(`${description} failed with code ${code}`));
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const doAnalyze = args.includes('--analyze') || args.includes('--all');
  const doVacuum = args.includes('--vacuum') || args.includes('--all');
  const doStats = args.includes('--stats') || args.includes('--all');

  if (!doAnalyze && !doVacuum && !doStats) {
    // Default: run all
    console.log('Running all maintenance tasks (use --analyze, --vacuum, --stats to select)');
  }

  const dbUrl = await getDatabaseUrl();
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL not found in .env.production or environment');
    process.exit(1);
  }

  console.log('Connected to database');
  console.log('='.repeat(60));

  try {
    // Table sizes
    if (doStats || !doAnalyze && !doVacuum) {
      await runPsqlCommand(dbUrl, `
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows,
          CASE WHEN n_live_tup > 0 THEN round(n_dead_tup::numeric / n_live_tup * 100, 1) ELSE 0 END as dead_pct
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `, 'Table sizes and bloat');
    }

    // Index usage
    if (doStats || !doAnalyze && !doVacuum) {
      await runPsqlCommand(dbUrl, `
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan ASC NULLS FIRST;
      `, 'Index usage statistics');
    }

    // Unused indexes
    if (doStats || !doAnalyze && !doVacuum) {
      await runPsqlCommand(dbUrl, `
        SELECT
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0 AND indexrelid NOT IN (
          SELECT conindid FROM pg_constraint WHERE contype IN ('p', 'u')
        )
        ORDER BY pg_relation_size(indexrelid) DESC;
      `, 'Potentially unused indexes (consider dropping)');
    }

    // VACUUM ANALYZE
    if (doVacuum || !doAnalyze && !doVacuum) {
      await runPsqlCommand(dbUrl, 'VACUUM ANALYZE;', 'VACUUM ANALYZE');
    }

    // ANALYZE only
    if (doAnalyze && !doVacuum) {
      await runPsqlCommand(dbUrl, 'ANALYZE;', 'ANALYZE');
    }

    // Check for long-running transactions
    if (doStats || !doAnalyze && !doVacuum) {
      await runPsqlCommand(dbUrl, `
        SELECT
          pid,
          now() - xact_start as duration,
          state,
          query
        FROM pg_stat_activity
        WHERE state != 'idle' AND xact_start IS NOT NULL
        ORDER BY xact_start;
      `, 'Active transactions');
    }

    // Replication lag (if replica)
    if (doStats || !doAnalyze && !doVacuum) {
      await runPsqlCommand(dbUrl, `
        SELECT
          client_addr,
          state,
          sync_state,
          pg_size_pretty(sent_lsn - replay_lsn) as lag
        FROM pg_stat_replication;
      `, 'Replication status');
    }

    console.log('\n✅ Database maintenance completed');
  } catch (error) {
    console.error('\n❌ Maintenance failed:', error.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});