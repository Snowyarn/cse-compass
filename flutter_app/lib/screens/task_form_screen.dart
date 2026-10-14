import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/models.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import '../services/notification_service.dart';

class TaskFormScreen extends StatefulWidget {
  final TaskItem? taskToEdit;
  final String? initialDueDate;

  const TaskFormScreen({Key? key, this.taskToEdit, this.initialDueDate})
      : super(key: key);

  @override
  State<TaskFormScreen> createState() => _TaskFormScreenState();
}

class _TaskFormScreenState extends State<TaskFormScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _titleController;
  late TextEditingController _descController;
  late TextEditingController _tagsController;
  final TextEditingController _subtaskInputController = TextEditingController();

  String? _selectedSubjectId;
  String _category = 'Assignments';
  TaskType _taskType = TaskType.assignment;
  TaskPriority _priority = TaskPriority.medium;
  DateTime? _dueDate;
  TimeOfDay? _dueTime;
  int _estimatedMinutes = 30;

  List<Subtask> _subtasks = [];
  List<ReminderItem> _reminders = [];

  final List<String> _categories = [
    'Assignments',
    'Lectures and classwork',
    'Data Structures and Algorithms',
    'Operating Systems',
    'Database Management Systems',
    'Computer Networks',
    'Computer Organization and Architecture',
    'Programming in C/C++',
    'Mathematics',
    'Computer Science projects',
    'Coding practice',
    'Exams and revision',
    'Labs and practicals',
    'Internship and placement preparation',
    'Personal tasks',
  ];

  @override
  void initState() {
    super.initState();
    final task = widget.taskToEdit;
    _titleController = TextEditingController(text: task?.title ?? '');
    _descController = TextEditingController(text: task?.description ?? '');
    _tagsController =
        TextEditingController(text: task?.tags.join(', ') ?? '');

    if (task != null) {
      _selectedSubjectId = task.subjectId;
      _category = task.category;
      _taskType = task.taskType;
      _priority = task.priority;
      _estimatedMinutes = task.estimatedMinutes;
      if (task.dueDate != null) {
        _dueDate = DateTime.tryParse(task.dueDate!);
      }
      if (task.dueTime != null) {
        final parts = task.dueTime!.split(':');
        if (parts.length >= 2) {
          _dueTime = TimeOfDay(
              hour: int.tryParse(parts[0]) ?? 12,
              minute: int.tryParse(parts[1]) ?? 0);
        }
      }
      _subtasks = List.from(task.subtasks);
      _reminders = List.from(task.reminders);
    } else {
      if (widget.initialDueDate != null) {
        _dueDate = DateTime.tryParse(widget.initialDueDate!);
      } else {
        _dueDate = DateTime.now();
      }
      _dueTime = const TimeOfDay(hour: 20, minute: 0);

      // Add default 15m reminder
      _addPresetReminder(ReminderType.preset_15m);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _tagsController.dispose();
    _subtaskInputController.dispose();
    super.dispose();
  }

  void _addPresetReminder(ReminderType type) {
    if (_dueDate == null) return;
    final dueDateTime = DateTime(
      _dueDate!.year,
      _dueDate!.month,
      _dueDate!.day,
      _dueTime?.hour ?? 20,
      _dueTime?.minute ?? 0,
    );

    final scheduled =
        NotificationService.instance.computePresetTime(dueDateTime, type);
    if (scheduled != null) {
      final scheduledStr = DateFormat('yyyy-MM-dd HH:mm:ss').format(scheduled);
      final notifId = (DateTime.now().millisecondsSinceEpoch % 100000).toString();

      setState(() {
        _reminders.add(ReminderItem(
          id: 'rem_${DateTime.now().millisecondsSinceEpoch}',
          taskId: widget.taskToEdit?.id ?? '',
          reminderType: type,
          scheduledTime: scheduledStr,
          notificationId: notifId,
        ));
      });
    }
  }

  void _addSubtask() {
    final text = _subtaskInputController.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _subtasks.add(Subtask(
        id: 'st_${DateTime.now().millisecondsSinceEpoch}',
        taskId: widget.taskToEdit?.id ?? '',
        title: text,
        completed: false,
        sortOrder: _subtasks.length,
      ));
      _subtaskInputController.clear();
    });
  }

  Future<void> _pickDueDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (picked != null) {
      setState(() => _dueDate = picked);
    }
  }

  Future<void> _pickDueTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _dueTime ?? const TimeOfDay(hour: 20, minute: 0),
    );
    if (picked != null) {
      setState(() => _dueTime = picked);
    }
  }

  Future<void> _saveTask() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = Provider.of<AppProvider>(context, listen: false);
    final now = DateTime.now();

    final dueDateStr = _dueDate != null
        ? DateFormat('yyyy-MM-dd').format(_dueDate!)
        : null;
    final dueTimeStr = _dueTime != null
        ? "${_dueTime!.hour.toString().padLeft(2, '0')}:${_dueTime!.minute.toString().padLeft(2, '0')}"
        : null;

    final tags = _tagsController.text
        .split(',')
        .map((t) => t.trim())
        .where((t) => t.isNotEmpty)
        .toList();

    final taskId =
        widget.taskToEdit?.id ?? 'task_${now.millisecondsSinceEpoch}';

    // Link subtasks & reminders to this taskId
    final linkedSubtasks = _subtasks
        .map((s) => Subtask(
              id: s.id,
              taskId: taskId,
              title: s.title,
              completed: s.completed,
              sortOrder: s.sortOrder,
            ))
        .toList();

    final linkedReminders = _reminders
        .map((r) => ReminderItem(
              id: r.id,
              taskId: taskId,
              reminderType: r.reminderType,
              scheduledTime: r.scheduledTime,
              notificationId: r.notificationId,
            ))
        .toList();

    final task = TaskItem(
      id: taskId,
      title: _titleController.text.trim(),
      description: _descController.text.trim().isNotEmpty
          ? _descController.text.trim()
          : null,
      subjectId: _selectedSubjectId,
      category: _category,
      taskType: _taskType,
      dueDate: dueDateStr,
      dueTime: dueTimeStr,
      priority: _priority,
      estimatedMinutes: _estimatedMinutes,
      completed: widget.taskToEdit?.completed ?? false,
      completedAt: widget.taskToEdit?.completedAt,
      isRecurring: false,
      tags: tags,
      createdAt: widget.taskToEdit?.createdAt ?? now.toIso8601String(),
      updatedAt: now.toIso8601String(),
      subtasks: linkedSubtasks,
      reminders: linkedReminders,
    );

    if (widget.taskToEdit != null) {
      await provider.updateTask(task);
    } else {
      await provider.addTask(task);
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.taskToEdit != null
              ? 'Task updated successfully'
              : 'Task created with ${linkedReminders.length} reminder(s)'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final subjects = Provider.of<AppProvider>(context).subjects;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.taskToEdit != null ? 'Edit Task' : 'New Academic Task'),
        actions: [
          TextButton.icon(
            onPressed: _saveTask,
            icon: const Icon(Icons.check, size: 20),
            label: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Title
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Task Title *',
                hintText: 'e.g. Implement Graph BFS in C++',
                prefixIcon: Icon(Icons.title, size: 20),
              ),
              validator: (val) {
                if (val == null || val.trim().isEmpty) {
                  return 'Please enter a task title';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Description
            TextFormField(
              controller: _descController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description / Notes (Optional)',
                hintText: 'Add textbook problems, assignment details, notes...',
                prefixIcon: Icon(Icons.notes, size: 20),
              ),
            ),
            const SizedBox(height: 16),

            // Subject & Category Row
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String?>(
                    value: _selectedSubjectId,
                    decoration: const InputDecoration(
                      labelText: 'Subject',
                      prefixIcon: Icon(Icons.school, size: 20),
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('No Subject')),
                      ...subjects.map((s) => DropdownMenuItem(
                            value: s.id,
                            child: Text(s.code, overflow: TextOverflow.ellipsis),
                          )),
                    ],
                    onChanged: (val) => setState(() => _selectedSubjectId = val),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _category,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      prefixIcon: Icon(Icons.category, size: 20),
                    ),
                    items: _categories.map((c) {
                      return DropdownMenuItem(
                        value: c,
                        child: Text(c, overflow: TextOverflow.ellipsis),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _category = val);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Priority Selector
            const Text('Priority Level',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Row(
              children: TaskPriority.values.map((p) {
                final isSelected = _priority == p;
                Color color;
                switch (p) {
                  case TaskPriority.urgent:
                    color = AppColors.error;
                    break;
                  case TaskPriority.high:
                    color = AppColors.warning;
                    break;
                  case TaskPriority.medium:
                    color = AppColors.primary;
                    break;
                  case TaskPriority.low:
                    color = const Color(0xFF64748B);
                    break;
                }
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Center(
                        child: Text(
                          p.name.toUpperCase(),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isSelected ? Colors.white : color,
                          ),
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: color,
                      onSelected: (selected) {
                        if (selected) setState(() => _priority = p);
                      },
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Due Date & Time
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: _pickDueDate,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 14),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurface : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.lightBorder,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today,
                              size: 18, color: AppColors.primary),
                          const SizedBox(width: 8),
                          Text(
                            _dueDate != null
                                ? DateFormat('MMM d, yyyy').format(_dueDate!)
                                : 'Select Date',
                            style: const TextStyle(fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
                    onTap: _pickDueTime,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 14),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurface : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.lightBorder,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.access_time,
                              size: 18, color: AppColors.primary),
                          const SizedBox(width: 8),
                          Text(
                            _dueTime != null
                                ? _dueTime!.format(context)
                                : 'Select Time',
                            style: const TextStyle(fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Estimated Duration Chips
            const Text('Estimated Time Required',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [15, 30, 45, 60, 90, 120].map((mins) {
                final isSelected = _estimatedMinutes == mins;
                return ChoiceChip(
                  label: Text('${mins}m'),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  onSelected: (selected) {
                    if (selected) setState(() => _estimatedMinutes = mins);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Subtasks / Checklist Builder
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Checklist / Subtasks',
                    style:
                        TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                Text('${_subtasks.length} items',
                    style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _subtaskInputController,
                    decoration: const InputDecoration(
                      hintText: 'Add a subtask step...',
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    onSubmitted: (_) => _addSubtask(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _addSubtask,
                  icon: const Icon(Icons.add_circle,
                      color: AppColors.primary, size: 32),
                ),
              ],
            ),
            if (_subtasks.isNotEmpty) ...[
              const SizedBox(height: 8),
              ..._subtasks.asMap().entries.map((entry) {
                final idx = entry.key;
                final st = entry.value;
                return Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : AppColors.lightCard,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color:
                          isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: Row(
                    children: [
                      Checkbox(
                        value: st.completed,
                        onChanged: (val) {
                          setState(() => st.completed = val ?? false);
                        },
                      ),
                      Expanded(
                        child: Text(
                          st.title,
                          style: TextStyle(
                            fontSize: 13,
                            decoration: st.completed
                                ? TextDecoration.lineThrough
                                : null,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 16),
                        onPressed: () {
                          setState(() => _subtasks.removeAt(idx));
                        },
                      ),
                    ],
                  ),
                );
              }),
            ],
            const SizedBox(height: 20),

            // Reminders Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Scheduled Reminders',
                    style:
                        TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                PopupMenuButton<ReminderType>(
                  icon: const Icon(Icons.add_alert, color: AppColors.primary),
                  tooltip: 'Add Preset Reminder',
                  onSelected: _addPresetReminder,
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                        value: ReminderType.preset_5m,
                        child: Text('5 minutes before')),
                    const PopupMenuItem(
                        value: ReminderType.preset_15m,
                        child: Text('15 minutes before')),
                    const PopupMenuItem(
                        value: ReminderType.preset_30m,
                        child: Text('30 minutes before')),
                    const PopupMenuItem(
                        value: ReminderType.preset_1h,
                        child: Text('1 hour before')),
                    const PopupMenuItem(
                        value: ReminderType.same_day_9am,
                        child: Text('Same day at 9:00 AM')),
                    const PopupMenuItem(
                        value: ReminderType.day_before_9am,
                        child: Text('1 day before at 9:00 AM')),
                  ],
                ),
              ],
            ),
            if (_reminders.isEmpty) ...[
              Text(
                'No reminders configured. Tap + to add presets.',
                style: TextStyle(
                    fontSize: 12,
                    color: isDark
                        ? AppColors.darkTextMuted
                        : AppColors.lightTextMuted),
              ),
            ] else ...[
              ..._reminders.asMap().entries.map((entry) {
                final idx = entry.key;
                final r = entry.value;
                return Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : AppColors.lightCard,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color:
                          isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.alarm,
                          size: 16, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${r.reminderType.name.replaceAll('_', ' ')} (${r.scheduledTime})',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline,
                            size: 16, color: AppColors.error),
                        onPressed: () {
                          setState(() => _reminders.removeAt(idx));
                        },
                      ),
                    ],
                  ),
                );
              }),
            ],
            const SizedBox(height: 20),

            // Tags Input
            TextFormField(
              controller: _tagsController,
              decoration: const InputDecoration(
                labelText: 'Tags (comma-separated)',
                hintText: 'e.g. dsa, lab, exam, urgent',
                prefixIcon: Icon(Icons.tag, size: 20),
              ),
            ),
            const SizedBox(height: 32),

            // Save Action
            ElevatedButton(
              onPressed: _saveTask,
              child: Text(widget.taskToEdit != null
                  ? 'Update Task'
                  : 'Create Academic Task'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
