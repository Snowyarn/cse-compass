import 'package:flutter/material.dart';
import '../models/models.dart';
import '../database/database_helper.dart';
import '../services/notification_service.dart';
import '../services/task_ranking_service.dart';

class AppProvider with ChangeNotifier {
  final DatabaseHelper _db = DatabaseHelper.instance;
  final NotificationService _notifications = NotificationService.instance;

  bool _isLoading = true;
  bool get isLoading => _isLoading;

  List<TaskItem> _tasks = [];
  List<TaskItem> get tasks => _tasks;

  List<SubjectItem> _subjects = [];
  List<SubjectItem> get subjects => _subjects;

  List<AssessmentItem> _assessments = [];
  List<AssessmentItem> get assessments => _assessments;

  List<CodingProblemItem> _codingProblems = [];
  List<CodingProblemItem> get codingProblems => _codingProblems;

  List<ProjectItem> _projects = [];
  List<ProjectItem> get projects => _projects;

  List<StudySessionItem> _studySessions = [];
  List<StudySessionItem> get studySessions => _studySessions;

  List<ReminderItem> _activeReminders = [];
  List<ReminderItem> get activeReminders => _activeReminders;

  AppSettings _settings = AppSettings();
  AppSettings get settings => _settings;

  TaskItem? _focusTask;
  TaskItem? get focusTask => _focusTask;
  String _focusReason = '';
  String get focusReason => _focusReason;

  // Filter state
  String _searchQuery = '';
  String get searchQuery => _searchQuery;

  String? _selectedCategory;
  String? get selectedCategory => _selectedCategory;

  String? _selectedSubjectId;
  String? get selectedSubjectId => _selectedSubjectId;

  TaskPriority? _selectedPriority;
  TaskPriority? get selectedPriority => _selectedPriority;

  String _statusFilter = 'all'; // 'all', 'active', 'completed', 'overdue', 'today'
  String get statusFilter => _statusFilter;

  String _sortBy = 'due_date'; // 'due_date', 'priority', 'created_at', 'duration'
  String get sortBy => _sortBy;

  DateTime _selectedCalendarDate = DateTime.now();
  DateTime get selectedCalendarDate => _selectedCalendarDate;

  // Initialize
  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    await _notifications.init();
    await loadSettings();
    await refreshAll();

    _isLoading = false;
    notifyListeners();
  }

  Future<void> refreshAll() async {
    await Future.wait([
      loadTasks(),
      loadSubjects(),
      loadAssessments(),
      loadCodingProblems(),
      loadProjects(),
      loadStudySessions(),
      loadActiveReminders(),
    ]);
    _computeFocusTask();
  }

  // --- Settings ---
  Future<void> loadSettings() async {
    _settings = await _db.getSettings();
    notifyListeners();
  }

  Future<void> updateSettings(AppSettings newSettings) async {
    _settings = newSettings;
    await _db.saveSettings(newSettings);
    notifyListeners();
  }

  void setTheme(String theme) {
    _settings.theme = theme;
    _db.saveSettings(_settings);
    notifyListeners();
  }

  // --- Task Methods ---
  Future<void> loadTasks() async {
    _tasks = await _db.getTasks(
      subjectId: _selectedSubjectId,
      category: _selectedCategory,
      priority: _selectedPriority,
      searchQuery: _searchQuery,
      sortBy: _sortBy,
    );
    _computeFocusTask();
    notifyListeners();
  }

  void setFilterStatus(String status) {
    _statusFilter = status;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    loadTasks();
  }

  void setSelectedCategory(String? category) {
    _selectedCategory = category;
    loadTasks();
  }

  void setSelectedSubjectId(String? subjectId) {
    _selectedSubjectId = subjectId;
    loadTasks();
  }

  void setSelectedPriority(TaskPriority? priority) {
    _selectedPriority = priority;
    loadTasks();
  }

  void setSortBy(String sortBy) {
    _sortBy = sortBy;
    loadTasks();
  }

  void setSelectedCalendarDate(DateTime date) {
    _selectedCalendarDate = date;
    notifyListeners();
  }

  List<TaskItem> get filteredTasks {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";

    return _tasks.where((task) {
      if (_statusFilter == 'active' && task.completed) return false;
      if (_statusFilter == 'completed' && !task.completed) return false;
      if (_statusFilter == 'today') {
        return task.dueDate == todayStr && !task.completed;
      }
      if (_statusFilter == 'overdue') {
        if (task.completed || task.dueDate == null) return false;
        return task.dueDate!.compareTo(todayStr) < 0;
      }
      return true;
    }).toList();
  }

  List<TaskItem> get tasksForSelectedCalendarDate {
    final dateStr =
        "${_selectedCalendarDate.year}-${_selectedCalendarDate.month.toString().padLeft(2, '0')}-${_selectedCalendarDate.day.toString().padLeft(2, '0')}";
    return _tasks.where((t) => t.dueDate == dateStr).toList();
  }

  List<TaskItem> get todayTasks {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    return _tasks.where((t) => t.dueDate == todayStr).toList();
  }

  List<TaskItem> get overdueTasks {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    return _tasks.where((t) => !t.completed && t.dueDate != null && t.dueDate!.compareTo(todayStr) < 0).toList();
  }

  double get todayCompletionRate {
    final todayList = todayTasks;
    if (todayList.isEmpty) return 0.0;
    final done = todayList.where((t) => t.completed).length;
    return done / todayList.length;
  }

  void _computeFocusTask() {
    final active = _tasks.where((t) => !t.completed).toList();
    final result = TaskRankingService.getFocusTask(active);
    _focusTask = result.recommendedTask;
    _focusReason = result.reasoning;
  }

  Future<void> addTask(TaskItem task) async {
    await _db.insertTask(task);
    for (var r in task.reminders) {
      if (r.notificationId != null) {
        final notifId = int.tryParse(r.notificationId!) ?? DateTime.now().millisecondsSinceEpoch ~/ 1000;
        await _notifications.scheduleTaskReminder(
          notificationId: notifId,
          taskTitle: 'CSE Compass: ${task.title}',
          scheduledTimeStr: r.scheduledTime,
          contextText: 'Due: ${task.dueDate ?? "No date"} (${task.category})',
        );
      }
    }
    await refreshAll();
  }

  Future<void> updateTask(TaskItem task) async {
    await _db.updateTask(task);
    // Cancel old and reschedule active reminders
    for (var r in task.reminders) {
      if (r.notificationId != null) {
        final notifId = int.tryParse(r.notificationId!) ?? (r.id.hashCode.abs() % 100000);
        await _notifications.cancelReminder(notifId);
        if (!task.completed) {
          await _notifications.scheduleTaskReminder(
            notificationId: notifId,
            taskTitle: 'CSE Compass: ${task.title}',
            scheduledTimeStr: r.scheduledTime,
            contextText: 'Due: ${task.dueDate ?? "No date"} (${task.category})',
          );
        }
      }
    }
    await refreshAll();
  }

  Future<void> toggleTaskCompleted(String taskId, bool completed) async {
    await _db.toggleTaskCompleted(taskId, completed);
    final task = await _db.getTaskById(taskId);
    if (task != null) {
      for (var r in task.reminders) {
        if (r.notificationId != null) {
          final notifId = int.tryParse(r.notificationId!) ?? (r.id.hashCode.abs() % 100000);
          if (completed) {
            await _notifications.cancelReminder(notifId);
          } else {
            await _notifications.scheduleTaskReminder(
              notificationId: notifId,
              taskTitle: 'CSE Compass: ${task.title}',
              scheduledTimeStr: r.scheduledTime,
              contextText: 'Due: ${task.dueDate ?? "No date"} (${task.category})',
            );
          }
        }
      }
    }
    await refreshAll();
  }

  Future<void> deleteTask(String taskId) async {
    final task = await _db.getTaskById(taskId);
    if (task != null) {
      for (var r in task.reminders) {
        if (r.notificationId != null) {
          final notifId = int.tryParse(r.notificationId!) ?? (r.id.hashCode.abs() % 100000);
          await _notifications.cancelReminder(notifId);
        }
      }
    }
    await _db.deleteTask(taskId);
    await refreshAll();
  }

  Future<void> toggleSubtask(String subtaskId, bool completed) async {
    await _db.toggleSubtask(subtaskId, completed);
    await loadTasks();
  }

  // --- Subjects ---
  Future<void> loadSubjects() async {
    _subjects = await _db.getSubjects();
    notifyListeners();
  }

  Future<void> addSubject(SubjectItem subject) async {
    await _db.insertSubject(subject);
    await loadSubjects();
  }

  Future<void> updateSubject(SubjectItem subject) async {
    await _db.updateSubject(subject);
    await loadSubjects();
  }

  Future<void> deleteSubject(String subjectId) async {
    await _db.deleteSubject(subjectId);
    await refreshAll();
  }

  Future<List<SyllabusUnit>> getSubjectSyllabus(String subjectId) async {
    return await _db.getSyllabusUnits(subjectId);
  }

  Future<void> updateTopicStatus(String topicId, String status) async {
    await _db.updateTopicStatus(topicId, status);
    await loadSubjects();
  }

  Future<void> incrementTopicRevision(String topicId) async {
    await _db.incrementTopicRevision(topicId);
    await loadSubjects();
  }

  // --- Assessments ---
  Future<void> loadAssessments() async {
    _assessments = await _db.getAssessments();
    notifyListeners();
  }

  Future<void> addAssessment(AssessmentItem assessment) async {
    await _db.insertAssessment(assessment);
    await loadAssessments();
  }

  Future<void> toggleAssessmentCompleted(String id, bool completed) async {
    await _db.toggleAssessmentCompleted(id, completed);
    await loadAssessments();
  }

  Future<void> deleteAssessment(String id) async {
    await _db.deleteAssessment(id);
    await loadAssessments();
  }

  // --- Coding Problems ---
  Future<void> loadCodingProblems() async {
    _codingProblems = await _db.getCodingProblems();
    notifyListeners();
  }

  Future<void> addCodingProblem(CodingProblemItem item) async {
    await _db.insertCodingProblem(item);
    await loadCodingProblems();
  }

  Future<void> updateCodingProblemStatus(String id, String status) async {
    await _db.updateCodingProblemStatus(id, status);
    await loadCodingProblems();
  }

  Future<void> deleteCodingProblem(String id) async {
    await _db.deleteCodingProblem(id);
    await loadCodingProblems();
  }

  // --- Projects ---
  Future<void> loadProjects() async {
    _projects = await _db.getProjects();
    notifyListeners();
  }

  Future<void> addProject(ProjectItem project) async {
    await _db.insertProject(project);
    await loadProjects();
  }

  Future<void> toggleMilestoneCompleted(String milestoneId, bool completed) async {
    await _db.toggleMilestoneCompleted(milestoneId, completed);
    await loadProjects();
  }

  // --- Study Sessions ---
  Future<void> loadStudySessions() async {
    _studySessions = await _db.getStudySessions();
    notifyListeners();
  }

  Future<void> recordStudySession(StudySessionItem session) async {
    await _db.insertStudySession(session);
    await loadStudySessions();
  }

  // --- Reminders ---
  Future<void> loadActiveReminders() async {
    _activeReminders = await _db.getActiveReminders();
    notifyListeners();
  }

  // --- Backup & Restore ---
  Future<String> exportBackupData() async {
    return await _db.exportBackupJson();
  }

  Future<void> importBackupData(String jsonString) async {
    await _db.importBackupJson(jsonString);
    await refreshAll();
  }
}
