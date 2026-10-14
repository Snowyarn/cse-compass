import 'dart:async';
import 'dart:convert';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import '../models/models.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('cse_compass.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        semester INTEGER NOT NULL,
        credits INTEGER NOT NULL,
        instructor TEXT,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        syllabus_progress INTEGER DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        subject_id TEXT,
        category TEXT NOT NULL,
        task_type TEXT NOT NULL,
        due_date TEXT,
        due_time TEXT,
        priority TEXT NOT NULL,
        estimated_minutes INTEGER DEFAULT 30,
        completed INTEGER DEFAULT 0,
        completed_at TEXT,
        is_recurring INTEGER DEFAULT 0,
        recurrence_rule TEXT,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE reminders (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        reminder_type TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        notification_id TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE syllabus_units (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        unit_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE syllabus_topics (
        id TEXT PRIMARY KEY,
        unit_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'not_started',
        revision_count INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (unit_id) REFERENCES syllabus_units (id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE assessments (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        title TEXT NOT NULL,
        assessment_type TEXT NOT NULL,
        due_date TEXT NOT NULL,
        due_time TEXT,
        total_marks INTEGER,
        weightage INTEGER,
        notes TEXT,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE coding_problems (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        language TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        topic TEXT NOT NULL,
        attempt_date TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        problem_url TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        tech_stack TEXT NOT NULL,
        repo_url TEXT,
        target_deadline TEXT,
        status TEXT DEFAULT 'in_progress',
        progress_percentage INTEGER DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE project_milestones (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        due_date TEXT,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE study_sessions (
        id TEXT PRIMARY KEY,
        subject_id TEXT,
        task_id TEXT,
        start_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        notes TEXT,
        session_type TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL,
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    ''');

    // Seed Initial Academic Data
    await _seedInitialData(db);
  }

  Future<void> _seedInitialData(Database db) async {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    final tomorrowStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${(now.day + 1).toString().padLeft(2, '0')}";
    final dayAfterTomorrowStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${(now.day + 2).toString().padLeft(2, '0')}";

    // 1. Subjects
    final subjects = [
      {
        'id': 'sub_dsa',
        'name': 'Data Structures & Algorithms',
        'code': 'CS201',
        'semester': 3,
        'credits': 4,
        'instructor': 'Prof. A. Sharma',
        'color': '#6366F1', // Indigo
        'icon': 'account_tree',
        'syllabus_progress': 65,
      },
      {
        'id': 'sub_os',
        'name': 'Operating Systems',
        'code': 'CS301',
        'semester': 3,
        'credits': 4,
        'instructor': 'Dr. R. Verma',
        'color': '#EC4899', // Pink
        'icon': 'memory',
        'syllabus_progress': 45,
      },
      {
        'id': 'sub_dbms',
        'name': 'Database Management Systems',
        'code': 'CS302',
        'semester': 3,
        'credits': 4,
        'instructor': 'Prof. K. Iyer',
        'color': '#10B981', // Emerald
        'icon': 'storage',
        'syllabus_progress': 70,
      },
      {
        'id': 'sub_dm',
        'name': 'Discrete Mathematics',
        'code': 'MA201',
        'semester': 3,
        'credits': 3,
        'instructor': 'Dr. N. Gupta',
        'color': '#F59E0B', // Amber
        'icon': 'functions',
        'syllabus_progress': 50,
      },
      {
        'id': 'sub_cn',
        'name': 'Computer Networks',
        'code': 'CS202',
        'semester': 3,
        'credits': 3,
        'instructor': 'Dr. S. Nair',
        'color': '#3B82F6', // Blue
        'icon': 'lan',
        'syllabus_progress': 30,
      },
    ];

    for (var s in subjects) {
      await db.insert('subjects', s);
    }

    // 2. Syllabus Units & Topics
    final units = [
      {'id': 'u_dsa_1', 'subject_id': 'sub_dsa', 'unit_number': 1, 'title': 'Linear Data Structures & Analysis'},
      {'id': 'u_dsa_2', 'subject_id': 'sub_dsa', 'unit_number': 2, 'title': 'Trees, BST, AVL & Heaps'},
      {'id': 'u_os_1', 'subject_id': 'sub_os', 'unit_number': 1, 'title': 'Process Management & Synchronization'},
      {'id': 'u_dbms_1', 'subject_id': 'sub_dbms', 'unit_number': 1, 'title': 'Relational Algebra & Normalization'},
    ];

    for (var u in units) {
      await db.insert('syllabus_units', u);
    }

    final topics = [
      {'id': 't_dsa_1', 'unit_id': 'u_dsa_1', 'subject_id': 'sub_dsa', 'title': 'Asymptotic Notations (Big-O, Omega, Theta)', 'status': 'completed', 'revision_count': 2, 'notes': 'Mastered master theorem cases'},
      {'id': 't_dsa_2', 'unit_id': 'u_dsa_1', 'subject_id': 'sub_dsa', 'title': 'Linked Lists, Stacks & Queue Applications', 'status': 'completed', 'revision_count': 1, 'notes': 'Monotonic stack problems practiced'},
      {'id': 't_dsa_3', 'unit_id': 'u_dsa_2', 'subject_id': 'sub_dsa', 'title': 'Binary Search Trees & AVL Rotations', 'status': 'in_progress', 'revision_count': 0, 'notes': 'Review double rotation rules'},
      {'id': 't_dsa_4', 'unit_id': 'u_dsa_2', 'subject_id': 'sub_dsa', 'title': 'Min/Max Binary Heaps & Priority Queues', 'status': 'not_started', 'revision_count': 0, 'notes': ''},
      {'id': 't_os_1', 'unit_id': 'u_os_1', 'subject_id': 'sub_os', 'title': 'Process State Transitions & PCB', 'status': 'completed', 'revision_count': 1, 'notes': ''},
      {'id': 't_os_2', 'unit_id': 'u_os_1', 'subject_id': 'sub_os', 'title': 'CPU Scheduling: Round Robin, SJF, Multilevel Queue', 'status': 'in_progress', 'revision_count': 1, 'notes': 'Calculate turnaround time formulas'},
      {'id': 't_dbms_1', 'unit_id': 'u_dbms_1', 'subject_id': 'sub_dbms', 'title': 'Entity Relationship (ER) Diagrams', 'status': 'completed', 'revision_count': 1, 'notes': ''},
      {'id': 't_dbms_2', 'unit_id': 'u_dbms_1', 'subject_id': 'sub_dbms', 'title': '1NF, 2NF, 3NF & BCNF Normalization', 'status': 'in_progress', 'revision_count': 0, 'notes': 'Practice lossy vs lossless join decomposition'},
    ];

    for (var t in topics) {
      await db.insert('syllabus_topics', t);
    }

    // 3. Tasks
    final tasks = [
      {
        'id': 'task_1',
        'title': 'Implement Red-Black Tree in C++',
        'description': 'Assignment 3 for Data Structures. Implement insertion, left/right rotate, and color fixing.',
        'subject_id': 'sub_dsa',
        'category': 'Assignments',
        'task_type': 'assignment',
        'due_date': todayStr,
        'due_time': '20:00',
        'priority': 'urgent',
        'estimated_minutes': 90,
        'completed': 0,
        'tags': jsonEncode(['dsa', 'c++', 'assignment']),
        'created_at': now.toIso8601String(),
        'updated_at': now.toIso8601String(),
      },
      {
        'id': 'task_2',
        'title': 'Solve Banker\'s Algorithm & Deadlock Avoidance Problems',
        'description': 'Complete textbook exercise problems for Operating Systems tutorial class.',
        'subject_id': 'sub_os',
        'category': 'Lectures and classwork',
        'task_type': 'lecture',
        'due_date': todayStr,
        'due_time': '22:00',
        'priority': 'high',
        'estimated_minutes': 45,
        'completed': 0,
        'tags': jsonEncode(['os', 'deadlock', 'tutorial']),
        'created_at': now.toIso8601String(),
        'updated_at': now.toIso8601String(),
      },
      {
        'id': 'task_3',
        'title': 'SQL Query Optimization Lab Report',
        'description': 'Write report on indexing, EXPLAIN ANALYZE execution plan comparisons for 100k rows table.',
        'subject_id': 'sub_dbms',
        'category': 'Labs and practicals',
        'task_type': 'lab',
        'due_date': tomorrowStr,
        'due_time': '17:00',
        'priority': 'medium',
        'estimated_minutes': 60,
        'completed': 0,
        'tags': jsonEncode(['dbms', 'sql', 'lab']),
        'created_at': now.toIso8601String(),
        'updated_at': now.toIso8601String(),
      },
      {
        'id': 'task_4',
        'title': 'Solve 3 LeetCode Graph / BFS Problems',
        'description': 'Practice Clone Graph, Rotting Oranges, and Number of Islands for upcoming placement rounds.',
        'subject_id': 'sub_dsa',
        'category': 'Coding practice',
        'task_type': 'coding',
        'due_date': dayAfterTomorrowStr,
        'due_time': '21:30',
        'priority': 'high',
        'estimated_minutes': 75,
        'completed': 0,
        'tags': jsonEncode(['placement', 'leetcode', 'graphs']),
        'created_at': now.toIso8601String(),
        'updated_at': now.toIso8601String(),
      },
    ];

    for (var task in tasks) {
      await db.insert('tasks', task);
    }

    // 4. Subtasks
    final subtasks = [
      {'id': 'sub_1_1', 'task_id': 'task_1', 'title': 'Create Node structure with parent, left, right pointers & color enum', 'completed': 1, 'sort_order': 0},
      {'id': 'sub_1_2', 'task_id': 'task_1', 'title': 'Implement leftRotate and rightRotate helper methods', 'completed': 1, 'sort_order': 1},
      {'id': 'sub_1_3', 'task_id': 'task_1', 'title': 'Implement insertFixup for red-black balance violations', 'completed': 0, 'sort_order': 2},
      {'id': 'sub_1_4', 'task_id': 'task_1', 'title': 'Test with stress test suite and verify tree height <= 2*log(n+1)', 'completed': 0, 'sort_order': 3},
      {'id': 'sub_2_1', 'task_id': 'task_2', 'title': 'Review Safety Algorithm steps (Work, Finish vectors)', 'completed': 1, 'sort_order': 0},
      {'id': 'sub_2_2', 'task_id': 'task_2', 'title': 'Solve Resource-Request Algorithm numericals 1 to 4', 'completed': 0, 'sort_order': 1},
    ];

    for (var st in subtasks) {
      await db.insert('subtasks', st);
    }

    // 5. Reminders
    final reminders = [
      {
        'id': 'rem_1',
        'task_id': 'task_1',
        'reminder_type': 'preset_30m',
        'scheduled_time': '$todayStr 19:30:00',
        'notification_id': '1001',
        'status': 'scheduled',
      },
      {
        'id': 'rem_2',
        'task_id': 'task_2',
        'reminder_type': 'preset_15m',
        'scheduled_time': '$todayStr 21:45:00',
        'notification_id': '1002',
        'status': 'scheduled',
      },
    ];

    for (var r in reminders) {
      await db.insert('reminders', r);
    }

    // 6. Assessments
    final assessments = [
      {
        'id': 'ass_1',
        'subject_id': 'sub_dsa',
        'title': 'Mid-Semester Exam: Algorithms & Trees',
        'assessment_type': 'mid_sem',
        'due_date': dayAfterTomorrowStr,
        'due_time': '10:00',
        'total_marks': 50,
        'weightage': 30,
        'notes': 'Covers Units 1 & 2. Time complexity proofs and tree algorithms.',
        'completed': 0,
      },
      {
        'id': 'ass_2',
        'subject_id': 'sub_os',
        'title': 'OS Lab Practical & Viva',
        'assessment_type': 'lab_exam',
        'due_date': "${now.year}-${now.month.toString().padLeft(2, '0')}-${(now.day + 5).toString().padLeft(2, '0')}",
        'due_time': '14:00',
        'total_marks': 25,
        'weightage': 15,
        'notes': 'Fork syscalls, POSIX threads, semaphores coding on Linux terminal.',
        'completed': 0,
      },
      {
        'id': 'ass_3',
        'subject_id': 'sub_dbms',
        'title': 'DBMS Project Phase 1 Presentation',
        'assessment_type': 'internal',
        'due_date': "${now.year}-${now.month.toString().padLeft(2, '0')}-${(now.day + 7).toString().padLeft(2, '0')}",
        'due_time': '11:30',
        'total_marks': 20,
        'weightage': 10,
        'notes': 'Show ER diagram and normalized schema (up to BCNF).',
        'completed': 0,
      },
    ];

    for (var a in assessments) {
      await db.insert('assessments', a);
    }

    // 7. Coding Problems
    final codingProblems = [
      {
        'id': 'cp_1',
        'title': 'LRU Cache Design (LeetCode #146)',
        'platform': 'LeetCode',
        'language': 'C++',
        'difficulty': 'Medium',
        'topic': 'Hash Map + Doubly Linked List',
        'attempt_date': todayStr,
        'status': 'Solved',
        'notes': 'O(1) get and put achieved using unordered_map<int, list::iterator>.',
        'problem_url': 'https://leetcode.com/problems/lru-cache/',
      },
      {
        'id': 'cp_2',
        'title': 'Course Schedule II - Topological Sort (LeetCode #210)',
        'platform': 'LeetCode',
        'language': 'C++',
        'difficulty': 'Medium',
        'topic': 'Graph BFS / Kahn\'s Algorithm',
        'attempt_date': todayStr,
        'status': 'Solved',
        'notes': 'In-degree array + queue. If processed != numCourses, cycle detected.',
        'problem_url': 'https://leetcode.com/problems/course-schedule-ii/',
      },
      {
        'id': 'cp_3',
        'title': 'Trapping Rain Water (LeetCode #42)',
        'platform': 'LeetCode',
        'language': 'Java',
        'difficulty': 'Hard',
        'topic': 'Two Pointers',
        'attempt_date': todayStr,
        'status': 'Reviewing',
        'notes': 'Left max & right max pointers technique runs in O(n) time, O(1) space.',
        'problem_url': 'https://leetcode.com/problems/trapping-rain-water/',
      },
    ];

    for (var cp in codingProblems) {
      await db.insert('coding_problems', cp);
    }

    // 8. Projects
    final project = {
      'id': 'proj_1',
      'name': 'Distributed Key-Value Store with Raft Consensus',
      'description': 'High-performance in-memory key-value engine with leader election, log replication, and persistence.',
      'tech_stack': 'Go, gRPC, Protocol Buffers',
      'repo_url': 'https://github.com/alexchen/raft-kvstore',
      'target_deadline': "${now.year}-${(now.month + 1).toString().padLeft(2, '0')}-15",
      'status': 'in_progress',
      'progress_percentage': 60,
    };
    await db.insert('projects', project);

    final milestones = [
      {'id': 'm_1', 'project_id': 'proj_1', 'title': 'Implement RPC communication between Raft peers', 'due_date': todayStr, 'completed': 1},
      {'id': 'm_2', 'project_id': 'proj_1', 'title': 'Implement Leader Election & Heartbeat timers', 'due_date': tomorrowStr, 'completed': 1},
      {'id': 'm_3', 'project_id': 'proj_1', 'title': 'Log Replication and Commit Index state machine', 'due_date': dayAfterTomorrowStr, 'completed': 0},
      {'id': 'm_4', 'project_id': 'proj_1', 'title': 'Persistence & Crash recovery tests', 'due_date': "${now.year}-${(now.month + 1).toString().padLeft(2, '0')}-10", 'completed': 0},
    ];

    for (var m in milestones) {
      await db.insert('project_milestones', m);
    }

    // 9. Study Sessions
    final studySessions = [
      {
        'id': 'sess_1',
        'subject_id': 'sub_dsa',
        'task_id': 'task_1',
        'start_time': '$todayStr 14:00:00',
        'duration_minutes': 50,
        'notes': 'Deep focus on AVL tree insertion and rotation mathematics.',
        'session_type': 'pomodoro',
      },
      {
        'id': 'sess_2',
        'subject_id': 'sub_os',
        'task_id': 'task_2',
        'start_time': '$todayStr 16:00:00',
        'duration_minutes': 25,
        'notes': 'Deadlock conditions and Banker\'s algorithm practice.',
        'session_type': 'pomodoro',
      },
    ];

    for (var ss in studySessions) {
      await db.insert('study_sessions', ss);
    }

    // 10. Default Settings
    final settingsMap = {
      'user_name': 'Alex Chen',
      'college_name': 'School of Computer Science & Engineering',
      'semester': '3',
      'theme': 'dark',
      'default_reminder': 'preset_15m',
      'pomodoro_work_mins': '25',
      'pomodoro_break_mins': '5',
      'notifications_enabled': '1',
      'onboarding_completed': '1',
    };

    for (var entry in settingsMap.entries) {
      await db.insert('settings', {'key': entry.key, 'value': entry.value});
    }
  }

  // --- Tasks CRUD ---
  Future<List<TaskItem>> getTasks({
    String? subjectId,
    String? category,
    TaskPriority? priority,
    bool? completed,
    String? date,
    String? searchQuery,
    String? sortBy, // 'due_date', 'priority', 'created_at', 'duration'
  }) async {
    final db = await database;
    String query = '''
      SELECT t.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE 1=1
    ''';
    List<dynamic> args = [];

    if (subjectId != null && subjectId.isNotEmpty) {
      query += ' AND t.subject_id = ?';
      args.add(subjectId);
    }
    if (category != null && category.isNotEmpty) {
      query += ' AND t.category = ?';
      args.add(category);
    }
    if (priority != null) {
      query += ' AND t.priority = ?';
      args.add(priority.name);
    }
    if (completed != null) {
      query += ' AND t.completed = ?';
      args.add(completed ? 1 : 0);
    }
    if (date != null && date.isNotEmpty) {
      query += ' AND t.due_date = ?';
      args.add(date);
    }
    if (searchQuery != null && searchQuery.isNotEmpty) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      args.add('%$searchQuery%');
      args.add('%$searchQuery%');
    }

    if (sortBy == 'priority') {
      query += " ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END ASC, t.due_date ASC";
    } else if (sortBy == 'duration') {
      query += ' ORDER BY t.estimated_minutes ASC';
    } else if (sortBy == 'created_at') {
      query += ' ORDER BY t.created_at DESC';
    } else {
      query += ' ORDER BY t.due_date ASC, t.due_time ASC';
    }

    final taskMaps = await db.rawQuery(query, args);
    List<TaskItem> tasks = [];

    for (var map in taskMaps) {
      final taskId = map['id'] as String;
      final subtaskMaps = await db.query(
        'subtasks',
        where: 'task_id = ?',
        whereArgs: [taskId],
        orderBy: 'sort_order ASC',
      );
      final reminderMaps = await db.query(
        'reminders',
        where: 'task_id = ?',
        whereArgs: [taskId],
      );

      final subtasks = subtaskMaps.map((m) => Subtask.fromMap(m)).toList();
      final reminders = reminderMaps.map((m) => ReminderItem.fromMap(m)).toList();

      tasks.add(TaskItem.fromMap(map, subtasks: subtasks, reminders: reminders));
    }

    return tasks;
  }

  Future<TaskItem?> getTaskById(String id) async {
    final db = await database;
    final results = await db.rawQuery('''
      SELECT t.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.id = ?
    ''', [id]);

    if (results.isEmpty) return null;

    final subtaskMaps = await db.query('subtasks', where: 'task_id = ?', whereArgs: [id], orderBy: 'sort_order ASC');
    final reminderMaps = await db.query('reminders', where: 'task_id = ?', whereArgs: [id]);

    final subtasks = subtaskMaps.map((m) => Subtask.fromMap(m)).toList();
    final reminders = reminderMaps.map((m) => ReminderItem.fromMap(m)).toList();

    return TaskItem.fromMap(results.first, subtasks: subtasks, reminders: reminders);
  }

  Future<void> insertTask(TaskItem task) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.insert('tasks', task.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);

      for (var st in task.subtasks) {
        await txn.insert('subtasks', st.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
      }
      for (var r in task.reminders) {
        await txn.insert('reminders', r.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
      }
    });
  }

  Future<void> updateTask(TaskItem task) async {
    final db = await database;
    await db.transaction((txn) async {
      task.updatedAt = DateTime.now().toIso8601String();
      await txn.update('tasks', task.toMap(), where: 'id = ?', whereArgs: [task.id]);

      await txn.delete('subtasks', where: 'task_id = ?', whereArgs: [task.id]);
      for (var st in task.subtasks) {
        await txn.insert('subtasks', st.toMap());
      }

      await txn.delete('reminders', where: 'task_id = ?', whereArgs: [task.id]);
      for (var r in task.reminders) {
        await txn.insert('reminders', r.toMap());
      }
    });
  }

  Future<void> toggleTaskCompleted(String taskId, bool completed) async {
    final db = await database;
    final now = completed ? DateTime.now().toIso8601String() : null;
    await db.update(
      'tasks',
      {
        'completed': completed ? 1 : 0,
        'completed_at': now,
        'updated_at': DateTime.now().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [taskId],
    );
  }

  Future<void> deleteTask(String taskId) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.delete('reminders', where: 'task_id = ?', whereArgs: [taskId]);
      await txn.delete('subtasks', where: 'task_id = ?', whereArgs: [taskId]);
      await txn.delete('tasks', where: 'id = ?', whereArgs: [taskId]);
    });
  }

  Future<void> toggleSubtask(String subtaskId, bool completed) async {
    final db = await database;
    await db.update('subtasks', {'completed': completed ? 1 : 0}, where: 'id = ?', whereArgs: [subtaskId]);
  }

  // --- Subjects & Syllabus CRUD ---
  Future<List<SubjectItem>> getSubjects() async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT s.*, 
        COUNT(DISTINCT st.id) as total_topics,
        SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) as completed_topics,
        COUNT(DISTINCT t.id) as active_tasks_count
      FROM subjects s
      LEFT JOIN syllabus_topics st ON s.id = st.subject_id
      LEFT JOIN tasks t ON s.id = t.subject_id AND t.completed = 0
      GROUP BY s.id
      ORDER BY s.semester ASC, s.name ASC
    ''');

    return maps.map((m) {
      final total = (m['total_topics'] as num?)?.toInt() ?? 0;
      final completed = (m['completed_topics'] as num?)?.toInt() ?? 0;
      final progress = total > 0 ? ((completed / total) * 100).round() : 0;
      final mapWithProgress = Map<String, dynamic>.from(m);
      mapWithProgress['syllabus_progress'] = progress;
      return SubjectItem.fromMap(mapWithProgress);
    }).toList();
  }

  Future<void> insertSubject(SubjectItem subject) async {
    final db = await database;
    await db.insert('subjects', subject.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateSubject(SubjectItem subject) async {
    final db = await database;
    await db.update('subjects', subject.toMap(), where: 'id = ?', whereArgs: [subject.id]);
  }

  Future<void> deleteSubject(String subjectId) async {
    final db = await database;
    await db.delete('subjects', where: 'id = ?', whereArgs: [subjectId]);
  }

  Future<List<SyllabusUnit>> getSyllabusUnits(String subjectId) async {
    final db = await database;
    final unitMaps = await db.query('syllabus_units', where: 'subject_id = ?', whereArgs: [subjectId], orderBy: 'unit_number ASC');

    List<SyllabusUnit> units = [];
    for (var uMap in unitMaps) {
      final unitId = uMap['id'] as String;
      final topicMaps = await db.query('syllabus_topics', where: 'unit_id = ?', whereArgs: [unitId]);
      final topics = topicMaps.map((t) => SyllabusTopic.fromMap(t)).toList();
      units.add(SyllabusUnit.fromMap(uMap, topics: topics));
    }
    return units;
  }

  Future<void> insertSyllabusUnit(SyllabusUnit unit) async {
    final db = await database;
    await db.insert('syllabus_units', unit.toMap());
  }

  Future<void> insertSyllabusTopic(SyllabusTopic topic) async {
    final db = await database;
    await db.insert('syllabus_topics', topic.toMap());
  }

  Future<void> updateTopicStatus(String topicId, String status) async {
    final db = await database;
    await db.update('syllabus_topics', {'status': status}, where: 'id = ?', whereArgs: [topicId]);
  }

  Future<void> incrementTopicRevision(String topicId) async {
    final db = await database;
    await db.rawUpdate('UPDATE syllabus_topics SET revision_count = revision_count + 1 WHERE id = ?', [topicId]);
  }

  // --- Assessments CRUD ---
  Future<List<AssessmentItem>> getAssessments({bool? completed}) async {
    final db = await database;
    String query = '''
      SELECT a.*, s.name as subject_name, s.color as subject_color
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE 1=1
    ''';
    List<dynamic> args = [];
    if (completed != null) {
      query += ' AND a.completed = ?';
      args.add(completed ? 1 : 0);
    }
    query += ' ORDER BY a.due_date ASC, a.due_time ASC';
    final maps = await db.rawQuery(query, args);
    return maps.map((m) => AssessmentItem.fromMap(m)).toList();
  }

  Future<void> insertAssessment(AssessmentItem assessment) async {
    final db = await database;
    await db.insert('assessments', assessment.toMap());
  }

  Future<void> toggleAssessmentCompleted(String id, bool completed) async {
    final db = await database;
    await db.update('assessments', {'completed': completed ? 1 : 0}, where: 'id = ?', whereArgs: [id]);
  }

  Future<void> deleteAssessment(String id) async {
    final db = await database;
    await db.delete('assessments', where: 'id = ?', whereArgs: [id]);
  }

  // --- Coding Problems CRUD ---
  Future<List<CodingProblemItem>> getCodingProblems({String? platform, String? topic, String? difficulty}) async {
    final db = await database;
    String query = 'SELECT * FROM coding_problems WHERE 1=1';
    List<dynamic> args = [];
    if (platform != null && platform.isNotEmpty && platform != 'All') {
      query += ' AND platform = ?';
      args.add(platform);
    }
    if (topic != null && topic.isNotEmpty && topic != 'All') {
      query += ' AND topic = ?';
      args.add(topic);
    }
    if (difficulty != null && difficulty.isNotEmpty && difficulty != 'All') {
      query += ' AND difficulty = ?';
      args.add(difficulty);
    }
    query += ' ORDER BY attempt_date DESC';
    final maps = await db.rawQuery(query, args);
    return maps.map((m) => CodingProblemItem.fromMap(m)).toList();
  }

  Future<void> insertCodingProblem(CodingProblemItem item) async {
    final db = await database;
    await db.insert('coding_problems', item.toMap());
  }

  Future<void> updateCodingProblemStatus(String id, String status) async {
    final db = await database;
    await db.update('coding_problems', {'status': status}, where: 'id = ?', whereArgs: [id]);
  }

  Future<void> deleteCodingProblem(String id) async {
    final db = await database;
    await db.delete('coding_problems', where: 'id = ?', whereArgs: [id]);
  }

  // --- Projects CRUD ---
  Future<List<ProjectItem>> getProjects() async {
    final db = await database;
    final projectMaps = await db.query('projects', orderBy: 'status ASC, target_deadline ASC');
    List<ProjectItem> projects = [];

    for (var pMap in projectMaps) {
      final projId = pMap['id'] as String;
      final mMaps = await db.query('project_milestones', where: 'project_id = ?', whereArgs: [projId]);
      final milestones = mMaps.map((m) => ProjectMilestone.fromMap(m)).toList();
      projects.add(ProjectItem.fromMap(pMap, milestones: milestones));
    }
    return projects;
  }

  Future<void> insertProject(ProjectItem project) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.insert('projects', project.toMap());
      for (var m in project.milestones) {
        await txn.insert('project_milestones', m.toMap());
      }
    });
  }

  Future<void> toggleMilestoneCompleted(String milestoneId, bool completed) async {
    final db = await database;
    await db.update('project_milestones', {'completed': completed ? 1 : 0}, where: 'id = ?', whereArgs: [milestoneId]);
  }

  // --- Study Sessions & Analytics ---
  Future<void> insertStudySession(StudySessionItem session) async {
    final db = await database;
    await db.insert('study_sessions', session.toMap());
  }

  Future<List<StudySessionItem>> getStudySessions() async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT ss.*, s.name as subject_name, s.color as subject_color
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      ORDER BY ss.start_time DESC
    ''');
    return maps.map((m) => StudySessionItem.fromMap(m)).toList();
  }

  Future<Map<String, dynamic>> getWeeklyAnalytics() async {
    final db = await database;
    final completedCount = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM tasks WHERE completed = 1')
    ) ?? 0;
    final activeCount = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM tasks WHERE completed = 0')
    ) ?? 0;
    final codingProblemsCount = Sqflite.firstIntValue(
      await db.rawQuery("SELECT COUNT(*) FROM coding_problems WHERE status = 'Solved'")
    ) ?? 0;
    final totalStudyMinutes = Sqflite.firstIntValue(
      await db.rawQuery('SELECT SUM(duration_minutes) FROM study_sessions')
    ) ?? 0;

    return {
      'completedTasks': completedCount,
      'activeTasks': activeCount,
      'solvedProblems': codingProblemsCount,
      'totalStudyMinutes': totalStudyMinutes,
    };
  }

  // --- Reminders Queries ---
  Future<List<ReminderItem>> getActiveReminders() async {
    final db = await database;
    final maps = await db.rawQuery('''
      SELECT r.*, t.title as task_title, t.due_date as task_due_date
      FROM reminders r
      JOIN tasks t ON r.task_id = t.id
      WHERE t.completed = 0
      ORDER BY r.scheduled_time ASC
    ''');
    return maps.map((m) => ReminderItem.fromMap(m)).toList();
  }

  // --- Settings ---
  Future<AppSettings> getSettings() async {
    final db = await database;
    final maps = await db.query('settings');
    Map<String, String> map = {};
    for (var row in maps) {
      map[row['key'] as String] = row['value'] as String;
    }

    return AppSettings(
      userName: map['user_name'] ?? 'Alex Chen',
      collegeName: map['college_name'] ?? 'School of Computer Science & Engineering',
      semester: int.tryParse(map['semester'] ?? '3') ?? 3,
      theme: map['theme'] ?? 'dark',
      defaultReminder: ReminderType.values.firstWhere(
        (e) => e.name == map['default_reminder'],
        orElse: () => ReminderType.preset_15m,
      ),
      pomodoroWorkMins: int.tryParse(map['pomodoro_work_mins'] ?? '25') ?? 25,
      pomodoroBreakMins: int.tryParse(map['pomodoro_break_mins'] ?? '5') ?? 5,
      notificationsEnabled: (map['notifications_enabled'] ?? '1') == '1',
      onboardingCompleted: (map['onboarding_completed'] ?? '1') == '1',
    );
  }

  Future<void> saveSettings(AppSettings settings) async {
    final db = await database;
    final batch = db.batch();
    batch.insert('settings', {'key': 'user_name', 'value': settings.userName}, conflictAlgorithm: ConflictAlgorithm.replace);
    batch.insert('settings', {'key': 'college_name', 'value': settings.collegeName}, conflictAlgorithm: ConflictAlgorithm.replace);
    batch.insert('settings', {'key': 'semester', 'value': settings.semester.toString()}, conflictAlgorithm: ConflictAlgorithm.replace);
    batch.insert('settings', {'key': 'theme', 'value': settings.theme}, conflictAlgorithm: ConflictAlgorithm.replace);
    batch.insert('settings', {'key': 'default_reminder', 'value': settings.defaultReminder.name}, conflictAlgorithm: ConflictAlgorithm.replace);
    batch.insert('settings', {'key': 'pomodoro_work_mins', 'value': settings.pomodoroWorkMins.toString()}, conflictAlgorithm: ConflictAlgorithm.replace);
    batch.insert('settings', {'key': 'pomodoro_break_mins', 'value': settings.pomodoroBreakMins.toString()}, conflictAlgorithm: ConflictAlgorithm.replace);
    batch.insert('settings', {'key': 'notifications_enabled', 'value': settings.notificationsEnabled ? '1' : '0'}, conflictAlgorithm: ConflictAlgorithm.replace);
    batch.insert('settings', {'key': 'onboarding_completed', 'value': settings.onboardingCompleted ? '1' : '0'}, conflictAlgorithm: ConflictAlgorithm.replace);
    await batch.commit(noResult: true);
  }

  // --- Backup Export / Import ---
  Future<String> exportBackupJson() async {
    final db = await database;
    final subjects = await db.query('subjects');
    final tasks = await db.query('tasks');
    final subtasks = await db.query('subtasks');
    final reminders = await db.query('reminders');
    final units = await db.query('syllabus_units');
    final topics = await db.query('syllabus_topics');
    final assessments = await db.query('assessments');
    final codingProblems = await db.query('coding_problems');
    final projects = await db.query('projects');
    final milestones = await db.query('project_milestones');
    final sessions = await db.query('study_sessions');

    final backup = {
      'exported_at': DateTime.now().toIso8601String(),
      'version': '1.0.0',
      'app': 'CSE Compass',
      'subjects': subjects,
      'tasks': tasks,
      'subtasks': subtasks,
      'reminders': reminders,
      'syllabus_units': units,
      'syllabus_topics': topics,
      'assessments': assessments,
      'coding_problems': codingProblems,
      'projects': projects,
      'project_milestones': milestones,
      'study_sessions': sessions,
    };

    return jsonEncode(backup);
  }

  Future<void> importBackupJson(String jsonString) async {
    final Map<String, dynamic> data = jsonDecode(jsonString);
    final db = await database;

    await db.transaction((txn) async {
      if (data['subjects'] != null) {
        for (var s in data['subjects']) {
          await txn.insert('subjects', Map<String, dynamic>.from(s), conflictAlgorithm: ConflictAlgorithm.replace);
        }
      }
      if (data['tasks'] != null) {
        for (var t in data['tasks']) {
          await txn.insert('tasks', Map<String, dynamic>.from(t), conflictAlgorithm: ConflictAlgorithm.replace);
        }
      }
      if (data['subtasks'] != null) {
        for (var st in data['subtasks']) {
          await txn.insert('subtasks', Map<String, dynamic>.from(st), conflictAlgorithm: ConflictAlgorithm.replace);
        }
      }
      if (data['reminders'] != null) {
        for (var r in data['reminders']) {
          await txn.insert('reminders', Map<String, dynamic>.from(r), conflictAlgorithm: ConflictAlgorithm.replace);
        }
      }
      if (data['assessments'] != null) {
        for (var a in data['assessments']) {
          await txn.insert('assessments', Map<String, dynamic>.from(a), conflictAlgorithm: ConflictAlgorithm.replace);
        }
      }
      if (data['coding_problems'] != null) {
        for (var cp in data['coding_problems']) {
          await txn.insert('coding_problems', Map<String, dynamic>.from(cp), conflictAlgorithm: ConflictAlgorithm.replace);
        }
      }
      if (data['projects'] != null) {
        for (var p in data['projects']) {
          await txn.insert('projects', Map<String, dynamic>.from(p), conflictAlgorithm: ConflictAlgorithm.replace);
        }
      }
    });
  }
}
