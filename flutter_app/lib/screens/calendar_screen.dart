import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/task_card.dart';
import '../widgets/empty_state_widget.dart';
import 'task_form_screen.dart';
import 'task_detail_screen.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({Key? key}) : super(key: key);

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _currentMonth = DateTime.now();

  void _previousMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1);
    });
  }

  void _jumpToToday(AppProvider provider) {
    setState(() {
      _currentMonth = DateTime.now();
    });
    provider.setSelectedCalendarDate(DateTime.now());
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        final selectedDate = provider.selectedCalendarDate;
        final selectedDateTasks = provider.tasksForSelectedCalendarDate;

        final firstDayOfMonth =
            DateTime(_currentMonth.year, _currentMonth.month, 1);
        final daysInMonth =
            DateTime(_currentMonth.year, _currentMonth.month + 1, 0).day;
        final startWeekday = firstDayOfMonth.weekday % 7; // Sunday = 0

        final monthHeader = DateFormat('MMMM yyyy').format(_currentMonth);
        final selectedHeader =
            DateFormat('EEEE, MMMM d, yyyy').format(selectedDate);

        return Scaffold(
          appBar: AppBar(
            title: const Text('Academic Calendar'),
            actions: [
              TextButton.icon(
                onPressed: () => _jumpToToday(provider),
                icon: const Icon(Icons.today, size: 18),
                label: const Text('Today'),
              ),
            ],
          ),
          body: Column(
            children: [
              // Month Navigation Header
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.chevron_left),
                      onPressed: _previousMonth,
                    ),
                    Text(
                      monthHeader,
                      style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w700),
                    ),
                    IconButton(
                      icon: const Icon(Icons.chevron_right),
                      onPressed: _nextMonth,
                    ),
                  ],
                ),
              ),

              // Weekday Letters
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: const ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                      .map((d) => SizedBox(
                            width: 36,
                            child: Center(
                              child: Text(
                                d,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                          ))
                      .toList(),
              ),
              const SizedBox(height: 6),

              // Calendar Grid
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: startWeekday + daysInMonth,
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 7,
                    mainAxisSpacing: 6,
                    crossAxisSpacing: 6,
                    childAspectRatio: 1.1,
                  ),
                  itemBuilder: (context, index) {
                    if (index < startWeekday) {
                      return const SizedBox.shrink();
                    }
                    final day = index - startWeekday + 1;
                    final dayDate =
                        DateTime(_currentMonth.year, _currentMonth.month, day);
                    final isSelected = selectedDate.year == dayDate.year &&
                        selectedDate.month == dayDate.month &&
                        selectedDate.day == dayDate.day;

                    final now = DateTime.now();
                    final isToday = now.year == dayDate.year &&
                        now.month == dayDate.month &&
                        now.day == dayDate.day;

                    final dateKey =
                        "${dayDate.year}-${dayDate.month.toString().padLeft(2, '0')}-${dayDate.day.toString().padLeft(2, '0')}";
                    final hasTasks =
                        provider.tasks.any((t) => t.dueDate == dateKey);

                    return GestureDetector(
                      onTap: () => provider.setSelectedCalendarDate(dayDate),
                      child: Container(
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary
                              : (isToday
                                  ? AppColors.primary.withOpacity(0.15)
                                  : (isDark
                                      ? AppColors.darkCard
                                      : AppColors.lightCard)),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : (isToday
                                    ? AppColors.primary
                                    : (isDark
                                        ? AppColors.darkBorder
                                        : AppColors.lightBorder)),
                          ),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Text(
                              '$day',
                              style: TextStyle(
                                fontWeight: (isSelected || isToday)
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                color: isSelected
                                    ? Colors.white
                                    : (isDark
                                        ? AppColors.darkTextPrimary
                                        : AppColors.lightTextPrimary),
                              ),
                            ),
                            if (hasTasks)
                              Positioned(
                                bottom: 4,
                                child: Container(
                                  width: 5,
                                  height: 5,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isSelected
                                        ? Colors.white
                                        : AppColors.secondary,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const Divider(height: 24),

              // Selected Date Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        selectedHeader,
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle,
                          color: AppColors.primary),
                      tooltip: 'Add Task for this date',
                      onPressed: () {
                        final dateStr =
                            "${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}";
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                TaskFormScreen(initialDueDate: dateStr),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),

              // Selected Date Tasks List
              Expanded(
                child: selectedDateTasks.isEmpty
                    ? EmptyStateWidget(
                        icon: Icons.event_available,
                        title: 'No Tasks Scheduled',
                        description:
                            'No academic tasks due on this date. Tap + to add one.',
                        actionLabel: 'Add Task',
                        onAction: () {
                          final dateStr =
                              "${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}";
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  TaskFormScreen(initialDueDate: dateStr),
                            ),
                          );
                        },
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        itemCount: selectedDateTasks.length,
                        itemBuilder: (context, index) {
                          final task = selectedDateTasks[index];
                          return TaskCard(
                            task: task,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      TaskDetailScreen(taskId: task.id),
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
                                  builder: (_) =>
                                      TaskFormScreen(taskToEdit: task),
                                ),
                              );
                            },
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
