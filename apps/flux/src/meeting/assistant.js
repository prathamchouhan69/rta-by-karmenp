// Flux Meeting Assistant - notes, action items, follow-ups.
// Deterministic structuring only. No model calls; no invented owners.

export const MEETING_DISCLAIMER = 'Meeting notes are structured from the text you supplied. Assign owners and dates yourself; Flux does not know your team.';

function clip(s, n = 600) { return String(s || '').slice(0, n); }

export function structureMeeting(input = {}) {
  const text = String(input.text || '').trim();
  if (!text) return { ok: false, code: 'EMPTY', message: 'Meeting text is required' };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const actionRe = /^\s*[-*]?\s*(action|to-?do|task|follow-?up|assign|owner|who)[:\-]/i;
const willRe = /\b(will|shall|must|to do|follow up)\b/i;
const decisionRe = /^\s*[-*]?\s*(decision|resolved|agreed|approved|chosen)[:\-]/i;
  const decidedRe = /\b(decided|agreed|approved|resolved)\b/i;
  const actionLines = lines.filter((l) => actionRe.test(l) || willRe.test(l));
  const decisions = lines.filter((l) => decisionRe.test(l) || decidedRe.test(l));
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/);
  const attendees = (input.attendees || []).map((a) => clip(a, 80)).slice(0, 50);

  const actionItems = actionLines.map((l, i) => ({
    id: 'A' + (i + 1),
    text: clip(l, 300),
    owner: input.owner || 'unassigned',
    due: input.due || null,
    status: 'open',
  }));

  return {
    ok: true,
    date: dateMatch ? dateMatch[0] : (input.date || null),
    title: clip(input.title || 'Meeting', 120),
    attendees,
    summary: clip(input.summary || lines.slice(0, 6).join(' '), 600),
    decisions: decisions.map((d) => clip(d, 300)),
    actionItems,
    followUps: actionItems.filter((a) => /follow.?up/i.test(a.text)).map((a) => a.id),
    generatedAt: new Date().toISOString(),
    disclaimer: MEETING_DISCLAIMER,
    limitations: ['Action owners and due dates are suggestions. Confirm them with the people responsible.'],
  };
}

export function toTaskProposals(meeting, actor) {
  const m = meeting || {};
  return (m.actionItems || []).map((a) => ({
    kind: 'task.create',
    title: a.text,
    owner: a.owner,
    due: a.due,
    source: 'meeting.assistant',
    createdBy: actor.id,
  }));
}