import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import 'task_form_screen.dart';
import 'cse_hub/focus_timer_screen.dart';

class TaskDetailScreen extends StatelessWidget {
  final String taskId;

  const TaskDetailScreen({Key? key, required this.taskId}) : super(key: key);

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

  void _confirmDelete(BuildContext context, AppProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Task?'),
        content: const Text(
            'Are you sure you want to permanently delete this task and all scheduled reminders?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () {
              provider.deleteTask(taskId);
              Navigator.of(ctx).pop();
              Navigator.of(context).pop();
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        final taskList = provider.tasks.where((t) => t.id == taskId).toList();
        if (taskList.isEmpty) {
          return Scaffold(
            appBar: AppBar(title: const Text('Task Detail')),
            body: const Center(child: Text('Task not found or was deleted.')),
          );
        }

        final task = taskList.first;
        final priorityColor = _getPriorityColor(task.priority);

        return Scaffold(
          appBar: AppBar(
            title: const Text('Task Details'),
            actions: [
              IconButton(
                icon: const Icon(Icons.edit_outlined),
                tooltip: 'Edit Task',
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => TaskFormScreen(taskToEdit: task),
                    ),
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: AppColors.error),
                tooltip: 'Delete Task',
                onPressed: () => _confirmDelete(context, provider),
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Completion & Priority Row
              Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      provider.toggleTaskCompleted(task.id, !task.completed);
                    },
                    child: Container(
                      width: 26,
                      height: 26,
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
                          ? const Icon(Icons.check, size: 16, color: Colors.white)
                          : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: priorityColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${task.priority.name.toUpperCase()} PRIORITY',
                      style: TextStyle(
                        color: priorityColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (task.subjectName != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        task.subjectCode ?? task.subjectName!,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),

              // Title
              Text(
                task.title,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  decoration:
                      task.completed ? TextDecoration.lineThrough : null,
                ),
              ),
              const SizedBox(height: 12),

              // Description
              if (task.description != null && task.description!.isNotEmpty) ...[
                Text(
                  task.description!,
                  style: TextStyle(
                    fontSize: 15,
                    height: 1.5,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Meta Details Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color:
                        isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Column(
                  children: [
                    _MetaRow(
                      icon: Icons.event,
                      label: 'Due Date',
                      value: task.dueDate != null
                          ? '${task.dueDate} at ${task.dueTime ?? "23:59"}'
                          : 'No due date set',
                    ),
                    const Divider(height: 16),
                    _MetaRow(
                      icon: Icons.category_outlined,
                      label: 'Category',
                      value: task.category,
                    ),
                    const Divider(height: 16),
                    _MetaRow(
                      icon: Icons.timer_outlined,
                      label: 'Estimated Time',
                      value: '${task.estimatedMinutes} minutes',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Focus Button
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => FocusTimerScreen(
                        initialSubjectId: task.subjectId,
                        initialTaskId: task.id,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.timer),
                label: const Text('Start Focus Session for this Task'),
              ),
              const SizedBox(height: 24),

              // Subtasks Checklist
              if (task.subtasks.isNotEmpty) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Subtasks Checklist',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                    Text(
                      '${task.subtasks.where((s) => s.completed).length} of ${task.subtasks.length} done',
                      style: TextStyle(
                          fontSize: 12,
                          color: isDark
                              ? AppColors.darkTextMuted
                              : AppColors.lightTextMuted),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ...task.subtasks.map((st) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color:
                          isDark ? AppColors.darkCard : AppColors.lightCard,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isDark
                            ? AppColors.darkBorder
                            : AppColors.lightBorder,
                      ),
                    ),
                    child: CheckboxListTile(
                      value: st.completed,
                      onChanged: (val) {
                        provider.toggleSubtask(st.id, val ?? false);
                      },
                      title: Text(
                        st.title,
                        style: TextStyle(
                          fontSize: 14,
                          decoration:
                              st.completed ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      dense: true,
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                  );
                }),
                const SizedBox(height: 20),
              ],

              // Reminders
              if (task.reminders.isNotEmpty) ...[
                const Text('Scheduled Reminders',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                ...task.reminders.map((r) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color:
                          isDark ? AppColors.darkCard : AppColors.lightCard,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isDark
                            ? AppColors.darkBorder
                            : AppColors.lightBorder,
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.notifications_active,
                            size: 18, color: AppColors.primary),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                r.reminderType.name.replaceAll('_', ' '),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                              Text(
                                r.scheduledTime,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('ACTIVE',
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.success)),
                        ),
                      ],
                    ),
                  );
                }),
              ],

              const SizedBox(height: 20),

              // Tags
              if (task.tags.isNotEmpty) ...[
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: task.tags.map((tag) {
                    return Chip(
                      label: Text('#$tag', style: const TextStyle(fontSize: 11)),
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    );
                  }).toList(),
                ),
              ],

              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _MetaRow({
    Key? key,
    required this.icon,
    required this.label,
    required this.value,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      children: [
        Icon(icon,
            size: 18,
            color: isDark
                ? AppColors.darkTextSecondary
                : AppColors.lightTextSecondary),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: isDark
                ? AppColors.darkTextSecondary
                : AppColors.lightTextSecondary,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
