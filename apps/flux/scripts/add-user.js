import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { Store } from '../src/store/store.js';
import { Users } from '../src/security/users.js';
import { ROLES } from '../src/security/roles.js';

// Works typed at a terminal and when answers are piped in (lines are queued, so none are lost).
const rl = createInterface({ input: stdin });
const queue = [], waiting = [];
rl.on('line', (l) => (waiting.length ? waiting.shift()(l) : queue.push(l)));
rl.on('close', () => { while (waiting.length) waiting.shift()(''); });
const ask = (q) => { stdout.write(q); return new Promise((r) => (queue.length ? r(queue.shift()) : waiting.push(r))); };

const dir = process.env.FLUX_DATA_DIR || './data';
const id = (await ask('User id (letters, digits, dot, dash): ')).trim();
const name = (await ask('Name: ')).trim();
const role = (await ask(`Role (${ROLES.join(' / ')}): `)).trim();
const password = await ask('Password (at least 12 characters; it is shown as you type): ');
rl.close();
try { const u = await new Users(new Store(dir)).create({ id, name, role, password }); console.log(`\nCreated ${u.id} (${u.role}) in ${dir}`); }
catch (e) { console.error(`\nCould not create user: ${e.message}`); process.exit(1); }
