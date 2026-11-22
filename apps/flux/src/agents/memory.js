import { newId } from '../util/ids.js';
import { redactText } from '../util/redact.js';

export const MEMORY_CATEGORIES = [
  'preference', 'contact', 'business', 'financial', 'operational',
  'strategic', 'personal', 'compliance', 'project', 'vendor'
];

// Conversation memory the user controls. It refuses anything that looks like PAN, Aadhaar, bank or card data.
export class Memory {
  constructor(store, audit) { this.col = store.collection('memory'); this.audit = audit; }

  add(text, actor, { category = 'general', tags = [], importance = 'medium' } = {}) {
    const t = String(text || '').trim();
    if (!t || t.length > 500) throw Object.assign(new Error('Memory must be 1 to 500 characters'), { status: 422, code: 'BAD_MEMORY' });
    if (redactText(t).found.length) throw Object.assign(new Error('That looks like a PAN, Aadhaar, bank, card or password detail. Flux does not store those.'), { status: 422, code: 'SENSITIVE' });
    if (!MEMORY_CATEGORIES.includes(category)) category = 'general';
    if (!['low', 'medium', 'high'].includes(importance)) importance = 'medium';

    const m = {
      id: newId('mem'),
      text: t,
      category,
      tags: Array.isArray(tags) ? tags.slice(0, 10).map(String) : [],
      importance,
      by: actor.id,
      at: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: null
    };
    this.col.put(m.id, m);
    this.audit.append({ actor: actor.id, action: 'memory.added', data: { id: m.id, category, importance } });
    return m;
  }

  list({ category, importance, tag, limit = 50, offset = 0, sortBy = 'recency' } = {}) {
    let results = this.col.all();

    if (category) results = results.filter(m => m.category === category);
    if (importance) results = results.filter(m => m.importance === importance);
    if (tag) results = results.filter(m => m.tags?.includes(tag));

    switch (sortBy) {
      case 'recency':
        results.sort((a, b) => b.at.localeCompare(a.at));
        break;
      case 'importance':
        const order = { high: 3, medium: 2, low: 1 };
        results.sort((a, b) => (order[b.importance] || 0) - (order[a.importance] || 0));
        break;
      case 'frequency':
        results.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
        break;
    }

    return results.slice(offset, offset + limit);
  }

  get(id, actor) {
    const m = this.col.get(id);
    if (m) {
      m.accessCount = (m.accessCount || 0) + 1;
      m.lastAccessed = new Date().toISOString();
      this.col.put(id, m);
      this.audit.append({ actor: actor.id, action: 'memory.accessed', data: { id } });
    }
    return m;
  }

  remove(id, actor) {
    const ok = this.col.del(id);
    if (ok) this.audit.append({ actor: actor.id, action: 'memory.removed', data: { id } });
    return ok;
  }

  /** Premium: search memories by text similarity (simple keyword matching) */
  search(query, { limit = 20 } = {}) {
    const terms = String(query || '').toLowerCase().split(/\s+/).filter(t => t.length > 1);
    if (!terms.length) return [];

    const results = this.col.all().map(m => {
      const text = (m.text + ' ' + (m.tags || []).join(' ')).toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) score += 1;
        // Bonus for category/tag matches
        if ((m.category || '').includes(term)) score += 2;
        if ((m.tags || []).some(t => t.includes(term))) score += 2;
      }
      return { ...m, score };
    }).filter(m => m.score > 0).sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /** Premium: get memory statistics */
  getStats({ actorId } = {}) {
    const memories = actorId ? this.col.all().filter(m => m.by === actorId) : this.col.all();
    return {
      total: memories.length,
      byCategory: Object.entries(memories.reduce((acc, m) => { acc[m.category] = (acc[m.category] || 0) + 1; return acc; }, {})).map(([category, count]) => ({ category, count })),
      byImportance: Object.entries(memories.reduce((acc, m) => { acc[m.importance] = (acc[m.importance] || 0) + 1; return acc; }, {})).map(([importance, count]) => ({ importance, count })),
      totalAccesses: memories.reduce((sum, m) => sum + (m.accessCount || 0), 0),
      avgAccesses: memories.length ? memories.reduce((sum, m) => sum + (m.accessCount || 0), 0) / memories.length : 0,
      tags: Object.entries(memories.flatMap(m => m.tags || []).reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {})).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 20)
    };
  }

  /** Premium: export memories for backup */
  export({ actorId, since } = {}) {
    let memories = this.col.all();
    if (actorId) memories = memories.filter(m => m.by === actorId);
    if (since) memories = memories.filter(m => new Date(m.at) >= new Date(since));
    return memories.map(m => ({ ...m, by: undefined })); // Remove actor ID for privacy
  }

  /** Premium: import memories from backup */
  import(memories, actor) {
    let added = 0;
    for (const m of memories) {
      if (!m.text || m.text.length > 500) continue;
      if (redactText(m.text).found.length) continue;
      const category = MEMORY_CATEGORIES.includes(m.category) ? m.category : 'general';
      const importance = ['low', 'medium', 'high'].includes(m.importance) ? m.importance : 'medium';
      const newMem = {
        id: newId('mem'),
        text: m.text,
        category,
        tags: Array.isArray(m.tags) ? m.tags.slice(0, 10) : [],
        importance,
        by: actor.id,
        at: new Date().toISOString(),
        accessCount: 0,
        lastAccessed: null
      };
      this.col.put(newMem.id, newMem);
      added++;
    }
    this.audit.append({ actor: actor.id, action: 'memory.imported', data: { count: added } });
    return { added };
  }
}