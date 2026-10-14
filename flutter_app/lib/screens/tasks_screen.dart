import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../widgets/task_card.dart';
import '../widgets/empty_state_widget.dart';
import 'task_form_screen.dart';
import 'task_detail_screen.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({Key? key}) : super(key: key);

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showFilterSortSheet(BuildContext context, AppProvider provider) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Filter & Sort Tasks',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  // Sort Options
                  const Text('Sort By',
                      style:
                          TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _sortChoiceChip('Deadline', 'due_date', provider),
                      _sortChoiceChip('Priority', 'priority', provider),
                      _sortChoiceChip('Duration', 'duration', provider),
                      _sortChoiceChip('Created', 'created_at', provider),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Priority Filter
                  const Text('Priority Filter',
                      style:
                          TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      ChoiceChip(
                        label: const Text('All'),
                        selected: provider.selectedPriority == null,
                        onSelected: (selected) {
                          provider.setSelectedPriority(null);
                          setSheetState(() {});
                        },
                      ),
                      ...TaskPriority.values.map((p) {
                        return ChoiceChip(
                          label: Text(p.name.toUpperCase()),
                          selected: provider.selectedPriority == p,
                          onSelected: (selected) {
                            provider.setSelectedPriority(selected ? p : null);
                            setSheetState(() {});
                          },
                        );
                      }),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Subject Filter
                  const Text('Subject Filter',
                      style:
                          TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String?>(
                    value: provider.selectedSubjectId,
                    decoration: const InputDecoration(
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    items: [
                      const DropdownMenuItem(
                          value: null, child: Text('All Subjects')),
                      ...provider.subjects.map(
                        (s) => DropdownMenuItem(
                          value: s.id,
                          child: Text('${s.code} - ${s.name}'),
                        ),
                      ),
                    ],
                    onChanged: (val) {
                      provider.setSelectedSubjectId(val);
                      setSheetState(() {});
                    },
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _sortChoiceChip(String label, String value, AppProvider provider) {
    final isSelected = provider.sortBy == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) provider.setSortBy(value);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        final filteredTasks = provider.filteredTasks;
        final statusTabs = ['all', 'today', 'active', 'overdue', 'completed'];

        return Scaffold(
          appBar: AppBar(
            title: const Text('My Tasks'),
            actions: [
              IconButton(
                icon: const Icon(Icons.filter_list_rounded),
                onPressed: () => _showFilterSortSheet(context, provider),
                tooltip: 'Filter & Sort',
              ),
            ],
          ),
          body: Column(
            children: [
              // Search Bar
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search tasks by title or notes...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              provider.setSearchQuery('');
                            },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onChanged: (val) => provider.setSearchQuery(val),
                ),
              ),

              // Status Filter Tabs
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Row(
                  children: statusTabs.map((status) {
                    final isSelected = provider.statusFilter == status;
                    String label = status[0].toUpperCase() + status.substring(1);
                    if (status == 'all') label = 'All (${provider.tasks.length})';
                    if (status == 'today') label = 'Today (${provider.todayTasks.length})';
                    if (status == 'overdue') label = 'Overdue (${provider.overdueTasks.length})';

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(label),
                        selected: isSelected,
                        selectedColor: AppColors.primary.withOpacity(0.2),
                        checkmarkColor: AppColors.primary,
                        labelStyle: TextStyle(
                          color: isSelected
                              ? AppColors.primary
                              : (isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary),
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
                          fontSize: 12,
                        ),
                        onSelected: (_) => provider.setFilterStatus(status),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 8),

              // Task List
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => provider.loadTasks(),
                  child: filteredTasks.isEmpty
                      ? EmptyStateWidget(
                          icon: Icons.task_alt,
                          title: 'No Tasks Found',
                          description: provider.searchQuery.isNotEmpty
                              ? 'No tasks matched your search term.'
                              : 'No tasks currently in this view.',
                          actionLabel: 'Create Task',
                          onAction: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                  builder: (_) => const TaskFormScreen()),
                            );
                          },
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          itemCount: filteredTasks.length,
                          itemBuilder: (context, index) {
                            final task = filteredTasks[index];
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
                                provider.toggleTaskCompleted(
                                    task.id, completed);
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
              ),
            ],
          ),
        );
      },
    );
  }
}
