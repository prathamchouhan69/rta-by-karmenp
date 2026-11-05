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
    if (this.col.get(id)) throw new Error('User already exists');
    this.col.put(id, { id, name: name || id, role, salt, hash, active: true, sessionVersion: 0 });
    return { id, name: name || id, role };
  }
  async authenticate(id, password) {
    const u = this.col.get(String(id || ''));
    const salt = u?.salt || '00'.repeat(16); // same work whether or not the user exists
    const got = await scrypt(String(password || ''), salt, KEYLEN);
    if (!u || !u.active) return null;
    const want = Buffer.from(u.hash, 'hex');
    return want.length === got.length && timingSafeEqual(want, got)
      ? { id: u.id, name: u.name, role: u.role, sessionVersion: u.sessionVersion || 0 }
      : null;
  }
  get(id) {
    const u = this.col.get(id);
    return u && u.active ? { id: u.id, name: u.name, role: u.role, sessionVersion: u.sessionVersion || 0 } : null;
  }
  getRecord(id) {
    const u = this.col.get(id);
    return u ? { id: u.id, name: u.name, role: u.role, active: Boolean(u.active) } : null;
  }
  list() { return this.col.all().map(({ id, name, role, active }) => ({ id, name, role, active })); }
  activeOwnerCount() { return this.col.find((u) => u.active && u.role === 'owner').length; }
  count() { return this.col.size; }
  setActive(id, active) {
    const user = this.col.get(id);
    if (!user) return null;
    const updated = { ...user, active, sessionVersion: (user.sessionVersion || 0) + 1 };
    this.col.put(id, updated);
    return { id: updated.id, name: updated.name, role: updated.role, active: updated.active };
  }
  setRole(id, role) {
    const user = this.col.get(id);
    if (!user) return null;
    const updated = { ...user, role, sessionVersion: (user.sessionVersion || 0) + 1 };
    this.col.put(id, updated);
    return { id: updated.id, name: updated.name, role: updated.role, active: Boolean(updated.active) };
  }
  async resetPassword(id, password) {
    const user = this.col.get(id);
    if (!user) return null;
    if (typeof password !== 'string' || password.length < 12) throw new Error('Password must be at least 12 characters');
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, KEYLEN)).toString('hex');
    this.col.put(id, { ...user, salt, hash, sessionVersion: (user.sessionVersion || 0) + 1 });
    return { id: user.id, name: user.name, role: user.role, active: Boolean(user.active) };
  }
}
