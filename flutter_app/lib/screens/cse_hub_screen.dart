import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import 'cse_hub/subject_detail_screen.dart';
import 'cse_hub/assessments_screen.dart';
import 'cse_hub/coding_tracker_screen.dart';
import 'cse_hub/projects_screen.dart';
import 'cse_hub/focus_timer_screen.dart';

class CseHubScreen extends StatelessWidget {
  const CseHubScreen({Key? key}) : super(key: key);

  Color _parseColor(String hex) {
    try {
      final buffer = StringBuffer();
      if (hex.length == 6 || hex.length == 7) buffer.write('ff');
      buffer.write(hex.replaceFirst('#', ''));
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return AppColors.primary;
    }
  }

  void _showAddSubjectDialog(BuildContext context, AppProvider provider) {
    final nameController = TextEditingController();
    final codeController = TextEditingController();
    final semController = TextEditingController(text: '3');
    final creditsController = TextEditingController(text: '4');
    final instructorController = TextEditingController();

    String selectedColor = '#6366F1';
    final colorOptions = [
      '#6366F1', // Indigo
      '#EC4899', // Pink
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#3B82F6', // Blue
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Add B.Tech Subject'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Subject Name *',
                    hintText: 'e.g. Computer Networks',
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: codeController,
                        decoration: const InputDecoration(
                          labelText: 'Code *',
                          hintText: 'e.g. CS202',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: creditsController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Credits',
                          hintText: '4',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: instructorController,
                  decoration: const InputDecoration(
                    labelText: 'Faculty / Instructor Name',
                    hintText: 'e.g. Dr. Nair',
                  ),
                ),
                const SizedBox(height: 16),
                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Subject Color',
                      style:
                          TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: colorOptions.map((c) {
                    final colorVal = _parseColor(c);
                    final isSelected = selectedColor == c;
                    return GestureDetector(
                      onTap: () => setDialogState(() => selectedColor = c),
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: colorVal,
                          shape: BoxShape.circle,
                          border: isSelected
                              ? Border.all(color: Colors.white, width: 2.5)
                              : null,
                        ),
                        child: isSelected
                            ? const Icon(Icons.check,
                                color: Colors.white, size: 16)
                            : null,
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (nameController.text.trim().isEmpty ||
                    codeController.text.trim().isEmpty) return;

                final subject = SubjectItem(
                  id: 'sub_${DateTime.now().millisecondsSinceEpoch}',
                  name: nameController.text.trim(),
                  code: codeController.text.trim().toUpperCase(),
                  semester: int.tryParse(semController.text.trim()) ?? 3,
                  credits: int.tryParse(creditsController.text.trim()) ?? 4,
                  instructor: instructorController.text.trim().isNotEmpty
                      ? instructorController.text.trim()
                      : null,
                  color: selectedColor,
                  icon: 'school',
                  syllabusProgress: 0,
                );

                provider.addSubject(subject);
                Navigator.of(ctx).pop();
              },
              child: const Text('Add Subject'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        final subjects = provider.subjects;

        return Scaffold(
          appBar: AppBar(
            title: const Text('CSE Command Hub'),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                tooltip: 'Add Subject',
                onPressed: () => _showAddSubjectDialog(context, provider),
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // CSE Hub Quick Launch Grid
              const Text(
                'Academic Modules',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.4,
                children: [
                  _HubModuleCard(
                    title: 'Exams & Viva',
                    subtitle: '${provider.assessments.length} tracked',
                    icon: Icons.assignment_outlined,
                    color: AppColors.error,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const AssessmentsScreen()),
                      );
                    },
                  ),
                  _HubModuleCard(
                    title: 'DSA & Coding',
                    subtitle: '${provider.codingProblems.length} solved',
                    icon: Icons.terminal_rounded,
                    color: AppColors.success,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const CodingTrackerScreen()),
                      );
                    },
                  ),
                  _HubModuleCard(
                    title: 'CSE Projects',
                    subtitle: '${provider.projects.length} in progress',
                    icon: Icons.code_rounded,
                    color: AppColors.warning,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const ProjectsScreen()),
                      );
                    },
                  ),
                  _HubModuleCard(
                    title: 'Focus Sprint',
                    subtitle: 'Pomodoro timer',
                    icon: Icons.timer_outlined,
                    color: AppColors.primary,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const FocusTimerScreen()),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Enrolled Subjects List
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Enrolled Subjects & Syllabus',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  TextButton.icon(
                    onPressed: () => _showAddSubjectDialog(context, provider),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add'),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              ...subjects.map((subject) {
                final color = _parseColor(subject.color);

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : AppColors.lightCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark
                          ? AppColors.darkBorder
                          : AppColors.lightBorder,
                    ),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                SubjectDetailScreen(subject: subject),
                          ),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    subject.code,
                                    style: TextStyle(
                                      color: color,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    subject.name,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const Icon(Icons.chevron_right, size: 20),
                              ],
                            ),
                            if (subject.instructor != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Instructor: ${subject.instructor}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Syllabus: ${subject.syllabusProgress}%',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  '${subject.activeTasksCount} active tasks',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            LinearProgressIndicator(
                              value: subject.syllabusProgress / 100.0,
                              backgroundColor: isDark
                                  ? AppColors.darkBorder
                                  : const Color(0xFFE2E8F0),
                              valueColor: AlwaysStoppedAnimation<Color>(color),
                              minHeight: 6,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),

              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}

class _HubModuleCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _HubModuleCard({
    Key? key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: isDark ? AppColors.darkCard : AppColors.lightCard,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 10),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
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
      ),
    );
  }
}
