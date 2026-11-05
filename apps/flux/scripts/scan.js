// Quality and safety gates. Run with: npm run scan. Exits non-zero if any rule fails.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((n) => { if (['node_modules', 'data', '.git'].includes(n)) return []; const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(root).filter((f) => /\.(js|json|md|example)$|\.env/.test(f) || f.endsWith('.gitignore'));
const src = files.filter((f) => relative(root, f).startsWith('src/'));
const rel = (f) => relative(root, f);
const fails = [];
const rule = (name, list, test) => { for (const f of list) { const bad = test(readFileSync(f, 'utf8'), f); if (bad) fails.push(`${name}: ${rel(f)}${bad === true ? '' : ' (' + bad + ')'}`); } };

const banned = [['Brain', 'Wise'], ['Build', 'Wise'], ['rta', 'karm']].map((p) => new RegExp(p.join(''), 'i'));
rule('forbidden assistant name', files, (t) => banned.some((r) => r.test(t)));
rule('hard-coded model identifier', src, (t) => /\b(gpt-?\d|claude-|llama-?\d|gemini|mistral|mixtral|qwen|deepseek|gemma|command-r)\b/i.test(t));
rule('key-like secret in a file', files, (t) => /\bsk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{12,}|xox[bap]-[0-9A-Za-z-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY/.test(t));
rule('placeholder or unfinished code', src, (t) => /\b(TODO|FIXME|XXX|lorem ipsum|not implemented)\b/i.test(t));
rule('browser storage or eval in server code', src, (t) => /localStorage|sessionStorage|\beval\(|new Function\(/.test(t));
rule('file too long (over 300 lines)', src, (t) => t.split('\n').length > 300 && t.split('\n').length);
rule('Zoho write outside the writer', src.filter((f) => rel(f).startsWith('src/zoho/') && !/writer\.js$|auth\.js$/.test(f)), (t) => /method:\s*'(POST|PUT|PATCH|DELETE)'/i.test(t));
rule('HTTP write verb outside allowed modules', src.filter((f) => !/src\/(zoho\/writer|zoho\/auth|models\/gateway|http\/(server|routes))\.js$/.test(rel(f))), (t) => /method:\s*'(POST|PUT|PATCH|DELETE)'/i.test(t));
rule('Zoho delete or payment call anywhere', src, (t) => /\/payments|customerpayments|method:\s*'DELETE'/i.test(t) && !/gateway|routes/.test(t));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const allowedRuntimeDependencies = { 'agent-browser': '0.41.2' };
for (const [name, version] of Object.entries(pkg.dependencies || {})) {
  if (allowedRuntimeDependencies[name] !== version) fails.push(`unapproved runtime dependency: ${name}@${version}`);
}

if (fails.length) { console.error('SCAN FAILED\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`Scan passed: ${src.length} source files, ${files.length} files checked, 0 problems.`);
