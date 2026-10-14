import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/circular_progress_widget.dart';
import '../widgets/focus_task_card.dart';
import '../widgets/task_card.dart';
import '../widgets/empty_state_widget.dart';
import 'task_form_screen.dart';
import 'task_detail_screen.dart';
import 'cse_hub/focus_timer_screen.dart';
import 'cse_hub/coding_tracker_screen.dart';
import 'reminders_screen.dart';
import 'analytics_screen.dart';

class HomeDashboardScreen extends StatelessWidget {
  const HomeDashboardScreen({Key? key}) : super(key: key);

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final now = DateTime.now();
        final dateFormatted = DateFormat('EEEE, MMMM d').format(now);
        final greeting = _getGreeting();
        final userName = provider.settings.userName;

        final todayTasks = provider.todayTasks;
        final overdueTasks = provider.overdueTasks;
        final completionRate = provider.todayCompletionRate;

        return Scaffold(
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$greeting, $userName 👋',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  dateFormatted,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_active_outlined),
                tooltip: 'Active Reminders',
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const RemindersScreen()),
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.bar_chart_rounded),
                tooltip: 'Analytics',
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AnalyticsScreen()),
                  );
                },
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () => provider.refreshAll(),
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                // 1. Overdue Warning (if any)
                if (overdueTasks.isNotEmpty) ...[
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: AppColors.error.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded,
                            color: AppColors.error, size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? "s" : ""}',
                                style: const TextStyle(
                                  color: AppColors.error,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Pending past deadlines need attention.',
                                style: TextStyle(
                                  color: isDark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.lightTextSecondary,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // 2. Circular Progress Card
                CircularProgressCard(
                  percentage: completionRate,
                  completedTasks:
                      todayTasks.where((t) => t.completed).length,
                  totalTasks: todayTasks.length,
                ),
                const SizedBox(height: 16),

                // 3. Quick Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: _QuickActionButton(
                        icon: Icons.add_task,
                        label: 'New Task',
                        color: AppColors.primary,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => const TaskFormScreen()),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _QuickActionButton(
                        icon: Icons.timer,
                        label: 'Focus Timer',
                        color: AppColors.secondary,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => const FocusTimerScreen()),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _QuickActionButton(
                        icon: Icons.code,
                        label: 'DSA Log',
                        color: AppColors.success,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => const CodingTrackerScreen()),
                          );
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // 4. Focus Now ("Next Best Task")
                FocusTaskCard(
                  task: provider.focusTask,
                  reasoning: provider.focusReason,
                  onStartFocus: () {
                    if (provider.focusTask != null) {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => FocusTimerScreen(
                            initialSubjectId: provider.focusTask!.subjectId,
                            initialTaskId: provider.focusTask!.id,
                          ),
                        ),
                      );
                    }
                  },
                  onTapTask: () {
                    if (provider.focusTask != null) {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => TaskDetailScreen(
                            taskId: provider.focusTask!.id,
                          ),
                        ),
                      );
                    }
                  },
                ),
                const SizedBox(height: 24),

                // 5. Today's Tasks Section Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Today's Schedule",
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      '${todayTasks.length} task${todayTasks.length != 1 ? "s" : ""}',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Today's Tasks List or Empty State
                if (todayTasks.isEmpty) ...[
                  EmptyStateWidget(
                    icon: Icons.check_circle_outline,
                    title: 'No Tasks For Today',
                    description:
                        'You are completely free today! Add a task or schedule study time.',
                    actionLabel: 'Add Task for Today',
                    onAction: () {
                      final todayStr =
                          "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => TaskFormScreen(initialDueDate: todayStr),
                        ),
                      );
                    },
                  ),
                ] else ...[
                  ...todayTasks.map(
                    (task) => TaskCard(
                      task: task,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => TaskDetailScreen(taskId: task.id),
                          ),
                        );
                      },
                      onToggleCompleted: (completed) {
                        provider.toggleTaskCompleted(task.id, completed);
                      },
                      onDelete: () => provider.deleteTask(task.id),
                      onEdit: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => TaskFormScreen(taskToEdit: task),
                          ),
                        );
                      },
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // 6. Academic Progress Snapshot
                _AcademicOverviewSection(provider: provider),
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    Key? key,
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: isDark ? AppColors.darkCard : AppColors.lightCard,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 20, color: color),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AcademicOverviewSection extends StatelessWidget {
  final AppProvider provider;

  const _AcademicOverviewSection({Key? key, required this.provider})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final subjects = provider.subjects;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Academic Pulse',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: subjects.map((s) {
              return Container(
                width: 140,
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.code,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      s.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 10),
                    LinearProgressIndicator(
                      value: s.syllabusProgress / 100.0,
                      backgroundColor: isDark
                          ? AppColors.darkBorder
                          : const Color(0xFFE2E8F0),
                      valueColor:
                          const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      minHeight: 5,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${s.syllabusProgress}% covered',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
