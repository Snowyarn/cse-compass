import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        final totalTasks = provider.tasks.length;
        final completedTasks =
            provider.tasks.where((t) => t.completed).length;
        final activeTasks = totalTasks - completedTasks;
        final solvedCoding = provider.codingProblems
            .where((cp) => cp.status == 'Solved')
            .length;

        final totalFocusMinutes = provider.studySessions.fold<int>(
            0, (sum, s) => sum + s.durationMinutes);
        final focusHours = (totalFocusMinutes / 60.0).toStringAsFixed(1);

        return Scaffold(
          appBar: AppBar(
            title: const Text('Productivity Analytics'),
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Top 4 Metrics Grid
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.4,
                children: [
                  _MetricCard(
                    title: 'Tasks Finished',
                    value: '$completedTasks',
                    subtitle: 'of $totalTasks total',
                    color: AppColors.success,
                    icon: Icons.check_circle_outline,
                  ),
                  _MetricCard(
                    title: 'Active Work',
                    value: '$activeTasks',
                    subtitle: 'pending tasks',
                    color: AppColors.primary,
                    icon: Icons.pending_actions,
                  ),
                  _MetricCard(
                    title: 'DSA Solved',
                    value: '$solvedCoding',
                    subtitle: 'problems mastered',
                    color: AppColors.secondary,
                    icon: Icons.terminal,
                  ),
                  _MetricCard(
                    title: 'Focus Time',
                    value: '${focusHours}h',
                    subtitle: '$totalFocusMinutes minutes logged',
                    color: AppColors.warning,
                    icon: Icons.timer,
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Study Sessions History
              const Text(
                'Recent Focus Sessions',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),

              if (provider.studySessions.isEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : AppColors.lightCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color:
                          isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: const Center(
                    child: Text('No study sessions completed yet.'),
                  ),
                ),
              ] else ...[
                ...provider.studySessions.map((session) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color:
                          isDark ? AppColors.darkCard : AppColors.lightCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isDark
                            ? AppColors.darkBorder
                            : AppColors.lightBorder,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.bolt,
                              size: 18, color: AppColors.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                session.subjectName ?? 'Deep Study Block',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700, fontSize: 14),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${session.startTime} • ${session.durationMinutes} mins',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.lightTextSecondary,
                                ),
                              ),
                              if (session.notes != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  session.notes!,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark
                                        ? AppColors.darkTextMuted
                                        : AppColors.lightTextMuted,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '+${session.durationMinutes}m',
                            style: const TextStyle(
                              color: AppColors.success,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],

              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color color;
  final IconData icon;

  const _MetricCard({
    Key? key,
    required this.title,
    required this.value,
    required this.subtitle,
    required this.color,
    required this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
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
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
              Icon(icon, size: 18, color: color),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 11,
              color: isDark
                  ? AppColors.darkTextMuted
                  : AppColors.lightTextMuted,
            ),
          ),
        ],
      ),
    );
  }
}
