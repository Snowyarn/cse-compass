import '../models/models.dart';

class TaskRankingResult {
  final TaskItem? recommendedTask;
  final String reasoning;
  final double score;

  TaskRankingResult({
    this.recommendedTask,
    required this.reasoning,
    this.score = 0.0,
  });
}

class TaskRankingService {
  static TaskRankingResult getFocusTask(List<TaskItem> activeTasks) {
    if (activeTasks.isEmpty) {
      return TaskRankingResult(
        recommendedTask: null,
        reasoning: 'All academic tasks are completed! Time to relax or practice coding.',
      );
    }

    final now = DateTime.now();
    TaskItem? bestTask;
    double highestScore = -1.0;
    String bestReason = '';

    for (var task in activeTasks) {
      double score = 0.0;
      String reason = '';

      // Priority weight
      switch (task.priority) {
        case TaskPriority.urgent:
          score += 100;
          reason = 'Urgent priority';
          break;
        case TaskPriority.high:
          score += 75;
          reason = 'High priority';
          break;
        case TaskPriority.medium:
          score += 50;
          reason = 'Medium priority';
          break;
        case TaskPriority.low:
          score += 25;
          reason = 'Low priority';
          break;
      }

      // Deadline proximity
      if (task.dueDate != null) {
        try {
          final due = DateTime.parse(task.dueDate!);
          final differenceInDays = DateTime(due.year, due.month, due.day)
              .difference(DateTime(now.year, now.month, now.day))
              .inDays;

          if (differenceInDays < 0) {
            score += 150;
            reason = 'Overdue by ${-differenceInDays} day(s)! Urgent action required.';
          } else if (differenceInDays == 0) {
            score += 90;
            reason = 'Due today! High focus recommended.';
          } else if (differenceInDays == 1) {
            score += 45;
            reason = 'Due tomorrow. Ideal to complete in advance.';
          } else if (differenceInDays <= 3) {
            score += 20;
            reason = 'Approaching deadline in $differenceInDays days.';
          }
        } catch (_) {}
      }

      // Subtask progress bonus (momentum)
      if (task.subtasks.isNotEmpty) {
        final completedSubs = task.subtasks.where((s) => s.completed).length;
        if (completedSubs > 0 && completedSubs < task.subtasks.length) {
          score += 25;
          reason += ' • Active momentum ($completedSubs/${task.subtasks.length} subtasks done)';
        }
      }

      // Estimated duration suitability (tasks between 20-60 mins fit a pomodoro block)
      if (task.estimatedMinutes <= 45) {
        score += 10;
      }

      if (score > highestScore) {
        highestScore = score;
        bestTask = task;
        bestReason = reason.isNotEmpty ? reason : 'Optimal task to tackle next based on schedule.';
      }
    }

    return TaskRankingResult(
      recommendedTask: bestTask,
      reasoning: bestReason,
      score: highestScore,
    );
  }
}
