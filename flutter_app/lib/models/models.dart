import 'dart:convert';

enum TaskPriority { low, medium, high, urgent }

enum TaskType {
  assignment,
  exam,
  lab,
  lecture,
  project,
  coding,
  revision,
  personal
}

enum ReminderType {
  preset_5m,
  preset_15m,
  preset_30m,
  preset_1h,
  same_day_9am,
  day_before_9am,
  custom
}

class Subtask {
  final String id;
  final String taskId;
  final String title;
  bool completed;
  final int sortOrder;

  Subtask({
    required this.id,
    required this.taskId,
    required this.title,
    this.completed = false,
    this.sortOrder = 0,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'task_id': taskId,
        'title': title,
        'completed': completed ? 1 : 0,
        'sort_order': sortOrder,
      };

  factory Subtask.fromMap(Map<String, dynamic> map) => Subtask(
        id: map['id'],
        taskId: map['task_id'],
        title: map['title'],
        completed: map['completed'] == 1,
        sortOrder: map['sort_order'] ?? 0,
      );
}

class ReminderItem {
  final String id;
  final String taskId;
  final ReminderType reminderType;
  final String scheduledTime;
  String? notificationId;
  String status;
  String? taskTitle;
  String? taskDueDate;

  ReminderItem({
    required this.id,
    required this.taskId,
    required this.reminderType,
    required this.scheduledTime,
    this.notificationId,
    this.status = 'pending',
    this.taskTitle,
    this.taskDueDate,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'task_id': taskId,
        'reminder_type': reminderType.name,
        'scheduled_time': scheduledTime,
        'notification_id': notificationId,
        'status': status,
      };

  factory ReminderItem.fromMap(Map<String, dynamic> map) => ReminderItem(
        id: map['id'],
        taskId: map['task_id'],
        reminderType: ReminderType.values.firstWhere(
          (e) => e.name == map['reminder_type'],
          orElse: () => ReminderType.preset_15m,
        ),
        scheduledTime: map['scheduled_time'],
        notificationId: map['notification_id'],
        status: map['status'] ?? 'pending',
        taskTitle: map['task_title'],
        taskDueDate: map['task_due_date'],
      );
}

class TaskItem {
  final String id;
  String title;
  String? description;
  String? subjectId;
  String category;
  TaskType taskType;
  String? dueDate;
  String? dueTime;
  TaskPriority priority;
  int estimatedMinutes;
  bool completed;
  String? completedAt;
  bool isRecurring;
  String? recurrenceRule;
  List<String> tags;
  final String createdAt;
  String updatedAt;

  // Joined fields
  List<Subtask> subtasks;
  List<ReminderItem> reminders;
  String? subjectName;
  String? subjectCode;
  String? subjectColor;

  TaskItem({
    required this.id,
    required this.title,
    this.description,
    this.subjectId,
    required this.category,
    required this.taskType,
    this.dueDate,
    this.dueTime,
    required this.priority,
    this.estimatedMinutes = 30,
    this.completed = false,
    this.completedAt,
    this.isRecurring = false,
    this.recurrenceRule,
    this.tags = const [],
    required this.createdAt,
    required this.updatedAt,
    this.subtasks = const [],
    this.reminders = const [],
    this.subjectName,
    this.subjectCode,
    this.subjectColor,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'description': description,
        'subject_id': subjectId,
        'category': category,
        'task_type': taskType.name,
        'due_date': dueDate,
        'due_time': dueTime,
        'priority': priority.name,
        'estimated_minutes': estimatedMinutes,
        'completed': completed ? 1 : 0,
        'completed_at': completedAt,
        'is_recurring': isRecurring ? 1 : 0,
        'recurrence_rule': recurrenceRule,
        'tags': jsonEncode(tags),
        'created_at': createdAt,
        'updated_at': updatedAt,
      };

  factory TaskItem.fromMap(Map<String, dynamic> map,
      {List<Subtask> subtasks = const [],
      List<ReminderItem> reminders = const []}) {
    List<String> parsedTags = [];
    try {
      if (map['tags'] != null) {
        parsedTags = List<String>.from(jsonDecode(map['tags']));
      }
    } catch (_) {}

    return TaskItem(
      id: map['id'],
      title: map['title'],
      description: map['description'],
      subjectId: map['subject_id'],
      category: map['category'] ?? 'Assignments',
      taskType: TaskType.values.firstWhere(
        (e) => e.name == map['task_type'],
        orElse: () => TaskType.assignment,
      ),
      dueDate: map['due_date'],
      dueTime: map['due_time'],
      priority: TaskPriority.values.firstWhere(
        (e) => e.name == map['priority'],
        orElse: () => TaskPriority.medium,
      ),
      estimatedMinutes: map['estimated_minutes'] ?? 30,
      completed: map['completed'] == 1,
      completedAt: map['completed_at'],
      isRecurring: map['is_recurring'] == 1,
      recurrenceRule: map['recurrence_rule'],
      tags: parsedTags,
      createdAt: map['created_at'] ?? DateTime.now().toIso8601String(),
      updatedAt: map['updated_at'] ?? DateTime.now().toIso8601String(),
      subtasks: subtasks,
      reminders: reminders,
      subjectName: map['subject_name'],
      subjectCode: map['subject_code'],
      subjectColor: map['subject_color'],
    );
  }
}

class SubjectItem {
  final String id;
  String name;
  String code;
  int semester;
  int credits;
  String? instructor;
  String color;
  String icon;
  int syllabusProgress;
  int totalTopics;
  int completedTopics;
  int activeTasksCount;

  SubjectItem({
    required this.id,
    required this.name,
    required this.code,
    required this.semester,
    required this.credits,
    this.instructor,
    required this.color,
    required this.icon,
    this.syllabusProgress = 0,
    this.totalTopics = 0,
    this.completedTopics = 0,
    this.activeTasksCount = 0,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'code': code,
        'semester': semester,
        'credits': credits,
        'instructor': instructor,
        'color': color,
        'icon': icon,
        'syllabus_progress': syllabusProgress,
      };

  factory SubjectItem.fromMap(Map<String, dynamic> map) => SubjectItem(
        id: map['id'],
        name: map['name'],
        code: map['code'],
        semester: map['semester'] ?? 3,
        credits: map['credits'] ?? 4,
        instructor: map['instructor'],
        color: map['color'] ?? '#6366F1',
        icon: map['icon'] ?? 'book',
        syllabusProgress: (map['syllabus_progress'] as num?)?.toInt() ?? 0,
        totalTopics: map['total_topics'] ?? 0,
        completedTopics: map['completed_topics'] ?? 0,
        activeTasksCount: map['active_tasks_count'] ?? 0,
      );
}

class SyllabusUnit {
  final String id;
  final String subjectId;
  final int unitNumber;
  final String title;
  List<SyllabusTopic> topics;

  SyllabusUnit({
    required this.id,
    required this.subjectId,
    required this.unitNumber,
    required this.title,
    this.topics = const [],
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'subject_id': subjectId,
        'unit_number': unitNumber,
        'title': title,
      };

  factory SyllabusUnit.fromMap(Map<String, dynamic> map,
          {List<SyllabusTopic> topics = const []}) =>
      SyllabusUnit(
        id: map['id'],
        subjectId: map['subject_id'],
        unitNumber: map['unit_number'] ?? 1,
        title: map['title'],
        topics: topics,
      );
}

class SyllabusTopic {
  final String id;
  final String unitId;
  final String subjectId;
  final String title;
  String status; // 'not_started', 'in_progress', 'completed'
  int revisionCount;
  String notes;

  SyllabusTopic({
    required this.id,
    required this.unitId,
    required this.subjectId,
    required this.title,
    this.status = 'not_started',
    this.revisionCount = 0,
    this.notes = '',
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'unit_id': unitId,
        'subject_id': subjectId,
        'title': title,
        'status': status,
        'revision_count': revisionCount,
        'notes': notes,
      };

  factory SyllabusTopic.fromMap(Map<String, dynamic> map) => SyllabusTopic(
        id: map['id'],
        unitId: map['unit_id'],
        subjectId: map['subject_id'],
        title: map['title'],
        status: map['status'] ?? 'not_started',
        revisionCount: map['revision_count'] ?? 0,
        notes: map['notes'] ?? '',
      );
}

class AssessmentItem {
  final String id;
  final String subjectId;
  String title;
  String assessmentType; // 'internal', 'mid_sem', 'end_sem', 'lab_exam', 'viva', 'assignment'
  String dueDate;
  String? dueTime;
  int? totalMarks;
  int? weightage;
  String? notes;
  bool completed;
  String? subjectName;
  String? subjectColor;

  AssessmentItem({
    required this.id,
    required this.subjectId,
    required this.title,
    required this.assessmentType,
    required this.dueDate,
    this.dueTime,
    this.totalMarks,
    this.weightage,
    this.notes,
    this.completed = false,
    this.subjectName,
    this.subjectColor,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'subject_id': subjectId,
        'title': title,
        'assessment_type': assessmentType,
        'due_date': dueDate,
        'due_time': dueTime,
        'total_marks': totalMarks,
        'weightage': weightage,
        'notes': notes,
        'completed': completed ? 1 : 0,
      };

  factory AssessmentItem.fromMap(Map<String, dynamic> map) => AssessmentItem(
        id: map['id'],
        subjectId: map['subject_id'],
        title: map['title'],
        assessmentType: map['assessment_type'],
        dueDate: map['due_date'],
        dueTime: map['due_time'],
        totalMarks: map['total_marks'],
        weightage: map['weightage'],
        notes: map['notes'],
        completed: map['completed'] == 1,
        subjectName: map['subject_name'],
        subjectColor: map['subject_color'],
      );
}

class CodingProblemItem {
  final String id;
  String title;
  String platform;
  String language;
  String difficulty;
  String topic;
  String attemptDate;
  String status;
  String? notes;
  String? problemUrl;

  CodingProblemItem({
    required this.id,
    required this.title,
    required this.platform,
    required this.language,
    required this.difficulty,
    required this.topic,
    required this.attemptDate,
    required this.status,
    this.notes,
    this.problemUrl,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'platform': platform,
        'language': language,
        'difficulty': difficulty,
        'topic': topic,
        'attempt_date': attemptDate,
        'status': status,
        'notes': notes,
        'problem_url': problemUrl,
      };

  factory CodingProblemItem.fromMap(Map<String, dynamic> map) =>
      CodingProblemItem(
        id: map['id'],
        title: map['title'],
        platform: map['platform'],
        language: map['language'],
        difficulty: map['difficulty'],
        topic: map['topic'],
        attemptDate: map['attempt_date'],
        status: map['status'],
        notes: map['notes'],
        problemUrl: map['problem_url'],
      );
}

class ProjectMilestone {
  final String id;
  final String projectId;
  String title;
  String? dueDate;
  bool completed;

  ProjectMilestone({
    required this.id,
    required this.projectId,
    required this.title,
    this.dueDate,
    this.completed = false,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'project_id': projectId,
        'title': title,
        'due_date': dueDate,
        'completed': completed ? 1 : 0,
      };

  factory ProjectMilestone.fromMap(Map<String, dynamic> map) =>
      ProjectMilestone(
        id: map['id'],
        projectId: map['project_id'],
        title: map['title'],
        dueDate: map['due_date'],
        completed: map['completed'] == 1,
      );
}

class ProjectItem {
  final String id;
  String name;
  String? description;
  String techStack;
  String? repoUrl;
  String? targetDeadline;
  String status;
  int progressPercentage;
  List<ProjectMilestone> milestones;

  ProjectItem({
    required this.id,
    required this.name,
    this.description,
    required this.techStack,
    this.repoUrl,
    this.targetDeadline,
    this.status = 'in_progress',
    this.progressPercentage = 0,
    this.milestones = const [],
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'description': description,
        'tech_stack': techStack,
        'repo_url': repoUrl,
        'target_deadline': targetDeadline,
        'status': status,
        'progress_percentage': progressPercentage,
      };

  factory ProjectItem.fromMap(Map<String, dynamic> map,
          {List<ProjectMilestone> milestones = const []}) =>
      ProjectItem(
        id: map['id'],
        name: map['name'],
        description: map['description'],
        techStack: map['tech_stack'] ?? '',
        repoUrl: map['repo_url'],
        targetDeadline: map['target_deadline'],
        status: map['status'] ?? 'in_progress',
        progressPercentage:
            (map['progress_percentage'] as num?)?.toInt() ?? 0,
        milestones: milestones,
      );
}

class StudySessionItem {
  final String id;
  String? subjectId;
  String? taskId;
  String startTime;
  int durationMinutes;
  String? notes;
  String sessionType;
  String? subjectName;
  String? subjectColor;

  StudySessionItem({
    required this.id,
    this.subjectId,
    this.taskId,
    required this.startTime,
    required this.durationMinutes,
    this.notes,
    required this.sessionType,
    this.subjectName,
    this.subjectColor,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'subject_id': subjectId,
        'task_id': taskId,
        'start_time': startTime,
        'duration_minutes': durationMinutes,
        'notes': notes,
        'session_type': sessionType,
      };

  factory StudySessionItem.fromMap(Map<String, dynamic> map) =>
      StudySessionItem(
        id: map['id'],
        subjectId: map['subject_id'],
        taskId: map['task_id'],
        startTime: map['start_time'],
        durationMinutes: map['duration_minutes'] ?? 0,
        notes: map['notes'],
        sessionType: map['session_type'] ?? 'pomodoro',
        subjectName: map['subject_name'],
        subjectColor: map['subject_color'],
      );
}

class AppSettings {
  String userName;
  String collegeName;
  int semester;
  String theme; // 'system', 'dark', 'light'
  ReminderType defaultReminder;
  int pomodoroWorkMins;
  int pomodoroBreakMins;
  bool notificationsEnabled;
  bool onboardingCompleted;

  AppSettings({
    this.userName = 'Alex Chen',
    this.collegeName = 'School of Computer Science & Engineering',
    this.semester = 3,
    this.theme = 'dark',
    this.defaultReminder = ReminderType.preset_15m,
    this.pomodoroWorkMins = 25,
    this.pomodoroBreakMins = 5,
    this.notificationsEnabled = true,
    this.onboardingCompleted = true,
  });
}
