import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const prompt = readFileSync(resolve(appRoot, '../../COPILOT_PROMPT.md'), 'utf8');
const inventory = readFileSync(resolve(appRoot, 'src/lib/library-inventory.ts'), 'utf8');

function sourceNames(heading) {
  const line = prompt.match(new RegExp(`^## ${heading}\\n([^\\n]+)`, 'm'))?.[1];
  if (!line) throw new Error(`Missing ## ${heading} inventory in COPILOT_PROMPT.md`);
  return line.replace(/\.$/, '').split(', ');
}

function appNames(constant) {
  const line = inventory.match(new RegExp(`export const ${constant} = \`([^\`]*)\`\\.split`))?.[1];
  if (!line) throw new Error(`Missing ${constant} in library-inventory.ts`);
  return line.split(', ');
}

function verify(heading, constant, expectedCount) {
  const source = sourceNames(heading);
  const app = appNames(constant);
  if (source.length !== expectedCount || app.length !== expectedCount) {
    throw new Error(`${heading}: expected ${expectedCount}, found source=${source.length}, app=${app.length}`);
  }
  const mismatch = source.findIndex((name, index) => name !== app[index]);
  if (mismatch !== -1) {
    throw new Error(`${heading}: app inventory differs at ordinal ${mismatch + 1}: "${source[mismatch]}" vs "${app[mismatch]}"`);
  }
  return source;
}

const references = verify('All 169 References', 'REFERENCE_NAMES', 169);
const charts = verify('All 95 Charts', 'CHART_NAMES', 95);
const referenceIds = references.map((_, index) => `ref-${String(index + 1).padStart(3, '0')}`);
const chartIds = charts.map((_, index) => `chart-${String(index + 1).padStart(3, '0')}`);
const optionIds = references.flatMap((_, referenceIndex) =>
  Array.from({ length: 5 }, (_, optionIndex) => `${referenceIds[referenceIndex]}-option-${optionIndex + 1}`),
);

if (new Set(referenceIds).size !== 169 || new Set(chartIds).size !== 95 || new Set(optionIds).size !== 845) {
  throw new Error('Ordinal IDs must be unique for all references, charts, and visual options.');
}

console.log('Library inventory verified: 169 references, 95 charts, 845 unique visual-option IDs.');
