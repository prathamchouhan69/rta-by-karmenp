import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const roots = ['packages/shared/src'];
const moneyWords = /\b(amount|total|balance|rate|price|tax|cgst|sgst|igst|gst|subtotal|discount|paid|due|outstanding|receivable|payable|credit|debit|cost|charge|fee)\b/i;
let scanned = 0; let violations = [];
async function walk(dir) { for (const entry of await readdir(dir, {withFileTypes:true})) { const path = join(dir, entry.name); if (entry.isDirectory()) await walk(path); else if (/\.(ts|tsx)$/.test(entry.name)) { const text = await readFile(path, 'utf8'); const lines = text.split('\n'); lines.forEach((line, index) => { scanned += 1; if (path.endsWith('groupDigits.ts')) return; const code = line.replace(/(['"`]).*?\1/g, ''); const hasMoneySymbol = moneyWords.test(code); const hasForbiddenCall = /parseFloat|parseInt|Number\(|BigInt\(|toFixed|toPrecision|Math\.(round|floor|ceil|trunc)/.test(code); if (hasMoneySymbol && hasForbiddenCall) violations.push(`${path}:${index + 1}`); }); } } }
for (const root of roots) {
  try { await access(root); } catch { continue; }
  await walk(root);
}
console.log(`${scanned} money-related lines scanned, ${violations.length} violations`);
if (violations.length) { console.error(violations.join('\n')); process.exitCode = 1; }
