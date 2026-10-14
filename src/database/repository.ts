import { getDb } from './db';
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
  TaskPriority,
  TaskType,
} from '../types';

export interface TaskFilterOptions {
  status?: 'all' | 'pending' | 'completed' | 'overdue' | 'today' | 'next7days';
  subjectId?: string;
  category?: string;
  priority?: TaskPriority;
  searchQuery?: string;
  taskType?: TaskType;
}

export type TaskSortOption = 'deadline' | 'priority' | 'created' | 'duration' | 'title';

export const Repository = {
  // ================= TASKS =================
  getAllTasks: (filter?: TaskFilterOptions, sort: TaskSortOption = 'deadline'): Task[] => {
    const db = getDb();
    let query = `
      SELECT t.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    if (filter) {
      if (filter.status === 'pending') {
        query += ' AND t.completed = 0';
      } else if (filter.status === 'completed') {
        query += ' AND t.completed = 1';
      } else if (filter.status === 'today') {
        query += ' AND t.due_date = ? AND t.completed = 0';
        params.push(todayStr);
      } else if (filter.status === 'overdue') {
        query += ' AND t.due_date < ? AND t.completed = 0';
        params.push(todayStr);
      } else if (filter.status === 'next7days') {
        const next7 = new Date();
        next7.setDate(next7.getDate() + 7);
        const next7Str = next7.toISOString().split('T')[0];
        query += ' AND t.due_date >= ? AND t.due_date <= ? AND t.completed = 0';
        params.push(todayStr, next7Str);
      }

      if (filter.subjectId) {
        query += ' AND t.subject_id = ?';
        params.push(filter.subjectId);
      }
      if (filter.category) {
        query += ' AND t.category = ?';
        params.push(filter.category);
      }
      if (filter.priority) {
        query += ' AND t.priority = ?';
        params.push(filter.priority);
      }
      if (filter.taskType) {
        query += ' AND t.task_type = ?';
        params.push(filter.taskType);
      }
      if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
        query += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.tags LIKE ?)';
        const searchPattern = `%${filter.searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
    }

    // Sort order
    if (sort === 'deadline') {
      query += ` ORDER BY t.completed ASC, 
        CASE WHEN t.due_date IS NULL OR t.due_date = '' THEN 1 ELSE 0 END, 
        t.due_date ASC, 
        CASE WHEN t.due_time IS NULL OR t.due_time = '' THEN '23:59' ELSE t.due_time END ASC`;
    } else if (sort === 'priority') {
      query += ` ORDER BY t.completed ASC, 
        CASE t.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END ASC, t.due_date ASC`;
    } else if (sort === 'created') {
      query += ' ORDER BY t.completed ASC, t.created_at DESC';
    } else if (sort === 'duration') {
      query += ' ORDER BY t.completed ASC, t.estimated_minutes ASC';
    } else if (sort === 'title') {
      query += ' ORDER BY t.completed ASC, t.title ASC';
    }

    const rows = db.getAllSync<any>(query, params);

    return rows.map((r) => {
      // Subtasks
      const subtasks = db.getAllSync<Subtask>(
        'SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC',
        [r.id]
      ).map(s => ({ ...s, completed: Boolean(s.completed) }));

      // Reminders
      const reminders = db.getAllSync<Reminder>(
        'SELECT * FROM reminders WHERE task_id = ? ORDER BY scheduled_time ASC',
        [r.id]
      );

      let tags: string[] = [];
      try {
        if (r.tags) tags = JSON.parse(r.tags);
      } catch {
        tags = [];
      }

      return {
        ...r,
        completed: Boolean(r.completed),
        is_recurring: Boolean(r.is_recurring),
        tags,
        subtasks,
        reminders,
      };
    });
  },

  getTaskById: (id: string): Task | null => {
    const db = getDb();
    const row = db.getFirstSync<any>(
      `SELECT t.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
       FROM tasks t
       LEFT JOIN subjects s ON t.subject_id = s.id
       WHERE t.id = ?`,
      [id]
    );

    if (!row) return null;

    const subtasks = db.getAllSync<Subtask>(
      'SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC',
      [id]
    ).map(s => ({ ...s, completed: Boolean(s.completed) }));

    const reminders = db.getAllSync<Reminder>(
      'SELECT * FROM reminders WHERE task_id = ? ORDER BY scheduled_time ASC',
      [id]
    );

    let tags: string[] = [];
    try {
      if (row.tags) tags = JSON.parse(row.tags);
    } catch {
      tags = [];
    }

    return {
      ...row,
      completed: Boolean(row.completed),
      is_recurring: Boolean(row.is_recurring),
      tags,
      subtasks,
      reminders,
    };
  },

  createTask: (
    task: Omit<Task, 'created_at' | 'updated_at'>,
    subtasks: { title: string }[] = [],
    reminders: { reminder_type: ReminderType; scheduled_time: string; notification_id?: string }[] = []
  ): Task => {
    const db = getDb();
    const now = new Date().toISOString();
    const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    db.runSync(
      `INSERT INTO tasks (id, title, description, subject_id, category, task_type, due_date, due_time, priority, estimated_minutes, completed, completed_at, is_recurring, recurrence_rule, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        task.title,
        task.description || null,
        task.subject_id || null,
        task.category,
        task.task_type,
        task.due_date || null,
        task.due_time || null,
        task.priority,
        task.estimated_minutes || 30,
        task.completed ? 1 : 0,
        task.completed_at || null,
        task.is_recurring ? 1 : 0,
        task.recurrence_rule || null,
        task.tags ? JSON.stringify(task.tags) : null,
        now,
        now,
      ]
    );

    // Insert subtasks
    subtasks.forEach((st, idx) => {
      const stId = `st-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
      db.runSync(
        'INSERT INTO subtasks (id, task_id, title, completed, sort_order) VALUES (?, ?, ?, 0, ?)',
        [stId, taskId, st.title, idx + 1]
      );
    });

    // Insert reminders
    reminders.forEach((rem, idx) => {
      const remId = `rem-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
      db.runSync(
        'INSERT INTO reminders (id, task_id, reminder_type, scheduled_time, notification_id, status) VALUES (?, ?, ?, ?, ?, ?)',
        [remId, taskId, rem.reminder_type, rem.scheduled_time, rem.notification_id || null, 'pending']
      );
    });

    return Repository.getTaskById(taskId)!;
  },

  updateTask: (
    task: Partial<Task> & { id: string },
    subtasks?: { id?: string; title: string; completed?: boolean }[],
    reminders?: { id?: string; reminder_type: ReminderType; scheduled_time: string; notification_id?: string }[]
  ): Task => {
    const db = getDb();
    const now = new Date().toISOString();

    const existing = Repository.getTaskById(task.id);
    if (!existing) throw new Error(`Task with id ${task.id} not found`);

    const updatedTitle = task.title !== undefined ? task.title : existing.title;
    const updatedDesc = task.description !== undefined ? task.description : existing.description;
    const updatedSubject = task.subject_id !== undefined ? task.subject_id : existing.subject_id;
    const updatedCat = task.category !== undefined ? task.category : existing.category;
    const updatedType = task.task_type !== undefined ? task.task_type : existing.task_type;
    const updatedDueDate = task.due_date !== undefined ? task.due_date : existing.due_date;
    const updatedDueTime = task.due_time !== undefined ? task.due_time : existing.due_time;
    const updatedPriority = task.priority !== undefined ? task.priority : existing.priority;
    const updatedEst = task.estimated_minutes !== undefined ? task.estimated_minutes : existing.estimated_minutes;
    const updatedCompleted = task.completed !== undefined ? (task.completed ? 1 : 0) : (existing.completed ? 1 : 0);
    const updatedCompletedAt = task.completed !== undefined
      ? (task.completed ? (existing.completed_at || now) : null)
      : existing.completed_at;
    const updatedRecurring = task.is_recurring !== undefined ? (task.is_recurring ? 1 : 0) : (existing.is_recurring ? 1 : 0);
    const updatedRule = task.recurrence_rule !== undefined ? task.recurrence_rule : existing.recurrence_rule;
    const updatedTags = task.tags !== undefined ? JSON.stringify(task.tags) : JSON.stringify(existing.tags);

    db.runSync(
      `UPDATE tasks SET 
        title = ?, description = ?, subject_id = ?, category = ?, task_type = ?, 
        due_date = ?, due_time = ?, priority = ?, estimated_minutes = ?, completed = ?, 
        completed_at = ?, is_recurring = ?, recurrence_rule = ?, tags = ?, updated_at = ?
       WHERE id = ?`,
      [
        updatedTitle,
        updatedDesc ?? null,
        updatedSubject ?? null,
        updatedCat,
        updatedType,
        updatedDueDate ?? null,
        updatedDueTime ?? null,
        updatedPriority,
        updatedEst ?? 30,
        updatedCompleted,
        updatedCompletedAt ?? null,
        updatedRecurring,
        updatedRule ?? null,
        updatedTags,
        now,
        task.id,
      ]
    );

    // Update subtasks if provided
    if (subtasks !== undefined) {
      db.runSync('DELETE FROM subtasks WHERE task_id = ?', [task.id]);
      subtasks.forEach((st, idx) => {
        const stId = st.id || `st-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
        db.runSync(
          'INSERT INTO subtasks (id, task_id, title, completed, sort_order) VALUES (?, ?, ?, ?, ?)',
          [stId, task.id, st.title, st.completed ? 1 : 0, idx + 1]
        );
      });
    }

    // Update reminders if provided
    if (reminders !== undefined) {
      db.runSync('DELETE FROM reminders WHERE task_id = ?', [task.id]);
      reminders.forEach((rem, idx) => {
        const remId = rem.id || `rem-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
        db.runSync(
          'INSERT INTO reminders (id, task_id, reminder_type, scheduled_time, notification_id, status) VALUES (?, ?, ?, ?, ?, ?)',
          [remId, task.id, rem.reminder_type, rem.scheduled_time, rem.notification_id || null, 'pending']
        );
      });
    }

    return Repository.getTaskById(task.id)!;
  },

  toggleTaskComplete: (id: string): { task: Task; notificationIdsToCancel: string[] } => {
    const db = getDb();
    const task = Repository.getTaskById(id);
    if (!task) throw new Error('Task not found');

    const nextCompleted = !task.completed;
    const now = new Date().toISOString();

    db.runSync(
      'UPDATE tasks SET completed = ?, completed_at = ?, updated_at = ? WHERE id = ?',
      [nextCompleted ? 1 : 0, nextCompleted ? now : null, now, id]
    );

    const notificationIdsToCancel: string[] = [];
    if (nextCompleted && task.reminders) {
      task.reminders.forEach((rem) => {
        if (rem.notification_id) notificationIdsToCancel.push(rem.notification_id);
      });
      db.runSync("UPDATE reminders SET status = 'cancelled' WHERE task_id = ?", [id]);
    }

    return {
      task: Repository.getTaskById(id)!,
      notificationIdsToCancel,
    };
  },

  deleteTask: (id: string): { notificationIdsToCancel: string[] } => {
    const db = getDb();
    const reminders = db.getAllSync<{ notification_id: string }>(
      'SELECT notification_id FROM reminders WHERE task_id = ?',
      [id]
    );
    const notificationIdsToCancel = reminders
      .map((r) => r.notification_id)
      .filter(Boolean);

    db.runSync('DELETE FROM subtasks WHERE task_id = ?', [id]);
    db.runSync('DELETE FROM reminders WHERE task_id = ?', [id]);
    db.runSync('DELETE FROM tasks WHERE id = ?', [id]);

    return { notificationIdsToCancel };
  },

  toggleSubtask: (subtaskId: string): Subtask | null => {
    const db = getDb();
    const subtask = db.getFirstSync<Subtask>('SELECT * FROM subtasks WHERE id = ?', [subtaskId]);
    if (!subtask) return null;

    const nextCompleted = subtask.completed ? 0 : 1;
    db.runSync('UPDATE subtasks SET completed = ? WHERE id = ?', [nextCompleted, subtaskId]);
    return { ...subtask, completed: Boolean(nextCompleted) };
  },

  addSubtask: (taskId: string, title: string): Subtask => {
    const db = getDb();
    const id = `st-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    db.runSync(
      'INSERT INTO subtasks (id, task_id, title, completed, sort_order) VALUES (?, ?, ?, 0, 1)',
      [id, taskId, title]
    );
    return { id, task_id: taskId, title, completed: false, sort_order: 1 };
  },

  // ================= REMINDERS =================
  getUpcomingReminders: (): Reminder[] => {
    const db = getDb();
    const rows = db.getAllSync<any>(`
      SELECT r.*, t.title as task_title, t.due_date as task_due_date
      FROM reminders r
      JOIN tasks t ON r.task_id = t.id
      WHERE t.completed = 0 AND r.status != 'cancelled'
      ORDER BY r.scheduled_time ASC
    `);
    return rows;
  },

  updateReminderNotificationId: (reminderId: string, notificationId: string): void => {
    const db = getDb();
    db.runSync('UPDATE reminders SET notification_id = ? WHERE id = ?', [notificationId, reminderId]);
  },

  cancelReminder: (reminderId: string): string | null => {
    const db = getDb();
    const rem = db.getFirstSync<{ notification_id: string }>('SELECT notification_id FROM reminders WHERE id = ?', [reminderId]);
    db.runSync("UPDATE reminders SET status = 'cancelled' WHERE id = ?", [reminderId]);
    return rem?.notification_id || null;
  },

  // ================= SUBJECTS =================
  getAllSubjects: (): Subject[] => {
    const db = getDb();
    const rows = db.getAllSync<any>(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM syllabus_topics st WHERE st.subject_id = s.id) as total_topics,
        (SELECT COUNT(*) FROM syllabus_topics st WHERE st.subject_id = s.id AND st.status = 'completed') as completed_topics,
        (SELECT COUNT(*) FROM tasks t WHERE t.subject_id = s.id AND t.completed = 0) as active_tasks_count
      FROM subjects s
      ORDER BY s.semester ASC, s.name ASC
    `);

    return rows.map((s) => {
      const total = s.total_topics || 0;
      const completed = s.completed_topics || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : s.syllabus_progress;
      return {
        ...s,
        syllabus_progress: progress,
      };
    });
  },

  getSubjectById: (id: string): Subject | null => {
    const db = getDb();
    const s = db.getFirstSync<any>(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM syllabus_topics st WHERE st.subject_id = s.id) as total_topics,
        (SELECT COUNT(*) FROM syllabus_topics st WHERE st.subject_id = s.id AND st.status = 'completed') as completed_topics,
        (SELECT COUNT(*) FROM tasks t WHERE t.subject_id = s.id AND t.completed = 0) as active_tasks_count
      FROM subjects s
      WHERE s.id = ?
    `, [id]);
    if (!s) return null;

    const total = s.total_topics || 0;
    const completed = s.completed_topics || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : s.syllabus_progress;

    return {
      ...s,
      syllabus_progress: progress,
    };
  },

  createSubject: (sub: Omit<Subject, 'syllabus_progress' | 'total_topics' | 'completed_topics' | 'active_tasks_count'>): Subject => {
    const db = getDb();
    const id = sub.id || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.runSync(
      `INSERT INTO subjects (id, name, code, semester, credits, instructor, color, icon, syllabus_progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, sub.name, sub.code, sub.semester, sub.credits, sub.instructor || null, sub.color, sub.icon]
    );
    return Repository.getSubjectById(id)!;
  },

  updateSubject: (sub: Partial<Subject> & { id: string }): Subject => {
    const db = getDb();
    const cur = Repository.getSubjectById(sub.id);
    if (!cur) throw new Error('Subject not found');

    db.runSync(
      `UPDATE subjects SET 
        name = ?, code = ?, semester = ?, credits = ?, instructor = ?, color = ?, icon = ?
       WHERE id = ?`,
      [
        sub.name !== undefined ? sub.name : cur.name,
        sub.code !== undefined ? sub.code : cur.code,
        sub.semester !== undefined ? sub.semester : cur.semester,
        sub.credits !== undefined ? sub.credits : cur.credits,
        (sub.instructor !== undefined ? sub.instructor : cur.instructor) ?? null,
        sub.color !== undefined ? sub.color : cur.color,
        sub.icon !== undefined ? sub.icon : cur.icon,
        sub.id,
      ]
    );

    return Repository.getSubjectById(sub.id)!;
  },

  deleteSubject: (id: string): void => {
    const db = getDb();
    db.runSync('DELETE FROM syllabus_topics WHERE subject_id = ?', [id]);
    db.runSync('DELETE FROM syllabus_units WHERE subject_id = ?', [id]);
    db.runSync('DELETE FROM assessments WHERE subject_id = ?', [id]);
    db.runSync('UPDATE tasks SET subject_id = NULL WHERE subject_id = ?', [id]);
    db.runSync('DELETE FROM subjects WHERE id = ?', [id]);
  },

  // ================= SYLLABUS =================
  getSyllabusForSubject: (subjectId: string): SyllabusUnit[] => {
    const db = getDb();
    const units = db.getAllSync<SyllabusUnit>(
      'SELECT * FROM syllabus_units WHERE subject_id = ? ORDER BY unit_number ASC',
      [subjectId]
    );

    return units.map((u) => {
      const topics = db.getAllSync<SyllabusTopic>(
        'SELECT * FROM syllabus_topics WHERE unit_id = ? ORDER BY id ASC',
        [u.id]
      );
      return { ...u, topics };
    });
  },

  updateTopicStatus: (
    topicId: string,
    status: 'not_started' | 'in_progress' | 'completed',
    revisionCount?: number,
    notes?: string
  ): void => {
    const db = getDb();
    if (revisionCount !== undefined && notes !== undefined) {
      db.runSync(
        'UPDATE syllabus_topics SET status = ?, revision_count = ?, notes = ? WHERE id = ?',
        [status, revisionCount, notes, topicId]
      );
    } else {
      db.runSync('UPDATE syllabus_topics SET status = ? WHERE id = ?', [status, topicId]);
    }
  },

  addTopic: (unitId: string, subjectId: string, title: string): SyllabusTopic => {
    const db = getDb();
    const id = `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.runSync(
      `INSERT INTO syllabus_topics (id, unit_id, subject_id, title, status, revision_count, notes)
       VALUES (?, ?, ?, ?, 'not_started', 0, '')`,
      [id, unitId, subjectId, title]
    );
    return {
      id,
      unit_id: unitId,
      subject_id: subjectId,
      title,
      status: 'not_started',
      revision_count: 0,
      notes: '',
    };
  },

  addUnit: (subjectId: string, title: string, unitNumber?: number): SyllabusUnit => {
    const db = getDb();
    const countRow = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM syllabus_units WHERE subject_id = ?',
      [subjectId]
    );
    const num = unitNumber || (countRow ? countRow.count + 1 : 1);
    const id = `unit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    db.runSync(
      'INSERT INTO syllabus_units (id, subject_id, unit_number, title) VALUES (?, ?, ?, ?)',
      [id, subjectId, num, title]
    );

    return {
      id,
      subject_id: subjectId,
      unit_number: num,
      title,
      topics: [],
    };
  },

  // ================= ASSESSMENTS =================
  getAllAssessments: (): Assessment[] => {
    const db = getDb();
    const rows = db.getAllSync<any>(`
      SELECT a.*, s.name as subject_name, s.color as subject_color
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      ORDER BY a.completed ASC, a.due_date ASC, a.due_time ASC
    `);
    return rows.map((r) => ({ ...r, completed: Boolean(r.completed) }));
  },

  createAssessment: (ass: Omit<Assessment, 'id'>): Assessment => {
    const db = getDb();
    const id = `ass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.runSync(
      `INSERT INTO assessments (id, subject_id, title, assessment_type, due_date, due_time, total_marks, weightage, notes, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ass.subject_id,
        ass.title,
        ass.assessment_type,
        ass.due_date,
        ass.due_time || null,
        ass.total_marks || null,
        ass.weightage || null,
        ass.notes || null,
        ass.completed ? 1 : 0,
      ]
    );
    return { ...ass, id, completed: Boolean(ass.completed) };
  },

  toggleAssessment: (id: string): boolean => {
    const db = getDb();
    const a = db.getFirstSync<{ completed: number }>('SELECT completed FROM assessments WHERE id = ?', [id]);
    if (!a) return false;
    const nextVal = a.completed ? 0 : 1;
    db.runSync('UPDATE assessments SET completed = ? WHERE id = ?', [nextVal, id]);
    return Boolean(nextVal);
  },

  deleteAssessment: (id: string): void => {
    const db = getDb();
    db.runSync('DELETE FROM assessments WHERE id = ?', [id]);
  },

  // ================= CODING PROBLEMS =================
  getAllCodingProblems: (): CodingProblem[] => {
    const db = getDb();
    return db.getAllSync<CodingProblem>('SELECT * FROM coding_problems ORDER BY attempt_date DESC, id DESC');
  },

  createCodingProblem: (p: Omit<CodingProblem, 'id'>): CodingProblem => {
    const db = getDb();
    const id = `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.runSync(
      `INSERT INTO coding_problems (id, title, platform, language, difficulty, topic, attempt_date, status, notes, problem_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, p.title, p.platform, p.language, p.difficulty, p.topic, p.attempt_date, p.status, p.notes || null, p.problem_url || null]
    );
    return { ...p, id };
  },

  updateCodingProblem: (p: CodingProblem): void => {
    const db = getDb();
    db.runSync(
      `UPDATE coding_problems SET 
        title = ?, platform = ?, language = ?, difficulty = ?, topic = ?, attempt_date = ?, status = ?, notes = ?, problem_url = ?
       WHERE id = ?`,
      [p.title, p.platform, p.language, p.difficulty, p.topic, p.attempt_date, p.status, p.notes || null, p.problem_url || null, p.id]
    );
  },

  deleteCodingProblem: (id: string): void => {
    const db = getDb();
    db.runSync('DELETE FROM coding_problems WHERE id = ?', [id]);
  },

  // ================= PROJECTS =================
  getAllProjects: (): Project[] => {
    const db = getDb();
    const projs = db.getAllSync<Project>('SELECT * FROM projects ORDER BY id DESC');

    return projs.map((p) => {
      const milestones = db.getAllSync<ProjectMilestone>(
        'SELECT * FROM project_milestones WHERE project_id = ? ORDER BY id ASC',
        [p.id]
      ).map((m) => ({ ...m, completed: Boolean(m.completed) }));

      const totalM = milestones.length;
      const compM = milestones.filter((m) => m.completed).length;
      const progress = totalM > 0 ? Math.round((compM / totalM) * 100) : p.progress_percentage;

      return {
        ...p,
        progress_percentage: progress,
        milestones,
      };
    });
  },

  createProject: (p: Omit<Project, 'id' | 'progress_percentage'>, milestones: { title: string; due_date?: string }[] = []): Project => {
    const db = getDb();
    const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.runSync(
      `INSERT INTO projects (id, name, description, tech_stack, repo_url, target_deadline, status, progress_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, p.name, p.description || null, p.tech_stack, p.repo_url || null, p.target_deadline || null, p.status || 'in_progress']
    );

    milestones.forEach((m, idx) => {
      const msId = `ms-${Date.now()}-${idx}`;
      db.runSync(
        'INSERT INTO project_milestones (id, project_id, title, due_date, completed) VALUES (?, ?, ?, ?, 0)',
        [msId, id, m.title, m.due_date || null]
      );
    });

    return Repository.getAllProjects().find((x) => x.id === id)!;
  },

  toggleMilestone: (milestoneId: string): void => {
    const db = getDb();
    const m = db.getFirstSync<{ completed: number; project_id: string }>(
      'SELECT completed, project_id FROM project_milestones WHERE id = ?',
      [milestoneId]
    );
    if (!m) return;

    const nextVal = m.completed ? 0 : 1;
    db.runSync('UPDATE project_milestones SET completed = ? WHERE id = ?', [nextVal, milestoneId]);

    // Recalculate project progress
    const all = db.getAllSync<{ completed: number }>(
      'SELECT completed FROM project_milestones WHERE project_id = ?',
      [m.project_id]
    );
    if (all.length > 0) {
      const comp = all.filter((x) => x.completed === 1).length;
      const pct = Math.round((comp / all.length) * 100);
      db.runSync('UPDATE projects SET progress_percentage = ? WHERE id = ?', [pct, m.project_id]);
    }
  },

  deleteProject: (id: string): void => {
    const db = getDb();
    db.runSync('DELETE FROM project_milestones WHERE project_id = ?', [id]);
    db.runSync('DELETE FROM projects WHERE id = ?', [id]);
  },

  // ================= STUDY SESSIONS =================
  getStudySessions: (daysLimit: number = 14): StudySession[] => {
    const db = getDb();
    const rows = db.getAllSync<any>(`
      SELECT ss.*, s.name as subject_name, s.color as subject_color
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      ORDER BY ss.start_time DESC
    `);
    return rows;
  },

  logStudySession: (sess: Omit<StudySession, 'id'>): StudySession => {
    const db = getDb();
    const id = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.runSync(
      `INSERT INTO study_sessions (id, subject_id, task_id, start_time, duration_minutes, notes, session_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sess.subject_id || null,
        sess.task_id || null,
        sess.start_time,
        sess.duration_minutes,
        sess.notes || null,
        sess.session_type,
      ]
    );
    return { ...sess, id };
  },

  // ================= SETTINGS =================
  getSettings: (): AppSettings => {
    const db = getDb();
    const rows = db.getAllSync<{ key: string; value: string }>('SELECT key, value FROM settings');
    const defaults: AppSettings = {
      user_name: 'Alex Chen',
      college_name: 'School of Computer Science & Eng.',
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

    const result = { ...defaults };
    rows.forEach((r) => {
      try {
        (result as any)[r.key] = JSON.parse(r.value);
      } catch {
        (result as any)[r.key] = r.value;
      }
    });

    return result;
  },

  updateSettings: (newSettings: Partial<AppSettings>): AppSettings => {
    const db = getDb();
    for (const [key, val] of Object.entries(newSettings)) {
      db.runSync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(val)]
      );
    }
    return Repository.getSettings();
  },

  // ================= BACKUP & RESTORE =================
  exportFullDatabaseJson: (): string => {
    const db = getDb();
    const data = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      tasks: db.getAllSync('SELECT * FROM tasks'),
      subtasks: db.getAllSync('SELECT * FROM subtasks'),
      reminders: db.getAllSync('SELECT * FROM reminders'),
      subjects: db.getAllSync('SELECT * FROM subjects'),
      syllabus_units: db.getAllSync('SELECT * FROM syllabus_units'),
      syllabus_topics: db.getAllSync('SELECT * FROM syllabus_topics'),
      assessments: db.getAllSync('SELECT * FROM assessments'),
      coding_problems: db.getAllSync('SELECT * FROM coding_problems'),
      projects: db.getAllSync('SELECT * FROM projects'),
      project_milestones: db.getAllSync('SELECT * FROM project_milestones'),
      study_sessions: db.getAllSync('SELECT * FROM study_sessions'),
      settings: db.getAllSync('SELECT * FROM settings'),
    };
    return JSON.stringify(data, null, 2);
  },

  exportTasksCsv: (): string => {
    const tasks = Repository.getAllTasks();
    const headers = ['ID', 'Title', 'Subject', 'Category', 'Type', 'Due Date', 'Due Time', 'Priority', 'Status', 'Estimated Mins'];
    const rows = tasks.map((t) => [
      `"${t.id}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.subject_name || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${t.task_type}"`,
      `"${t.due_date || ''}"`,
      `"${t.due_time || ''}"`,
      `"${t.priority}"`,
      `"${t.completed ? 'Completed' : 'Pending'}"`,
      `"${t.estimated_minutes || 0}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  importFullDatabaseJson: (jsonString: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.tasks || !data.subjects) {
        return { success: false, message: 'Invalid CSE Compass backup format. Missing core tables.' };
      }

      const db = getDb();
      db.execSync('BEGIN TRANSACTION;');
      try {
        db.execSync(`
          DELETE FROM subtasks;
          DELETE FROM reminders;
          DELETE FROM tasks;
          DELETE FROM syllabus_topics;
          DELETE FROM syllabus_units;
          DELETE FROM assessments;
          DELETE FROM coding_problems;
          DELETE FROM project_milestones;
          DELETE FROM projects;
          DELETE FROM study_sessions;
          DELETE FROM subjects;
        `);

        // Re-insert subjects
        if (Array.isArray(data.subjects)) {
          for (const s of data.subjects) {
            db.runSync(
              `INSERT OR REPLACE INTO subjects (id, name, code, semester, credits, instructor, color, icon, syllabus_progress)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [s.id, s.name, s.code, s.semester, s.credits, s.instructor, s.color, s.icon, s.syllabus_progress]
            );
          }
        }

        // Re-insert tasks
        if (Array.isArray(data.tasks)) {
          for (const t of data.tasks) {
            db.runSync(
              `INSERT OR REPLACE INTO tasks (id, title, description, subject_id, category, task_type, due_date, due_time, priority, estimated_minutes, completed, completed_at, is_recurring, recurrence_rule, tags, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [t.id, t.title, t.description, t.subject_id, t.category, t.task_type, t.due_date, t.due_time, t.priority, t.estimated_minutes, t.completed, t.completed_at, t.is_recurring, t.recurrence_rule, t.tags, t.created_at, t.updated_at]
            );
          }
        }

        // Subtasks
        if (Array.isArray(data.subtasks)) {
          for (const st of data.subtasks) {
            db.runSync(
              'INSERT OR REPLACE INTO subtasks (id, task_id, title, completed, sort_order) VALUES (?, ?, ?, ?, ?)',
              [st.id, st.task_id, st.title, st.completed, st.sort_order]
            );
          }
        }

        // Reminders
        if (Array.isArray(data.reminders)) {
          for (const r of data.reminders) {
            db.runSync(
              'INSERT OR REPLACE INTO reminders (id, task_id, reminder_type, scheduled_time, notification_id, status) VALUES (?, ?, ?, ?, ?, ?)',
              [r.id, r.task_id, r.reminder_type, r.scheduled_time, r.notification_id, r.status]
            );
          }
        }

        // Syllabus
        if (Array.isArray(data.syllabus_units)) {
          for (const u of data.syllabus_units) {
            db.runSync(
              'INSERT OR REPLACE INTO syllabus_units (id, subject_id, unit_number, title) VALUES (?, ?, ?, ?)',
              [u.id, u.subject_id, u.unit_number, u.title]
            );
          }
        }
        if (Array.isArray(data.syllabus_topics)) {
          for (const top of data.syllabus_topics) {
            db.runSync(
              'INSERT OR REPLACE INTO syllabus_topics (id, unit_id, subject_id, title, status, revision_count, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [top.id, top.unit_id, top.subject_id, top.title, top.status, top.revision_count, top.notes]
            );
          }
        }

        // Assessments
        if (Array.isArray(data.assessments)) {
          for (const a of data.assessments) {
            db.runSync(
              'INSERT OR REPLACE INTO assessments (id, subject_id, title, assessment_type, due_date, due_time, total_marks, weightage, notes, completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [a.id, a.subject_id, a.title, a.assessment_type, a.due_date, a.due_time, a.total_marks, a.weightage, a.notes, a.completed]
            );
          }
        }

        // Coding problems
        if (Array.isArray(data.coding_problems)) {
          for (const c of data.coding_problems) {
            db.runSync(
              'INSERT OR REPLACE INTO coding_problems (id, title, platform, language, difficulty, topic, attempt_date, status, notes, problem_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [c.id, c.title, c.platform, c.language, c.difficulty, c.topic, c.attempt_date, c.status, c.notes, c.problem_url]
            );
          }
        }

        // Projects
        if (Array.isArray(data.projects)) {
          for (const p of data.projects) {
            db.runSync(
              'INSERT OR REPLACE INTO projects (id, name, description, tech_stack, repo_url, target_deadline, status, progress_percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [p.id, p.name, p.description, p.tech_stack, p.repo_url, p.target_deadline, p.status, p.progress_percentage]
            );
          }
        }
        if (Array.isArray(data.project_milestones)) {
          for (const m of data.project_milestones) {
            db.runSync(
              'INSERT OR REPLACE INTO project_milestones (id, project_id, title, due_date, completed) VALUES (?, ?, ?, ?, ?)',
              [m.id, m.project_id, m.title, m.due_date, m.completed]
            );
          }
        }

        // Study sessions
        if (Array.isArray(data.study_sessions)) {
          for (const s of data.study_sessions) {
            db.runSync(
              'INSERT OR REPLACE INTO study_sessions (id, subject_id, task_id, start_time, duration_minutes, notes, session_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [s.id, s.subject_id, s.task_id, s.start_time, s.duration_minutes, s.notes, s.session_type]
            );
          }
        }

        db.execSync('COMMIT;');
        return { success: true, message: 'Data imported and restored successfully.' };
      } catch (err: any) {
        db.execSync('ROLLBACK;');
        return { success: false, message: `Import error: ${err.message}` };
      }
    } catch (e: any) {
      return { success: false, message: `Invalid JSON file: ${e.message}` };
    }
  },

  resetAllData: (): void => {
    const db = getDb();
    db.execSync(`
      DELETE FROM subtasks;
      DELETE FROM reminders;
      DELETE FROM tasks;
      DELETE FROM syllabus_topics;
      DELETE FROM syllabus_units;
      DELETE FROM assessments;
      DELETE FROM coding_problems;
      DELETE FROM project_milestones;
      DELETE FROM projects;
      DELETE FROM study_sessions;
      DELETE FROM subjects;
      DELETE FROM settings;
    `);
    // Re-seed
    const { initDatabase } = require('./db');
    initDatabase();
  },
};
