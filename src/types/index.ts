export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskType =
  | 'assignment'
  | 'exam'
  | 'lab'
  | 'lecture'
  | 'project'
  | 'coding'
  | 'revision'
  | 'personal';

export type TaskCategory =
  | 'Lectures and classwork'
  | 'Assignments'
  | 'Mathematics'
  | 'Physics'
  | 'Engineering Chemistry'
  | 'Programming in C/C++'
  | 'Data Structures and Algorithms'
  | 'Computer Networks'
  | 'Operating Systems'
  | 'Database Management Systems'
  | 'Computer Organization and Architecture'
  | 'Discrete Mathematics'
  | 'Computer Science projects'
  | 'Coding practice'
  | 'Exams and revision'
  | 'Labs and practicals'
  | 'Internship and placement preparation'
  | 'Personal tasks';

export type ReminderType =
  | 'preset_5m'
  | 'preset_15m'
  | 'preset_30m'
  | 'preset_1h'
  | 'same_day_9am'
  | 'day_before_9am'
  | 'custom';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
}

export interface Reminder {
  id: string;
  task_id: string;
  reminder_type: ReminderType;
  scheduled_time: string; // ISO String
  notification_id?: string;
  status: 'pending' | 'fired' | 'cancelled';
  task_title?: string;
  task_due_date?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  subject_id?: string;
  category: TaskCategory | string;
  task_type: TaskType;
  due_date?: string; // YYYY-MM-DD
  due_time?: string; // HH:mm
  priority: TaskPriority;
  estimated_minutes?: number;
  completed: boolean;
  completed_at?: string;
  is_recurring: boolean;
  recurrence_rule?: 'daily' | 'weekly' | 'weekdays' | 'monthly' | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // Computed / Joined fields
  subtasks?: Subtask[];
  reminders?: Reminder[];
  subject_name?: string;
  subject_code?: string;
  subject_color?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  credits: number;
  instructor?: string;
  color: string;
  icon: string;
  syllabus_progress: number; // 0 to 100
  total_topics?: number;
  completed_topics?: number;
  active_tasks_count?: number;
}

export interface SyllabusUnit {
  id: string;
  subject_id: string;
  unit_number: number;
  title: string;
  topics?: SyllabusTopic[];
}

export interface SyllabusTopic {
  id: string;
  unit_id: string;
  subject_id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  revision_count: number;
  notes?: string;
}

export type AssessmentType =
  | 'internal'
  | 'mid_sem'
  | 'end_sem'
  | 'lab_exam'
  | 'viva'
  | 'assignment';

export interface Assessment {
  id: string;
  subject_id: string;
  title: string;
  assessment_type: AssessmentType;
  due_date: string; // YYYY-MM-DD
  due_time?: string; // HH:mm
  total_marks?: number;
  weightage?: number;
  notes?: string;
  completed: boolean;
  subject_name?: string;
  subject_color?: string;
}

export type CodingPlatform =
  | 'LeetCode'
  | 'Codeforces'
  | 'HackerRank'
  | 'GeeksforGeeks'
  | 'CodeChef'
  | 'Other';

export type CodingLanguage =
  | 'C'
  | 'C++'
  | 'Java'
  | 'Python'
  | 'Go'
  | 'Rust'
  | 'JavaScript'
  | 'TypeScript';

export type CodingDifficulty = 'Easy' | 'Medium' | 'Hard';

export type CodingTopic =
  | 'Arrays'
  | 'Strings'
  | 'Linked Lists'
  | 'Stacks & Queues'
  | 'Trees'
  | 'Graphs'
  | 'DP'
  | 'Recursion'
  | 'Sorting & Searching'
  | 'Bit Manipulation'
  | 'Math'
  | 'Greedy'
  | 'Other';

export interface CodingProblem {
  id: string;
  title: string;
  platform: CodingPlatform;
  language: CodingLanguage;
  difficulty: CodingDifficulty;
  topic: CodingTopic;
  attempt_date: string; // YYYY-MM-DD
  status: 'solved' | 'attempted' | 'to_review';
  notes?: string;
  problem_url?: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  due_date?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tech_stack: string;
  repo_url?: string;
  target_deadline?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  progress_percentage: number;
  milestones?: ProjectMilestone[];
}

export interface StudySession {
  id: string;
  subject_id?: string;
  task_id?: string;
  start_time: string; // ISO
  duration_minutes: number;
  notes?: string;
  session_type: 'pomodoro' | 'deep_work' | 'revision' | 'coding_practice';
  subject_name?: string;
  subject_color?: string;
}

export interface AppSettings {
  user_name: string;
  college_name: string;
  semester: number;
  theme: 'system' | 'dark' | 'light';
  default_reminder: ReminderType;
  week_start: 'sunday' | 'monday';
  time_format: '12h' | '24h';
  pomodoro_work_mins: number;
  pomodoro_break_mins: number;
  notifications_enabled: boolean;
  onboarding_completed: boolean;
}
