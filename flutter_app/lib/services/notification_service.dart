import 'dart:io';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import '../models/models.dart';

class NotificationService {
  static final NotificationService instance = NotificationService._init();
  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;

  NotificationService._init();

  Future<void> init() async {
    if (_isInitialized) return;

    tz.initializeTimeZones();

    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@drawable/ic_launcher');

    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notificationsPlugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Notification tapped action
      },
    );

    _isInitialized = true;
  }

  Future<bool> requestPermissions() async {
    if (Platform.isAndroid) {
      final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
          _notificationsPlugin.resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();

      final bool? grantedNotification =
          await androidImplementation?.requestNotificationsPermission();
      await androidImplementation?.requestExactAlarmsPermission();
      return grantedNotification ?? false;
    } else if (Platform.isIOS) {
      final bool? granted = await _notificationsPlugin
          .resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin>()
          ?.requestPermissions(
            alert: true,
            badge: true,
            sound: true,
          );
      return granted ?? false;
    }
    return true;
  }

  Future<void> scheduleTaskReminder({
    required int notificationId,
    required String taskTitle,
    required String scheduledTimeStr,
    required String contextText,
  }) async {
    try {
      final scheduledDate = DateTime.parse(scheduledTimeStr);
      if (scheduledDate.isBefore(DateTime.now())) {
        return; // Skip past dates
      }

      final tz.TZDateTime tzTime = tz.TZDateTime.from(scheduledDate, tz.local);

      const AndroidNotificationDetails androidDetails =
          AndroidNotificationDetails(
        'cse_compass_academic_reminders',
        'Academic Deadlines & Reminders',
        channelDescription:
            'Critical notifications for exams, assignments, and study sessions',
        importance: Importance.max,
        priority: Priority.high,
        ticker: 'CSE Compass Reminder',
      );

      const NotificationDetails platformDetails =
          NotificationDetails(android: androidDetails);

      await _notificationsPlugin.zonedSchedule(
        notificationId,
        taskTitle,
        contextText,
        tzTime,
        platformDetails,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    } catch (_) {
      // Graceful fallback if device restricts alarms
    }
  }

  Future<void> cancelReminder(int notificationId) async {
    try {
      await _notificationsPlugin.cancel(notificationId);
    } catch (_) {}
  }

  Future<void> cancelAll() async {
    try {
      await _notificationsPlugin.cancelAll();
    } catch (_) {}
  }

  DateTime? computePresetTime(DateTime dueDateTime, ReminderType preset) {
    switch (preset) {
      case ReminderType.preset_5m:
        return dueDateTime.subtract(const Duration(minutes: 5));
      case ReminderType.preset_15m:
        return dueDateTime.subtract(const Duration(minutes: 15));
      case ReminderType.preset_30m:
        return dueDateTime.subtract(const Duration(minutes: 30));
      case ReminderType.preset_1h:
        return dueDateTime.subtract(const Duration(hours: 1));
      case ReminderType.same_day_9am:
        return DateTime(dueDateTime.year, dueDateTime.month, dueDateTime.day, 9, 0);
      case ReminderType.day_before_9am:
        final dayBefore = dueDateTime.subtract(const Duration(days: 1));
        return DateTime(dayBefore.year, dayBefore.month, dayBefore.day, 9, 0);
      case ReminderType.custom:
        return null;
    }
  }
}
