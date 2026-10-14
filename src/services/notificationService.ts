import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderType, Task } from '../types';
import { Repository } from '../database/repository';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ScheduleResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export const NotificationService = {
  // Initialize notification channels (vital on Android)
  initialize: async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('academic-reminders', {
          name: 'Academic Deadlines & Tasks',
          description: 'Timely reminders for assignments, exams, and study sessions',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('study-focus', {
          name: 'Pomodoro & Focus Timer',
          description: 'Alerts when study sessions or breaks complete',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }
      return true;
    } catch (e: any) {
      console.warn('NotificationService.initialize error:', e.message);
      return false;
    }
  },

  // Request notification permissions
  requestPermissions: async (): Promise<{ granted: boolean; canAskAgain: boolean }> => {
    try {
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
        return { granted: true, canAskAgain: true };
      }

      const request = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      return {
        granted: Boolean(request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL),
        canAskAgain: request.canAskAgain,
      };
    } catch (e: any) {
      console.warn('requestPermissions error:', e.message);
      return { granted: false, canAskAgain: false };
    }
  },

  checkPermissions: async (): Promise<boolean> => {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return Boolean(settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
    } catch {
      return false;
    }
  },

  // Calculate reminder trigger Date from task due date & time
  calculateTriggerDate: (
    dueDateStr?: string,
    dueTimeStr?: string,
    reminderType: ReminderType = 'preset_15m',
    customTimeStr?: string
  ): Date | null => {
    if (!dueDateStr) return null;

    // Build the deadline Date object
    const [year, month, day] = dueDateStr.split('-').map(Number);
    let hour = 23;
    let minute = 59;

    if (dueTimeStr && dueTimeStr.includes(':')) {
      const [h, m] = dueTimeStr.split(':').map(Number);
      hour = isNaN(h) ? 23 : h;
      minute = isNaN(m) ? 59 : m;
    }

    const deadline = new Date(year, month - 1, day, hour, minute, 0, 0);

    switch (reminderType) {
      case 'preset_5m':
        return new Date(deadline.getTime() - 5 * 60 * 1000);
      case 'preset_15m':
        return new Date(deadline.getTime() - 15 * 60 * 1000);
      case 'preset_30m':
        return new Date(deadline.getTime() - 30 * 60 * 1000);
      case 'preset_1h':
        return new Date(deadline.getTime() - 60 * 60 * 1000);
      case 'same_day_9am':
        return new Date(year, month - 1, day, 9, 0, 0, 0);
      case 'day_before_9am':
        const prevDay = new Date(year, month - 1, day - 1, 9, 0, 0, 0);
        return prevDay;
      case 'custom':
        if (customTimeStr) {
          const parsed = new Date(customTimeStr);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        return new Date(deadline.getTime() - 30 * 60 * 1000);
      default:
        return new Date(deadline.getTime() - 15 * 60 * 1000);
    }
  },

  // Format label for UI
  getReminderLabel: (type: ReminderType): string => {
    switch (type) {
      case 'preset_5m':
        return '5 minutes before';
      case 'preset_15m':
        return '15 minutes before';
      case 'preset_30m':
        return '30 minutes before';
      case 'preset_1h':
        return '1 hour before';
      case 'same_day_9am':
        return 'Day of deadline (9:00 AM)';
      case 'day_before_9am':
        return 'Day before deadline (9:00 AM)';
      case 'custom':
        return 'Custom reminder time';
      default:
        return 'Reminder';
    }
  },

  // Schedule a local notification
  scheduleTaskReminder: async (
    taskId: string,
    taskTitle: string,
    scheduledDate: Date,
    subjectName?: string,
    priority?: string
  ): Promise<ScheduleResult> => {
    try {
      const now = new Date();
      if (scheduledDate.getTime() <= now.getTime()) {
        return {
          success: false,
          error: 'Scheduled reminder time has already passed.',
        };
      }

      // Check permission
      const hasPerm = await NotificationService.checkPermissions();
      if (!hasPerm) {
        const req = await NotificationService.requestPermissions();
        if (!req.granted) {
          return {
            success: false,
            error: 'Notification permissions were denied.',
          };
        }
      }

      const urgencyPrefix = priority === 'urgent' ? '🚨 [URGENT] ' : priority === 'high' ? '⚠️ ' : '';
      const bodyText = subjectName
        ? `${urgencyPrefix}Subject: ${subjectName}. Deadline approaching!`
        : `${urgencyPrefix}Your task is due shortly. Tap to view and review checklist.`;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `CSE Compass: ${taskTitle}`,
          body: bodyText,
          data: { taskId, url: `/task/${taskId}` },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledDate,
          channelId: 'academic-reminders',
        },
      });

      return {
        success: true,
        notificationId,
      };
    } catch (e: any) {
      console.warn('scheduleTaskReminder failed:', e.message);
      return {
        success: false,
        error: e.message || 'Failed to schedule device notification.',
      };
    }
  },

  // Schedule study timer completion
  scheduleFocusTimerEnd: async (durationMinutes: number, sessionName: string): Promise<string | null> => {
    try {
      const targetTime = new Date(Date.now() + durationMinutes * 60 * 1000);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Focus Session Complete!',
          body: `Great job on finishing your ${durationMinutes}-minute ${sessionName} session. Time for a well-deserved break!`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetTime,
          channelId: 'study-focus',
        },
      });
      return notificationId;
    } catch {
      return null;
    }
  },

  // Cancel specific notification ID
  cancelNotification: async (notificationId: string): Promise<void> => {
    try {
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    } catch (e: any) {
      console.warn('cancelNotification failed:', e.message);
    }
  },

  // Cancel multiple notification IDs
  cancelMultipleNotifications: async (notificationIds: string[]): Promise<void> => {
    for (const id of notificationIds) {
      if (id) {
        await NotificationService.cancelNotification(id);
      }
    }
  },

  // Reschedule all reminders for a task when deadline changes
  rescheduleTaskReminders: async (task: Task): Promise<void> => {
    if (!task.reminders || task.reminders.length === 0) return;

    for (const rem of task.reminders) {
      // Cancel previous notification
      if (rem.notification_id) {
        await NotificationService.cancelNotification(rem.notification_id);
      }

      // If task is completed, don't re-arm
      if (task.completed) continue;

      const triggerDate = NotificationService.calculateTriggerDate(
        task.due_date,
        task.due_time,
        rem.reminder_type,
        rem.scheduled_time
      );

      if (triggerDate && triggerDate.getTime() > Date.now()) {
        const result = await NotificationService.scheduleTaskReminder(
          task.id,
          task.title,
          triggerDate,
          task.subject_name,
          task.priority
        );
        if (result.success && result.notificationId) {
          Repository.updateReminderNotificationId(rem.id, result.notificationId);
        }
      }
    }
  },
};
