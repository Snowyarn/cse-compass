import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Task,
  Subject,
  Assessment,
  CodingProblem,
  Project,
  StudySession,
  Reminder,
  AppSettings,
  ReminderType,
} from '../types';
import { Repository } from '../database/repository';
import { NotificationService } from '../services/notificationService';

export interface ToastInfo {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'danger';
}

interface AppContextType {
  tasks: Task[];
  subjects: Subject[];
  assessments: Assessment[];
  codingProblems: CodingProblem[];
  projects: Project[];
  studySessions: StudySession[];
  upcomingReminders: Reminder[];
  settings: AppSettings;
  isLoading: boolean;
  toast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'danger') => void;
  hideToast: () => void;
  refreshAllData: () => void;
  // Task Actions
  createTask: (
    task: Omit<Task, 'created_at' | 'updated_at'>,
    subtasks?: { title: string }[],
    reminders?: { reminder_type: ReminderType; scheduled_time: string }[]
  ) => Promise<{ task: Task; reminderScheduled: boolean; warning?: string }>;
  updateTask: (
    task: Partial<Task> & { id: string },
    subtasks?: { id?: string; title: string; completed?: boolean }[],
    reminders?: { id?: string; reminder_type: ReminderType; scheduled_time: string; notification_id?: string }[]
  ) => Promise<Task>;
  toggleTask: (id: string) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => void;
  // Subject Actions
  createSubject: (sub: Omit<Subject, 'syllabus_progress' | 'total_topics' | 'completed_topics' | 'active_tasks_count'>) => Subject;
  updateSubject: (sub: Partial<Subject> & { id: string }) => Subject;
  deleteSubject: (id: string) => void;
  // Assessment Actions
  createAssessment: (ass: Omit<Assessment, 'id'>) => Assessment;
  toggleAssessment: (id: string) => void;
  deleteAssessment: (id: string) => void;
  // Coding Actions
  createCodingProblem: (p: Omit<CodingProblem, 'id'>) => CodingProblem;
  updateCodingProblem: (p: CodingProblem) => void;
  deleteCodingProblem: (id: string) => void;
  // Project Actions
  createProject: (p: Omit<Project, 'id' | 'progress_percentage'>, milestones?: { title: string; due_date?: string }[]) => Project;
  toggleMilestone: (milestoneId: string) => void;
  deleteProject: (id: string) => void;
  // Study Actions
  logStudySession: (sess: Omit<StudySession, 'id'>) => StudySession;
  // Settings Actions
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetAllData: () => void;
}

const defaultSettings: AppSettings = {
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

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [codingProblems, setCodingProblems] = useState<CodingProblem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'danger' = 'info') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const refreshAllData = useCallback(() => {
    try {
      setTasks(Repository.getAllTasks());
      setSubjects(Repository.getAllSubjects());
      setAssessments(Repository.getAllAssessments());
      setCodingProblems(Repository.getAllCodingProblems());
      setProjects(Repository.getAllProjects());
      setStudySessions(Repository.getStudySessions());
      setUpcomingReminders(Repository.getUpcomingReminders());
      setSettings(Repository.getSettings());
    } catch (e: any) {
      console.warn('refreshAllData error:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    NotificationService.initialize();
    refreshAllData();
  }, [refreshAllData]);

  // Task Handlers
  const createTask = async (
    taskData: Omit<Task, 'created_at' | 'updated_at'>,
    subtasks: { title: string }[] = [],
    reminders: { reminder_type: ReminderType; scheduled_time: string }[] = []
  ) => {
    const created = Repository.createTask(taskData, subtasks, reminders);
    let reminderScheduled = true;
    let warning: string | undefined;

    // Schedule notifications for reminders
    if (created.reminders && created.reminders.length > 0) {
      for (const rem of created.reminders) {
        const triggerDate = NotificationService.calculateTriggerDate(
          created.due_date,
          created.due_time,
          rem.reminder_type,
          rem.scheduled_time
        );

        if (triggerDate && triggerDate.getTime() > Date.now()) {
          const result = await NotificationService.scheduleTaskReminder(
            created.id,
            created.title,
            triggerDate,
            created.subject_name,
            created.priority
          );

          if (result.success && result.notificationId) {
            Repository.updateReminderNotificationId(rem.id, result.notificationId);
          } else {
            reminderScheduled = false;
            warning = result.error || 'Task saved, but notification could not be scheduled.';
          }
        }
      }
    }

    refreshAllData();
    return { task: created, reminderScheduled, warning };
  };

  const updateTask = async (
    taskData: Partial<Task> & { id: string },
    subtasks?: { id?: string; title: string; completed?: boolean }[],
    reminders?: { id?: string; reminder_type: ReminderType; scheduled_time: string; notification_id?: string }[]
  ) => {
    const updated = Repository.updateTask(taskData, subtasks, reminders);
    // Reschedule notifications
    await NotificationService.rescheduleTaskReminders(updated);
    refreshAllData();
    return updated;
  };

  const toggleTask = async (id: string): Promise<Task> => {
    const { task, notificationIdsToCancel } = Repository.toggleTaskComplete(id);
    if (notificationIdsToCancel.length > 0) {
      await NotificationService.cancelMultipleNotifications(notificationIdsToCancel);
    }
    refreshAllData();
    return task;
  };

  const deleteTask = async (id: string): Promise<void> => {
    const { notificationIdsToCancel } = Repository.deleteTask(id);
    if (notificationIdsToCancel.length > 0) {
      await NotificationService.cancelMultipleNotifications(notificationIdsToCancel);
    }
    refreshAllData();
  };

  const toggleSubtask = (subtaskId: string) => {
    Repository.toggleSubtask(subtaskId);
    refreshAllData();
  };

  // Subjects
  const createSubject = (sub: Omit<Subject, 'syllabus_progress' | 'total_topics' | 'completed_topics' | 'active_tasks_count'>) => {
    const created = Repository.createSubject(sub);
    refreshAllData();
    return created;
  };

  const updateSubject = (sub: Partial<Subject> & { id: string }) => {
    const updated = Repository.updateSubject(sub);
    refreshAllData();
    return updated;
  };

  const deleteSubject = (id: string) => {
    Repository.deleteSubject(id);
    refreshAllData();
  };

  // Assessments
  const createAssessment = (ass: Omit<Assessment, 'id'>) => {
    const created = Repository.createAssessment(ass);
    refreshAllData();
    return created;
  };

  const toggleAssessment = (id: string) => {
    Repository.toggleAssessment(id);
    refreshAllData();
  };

  const deleteAssessment = (id: string) => {
    Repository.deleteAssessment(id);
    refreshAllData();
  };

  // Coding Problems
  const createCodingProblem = (p: Omit<CodingProblem, 'id'>) => {
    const created = Repository.createCodingProblem(p);
    refreshAllData();
    return created;
  };

  const updateCodingProblem = (p: CodingProblem) => {
    Repository.updateCodingProblem(p);
    refreshAllData();
  };

  const deleteCodingProblem = (id: string) => {
    Repository.deleteCodingProblem(id);
    refreshAllData();
  };

  // Projects
  const createProject = (p: Omit<Project, 'id' | 'progress_percentage'>, milestones?: { title: string; due_date?: string }[]) => {
    const created = Repository.createProject(p, milestones);
    refreshAllData();
    return created;
  };

  const toggleMilestone = (milestoneId: string) => {
    Repository.toggleMilestone(milestoneId);
    refreshAllData();
  };

  const deleteProject = (id: string) => {
    Repository.deleteProject(id);
    refreshAllData();
  };

  // Study Sessions
  const logStudySession = (sess: Omit<StudySession, 'id'>) => {
    const created = Repository.logStudySession(sess);
    refreshAllData();
    return created;
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = Repository.updateSettings(newSettings);
    setSettings(updated);
  };

  const resetAllData = () => {
    Repository.resetAllData();
    refreshAllData();
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        subjects,
        assessments,
        codingProblems,
        projects,
        studySessions,
        upcomingReminders,
        settings,
        isLoading,
        toast,
        showToast,
        hideToast,
        refreshAllData,
        createTask,
        updateTask,
        toggleTask,
        deleteTask,
        toggleSubtask,
        createSubject,
        updateSubject,
        deleteSubject,
        createAssessment,
        toggleAssessment,
        deleteAssessment,
        createCodingProblem,
        updateCodingProblem,
        deleteCodingProblem,
        createProject,
        toggleMilestone,
        deleteProject,
        logStudySession,
        updateSettings,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
