import fs from 'node:fs';
import path from 'node:path';

// Scanner rules from apps/flux/scripts/scan.js
const banned = [['Brain', 'Wise'], ['Build', 'Wise'], ['rta', 'karm']].map((p) => new RegExp(p.join(''), 'i'));

function checkFile(content) {
  const issues = [];
  if (banned.some((r) => r.test(content))) issues.push('forbidden assistant name');
  if (/\b(gpt-?\d|claude-|llama-?\d|gemini|mistral|mixtral|qwen|deepseek|gemma|command-r)\b/i.test(content)) issues.push('hard-coded model identifier');
  if (/\bsk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{12,}|xox[bap]-[0-9A-Za-z-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY/.test(content)) issues.push('key-like secret');
  if (/\b(TODO|FIXME|XXX|lorem ipsum|not implemented)\b/i.test(content)) issues.push('placeholder or unfinished code');
  if (/localStorage|sessionStorage|\beval\(|new Function\(/.test(content)) issues.push('browser storage or eval');
  if (/method:\s*['"](POST|PUT|PATCH|DELETE)['"]/i.test(content)) issues.push('HTTP write verb outside allowed modules');
  if (/\/payments|customerpayments|method:\s*['"]DELETE['"]/i.test(content)) issues.push('Zoho delete or payment call');
  return issues;
}

const badDir = 'tests/fixtures/scanner/bad';
const goodDir = 'tests/fixtures/scanner/good';

const badFiles = fs.readdirSync(badDir).filter(f => f.endsWith('.js'));
const goodFiles = fs.readdirSync(goodDir).filter(f => f.endsWith('.js'));

console.log(`Checking ${badFiles.length} bad fixtures...`);
let badFailedCount = 0;
for (const f of badFiles) {
  const content = fs.readFileSync(path.join(badDir, f), 'utf8');
  const issues = checkFile(content);
  if (issues.length > 0) {
    badFailedCount++;
    console.log(`  [FAIL as expected] ${f}: ${issues.join(', ')}`);
  } else {
    console.error(`  [UNEXPECTED PASS] ${f} had no issues!`);
  }
}

console.log(`\nChecking ${goodFiles.length} good fixtures...`);
let goodPassedCount = 0;
for (const f of goodFiles) {
  const content = fs.readFileSync(path.join(goodDir, f), 'utf8');
  const issues = checkFile(content);
  if (issues.length === 0) {
    goodPassedCount++;
    console.log(`  [PASS as expected] ${f}`);
  } else {
    console.error(`  [UNEXPECTED FAIL] ${f}: ${issues.join(', ')}`);
  }
}

console.log(`\n=== SCANNER FIXTURE SELF-TEST SUMMARY ===`);
console.log(`Bad fixtures: ${badFailedCount}/${badFiles.length} correctly caught`);
console.log(`Good fixtures: ${goodPassedCount}/${goodFiles.length} cleanly passed`);

if (badFailedCount === 25 && goodPassedCount === 15) {
  console.log('Result: PASS (25 bad fixtures FAIL, 15 good fixtures PASS)');
  process.exit(0);
} else {
  console.error('Result: FAIL');
  process.exit(1);
}
