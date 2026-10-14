import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/empty_state_widget.dart';

class ProjectsScreen extends StatelessWidget {
  const ProjectsScreen({Key? key}) : super(key: key);

  void _showAddProjectDialog(BuildContext context, AppProvider provider) {
    final nameController = TextEditingController();
    final descController = TextEditingController();
    final techStackController = TextEditingController();
    final repoUrlController = TextEditingController();
    final milestoneController = TextEditingController();

    List<String> milestoneTitles = [];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Add CSE Project'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Project Name *',
                    hintText: 'e.g. Distributed Key-Value Store',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    hintText: 'Summary of project architecture and goal...',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: techStackController,
                  decoration: const InputDecoration(
                    labelText: 'Tech Stack (e.g. Go, gRPC, React)',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: repoUrlController,
                  decoration: const InputDecoration(
                    labelText: 'GitHub / Repo URL (Optional)',
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: milestoneController,
                        decoration: const InputDecoration(
                          hintText: 'Add milestone step...',
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle,
                          color: AppColors.primary),
                      onPressed: () {
                        if (milestoneController.text.trim().isNotEmpty) {
                          setDialogState(() {
                            milestoneTitles
                                .add(milestoneController.text.trim());
                            milestoneController.clear();
                          });
                        }
                      },
                    ),
                  ],
                ),
                if (milestoneTitles.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  ...milestoneTitles.asMap().entries.map(
                        (e) => Row(
                          children: [
                            const Icon(Icons.check_circle_outline, size: 14),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(e.value,
                                  style: const TextStyle(fontSize: 12)),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, size: 14),
                              onPressed: () {
                                setDialogState(
                                    () => milestoneTitles.removeAt(e.key));
                              },
                            ),
                          ],
                        ),
                      ),
                ],
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
                if (nameController.text.trim().isEmpty) return;
                final projId = 'proj_${DateTime.now().millisecondsSinceEpoch}';

                final milestones = milestoneTitles
                    .map((m) => ProjectMilestone(
                          id: 'm_${DateTime.now().microsecondsSinceEpoch}_${m.hashCode}',
                          projectId: projId,
                          title: m,
                          completed: false,
                        ))
                    .toList();

                final project = ProjectItem(
                  id: projId,
                  name: nameController.text.trim(),
                  description: descController.text.trim().isNotEmpty
                      ? descController.text.trim()
                      : null,
                  techStack: techStackController.text.trim(),
                  repoUrl: repoUrlController.text.trim().isNotEmpty
                      ? repoUrlController.text.trim()
                      : null,
                  status: 'in_progress',
                  progressPercentage: 0,
                  milestones: milestones,
                );

                provider.addProject(project);
                Navigator.of(ctx).pop();
              },
              child: const Text('Save Project'),
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
        final projects = provider.projects;

        return Scaffold(
          appBar: AppBar(
            title: const Text('CSE Projects'),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                tooltip: 'Add Project',
                onPressed: () => _showAddProjectDialog(context, provider),
              ),
            ],
          ),
          body: projects.isEmpty
              ? EmptyStateWidget(
                  icon: Icons.code_rounded,
                  title: 'No Projects Added',
                  description:
                      'Track your semester capstones, personal portfolios, and open-source contributions.',
                  actionLabel: 'Add First Project',
                  onAction: () => _showAddProjectDialog(context, provider),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: projects.length,
                  itemBuilder: (context, index) {
                    final p = projects[index];
                    final completedMilestones =
                        p.milestones.where((m) => m.completed).length;
                    final progress = p.milestones.isNotEmpty
                        ? (completedMilestones / p.milestones.length)
                        : (p.progressPercentage / 100.0);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color:
                            isDark ? AppColors.darkCard : AppColors.lightCard,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.lightBorder,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  p.name,
                                  style: const TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${(progress * 100).round()}% DONE',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (p.description != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              p.description!,
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                          const SizedBox(height: 10),

                          // Tech Stack Tags
                          if (p.techStack.isNotEmpty)
                            Wrap(
                              spacing: 6,
                              children: p.techStack.split(',').map((tech) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? AppColors.darkSurface
                                        : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    tech.trim(),
                                    style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600),
                                  ),
                                );
                              }).toList(),
                            ),

                          const SizedBox(height: 14),

                          // Progress Bar
                          LinearProgressIndicator(
                            value: progress,
                            backgroundColor: isDark
                                ? AppColors.darkBorder
                                : const Color(0xFFE2E8F0),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                                AppColors.primary),
                            minHeight: 6,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          const SizedBox(height: 14),

                          // Milestones
                          if (p.milestones.isNotEmpty) ...[
                            const Text(
                              'Milestones',
                              style: TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 6),
                            ...p.milestones.map((m) {
                              return CheckboxListTile(
                                contentPadding: EdgeInsets.zero,
                                dense: true,
                                value: m.completed,
                                title: Text(
                                  m.title,
                                  style: TextStyle(
                                    fontSize: 13,
                                    decoration: m.completed
                                        ? TextDecoration.lineThrough
                                        : null,
                                  ),
                                ),
                                onChanged: (val) {
                                  provider.toggleMilestoneCompleted(
                                      m.id, val ?? false);
                                },
                              );
                            }),
                          ],

                          if (p.repoUrl != null) ...[
                            const SizedBox(height: 8),
                            TextButton.icon(
                              onPressed: () async {
                                final uri = Uri.parse(p.repoUrl!);
                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri);
                                }
                              },
                              icon: const Icon(Icons.link, size: 16),
                              label: const Text('View Repository'),
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}
