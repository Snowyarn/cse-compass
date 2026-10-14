import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class TaskCard extends StatelessWidget {
  final TaskItem task;
  final VoidCallback onTap;
  final ValueChanged<bool> onToggleCompleted;
  final VoidCallback? onDelete;
  final VoidCallback? onEdit;

  const TaskCard({
    Key? key,
    required this.task,
    required this.onTap,
    required this.onToggleCompleted,
    this.onDelete,
    this.onEdit,
  }) : super(key: key);

  Color _getPriorityColor(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.urgent:
        return AppColors.error;
      case TaskPriority.high:
        return AppColors.warning;
      case TaskPriority.medium:
        return AppColors.primary;
      case TaskPriority.low:
        return const Color(0xFF64748B);
    }
  }

  Color _parseHexColor(String? hexString, Color defaultColor) {
    if (hexString == null || hexString.isEmpty) return defaultColor;
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    try {
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return defaultColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final priorityColor = _getPriorityColor(task.priority);
    final subjectColor = _parseHexColor(task.subjectColor, AppColors.primary);

    final now = DateTime.now();
    final todayStr =
        "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    final isOverdue =
        !task.completed && task.dueDate != null && task.dueDate!.compareTo(todayStr) < 0;
    final isToday = task.dueDate == todayStr;

    final completedSubtasks = task.subtasks.where((s) => s.completed).length;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Completion Checkbox
                GestureDetector(
                  onTap: () => onToggleCompleted(!task.completed),
                  child: Container(
                    margin: const EdgeInsets.only(top: 2, right: 12),
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: task.completed
                            ? AppColors.success
                            : priorityColor,
                        width: 2,
                      ),
                      color: task.completed
                          ? AppColors.success
                          : Colors.transparent,
                    ),
                    child: task.completed
                        ? const Icon(Icons.check, size: 14, color: Colors.white)
                        : null,
                  ),
                ),

                // Main Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header: Subject & Priority Tag
                      Row(
                        children: [
                          if (task.subjectName != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: subjectColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                task.subjectCode ?? task.subjectName!,
                                style: TextStyle(
                                  color: subjectColor,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                          ],
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: priorityColor.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              task.priority.name.toUpperCase(),
                              style: TextStyle(
                                color: priorityColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const Spacer(),
                          if (onDelete != null || onEdit != null)
                            PopupMenuButton<String>(
                              padding: EdgeInsets.zero,
                              iconSize: 18,
                              icon: Icon(
                                Icons.more_horiz,
                                color: isDark
                                    ? AppColors.darkTextMuted
                                    : AppColors.lightTextMuted,
                              ),
                              onSelected: (val) {
                                if (val == 'edit' && onEdit != null) onEdit!();
                                if (val == 'delete' && onDelete != null) onDelete!();
                              },
                              itemBuilder: (context) => [
                                if (onEdit != null)
                                  const PopupMenuItem(
                                    value: 'edit',
                                    child: Row(
                                      children: [
                                        Icon(Icons.edit_outlined, size: 16),
                                        SizedBox(width: 8),
                                        Text('Edit'),
                                      ],
                                    ),
                                  ),
                                if (onDelete != null)
                                  const PopupMenuItem(
                                    value: 'delete',
                                    child: Row(
                                      children: [
                                        Icon(Icons.delete_outline,
                                            size: 16, color: AppColors.error),
                                        SizedBox(width: 8),
                                        Text('Delete',
                                            style: TextStyle(
                                                color: AppColors.error)),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),

                      // Task Title
                      Text(
                        task.title,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          decoration: task.completed
                              ? TextDecoration.lineThrough
                              : null,
                          color: task.completed
                              ? (isDark
                                  ? AppColors.darkTextMuted
                                  : AppColors.lightTextMuted)
                              : (isDark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.lightTextPrimary),
                        ),
                      ),

                      if (task.description != null &&
                          task.description!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          task.description!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],

                      const SizedBox(height: 10),

                      // Footer: Due Date, Subtasks, Reminders
                      Wrap(
                        spacing: 12,
                        runSpacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          if (task.dueDate != null)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.event,
                                  size: 13,
                                  color: isOverdue
                                      ? AppColors.error
                                      : isToday
                                          ? AppColors.warning
                                          : (isDark
                                              ? AppColors.darkTextMuted
                                              : AppColors.lightTextMuted),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  isOverdue
                                      ? 'Overdue (${task.dueDate})'
                                      : isToday
                                          ? 'Today ${task.dueTime ?? ""}'
                                          : '${task.dueDate} ${task.dueTime ?? ""}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: (isOverdue || isToday)
                                        ? FontWeight.w600
                                        : FontWeight.normal,
                                    color: isOverdue
                                        ? AppColors.error
                                        : isToday
                                            ? AppColors.warning
                                            : (isDark
                                                ? AppColors.darkTextSecondary
                                                : AppColors.lightTextSecondary),
                                  ),
                                ),
                              ],
                            ),
                          if (task.subtasks.isNotEmpty)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.check_box_outlined,
                                  size: 13,
                                  color: isDark
                                      ? AppColors.darkTextMuted
                                      : AppColors.lightTextMuted,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '$completedSubtasks/${task.subtasks.length}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                          if (task.reminders.isNotEmpty)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.notifications_active_outlined,
                                  size: 13,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${task.reminders.length}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          if (task.estimatedMinutes > 0)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.timer_outlined,
                                  size: 13,
                                  color: isDark
                                      ? AppColors.darkTextMuted
                                      : AppColors.lightTextMuted,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${task.estimatedMinutes}m',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
