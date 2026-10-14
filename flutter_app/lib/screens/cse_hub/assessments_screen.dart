import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/empty_state_widget.dart';

class AssessmentsScreen extends StatelessWidget {
  const AssessmentsScreen({Key? key}) : super(key: key);

  String _getCountdownText(String dueDateStr) {
    try {
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final due = DateTime.parse(dueDateStr);
      final target = DateTime(due.year, due.month, due.day);
      final diff = target.difference(today).inDays;

      if (diff < 0) return 'Overdue by ${-diff}d';
      if (diff == 0) return 'Today!';
      if (diff == 1) return 'Tomorrow';
      return 'in $diff days';
    } catch (_) {
      return dueDateStr;
    }
  }

  void _showAddDialog(BuildContext context, AppProvider provider) {
    final titleController = TextEditingController();
    final marksController = TextEditingController();
    final weightageController = TextEditingController();
    final notesController = TextEditingController();

    String? subjectId = provider.subjects.isNotEmpty ? provider.subjects.first.id : null;
    String assessmentType = 'mid_sem';
    DateTime selectedDate = DateTime.now().add(const Duration(days: 3));

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Add Assessment / Exam'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: subjectId,
                  decoration: const InputDecoration(labelText: 'Subject'),
                  items: provider.subjects.map((s) {
                    return DropdownMenuItem(
                      value: s.id,
                      child: Text('${s.code} - ${s.name}', overflow: TextOverflow.ellipsis),
                    );
                  }).toList(),
                  onChanged: (val) => setDialogState(() => subjectId = val),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Exam Title / Assessment Name',
                    hintText: 'e.g. Mid-Sem Algorithms & Trees',
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: assessmentType,
                  decoration: const InputDecoration(labelText: 'Assessment Type'),
                  items: const [
                    DropdownMenuItem(value: 'mid_sem', child: Text('Mid-Semester Exam')),
                    DropdownMenuItem(value: 'end_sem', child: Text('End-Semester Exam')),
                    DropdownMenuItem(value: 'internal', child: Text('Internal Test')),
                    DropdownMenuItem(value: 'lab_exam', child: Text('Lab Practical / Exam')),
                    DropdownMenuItem(value: 'viva', child: Text('Viva Voce')),
                    DropdownMenuItem(value: 'assignment', child: Text('Major Assignment')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => assessmentType = val);
                  },
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: ctx,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      setDialogState(() => selectedDate = picked);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.withOpacity(0.4)),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Date:', style: TextStyle(fontWeight: FontWeight.w600)),
                        Text(DateFormat('MMM d, yyyy').format(selectedDate)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: marksController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Marks (e.g. 50)'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: weightageController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Weightage % (e.g. 30)'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(labelText: 'Notes / Syllabus topics covered'),
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
                if (titleController.text.trim().isEmpty || subjectId == null) return;
                final assessment = AssessmentItem(
                  id: 'ass_${DateTime.now().millisecondsSinceEpoch}',
                  subjectId: subjectId!,
                  title: titleController.text.trim(),
                  assessmentType: assessmentType,
                  dueDate: DateFormat('yyyy-MM-dd').format(selectedDate),
                  totalMarks: int.tryParse(marksController.text.trim()),
                  weightage: int.tryParse(weightageController.text.trim()),
                  notes: notesController.text.trim().isNotEmpty ? notesController.text.trim() : null,
                  completed: false,
                );
                provider.addAssessment(assessment);
                Navigator.of(ctx).pop();
              },
              child: const Text('Add Assessment'),
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
        final assessments = provider.assessments;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Assessments & Exams'),
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                tooltip: 'Add Assessment',
                onPressed: () => _showAddDialog(context, provider),
              ),
            ],
          ),
          body: assessments.isEmpty
              ? EmptyStateWidget(
                  icon: Icons.assignment_outlined,
                  title: 'No Assessments Scheduled',
                  description: 'Track mid-sem exams, end-sems, internal tests, and lab vivas here.',
                  actionLabel: 'Add Assessment',
                  onAction: () => _showAddDialog(context, provider),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: assessments.length,
                  itemBuilder: (context, index) {
                    final item = assessments[index];
                    final countdown = _getCountdownText(item.dueDate);
                    final isOverdue = countdown.contains('Overdue');
                    final isToday = countdown.contains('Today');

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
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
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  item.assessmentType.replaceAll('_', ' ').toUpperCase(),
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: (isOverdue ? AppColors.error : (isToday ? AppColors.warning : AppColors.primary)).withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  countdown,
                                  style: TextStyle(
                                    color: isOverdue ? AppColors.error : (isToday ? AppColors.warning : AppColors.primary),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            item.title,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              decoration: item.completed ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Due: ${item.dueDate} ${item.dueTime ?? ""}',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                          if (item.notes != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              item.notes!,
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                              ),
                            ),
                          ],
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              if (item.totalMarks != null)
                                Text('Marks: ${item.totalMarks}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              if (item.weightage != null) ...[
                                const SizedBox(width: 12),
                                Text('Weightage: ${item.weightage}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                              const Spacer(),
                              Checkbox(
                                value: item.completed,
                                onChanged: (val) {
                                  provider.toggleAssessmentCompleted(item.id, val ?? false);
                                },
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.error),
                                onPressed: () => provider.deleteAssessment(item.id),
                              ),
                            ],
                          ),
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
