import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Task Ranking Scoring Logic Test
function getTaskScore(task) {
  if (task.completed) {
    return { score: -1, reason: 'Already completed' };
  }

  let score = 0;
  const reasons = [];
  const now = new Date();

  if (task.due_date) {
    const [y, m, d] = task.due_date.split('-').map(Number);
    const dueDate = new Date(y, m - 1, d);
    const diffDays = Math.ceil((dueDate.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      score += 1000 + Math.abs(diffDays) * 50;
      reasons.push(`Overdue by ${Math.abs(diffDays)} days`);
    } else if (diffDays === 0) {
      score += 600;
      reasons.push('Due today');
    } else if (diffDays === 1) {
      score += 380;
      reasons.push('Due tomorrow');
    } else if (diffDays <= 3) {
      score += 220;
      reasons.push(`Due in ${diffDays} days`);
    } else if (diffDays <= 7) {
      score += 100;
      reasons.push('Due this week');
    } else {
      score += 20;
    }
  } else {
    reasons.push('Flexible deadline');
  }

  switch (task.priority) {
    case 'urgent':
      score += 300;
      reasons.push('Urgent priority');
      break;
    case 'high':
      score += 180;
      reasons.push('High priority');
      break;
    case 'medium':
      score += 70;
      break;
    case 'low':
      score += 10;
      break;
  }

  if (task.task_type === 'exam') {
    score += 140;
    reasons.push('Exam preparation');
  } else if (task.task_type === 'assignment' || task.task_type === 'lab') {
    score += 90;
  } else if (task.task_type === 'coding') {
    score += 50;
  }

  const estMins = task.estimated_minutes || 30;
  if (estMins >= 15 && estMins <= 60) {
    score += 40;
  }

  if (task.subtasks && task.subtasks.length > 0) {
    const compCount = task.subtasks.filter((st) => st.completed).length;
    if (compCount > 0 && compCount < task.subtasks.length) {
      score += 35;
      reasons.push(`${compCount}/${task.subtasks.length} subtasks done`);
    }
  }

  return { score, reason: reasons.slice(0, 2).join(' • ') };
}

function getRecommendedFocusTask(tasks) {
  const pendingTasks = tasks.filter((t) => !t.completed);
  if (pendingTasks.length === 0) return null;

  let bestTask = null;
  let highestScore = -Infinity;
  let bestReason = '';

  for (const t of pendingTasks) {
    const { score, reason } = getTaskScore(t);
    if (score > highestScore) {
      highestScore = score;
      bestTask = t;
      bestReason = reason;
    }
  }

  if (!bestTask) return null;
  return { task: bestTask, score: highestScore, reason: bestReason };
}

// 2. Reminder Date Trigger Calculator Test
function calculateTriggerDate(dueDateStr, dueTimeStr, reminderType, customTimeStr) {
  if (!dueDateStr) return null;

  const [year, month, day] = dueDateStr.split('-').map(Number);
  let hour = 23;
  let minute = 59;

  if (dueTimeStr && dueTimeStr.includes(':')) {
    const [h, m] = dueTimeStr.split(':').map(Number);
    hour = isNaN(h) ? 23 : h;
    minute = isNaN(m) ? 59 : m;
  }

  const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);

  switch (reminderType) {
    case 'preset_5m':
      return new Date(deadline.getTime() - 5 * 60 * 1000);
    case 'preset_15m':
      return new Date(deadline.getTime() - 15 * 60 * 1000);
    case 'preset_30m':
      return new Date(deadline.getTime() - 30 * 60 * 1000);
    case 'preset_1h':
      return new Date(deadline.getTime() - 60 * 60 * 1000);
    case 'same_day_9am':
      return new Date(year, month - 1, day, 9, 0, 0, 0);
    case 'day_before_9am':
      return new Date(year, month - 1, day - 1, 9, 0, 0, 0);
    case 'custom':
      if (customTimeStr) {
        const parsed = new Date(customTimeStr);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      return new Date(deadline.getTime() - 30 * 60 * 1000);
    default:
      return new Date(deadline.getTime() - 15 * 60 * 1000);
  }
}

// 3. Backup Validation
function validateBackupJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.tasks || !data.subjects || !Array.isArray(data.tasks) || !Array.isArray(data.subjects)) {
      return { valid: false, error: 'Missing core tables' };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

// ================= TEST SUITE =================

test('Task Ranking: completed tasks get negative score and are excluded', () => {
  const completedTask = { id: 't1', title: 'Done task', completed: true };
  const res = getTaskScore(completedTask);
  assert.equal(res.score, -1);
});

test('Task Ranking: overdue high priority ranks higher than future low priority', () => {
  const overdueTask = {
    id: 't1',
    title: 'Overdue DSA Assignment',
    due_date: '2026-10-01',
    priority: 'urgent',
    task_type: 'assignment',
    completed: false,
    estimated_minutes: 45,
  };

  const futureTask = {
    id: 't2',
    title: 'Next Month Reading',
    due_date: '2026-11-20',
    priority: 'low',
    task_type: 'lecture',
    completed: false,
    estimated_minutes: 30,
  };

  const overdueScore = getTaskScore(overdueTask);
  const futureScore = getTaskScore(futureTask);

  assert.ok(overdueScore.score > futureScore.score, 'Overdue score must exceed future score');
  assert.ok(overdueScore.score > 1000, 'Overdue score must have base > 1000');
});

test('Focus Recommendation: picks highest impact actionable task', () => {
  const tasks = [
    {
      id: 't1',
      title: 'Low priority personal task',
      priority: 'low',
      task_type: 'personal',
      completed: false,
      estimated_minutes: 90,
    },
    {
      id: 't2',
      title: 'Urgent OS Process Scheduling Assignment',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'urgent',
      task_type: 'assignment',
      completed: false,
      estimated_minutes: 45,
      subtasks: [{ id: 'st1', completed: true }, { id: 'st2', completed: false }],
    },
  ];

  const rec = getRecommendedFocusTask(tasks);
  assert.ok(rec !== null);
  assert.equal(rec.task.id, 't2');
  assert.ok(rec.reason.length > 0);
});

test('Reminder Triggers: 15-minute preset calculates exact offset', () => {
  const trigger = calculateTriggerDate('2026-10-20', '14:30', 'preset_15m');
  assert.ok(trigger !== null);
  assert.equal(trigger.getFullYear(), 2026);
  assert.equal(trigger.getMonth(), 9); // Oct is 9 (0-indexed)
  assert.equal(trigger.getDate(), 20);
  assert.equal(trigger.getHours(), 14);
  assert.equal(trigger.getMinutes(), 15);
});

test('Reminder Triggers: 1-hour preset calculates exact offset', () => {
  const trigger = calculateTriggerDate('2026-10-20', '14:30', 'preset_1h');
  assert.ok(trigger !== null);
  assert.equal(trigger.getHours(), 13);
  assert.equal(trigger.getMinutes(), 30);
});

test('Reminder Triggers: day before 9am calculates exact prior day', () => {
  const trigger = calculateTriggerDate('2026-10-20', '18:00', 'day_before_9am');
  assert.ok(trigger !== null);
  assert.equal(trigger.getDate(), 19);
  assert.equal(trigger.getHours(), 9);
  assert.equal(trigger.getMinutes(), 0);
});

test('Backup Validation: accepts valid backup JSON format', () => {
  const validJson = JSON.stringify({
    version: '1.0.0',
    tasks: [{ id: '1', title: 'Task' }],
    subjects: [{ id: 'sub-1', name: 'DSA' }],
  });
  const res = validateBackupJson(validJson);
  assert.equal(res.valid, true);
});

test('Backup Validation: rejects invalid or corrupt JSON safely', () => {
  const corruptJson = '{ "random": 123 }';
  const res = validateBackupJson(corruptJson);
  assert.equal(res.valid, false);

  const brokenJson = 'NOT_JSON';
  const brokenRes = validateBackupJson(brokenJson);
  assert.equal(brokenRes.valid, false);
});
