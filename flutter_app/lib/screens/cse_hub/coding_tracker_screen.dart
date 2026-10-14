import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/empty_state_widget.dart';

class CodingTrackerScreen extends StatelessWidget {
  const CodingTrackerScreen({Key? key}) : super(key: key);

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return AppColors.success;
      case 'medium':
        return AppColors.warning;
      case 'hard':
        return AppColors.error;
      default:
        return AppColors.primary;
    }
  }

  void _showAddDialog(BuildContext context, AppProvider provider) {
    final titleController = TextEditingController();
    final topicController = TextEditingController();
    final urlController = TextEditingController();
    final notesController = TextEditingController();

    String platform = 'LeetCode';
    String language = 'C++';
    String difficulty = 'Medium';
    String status = 'Solved';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Log Coding / DSA Problem'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Problem Name',
                    hintText: 'e.g. Reverse Linked List (#206)',
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: platform,
                        decoration: const InputDecoration(labelText: 'Platform'),
                        items: const [
                          DropdownMenuItem(value: 'LeetCode', child: Text('LeetCode')),
                          DropdownMenuItem(value: 'Codeforces', child: Text('Codeforces')),
                          DropdownMenuItem(value: 'HackerRank', child: Text('HackerRank')),
                          DropdownMenuItem(value: 'GeeksforGeeks', child: Text('GFG')),
                          DropdownMenuItem(value: 'CodeChef', child: Text('CodeChef')),
                        ],
                        onChanged: (val) {
                          if (val != null) setDialogState(() => platform = val);
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: difficulty,
                        decoration: const InputDecoration(labelText: 'Difficulty'),
                        items: const [
                          DropdownMenuItem(value: 'Easy', child: Text('Easy')),
                          DropdownMenuItem(value: 'Medium', child: Text('Medium')),
                          DropdownMenuItem(value: 'Hard', child: Text('Hard')),
                        ],
                        onChanged: (val) {
                          if (val != null) setDialogState(() => difficulty = val);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: language,
                        decoration: const InputDecoration(labelText: 'Language'),
                        items: const [
                          DropdownMenuItem(value: 'C++', child: Text('C++')),
                          DropdownMenuItem(value: 'Java', child: Text('Java')),
                          DropdownMenuItem(value: 'Python', child: Text('Python')),
                          DropdownMenuItem(value: 'Go', child: Text('Go')),
                          DropdownMenuItem(value: 'Rust', child: Text('Rust')),
                        ],
                        onChanged: (val) {
                          if (val != null) setDialogState(() => language = val);
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: status,
                        decoration: const InputDecoration(labelText: 'Status'),
                        items: const [
                          DropdownMenuItem(value: 'Solved', child: Text('Solved')),
                          DropdownMenuItem(value: 'Reviewing', child: Text('Reviewing')),
                          DropdownMenuItem(value: 'Attempted', child: Text('Attempted')),
                        ],
                        onChanged: (val) {
                          if (val != null) setDialogState(() => status = val);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: topicController,
                  decoration: const InputDecoration(
                    labelText: 'Topic / Pattern',
                    hintText: 'e.g. Sliding Window, Graphs, DP',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: urlController,
                  decoration: const InputDecoration(
                    labelText: 'Problem URL (Optional)',
                    hintText: 'https://leetcode.com/problems/...',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(
                    labelText: 'Approach Notes / Complexity',
                    hintText: 'e.g. O(N) time using two pointers technique',
                  ),
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
                if (titleController.text.trim().isEmpty) return;
                final item = CodingProblemItem(
                  id: 'cp_${DateTime.now().millisecondsSinceEpoch}',
                  title: titleController.text.trim(),
                  platform: platform,
                  language: language,
                  difficulty: difficulty,
                  topic: topicController.text.trim().isNotEmpty
                      ? topicController.text.trim()
                      : 'General',
                  attemptDate: DateFormat('yyyy-MM-dd').format(DateTime.now()),
                  status: status,
                  notes: notesController.text.trim().isNotEmpty
                      ? notesController.text.trim()
                      : null,
                  problemUrl: urlController.text.trim().isNotEmpty
                      ? urlController.text.trim()
                      : null,
                );
                provider.addCodingProblem(item);
                Navigator.of(ctx).pop();
              },
              child: const Text('Save Problem'),
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
        final problems = provider.codingProblems;
        final solvedCount = problems.where((p) => p.status == 'Solved').length;

        return Scaffold(
          appBar: AppBar(
            title: const Text('DSA & Coding Tracker'),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                tooltip: 'Log Problem',
                onPressed: () => _showAddDialog(context, provider),
              ),
            ],
          ),
          body: Column(
            children: [
              // Summary Banner
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        Text('$solvedCount',
                            style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppColors.success)),
                        const SizedBox(height: 4),
                        const Text('Solved', style: TextStyle(fontSize: 12)),
                      ],
                    ),
                    Container(height: 30, width: 1, color: Colors.grey.withOpacity(0.3)),
                    Column(
                      children: [
                        Text('${problems.length}',
                            style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary)),
                        const SizedBox(height: 4),
                        const Text('Total Logged', style: TextStyle(fontSize: 12)),
                      ],
                    ),
                    Container(height: 30, width: 1, color: Colors.grey.withOpacity(0.3)),
                    Column(
                      children: [
                        Text(
                          '${problems.where((p) => p.difficulty == 'Hard').length}',
                          style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppColors.error),
                        ),
                        const SizedBox(height: 4),
                        const Text('Hard Solved', style: TextStyle(fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),

              // Problem List
              Expanded(
                child: problems.isEmpty
                    ? EmptyStateWidget(
                        icon: Icons.code,
                        title: 'No Problems Logged',
                        description:
                            'Track your LeetCode, Codeforces, and placement interview questions.',
                        actionLabel: 'Log First Problem',
                        onAction: () => _showAddDialog(context, provider),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: problems.length,
                        itemBuilder: (context, index) {
                          final item = problems[index];
                          final diffColor = _getDifficultyColor(item.difficulty);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkCard : AppColors.lightCard,
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
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: diffColor.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        item.difficulty.toUpperCase(),
                                        style: TextStyle(
                                          color: diffColor,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        '${item.platform} • ${item.language}',
                                        style: const TextStyle(
                                          color: AppColors.primary,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    const Spacer(),
                                    Text(
                                      item.status,
                                      style: TextStyle(
                                        color: item.status == 'Solved'
                                            ? AppColors.success
                                            : AppColors.warning,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  item.title,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Pattern: ${item.topic}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary,
                                  ),
                                ),
                                if (item.notes != null) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    item.notes!,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark
                                          ? AppColors.darkTextMuted
                                          : AppColors.lightTextMuted,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    if (item.problemUrl != null) ...[
                                      TextButton.icon(
                                        style: TextButton.styleFrom(
                                          padding: EdgeInsets.zero,
                                          minimumSize: Size.zero,
                                          tapTargetSize:
                                              MaterialTapTargetSize.shrinkWrap,
                                        ),
                                        onPressed: () async {
                                          final uri = Uri.parse(item.problemUrl!);
                                          if (await canLaunchUrl(uri)) {
                                            await launchUrl(uri);
                                          }
                                        },
                                        icon: const Icon(Icons.open_in_new, size: 14),
                                        label: const Text('Open Problem',
                                            style: TextStyle(fontSize: 12)),
                                      ),
                                    ],
                                    const Spacer(),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline,
                                          size: 18, color: AppColors.error),
                                      onPressed: () =>
                                          provider.deleteCodingProblem(item.id),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
