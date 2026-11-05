import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ROLES } from './roles.js';
const scrypt = promisify(scryptCb);
const KEYLEN = 64;

export class Users {
  constructor(store) { this.col = store.collection('users'); }
  async create({ id, name, role, password }) {
    if (!/^[a-z0-9._-]{3,40}$/.test(id || '')) throw new Error('User id must be 3 to 40 characters: lower-case letters, digits, dot, dash or underscore');
    if (!ROLES.includes(role)) throw new Error(`Role must be one of ${ROLES.join(', ')}`);
    if (typeof password !== 'string' || password.length < 12) throw new Error('Password must be at least 12 characters');
    if (this.col.get(id)) throw new Error('User already exists');
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, KEYLEN)).toString('hex');
    this.col.put(id, { id, name: name || id, role, salt, hash, active: true });
    return { id, name: name || id, role };
  }
  async authenticate(id, password) {
    const u = this.col.get(String(id || ''));
    const salt = u?.salt || '00'.repeat(16); // same work whether or not the user exists
    const got = await scrypt(String(password || ''), salt, KEYLEN);
    if (!u || !u.active) return null;
    const want = Buffer.from(u.hash, 'hex');
    return want.length === got.length && timingSafeEqual(want, got) ? { id: u.id, name: u.name, role: u.role } : null;
  }
  get(id) { const u = this.col.get(id); return u && u.active ? { id: u.id, name: u.name, role: u.role } : null; }
  list() { return this.col.all().map(({ id, name, role, active }) => ({ id, name, role, active })); }
  count() { return this.col.size; }
}
