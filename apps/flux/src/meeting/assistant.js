// Flux Premium Meeting Assistant - notes, action items, follow-ups, speaker tracking.
// Deterministic structuring only. No model calls; no invented owners.

export const MEETING_DISCLAIMER = 'Meeting notes are structured from the text you supplied. Assign owners and dates yourself; Flux does not know your team.';

const ACTION_KEYWORDS = ['action', 'task', 'followup', 'follow-up', 'assign', 'owner', 'who', 'will do', 'shall', 'must', 'to do', 'follow up', 'responsible for'];
const DECISION_KEYWORDS = ['decision', 'resolved', 'agreed', 'approved', 'chosen', 'decided', 'we will', 'we agreed', 'approved'];
const QUESTION_KEYWORDS = ['?', 'question', 'clarify', 'unknown', 'need to check', 'tbd'];
const BLOCKER_KEYWORDS = ['blocker', 'blocked', 'waiting for', 'depends on', 'dependency', 'stuck'];
const RISK_KEYWORDS = ['risk', 'concern', 'issue', 'problem', 'challenge', 'danger', 'warning'];

function clip(s, n = 600) { return String(s || '').slice(0, n); }

function extractOwner(line) {
  const patterns = [
    /@(\w+)/g,
    /\b(?:assigned?\s+to|owner\s*[:=]\s*|responsible\s*[:=]\s*|by\s+)(\w+)/gi,
    /\b(\w+)\s+(?:will|shall|must|should|has\s+to)\b/gi,
  ];
  for (const p of patterns) {
    const matches = [...line.matchAll(p)];
    if (matches.length) return matches[0][1] || matches[0][0].replace(/@/, '');
  }
  return null;
}

function extractDueDate(line) {
  const patterns = [
    /by\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /due\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /before\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /(?:this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    /in\s+(\d+)\s*(day|week|month)s?/gi,
  ];
  for (const p of patterns) {
    const match = line.match(p);
    if (match) return match[0];
  }
  return null;
}

function classifyLine(line) {
  const lower = line.toLowerCase();
  if (ACTION_KEYWORDS.some(k => lower.includes(k))) return 'action';
  if (DECISION_KEYWORDS.some(k => lower.includes(k))) return 'decision';
  if (QUESTION_KEYWORDS.some(k => lower.includes(k))) return 'question';
  if (BLOCKER_KEYWORDS.some(k => lower.includes(k))) return 'blocker';
  if (RISK_KEYWORDS.some(k => lower.includes(k))) return 'risk';
  return 'note';
}

export function structureMeeting(input = {}) {
  const text = String(input.text || '').trim();
  if (!text) return { ok: false, code: 'EMPTY', message: 'Meeting text is required' };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/);
  const attendees = (input.attendees || []).map((a) => clip(a, 80)).slice(0, 50);

  const classified = lines.map(l => ({ text: l, type: classifyLine(l) }));

  const actionLines = classified.filter(c => c.type === 'action');
  const decisionLines = classified.filter(c => c.type === 'decision');
  const questionLines = classified.filter(c => c.type === 'question');
  const blockerLines = classified.filter(c => c.type === 'blocker');
  const riskLines = classified.filter(c => c.type === 'risk');
  const noteLines = classified.filter(c => c.type === 'note');

  const actionItems = actionLines.map((c, i) => {
    const owner = extractOwner(c.text) || input.owner || 'unassigned';
    const due = extractDueDate(c.text) || input.due || null;
    return {
      id: `ACT-${String(i + 1).padStart(3, '0')}`,
      text: clip(c.text, 400),
      owner,
      due,
      status: 'open',
      priority: c.text.toLowerCase().includes('urgent') ? 'high' : 'medium',
      tags: extractTags(c.text),
      dependencies: [],
    };
  });

  const decisions = decisionLines.map((d, i) => ({
    id: `DEC-${String(i + 1).padStart(3, '0')}`,
    text: clip(d.text, 400),
    decidedBy: extractOwner(d.text) || 'group',
    tags: extractTags(d.text),
  }));

  const questions = questionLines.map((q, i) => ({
    id: `Q-${String(i + 1).padStart(3, '0')}`,
    text: clip(q.text, 300),
    askedBy: extractOwner(q.text) || 'unknown',
    status: 'open',
  }));

  const blockers = blockerLines.map((b, i) => ({
    id: `BLK-${String(i + 1).padStart(3, '0')}`,
    text: clip(b.text, 300),
    owner: extractOwner(b.text) || 'unassigned',
    status: 'open',
    dependsOn: extractDependencies(b.text),
  }));

  const risks = riskLines.map((r, i) => ({
    id: `RSK-${String(i + 1).padStart(3, '0')}`,
    text: clip(r.text, 300),
    likelihood: r.text.toLowerCase().includes('high') ? 'high' : r.text.toLowerCase().includes('low') ? 'low' : 'medium',
    impact: r.text.toLowerCase().includes('critical') ? 'critical' : r.text.toLowerCase().includes('minor') ? 'low' : 'medium',
    mitigation: null,
  }));

  return {
    ok: true,
    meetingId: `MEET-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: dateMatch ? dateMatch[0] : (input.date || null),
    title: clip(input.title || 'Meeting', 120),
    duration: input.duration || null,
    attendees,
    summary: clip(input.summary || lines.slice(0, 8).join(' '), 800),
    decisions,
    actionItems,
    questions,
    blockers,
    risks,
    followUps: actionItems.filter(a => /follow.?up/i.test(a.text)).map(a => a.id),
    generatedAt: new Date().toISOString(),
    disclaimer: MEETING_DISCLAIMER,
    limitations: ['Action owners and due dates are suggestions. Confirm them with the people responsible.'],
    metadata: {
      totalLines: lines.length,
      actionCount: actionItems.length,
      decisionCount: decisions.length,
      questionCount: questions.length,
      blockerCount: blockers.length,
      riskCount: risks.length,
    },
  };
}

function extractTags(text) {
  const tags = [];
  const tagPatterns = [
    /#(\w+)/g,
    /\b(?:tag|label|category)\s*[:=]\s*(\w+)/gi,
  ];
  for (const p of tagPatterns) {
    for (const match of text.matchAll(p)) tags.push(match[1]);
  }
  return [...new Set(tags)];
}

function extractDependencies(text) {
  const deps = [];
  const patterns = [
    /depends?\s+on\s+([^.]+)/gi,
    /after\s+([^.]+)/gi,
    /once\s+([^.]+)/gi,
  ];
  for (const p of patterns) {
    for (const match of text.matchAll(p)) deps.push(clip(match[1], 100));
  }
  return deps;
}

export function toTaskProposals(meeting, actor) {
  const m = meeting || {};
  return (m.actionItems || []).map((a) => ({
    kind: 'task.create',
    title: a.text,
    owner: a.owner,
    due: a.due,
    priority: a.priority,
    tags: a.tags,
    source: 'meeting.assistant',
    createdBy: actor.id,
  }));
}

/** Premium: generate meeting minutes in Markdown format */
export function generateMinutes(meeting, format = 'markdown') {
  const m = meeting || {};
  if (format === 'markdown') {
    let md = `# ${m.title || 'Meeting Notes'}\n\n`;
    md += `**Date:** ${m.date || 'Not specified'}\n`;
    md += `**Duration:** ${m.duration || 'Not specified'}\n`;
    md += `**Attendees:** ${(m.attendees || []).join(', ') || 'Not recorded'}\n\n`;
    
    if (m.summary) md += `## Summary\n${m.summary}\n\n`;
    
    if (m.decisions?.length) {
      md += `## Decisions\n`;
      for (const d of m.decisions) md += `- ${d.text} (by: ${d.decidedBy})\n`;
      md += '\n';
    }
    
    if (m.actionItems?.length) {
      md += `## Action Items\n`;
      for (const a of m.actionItems) {
        md += `- **${a.id}** ${a.text}\n`;
        md += `  - Owner: ${a.owner}\n`;
        md += `  - Due: ${a.due || 'Not set'}\n`;
        md += `  - Priority: ${a.priority}\n`;
        if (a.tags?.length) md += `  - Tags: ${a.tags.join(', ')}\n`;
        if (a.dependencies?.length) md += `  - Depends on: ${a.dependencies.join(', ')}\n`;
        md += '\n';
      }
    }
    
    if (m.blockers?.length) {
      md += `## Blockers\n`;
      for (const b of m.blockers) md += `- ${b.text} (Owner: ${b.owner}, Depends on: ${b.dependsOn?.join(', ') || 'none'})\n`;
      md += '\n';
    }
    
    if (m.risks?.length) {
      md += `## Risks\n`;
      for (const r of m.risks) md += `- ${r.text} (Likelihood: ${r.likelihood}, Impact: ${r.impact})\n`;
      md += '\n';
    }
    
    if (m.questions?.length) {
      md += `## Open Questions\n`;
      for (const q of m.questions) md += `- ${q.text} (Asked by: ${q.askedBy})\n`;
      md += '\n';
    }
    
    md += `---\n*Generated by Flux Meeting Assistant at ${new Date().toISOString()}*\n`;
    md += `*${MEETING_DISCLAIMER}*\n`;
    return { ok: true, format: 'markdown', content: md };
  }
  
  return { ok: false, error: 'Unsupported format' };
}

/** Premium: convert meeting to calendar events (ICS format) */
export function toCalendarEvents(meeting) {
  const events = [];
  for (const a of meeting.actionItems || []) {
    if (!a.due) continue;
    try {
      const dueDate = new Date(a.due);
      if (Number.isNaN(dueDate.getTime())) continue;
      const start = new Date(dueDate.getTime() - 30 * 60000); // 30 min before
      const uid = `${a.id}@flux.karm.local`;
      events.push({
        uid,
        summary: `[Action] ${a.text}`,
        description: `Owner: ${a.owner}\nPriority: ${a.priority}\nMeeting: ${meeting.title}`,
        dtstart: start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
        dtend: dueDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      });
    } catch (e) {
      // skip invalid dates
    }
  }
  return { ok: true, events, format: 'ics' };
}