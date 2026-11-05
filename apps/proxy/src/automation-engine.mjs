function istDateAndTime(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateAutomationInput(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const owner = typeof body.owner === 'string' ? body.owner.trim() : '';
  const scheduleTime = body.scheduleTime;
  if (title.length < 3 || title.length > 120) return { ok: false, message: 'title must contain 3 to 120 characters' };
  if (description.length > 1000) return { ok: false, message: 'description must be 1000 characters or fewer' };
  if (!owner || owner.length > 80) return { ok: false, message: 'owner must contain 1 to 80 characters' };
  if (typeof scheduleTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(scheduleTime)) {
    return { ok: false, message: 'scheduleTime must use 24-hour HH:mm format in Asia/Kolkata' };
  }
  return { ok: true, value: { title, description, owner, scheduleTime, enabled: true } };
}

export function nextDailyRunAt(scheduleTime, now = new Date()) {
  const { year, month, day, hour, minute } = istDateAndTime(now);
  const [scheduleHour, scheduleMinute] = scheduleTime.split(':').map(Number);
  const todayRun = `${year}-${month}-${day}T${scheduleTime}:00+05:30`;
  if (Number(hour) < scheduleHour || (Number(hour) === scheduleHour && Number(minute) < scheduleMinute)) {
    return new Date(todayRun).toISOString();
  }
  const nextDay = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextDate = nextDay.toISOString().slice(0, 10);
  return new Date(`${nextDate}T${scheduleTime}:00+05:30`).toISOString();
}

export async function runDueAutomations(store, now = new Date()) {
  const result = await store.list('automations', { per_page: 200 });
  const automations = (result.automations ?? []).filter((automation) =>
    automation.enabled === true
    && typeof automation.nextRunAt === 'string'
    && Date.parse(automation.nextRunAt) <= now.getTime(),
  );
  const completed = [];
  for (const automation of automations) {
    const runAt = automation.nextRunAt;
    const key = `automation:${automation.automation_id}:${runAt}`;
    const request = { automationId: automation.automation_id, runAt };
    const fingerprint = store.requestFingerprint(request);
    const reservation = await store.reserveIdempotency(key, request);
    if (reservation.fingerprint !== fingerprint) throw new Error('Automation run key fingerprint mismatch');
    let task;
    if (!reservation.created) {
      if (reservation.status === 'complete') continue;
      const taskRows = await store.list('tasks', { per_page: 200 });
      task = (taskRows.tasks ?? []).find((item) => item.automationRunKey === key);
      if (!task) continue;
    } else {
      const { year, month, day } = istDateAndTime(now);
      task = await store.create('tasks', {
        title: automation.title,
        description: automation.description,
        owner: automation.owner,
        dueDate: `${year}-${month}-${day}`,
        sourceType: 'automation',
        sourceId: automation.automation_id,
        automationRunKey: key,
        status: 'open',
        createdAt: now.toISOString(),
      });
    }
    const updated = await store.update('automations', automation.automation_id, {
      lastRunAt: now.toISOString(),
      lastTaskId: task.task_id,
      nextRunAt: nextDailyRunAt(automation.scheduleTime, now),
    });
    if (!updated) throw new Error(`Automation ${automation.automation_id} disappeared during execution`);
    await store.recordAudit({ action: 'automation_task_created', resource: 'automations', resource_id: automation.automation_id, result: 'success' });
    await store.saveIdempotency(key, request, { status: 201, body: { ok: true, data: task } });
    completed.push({ automationId: automation.automation_id, taskId: task.task_id });
  }
  return completed;
}

export function isValidAutomationDate(value) {
  return isCalendarDate(value);
}
