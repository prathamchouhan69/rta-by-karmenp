import { randomUUID } from 'node:crypto';
export const newId = (prefix) => `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
