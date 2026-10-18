import { Task } from '../types';

/**
 * Encapsulates a recommended task recommendation output, including its
 * relative priority score and an explanation for the user.
 */
export interface TaskRecommendation {
  task: Task;
  score: number;
  reason: string;
}

/**
 * Computes an academic urgency and impact score for a task.
 * Higher scores represent tasks that should be tackled sooner.
 * Completed tasks always return a negative score (-1) to be excluded from recommendations.
 *
 * Weight Factors:
 * 1. Deadline Proximity (Overdue base: 1000+, Due Today: 600, Due Tomorrow: 380)
 * 2. Priority Level (Urgent: +300, High: +180, Medium: +70)
 * 3. Academic Task Type (Exams: +140, Assignments/Labs: +90, Coding: +50)
 * 4. Estimated Time Sweet-spot (15-60 min tasks: +40 for momentum)
 * 5. Subtask Checklist Momentum (+35 when partially completed)
 *
 * @param task The task to evaluate
 * @returns Object with numeric score and human-readable explanation reason
 */
export const getTaskScore = (task: Task): { score: number; reason: string } => {
  if (task.completed) {
    return { score: -1, reason: 'Already completed' };
  }

  let score = 0;
  const reasons: string[] = [];
  const now = new Date();

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

/**
 * Analyzes all pending tasks and selects the single highest-impact task
 * to recommend in the "Focus Now" dashboard section.
 *
 * @param tasks Complete list of user tasks
 * @returns TaskRecommendation containing the highest-ranked task and rationale, or null if all completed
 */
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
