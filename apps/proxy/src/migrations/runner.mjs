import { readFile, readdir, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './postgres-store.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, 'migrations');
const MIGRATION_TABLE = '_karm_migrations';

export async function runMigrations(databaseUrl, direction = 'up', targetVersion = null) {
  const pool = createPool(databaseUrl);
  
  try {
    // Ensure migration tracking table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        checksum VARCHAR(64) NOT NULL
      )
    `);

    // Get applied migrations
    const appliedResult = await pool.query(`SELECT version, checksum FROM ${MIGRATION_TABLE} ORDER BY applied_at`);
    const applied = new Map(appliedResult.rows.map(r => [r.version, r.checksum]));

    // Get migration files
    const files = await getMigrationFiles();
    
    if (direction === 'up') {
      await runUpMigrations(pool, files, applied, targetVersion);
    } else if (direction === 'down') {
      await runDownMigrations(pool, files, applied, targetVersion);
    } else if (direction === 'status') {
      printStatus(files, applied);
    } else if (direction === 'create') {
      await createMigration(targetVersion);
    }
  } finally {
    await pool.end();
  }
}

async function getMigrationFiles() {
  try {
    const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (entry.isFile() && extname(entry.name) === '.sql') {
        const match = entry.name.match(/^(\d+)_(.+)\.(up|down)\.sql$/);
        if (match) {
          files.push({
            version: match[1],
            name: match[2],
            direction: match[3],
            filename: entry.name,
            path: join(MIGRATIONS_DIR, entry.name)
          });
        }
      }
    }
    return files.sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

async function runUpMigrations(pool, files, applied, targetVersion) {
  const upFiles = files.filter(f => f.direction === 'up');
  
  for (const file of upFiles) {
    if (targetVersion && file.version > targetVersion) break;
    if (applied.has(file.version)) {
      // Verify checksum
      const content = await readFile(file.path, 'utf8');
      const checksum = computeChecksum(content);
      if (applied.get(file.version) !== checksum) {
        throw new Error(`Migration ${file.version} checksum mismatch!`);
      }
      continue; // Already applied
    }

    console.log(`Applying migration ${file.version}: ${file.name}`);
    const content = await readFile(file.path, 'utf8');
    const checksum = computeChecksum(content);
    
    await pool.query('BEGIN');
    try {
      await pool.query(content);
      await pool.query(
        `INSERT INTO ${MIGRATION_TABLE} (version, name, checksum) VALUES ($1, $2, $3)`,
        [file.version, file.name, checksum]
      );
      await pool.query('COMMIT');
      console.log(`  ✓ Applied`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw new Error(`Migration ${file.version} failed: ${error.message}`);
    }
  }
}

async function runDownMigrations(pool, files, applied, targetVersion) {
  const downFiles = files.filter(f => f.direction === 'down').reverse();
  
  for (const file of downFiles) {
    if (!applied.has(file.version)) continue; // Not applied
    if (targetVersion && file.version <= targetVersion) break;
    
    console.log(`Rolling back migration ${file.version}: ${file.name}`);
    const content = await readFile(file.path, 'utf8');
    
    await pool.query('BEGIN');
    try {
      await pool.query(content);
      await pool.query(`DELETE FROM ${MIGRATION_TABLE} WHERE version = $1`, [file.version]);
      await pool.query('COMMIT');
      console.log(`  ✓ Rolled back`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw new Error(`Rollback ${file.version} failed: ${error.message}`);
    }
  }
}

function printStatus(files, applied) {
  console.log('\nMigration Status:');
  console.log('='.repeat(80));
  const versions = [...new Set(files.map(f => f.version))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  
  for (const version of versions) {
    const upFile = files.find(f => f.version === version && f.direction === 'up');
    const downFile = files.find(f => f.version === version && f.direction === 'down');
    const isApplied = applied.has(version);
    
    console.log(`${isApplied ? '✓' : '○'} ${version}: ${upFile?.name || 'unknown'} ${downFile ? '(reversible)' : '(no rollback)'}`);
  }
  console.log('='.repeat(80));
}

async function createMigration(name) {
  if (!name) throw new Error('Migration name required: npm run migrate:create -- "add_user_table"');
  
  const timestamp = Date.now().toString().padStart(12, '0');
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const version = timestamp;
  
  const upPath = join(MIGRATIONS_DIR, `${version}_${safeName}.up.sql`);
  const downPath = join(MIGRATIONS_DIR, `${version}_${safeName}.down.sql`);
  
  const upTemplate = `-- Migration: ${safeName}
-- Version: ${version}
-- Direction: up

-- Add your UP migration SQL here
-- Example:
-- CREATE TABLE example (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

`;
  
  const downTemplate = `-- Migration: ${safeName}
-- Version: ${version}
-- Direction: down

-- Add your DOWN migration SQL here (reverse of up)
-- Example:
-- DROP TABLE IF EXISTS example;

`;
  
  await writeFile(upPath, upTemplate);
  await writeFile(downPath, downTemplate);
  
  console.log(`Created migration pair:`);
  console.log(`  ${upPath}`);
  console.log(`  ${downPath}`);
}

function computeChecksum(content) {
  return createHash('sha256').update(content.trim()).digest('hex');
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const target = args[1];
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && command !== 'create') {
    console.error('DATABASE_URL required');
    process.exit(1);
  }
  
  runMigrations(databaseUrl, command, target).catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
}