import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CircularProgressCard extends StatelessWidget {
  final double percentage; // 0.0 to 1.0
  final int completedTasks;
  final int totalTasks;

  const CircularProgressCard({
    Key? key,
    required this.percentage,
    required this.completedTasks,
    required this.totalTasks,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final percentInt = (percentage * 100).round();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
      ),
      child: Row(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 72,
                height: 72,
                child: CircularProgressIndicator(
                  value: percentage,
                  strokeWidth: 8,
                  backgroundColor: isDark
                      ? AppColors.darkBorder
                      : const Color(0xFFE2E8F0),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    percentage >= 1.0
                        ? AppColors.success
                        : AppColors.primary,
                  ),
                ),
              ),
              Text(
                '$percentInt%',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Today's Progress",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  totalTasks == 0
                      ? 'No tasks scheduled for today.'
                      : '$completedTasks of $totalTasks tasks finished',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  percentage >= 1.0 && totalTasks > 0
                      ? '🎉 Amazing! All caught up for today!'
                      : percentage > 0.5
                          ? '🔥 Halfway there! Keep going!'
                          : '🚀 Stay focused and finish strong.',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: percentage >= 1.0
                        ? AppColors.success
                        : AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
