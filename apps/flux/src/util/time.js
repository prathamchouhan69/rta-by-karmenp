// India Standard Time is UTC+05:30 all year (no daylight saving), so plain offset arithmetic is exact.
const IST_MS = 330 * 60000;
export const istDate = (d = new Date()) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 10);
export const istStamp = (d = new Date()) => new Date(d.getTime() + IST_MS).toISOString().replace('T', ' ').slice(0, 16) + ' IST';

/** Accepts YYYY-MM-DD, DD/MM/YYYY or DD-MM-YYYY. Returns YYYY-MM-DD, or null if it is not a real calendar date. */
export function parseDate(s) {
  const t = String(s ?? '').trim();
  let y, m, d, x;
  if ((x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t))) [y, m, d] = [x[1], x[2], x[3]];
  else if ((x = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t))) [d, m, y] = [x[1], x[2], x[3]];
  else return null;
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const dt = new Date(iso + 'T00:00:00Z');
  return !Number.isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === iso ? iso : null;
}
export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
export const addDays = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

/** The next occurrence of `hour`:00 IST strictly after `now`. */
export function nextRun(now, hour = 8) {
  const i = new Date(now.getTime() + IST_MS);
  let t = Date.UTC(i.getUTCFullYear(), i.getUTCMonth(), i.getUTCDate(), hour, 0, 0) - IST_MS;
  if (t <= now.getTime()) t += 86400000;
  return new Date(t);
}
export const financialYear = (iso) => { const [y, m] = iso.split('-').map(Number); const s = m >= 4 ? y : y - 1; return `${s}-${String(s + 1).slice(2)}`; };
