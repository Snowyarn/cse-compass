import * as SQLite from 'expo-sqlite';
import {
  Task,
  Subtask,
  Reminder,
  Subject,
  SyllabusUnit,
  SyllabusTopic,
  Assessment,
  CodingProblem,
  Project,
  ProjectMilestone,
  StudySession,
  AppSettings,
  ReminderType,
} from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('cse_compass.db');
  }
  return dbInstance;
};

// Database Initialization & Schema Definition
export const initDatabase = async (): Promise<void> => {
  const db = getDb();

  // Create tables if not exist
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      semester INTEGER NOT NULL,
      credits INTEGER NOT NULL,
      instructor TEXT,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      syllabus_progress REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS syllabus_units (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      unit_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS syllabus_topics (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'not_started',
      revision_count INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (unit_id) REFERENCES syllabus_units (id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
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
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      reminder_type TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      notification_id TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessments (
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
    );

    CREATE TABLE IF NOT EXISTS coding_problems (
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
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      tech_stack TEXT NOT NULL,
      repo_url TEXT,
      target_deadline TEXT,
      status TEXT DEFAULT 'in_progress',
      progress_percentage REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS project_milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      completed INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      task_id TEXT,
      start_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      notes TEXT,
      session_type TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks (completed);
    CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders (scheduled_time);
    CREATE INDEX IF NOT EXISTS idx_assessments_due ON assessments (due_date);
  `);

  // Check if initial seeding is needed
  const subjectCountRow = db.getFirstSync<{ count: number }>('SELECT count(*) as count FROM subjects');
  if (!subjectCountRow || subjectCountRow.count === 0) {
    seedInitialData(db);
  }
};

// Seed Realistic B.Tech CSE Curriculum and Starter Content
const seedInitialData = (db: SQLite.SQLiteDatabase): void => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  // Future dates
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const in3Days = new Date(now);
  in3Days.setDate(now.getDate() + 3);
  const in3DaysStr = in3Days.toISOString().split('T')[0];

  const in5Days = new Date(now);
  in5Days.setDate(now.getDate() + 5);
  const in5DaysStr = in5Days.toISOString().split('T')[0];

  const in10Days = new Date(now);
  in10Days.setDate(now.getDate() + 10);
  const in10DaysStr = in10Days.toISOString().split('T')[0];

  const in14Days = new Date(now);
  in14Days.setDate(now.getDate() + 14);
  const in14DaysStr = in14Days.toISOString().split('T')[0];

  // Default Settings
  const defaultSettings: AppSettings = {
    user_name: 'Alex Chen',
    college_name: 'School of Computer Science & Engineering',
    semester: 3,
    theme: 'dark',
    default_reminder: 'preset_15m',
    week_start: 'monday',
    time_format: '12h',
    pomodoro_work_mins: 25,
    pomodoro_break_mins: 5,
    notifications_enabled: true,
    onboarding_completed: true,
  };

  for (const [key, val] of Object.entries(defaultSettings)) {
    db.runSync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, JSON.stringify(val)]
    );
  }

  // Pre-populate CSE Subjects
  const subjectsData = [
    {
      id: 'sub-dsa',
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      semester: 3,
      credits: 4,
      instructor: 'Dr. Anand Gupta',
      color: '#6366F1',
      icon: 'git-branch',
      syllabus_progress: 42,
    },
    {
      id: 'sub-os',
      name: 'Operating Systems',
      code: 'CS301',
      semester: 3,
      credits: 4,
      instructor: 'Dr. Sunita Iyer',
      color: '#F59E0B',
      icon: 'terminal',
      syllabus_progress: 35,
    },
    {
      id: 'sub-dbms',
      name: 'Database Management Systems',
      code: 'CS302',
      semester: 3,
      credits: 4,
      instructor: 'Prof. Neeraj Verma',
      color: '#06B6D4',
      icon: 'server',
      syllabus_progress: 28,
    },
    {
      id: 'sub-coa',
      name: 'Computer Organization & Architecture',
      code: 'CS202',
      semester: 3,
      credits: 3,
      instructor: 'Prof. K. Rao',
      color: '#3B82F6',
      icon: 'hardware-chip',
      syllabus_progress: 50,
    },
    {
      id: 'sub-maths',
      name: 'Discrete Mathematics',
      code: 'MA201',
      semester: 3,
      credits: 4,
      instructor: 'Prof. R. Sharma',
      color: '#8B5CF6',
      icon: 'calculator',
      syllabus_progress: 60,
    },
    {
      id: 'sub-prog-c',
      name: 'Programming in C/C++',
      code: 'CS101',
      semester: 1,
      credits: 4,
      instructor: 'Dr. P. Mehta',
      color: '#10B981',
      icon: 'code-slash',
      syllabus_progress: 85,
    },
  ];

  for (const sub of subjectsData) {
    db.runSync(
      `INSERT INTO subjects (id, name, code, semester, credits, instructor, color, icon, syllabus_progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sub.id, sub.name, sub.code, sub.semester, sub.credits, sub.instructor, sub.color, sub.icon, sub.syllabus_progress]
    );
  }

  // Pre-populate Syllabus Units & Topics for DSA
  const dsaUnits = [
    {
      id: 'unit-dsa-1',
      subject_id: 'sub-dsa',
      unit_number: 1,
      title: 'Linear Data Structures: Arrays, Stacks, & Queues',
      topics: [
        { id: 'top-1', title: 'Dynamic Array Allocation & Vector internals', status: 'completed', revision_count: 2 },
        { id: 'top-2', title: 'Singly, Doubly, & Circular Linked Lists', status: 'completed', revision_count: 1 },
        { id: 'top-3', title: 'Stack operations & Infix to Postfix conversion', status: 'completed', revision_count: 1 },
        { id: 'top-4', title: 'Queue & Double-ended Queue (Deque) design', status: 'in_progress', revision_count: 0 },
      ],
    },
    {
      id: 'unit-dsa-2',
      subject_id: 'sub-dsa',
      unit_number: 2,
      title: 'Trees & Hierarchical Structures',
      topics: [
        { id: 'top-5', title: 'Binary Trees & Traversals (Inorder, Preorder, Postorder)', status: 'in_progress', revision_count: 1 },
        { id: 'top-6', title: 'Binary Search Trees (BST) Insertion & Deletion', status: 'in_progress', revision_count: 0 },
        { id: 'top-7', title: 'Balanced Trees: AVL Tree Rotations', status: 'not_started', revision_count: 0 },
        { id: 'top-8', title: 'Binary Heaps & Priority Queues', status: 'not_started', revision_count: 0 },
      ],
    },
    {
      id: 'unit-dsa-3',
      subject_id: 'sub-dsa',
      unit_number: 3,
      title: 'Graphs & Graph Algorithms',
      topics: [
        { id: 'top-9', title: 'Graph Representations (Adjacency Matrix & List)', status: 'completed', revision_count: 1 },
        { id: 'top-10', title: 'Breadth First Search (BFS) & Depth First Search (DFS)', status: 'completed', revision_count: 2 },
        { id: 'top-11', title: 'Dijkstra\'s Shortest Path Algorithm', status: 'in_progress', revision_count: 0 },
        { id: 'top-12', title: 'Minimum Spanning Tree (Kruskal & Prim)', status: 'not_started', revision_count: 0 },
      ],
    },
    {
      id: 'unit-dsa-4',
      subject_id: 'sub-dsa',
      unit_number: 4,
      title: 'Dynamic Programming & Advanced Topics',
      topics: [
        { id: 'top-13', title: 'Memoization vs Tabulation Fundamentals', status: 'in_progress', revision_count: 0 },
        { id: 'top-14', title: '0/1 Knapsack & Subset Sum', status: 'not_started', revision_count: 0 },
        { id: 'top-15', title: 'Longest Common Subsequence (LCS)', status: 'not_started', revision_count: 0 },
      ],
    },
  ];

  for (const unit of dsaUnits) {
    db.runSync(
      'INSERT INTO syllabus_units (id, subject_id, unit_number, title) VALUES (?, ?, ?, ?)',
      [unit.id, unit.subject_id, unit.unit_number, unit.title]
    );
    for (const top of unit.topics) {
      db.runSync(
        `INSERT INTO syllabus_topics (id, unit_id, subject_id, title, status, revision_count, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [top.id, unit.id, unit.subject_id, top.title, top.status, top.revision_count, 'Important exam topic']
      );
    }
  }

  // OS Units
  const osUnits = [
    {
      id: 'unit-os-1',
      subject_id: 'sub-os',
      unit_number: 1,
      title: 'Processes, Threads & CPU Scheduling',
      topics: [
        { id: 'top-os-1', title: 'Process States & Process Control Block (PCB)', status: 'completed', revision_count: 2 },
        { id: 'top-os-2', title: 'CPU Scheduling Algorithms (FCFS, SJF, RR, Priority)', status: 'completed', revision_count: 1 },
        { id: 'top-os-3', title: 'Multithreading Models & Context Switch Overhead', status: 'in_progress', revision_count: 0 },
      ],
    },
    {
      id: 'unit-os-2',
      subject_id: 'sub-os',
      unit_number: 2,
      title: 'Synchronization & Deadlocks',
      topics: [
        { id: 'top-os-4', title: 'Critical Section Problem & Peterson\'s Algorithm', status: 'in_progress', revision_count: 0 },
        { id: 'top-os-5', title: 'Semaphores, Mutex & Classical IPC Problems', status: 'not_started', revision_count: 0 },
        { id: 'top-os-6', title: 'Banker\'s Algorithm for Deadlock Avoidance', status: 'not_started', revision_count: 0 },
      ],
    },
  ];

  for (const unit of osUnits) {
    db.runSync(
      'INSERT INTO syllabus_units (id, subject_id, unit_number, title) VALUES (?, ?, ?, ?)',
      [unit.id, unit.subject_id, unit.unit_number, unit.title]
    );
    for (const top of unit.topics) {
      db.runSync(
        `INSERT INTO syllabus_topics (id, unit_id, subject_id, title, status, revision_count, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [top.id, unit.id, unit.subject_id, top.title, top.status, top.revision_count, 'Core concept']
      );
    }
  }

  // Pre-populate Tasks
  const tasksData = [
    {
      id: 'task-1',
      title: 'Implement Dijkstra\'s Algorithm in C++',
      description: 'Write complete graph implementation with adjacency list and min-heap priority queue for optimal O(E log V) runtime.',
      subject_id: 'sub-dsa',
      category: 'Data Structures and Algorithms',
      task_type: 'assignment',
      due_date: tomorrowStr,
      due_time: '23:59',
      priority: 'urgent',
      estimated_minutes: 90,
      completed: 0,
      is_recurring: 0,
      tags: JSON.stringify(['Graph', 'Algorithms', 'C++', 'Urgent']),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      subtasks: [
        { id: 'st-1', title: 'Build Adjacency List graph structure', completed: 1, sort_order: 1 },
        { id: 'st-2', title: 'Implement Priority Queue min-heap comparator', completed: 1, sort_order: 2 },
        { id: 'st-3', title: 'Track predecessor pointers for path reconstruction', completed: 0, sort_order: 3 },
        { id: 'st-4', title: 'Test edge cases with disconnected nodes & cycles', completed: 0, sort_order: 4 },
      ],
      reminder: {
        id: 'rem-1',
        reminder_type: 'preset_1h',
        scheduled_time: new Date(tomorrow.getTime() - 3600000).toISOString(),
      },
    },
    {
      id: 'task-2',
      title: 'Operating Systems Process Scheduling Lab Report',
      description: 'Tabulate turnaround time and waiting time for Round Robin (quantum=4) vs Shortest Job First.',
      subject_id: 'sub-os',
      category: 'Labs and practicals',
      task_type: 'lab',
      due_date: in3DaysStr,
      due_time: '17:00',
      priority: 'high',
      estimated_minutes: 60,
      completed: 0,
      is_recurring: 0,
      tags: JSON.stringify(['Lab', 'OS', 'Simulation']),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      subtasks: [
        { id: 'st-5', title: 'Compile C simulation output tables', completed: 1, sort_order: 1 },
        { id: 'st-6', title: 'Plot Gantt charts for test cases', completed: 0, sort_order: 2 },
        { id: 'st-7', title: 'Write inference on starvation vs fairness', completed: 0, sort_order: 3 },
      ],
      reminder: {
        id: 'rem-2',
        reminder_type: 'preset_30m',
        scheduled_time: new Date(in3Days.getTime() - 1800000).toISOString(),
      },
    },
    {
      id: 'task-3',
      title: 'Daily Coding Practice: Two Pointers & Sliding Window',
      description: 'Solve 2 medium problems on LeetCode: Longest Substring Without Repeating Characters and 3Sum.',
      subject_id: undefined,
      category: 'Coding practice',
      task_type: 'coding',
      due_date: todayStr,
      due_time: '21:00',
      priority: 'high',
      estimated_minutes: 45,
      completed: 0,
      is_recurring: 1,
      recurrence_rule: 'daily',
      tags: JSON.stringify(['LeetCode', 'DSA', 'PlacementPrep']),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      subtasks: [
        { id: 'st-8', title: 'Solve LC 3: Longest Substring Without Repeating Characters', completed: 1, sort_order: 1 },
        { id: 'st-9', title: 'Solve LC 15: 3Sum with duplicate pruning', completed: 0, sort_order: 2 },
      ],
      reminder: {
        id: 'rem-3',
        reminder_type: 'preset_15m',
        scheduled_time: new Date(now.getTime() + 1800000).toISOString(),
      },
    },
    {
      id: 'task-4',
      title: 'Database Schema Design: Campus Course Registration',
      description: 'Design 3NF relational schema with foreign key constraints, index declarations and sample queries.',
      subject_id: 'sub-dbms',
      category: 'Assignments',
      task_type: 'assignment',
      due_date: in5DaysStr,
      due_time: '23:59',
      priority: 'medium',
      estimated_minutes: 75,
      completed: 0,
      is_recurring: 0,
      tags: JSON.stringify(['DBMS', 'SQL', '3NF']),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      subtasks: [
        { id: 'st-10', title: 'Draw ER Diagram with cardinality constraints', completed: 0, sort_order: 1 },
        { id: 'st-11', title: 'Derive relational tables and check BCNF', completed: 0, sort_order: 2 },
        { id: 'st-12', title: 'Write DDL CREATE TABLE scripts', completed: 0, sort_order: 3 },
      ],
    },
    {
      id: 'task-5',
      title: 'Discrete Maths: Proofs on Equivalence Relations',
      description: 'Complete Exercise 4.2 problem set on reflexive, symmetric, and transitive closures.',
      subject_id: 'sub-maths',
      category: 'Discrete Mathematics',
      task_type: 'assignment',
      due_date: in10DaysStr,
      due_time: '18:00',
      priority: 'medium',
      estimated_minutes: 60,
      completed: 0,
      is_recurring: 0,
      tags: JSON.stringify(['Maths', 'Proofs']),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      subtasks: [],
    },
    {
      id: 'task-6',
      title: 'Review C Pointers & Dynamic Memory Allocation',
      description: 'Cover malloc, calloc, realloc, and memory leak debugging with Valgrind.',
      subject_id: 'sub-prog-c',
      category: 'Programming in C/C++',
      task_type: 'revision',
      due_date: todayStr,
      due_time: '19:00',
      priority: 'low',
      estimated_minutes: 30,
      completed: 1,
      completed_at: now.toISOString(),
      is_recurring: 0,
      tags: JSON.stringify(['C', 'Memory', 'Basics']),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      subtasks: [],
    },
  ];

  for (const t of tasksData) {
    db.runSync(
      `INSERT INTO tasks (id, title, description, subject_id, category, task_type, due_date, due_time, priority, estimated_minutes, completed, completed_at, is_recurring, recurrence_rule, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.title,
        t.description,
        t.subject_id || null,
        t.category,
        t.task_type,
        t.due_date,
        t.due_time,
        t.priority,
        t.estimated_minutes,
        t.completed,
        t.completed_at || null,
        t.is_recurring,
        t.recurrence_rule || null,
        t.tags,
        t.created_at,
        t.updated_at,
      ]
    );

    if (t.subtasks && t.subtasks.length > 0) {
      for (const st of t.subtasks) {
        db.runSync(
          'INSERT INTO subtasks (id, task_id, title, completed, sort_order) VALUES (?, ?, ?, ?, ?)',
          [st.id, t.id, st.title, st.completed, st.sort_order]
        );
      }
    }

    if (t.reminder) {
      db.runSync(
        `INSERT INTO reminders (id, task_id, reminder_type, scheduled_time, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [t.reminder.id, t.id, t.reminder.reminder_type, t.reminder.scheduled_time]
      );
    }
  }

  // Pre-populate Assessments
  const assessmentsData = [
    {
      id: 'ass-1',
      subject_id: 'sub-dsa',
      title: 'DSA Mid-Semester Examination',
      assessment_type: 'mid_sem',
      due_date: in10DaysStr,
      due_time: '10:00',
      total_marks: 50,
      weightage: 25,
      notes: 'Units 1 and 2: Linear structures, BST, and Heap operations.',
      completed: 0,
    },
    {
      id: 'ass-2',
      subject_id: 'sub-os',
      title: 'OS Lab Practical & Viva',
      assessment_type: 'lab_exam',
      due_date: in14DaysStr,
      due_time: '14:00',
      total_marks: 30,
      weightage: 15,
      notes: 'Shell programming in bash and POSIX pthread synchronization.',
      completed: 0,
    },
    {
      id: 'ass-3',
      subject_id: 'sub-dbms',
      title: 'DBMS Internal Assessment 1',
      assessment_type: 'internal',
      due_date: in5DaysStr,
      due_time: '11:30',
      total_marks: 20,
      weightage: 10,
      notes: 'Relational algebra and SQL aggregate subqueries.',
      completed: 0,
    },
  ];

  for (const a of assessmentsData) {
    db.runSync(
      `INSERT INTO assessments (id, subject_id, title, assessment_type, due_date, due_time, total_marks, weightage, notes, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.subject_id, a.title, a.assessment_type, a.due_date, a.due_time, a.total_marks, a.weightage, a.notes, a.completed]
    );
  }

  // Pre-populate Coding Problems
  const codingData = [
    {
      id: 'code-1',
      title: 'Trapping Rain Water (LC #42)',
      platform: 'LeetCode',
      language: 'C++',
      difficulty: 'Hard',
      topic: 'Arrays',
      attempt_date: todayStr,
      status: 'solved',
      notes: 'Solved using Two Pointers technique in O(N) time and O(1) space. Maintain left_max and right_max.',
      problem_url: 'https://leetcode.com/problems/trapping-rain-water/',
    },
    {
      id: 'code-2',
      title: 'LRU Cache Design (LC #146)',
      platform: 'LeetCode',
      language: 'C++',
      difficulty: 'Medium',
      topic: 'Linked Lists',
      attempt_date: todayStr,
      status: 'solved',
      notes: 'Combined std::unordered_map with a custom Doubly Linked List for strict O(1) get and put.',
      problem_url: 'https://leetcode.com/problems/lru-cache/',
    },
    {
      id: 'code-3',
      title: 'Course Schedule - Cycle Detection (LC #207)',
      platform: 'LeetCode',
      language: 'Python',
      difficulty: 'Medium',
      topic: 'Graphs',
      attempt_date: tomorrowStr,
      status: 'solved',
      notes: 'Kahn\'s algorithm using in-degree array. If processed count != total vertices, cycle detected.',
      problem_url: 'https://leetcode.com/problems/course-schedule/',
    },
    {
      id: 'code-4',
      title: 'Coin Change Minimum Coins (LC #322)',
      platform: 'LeetCode',
      language: 'C++',
      difficulty: 'Medium',
      topic: 'DP',
      attempt_date: todayStr,
      status: 'attempted',
      notes: 'Unbounded knapsack DP. Need to review bottom-up space optimization.',
      problem_url: 'https://leetcode.com/problems/coin-change/',
    },
    {
      id: 'code-5',
      title: 'Binary Tree Level Order Traversal (LC #102)',
      platform: 'LeetCode',
      language: 'Java',
      difficulty: 'Medium',
      topic: 'Trees',
      attempt_date: todayStr,
      status: 'solved',
      notes: 'Standard BFS with queue size snapshot per level.',
      problem_url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
    },
  ];

  for (const c of codingData) {
    db.runSync(
      `INSERT INTO coding_problems (id, title, platform, language, difficulty, topic, attempt_date, status, notes, problem_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.title, c.platform, c.language, c.difficulty, c.topic, c.attempt_date, c.status, c.notes, c.problem_url]
    );
  }

  // Pre-populate Projects & Milestones
  const proj1Id = 'proj-1';
  db.runSync(
    `INSERT INTO projects (id, name, description, tech_stack, repo_url, target_deadline, status, progress_percentage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      proj1Id,
      'Custom UNIX-like Micro Shell (rush-sh)',
      'A POSIX-compliant minimalist command shell featuring command execution, I/O redirection, piping, and job backgrounding.',
      'C, POSIX Syscalls (fork, execvp, waitpid), Make, GDB',
      'https://github.com/cse-student/rush-sh',
      in14DaysStr,
      'in_progress',
      65,
    ]
  );

  const proj1Milestones = [
    { id: 'ms-1', title: 'Command line tokenization & whitespace parsing', completed: 1 },
    { id: 'ms-2', title: 'Built-in commands (cd, exit, help, history)', completed: 1 },
    { id: 'ms-3', title: 'I/O Redirection (> < >>) and pipe chaining (|)', completed: 0 },
    { id: 'ms-4', title: 'Signal handling for Ctrl+C and Ctrl+Z gracefully', completed: 0 },
  ];

  for (const ms of proj1Milestones) {
    db.runSync(
      'INSERT INTO project_milestones (id, project_id, title, due_date, completed) VALUES (?, ?, ?, ?, ?)',
      [ms.id, proj1Id, ms.title, in14DaysStr, ms.completed]
    );
  }

  const proj2Id = 'proj-2';
  db.runSync(
    `INSERT INTO projects (id, name, description, tech_stack, repo_url, target_deadline, status, progress_percentage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      proj2Id,
      'Distributed Key-Value Store with Raft Consensus',
      'Fault-tolerant leader election and log replication written for distributed systems practice.',
      'Go, gRPC, Protobuf',
      'https://github.com/cse-student/raft-kv',
      in10DaysStr,
      'in_progress',
      30,
    ]
  );

  // Pre-populate Study Sessions
  const sessions = [
    {
      id: 'sess-1',
      subject_id: 'sub-dsa',
      start_time: new Date(now.getTime() - 86400000 * 2).toISOString(),
      duration_minutes: 50,
      notes: 'Solved Graph BFS and DFS problems',
      session_type: 'deep_work',
    },
    {
      id: 'sess-2',
      subject_id: 'sub-os',
      start_time: new Date(now.getTime() - 86400000).toISOString(),
      duration_minutes: 45,
      notes: 'Reviewed Round Robin CPU Scheduling algorithms',
      session_type: 'pomodoro',
    },
    {
      id: 'sess-3',
      subject_id: 'sub-dsa',
      start_time: now.toISOString(),
      duration_minutes: 30,
      notes: 'Dijkstra shortest path review',
      session_type: 'practice',
    },
  ];

  for (const s of sessions) {
    db.runSync(
      `INSERT INTO study_sessions (id, subject_id, task_id, start_time, duration_minutes, notes, session_type)
       VALUES (?, ?, NULL, ?, ?, ?, ?)`,
      [s.id, s.subject_id, s.start_time, s.duration_minutes, s.notes, s.session_type]
    );
  }
};
