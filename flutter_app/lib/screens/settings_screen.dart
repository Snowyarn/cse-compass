import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/models.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import '../services/notification_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  void _showProfileEditDialog(BuildContext context, AppProvider provider) {
    final nameController =
        TextEditingController(text: provider.settings.userName);
    final collegeController =
        TextEditingController(text: provider.settings.collegeName);
    final semController =
        TextEditingController(text: provider.settings.semester.toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Academic Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Student Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: collegeController,
              decoration: const InputDecoration(labelText: 'University / College'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: semController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Current Semester (1-8)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final newSettings = AppSettings(
                userName: nameController.text.trim(),
                collegeName: collegeController.text.trim(),
                semester: int.tryParse(semController.text.trim()) ?? 3,
                theme: provider.settings.theme,
                defaultReminder: provider.settings.defaultReminder,
                pomodoroWorkMins: provider.settings.pomodoroWorkMins,
                pomodoroBreakMins: provider.settings.pomodoroBreakMins,
                notificationsEnabled: provider.settings.notificationsEnabled,
                onboardingCompleted: true,
              );
              provider.updateSettings(newSettings);
              Navigator.of(ctx).pop();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showImportJsonDialog(BuildContext context, AppProvider provider) {
    final jsonController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Restore from JSON Backup'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Paste your exported backup JSON string below:',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: jsonController,
              maxLines: 5,
              decoration: const InputDecoration(
                hintText: '{"version":"1.0.0", "subjects":[...]}',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final text = jsonController.text.trim();
              if (text.isNotEmpty) {
                try {
                  await provider.importBackupData(text);
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('✅ Backup data imported successfully!'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error restoring data: $e'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                }
              }
            },
            child: const Text('Restore Data'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        final settings = provider.settings;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Settings & Profile'),
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Profile Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(Icons.school,
                            size: 28, color: AppColors.primary),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            settings.userName,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'B.Tech CSE • Semester ${settings.semester}',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                          Text(
                            settings.collegeName,
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark
                                  ? AppColors.darkTextMuted
                                  : AppColors.lightTextMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit_outlined),
                      tooltip: 'Edit Profile',
                      onPressed: () => _showProfileEditDialog(context, provider),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Appearance
              const Text('Appearance',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Column(
                  children: [
                    RadioListTile<String>(
                      title: const Text('Dark Navy (Obsidian)'),
                      subtitle: const Text('Optimized for low-light coding sessions'),
                      value: 'dark',
                      groupValue: settings.theme,
                      onChanged: (val) {
                        if (val != null) provider.setTheme(val);
                      },
                    ),
                    const Divider(height: 1),
                    RadioListTile<String>(
                      title: const Text('Light Theme'),
                      subtitle: const Text('Crisp daytime study palette'),
                      value: 'light',
                      groupValue: settings.theme,
                      onChanged: (val) {
                        if (val != null) provider.setTheme(val);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Notification Preferences
              const Text('Reminders & Notifications',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Scheduled Alarms Permission',
                            style: TextStyle(fontSize: 14)),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                          ),
                          onPressed: () async {
                            final granted = await NotificationService.instance
                                .requestPermissions();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(granted
                                    ? '✅ Permissions verified!'
                                    : '⚠️ Permissions denied in OS settings'),
                              ),
                            );
                          },
                          child: const Text('Check / Request'),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Default Reminder Interval',
                            style: TextStyle(fontSize: 14)),
                        DropdownButton<ReminderType>(
                          value: settings.defaultReminder,
                          items: const [
                            DropdownMenuItem(
                                value: ReminderType.preset_5m,
                                child: Text('5 mins before')),
                            DropdownMenuItem(
                                value: ReminderType.preset_15m,
                                child: Text('15 mins before')),
                            DropdownMenuItem(
                                value: ReminderType.preset_30m,
                                child: Text('30 mins before')),
                            DropdownMenuItem(
                                value: ReminderType.preset_1h,
                                child: Text('1 hour before')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              settings.defaultReminder = val;
                              provider.updateSettings(settings);
                            }
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Data Management
              const Text('Data & Backup',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.file_download_outlined,
                          color: AppColors.primary),
                      title: const Text('Export JSON Backup'),
                      subtitle: const Text('Export all tasks, subjects, notes & logs'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () async {
                        final jsonStr = await provider.exportBackupData();
                        await Share.share(
                          jsonStr,
                          subject: 'CSE Compass Academic Data Backup',
                        );
                      },
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.file_upload_outlined,
                          color: AppColors.secondary),
                      title: const Text('Restore from Backup'),
                      subtitle: const Text('Import previously saved JSON archive'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => _showImportJsonDialog(context, provider),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // About CSE Compass
              Center(
                child: Column(
                  children: [
                    const Text(
                      'CSE Compass v1.0.0',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Designed exclusively for B.Tech Computer Science Students\nOffline-first • SQLite Persistent • Zero Cloud Dependent',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark
                            ? AppColors.darkTextMuted
                            : AppColors.lightTextMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}
