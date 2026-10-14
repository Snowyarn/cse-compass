import { Task } from '../types';

export interface TaskRecommendation {
  task: Task;
  score: number;
  reason: string;
}

export const getTaskScore = (task: Task): { score: number; reason: string } => {
  if (task.completed) {
    return { score: -1, reason: 'Already completed' };
  }

  let score = 0;
  const reasons: string[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Deadline Proximity
  if (task.due_date) {
    const [y, m, d] = task.due_date.split('-').map(Number);
    const dueDate = new Date(y, m - 1, d);
    const diffDays = Math.ceil((dueDate.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      score += 1000 + Math.abs(diffDays) * 50;
      reasons.push(`Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`);
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

  // 2. Priority Weight
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

  // 3. Task Type Weight
  if (task.task_type === 'exam') {
    score += 140;
    reasons.push('Exam preparation');
  } else if (task.task_type === 'assignment' || task.task_type === 'lab') {
    score += 90;
  } else if (task.task_type === 'coding') {
    score += 50;
  }

  // 4. Manageability / Duration Bonus (Bite-sized sweet spot: 25 - 60 mins)
  const estMins = task.estimated_minutes || 30;
  if (estMins >= 15 && estMins <= 60) {
    score += 40;
  }

  // 5. Checklist Momentum
  if (task.subtasks && task.subtasks.length > 0) {
    const compCount = task.subtasks.filter((st) => st.completed).length;
    if (compCount > 0 && compCount < task.subtasks.length) {
      score += 35;
      reasons.push(`${compCount}/${task.subtasks.length} subtasks done`);
    }
  }

  return {
    score,
    reason: reasons.slice(0, 2).join(' • '),
  };
};

// Select the single highest-impact "Focus Now" task
export const getRecommendedFocusTask = (tasks: Task[]): TaskRecommendation | null => {
  const pendingTasks = tasks.filter((t) => !t.completed);
  if (pendingTasks.length === 0) return null;

  let bestTask: Task | null = null;
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
  return {
    task: bestTask,
    score: highestScore,
    reason: bestReason,
  };
};
