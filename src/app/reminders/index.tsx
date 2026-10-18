import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { NotificationService } from '../../services/notificationService';
import { Repository } from '../../database/repository';
import * as Notifications from 'expo-notifications';

export default function RemindersScreen() {
  const { theme } = useTheme();
  const { upcomingReminders, refreshAllData, showToast } = useApp();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkPerms = async () => {
    const granted = await NotificationService.checkPermissions();
    setHasPermission(granted);
  };

  useEffect(() => {
    checkPerms();
  }, []);

  const handleRequestPermission = async () => {
    const res = await NotificationService.requestPermissions();
    setHasPermission(res.granted);
    if (res.granted) {
      showToast('Notification permission granted! Reminders are active.', 'success');
    } else {
      Alert.alert(
        'Permission Restricted',
        'Notification permission was not granted. Please enable notifications for CSE Compass in your Android/device Settings to receive deadline reminders.'
      );
    }
  };

  const handleCancelReminder = async (remId: string) => {
    const notifId = Repository.cancelReminder(remId);
    if (notifId) {
      await NotificationService.cancelNotification(notifId);
    }
    refreshAllData();
    showToast('Reminder cancelled', 'info');
  };

  const handleTestNotification = async () => {
    try {
      const granted = await NotificationService.checkPermissions();
      if (!granted) {
        const req = await NotificationService.requestPermissions();
        if (!req.granted) {
          Alert.alert('Permission Needed', 'Please allow notifications to send test reminder.');
          return;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 CSE Compass Reminder Test',
          body: 'Success! Your device is fully configured for scheduled academic reminders.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3,
          channelId: 'academic-reminders',
        },
      });

      showToast('Test notification armed! Expect alert in 3 seconds.', 'success');
    } catch (e: any) {
      Alert.alert('Test Notification Error', e.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Upcoming Reminders</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Permission Diagnostic Card */}
        <View
          style={[
            styles.permCard,
            {
              backgroundColor: hasPermission ? `${theme.success}12` : `${theme.warning}14`,
              borderColor: hasPermission ? theme.success : theme.warning,
            },
          ]}
        >
          <View style={styles.permHeader}>
            <Ionicons
              name={hasPermission ? 'shield-checkmark' : 'alert-circle'}
              size={22}
              color={hasPermission ? theme.success : theme.warning}
              style={{ marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.permTitle, { color: hasPermission ? theme.success : theme.warning }]}>
                {hasPermission ? 'Device Notifications Active' : 'Notification Permission Action Needed'}
              </Text>
              <Text style={[styles.permDesc, { color: theme.textSecondary }]}>
                {hasPermission
                  ? 'CSE Compass is authorized to dispatch exact academic deadline alarms.'
                  : 'Android 13+ requires explicit authorization to alert you before assignment deadlines.'}
              </Text>
            </View>
          </View>

          <View style={styles.permActionsRow}>
            {!hasPermission && (
              <TouchableOpacity
                style={[styles.permActionBtn, { backgroundColor: theme.primary }]}
                onPress={handleRequestPermission}
              >
                <Text style={styles.permActionBtnText}>Grant Permission</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.testBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
              onPress={handleTestNotification}
            >
              <Ionicons name="paper-plane-outline" size={14} color={theme.textPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.testBtnText, { color: theme.textPrimary }]}>Send 3s Test Alert</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Android Background Information Accordion */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="battery-charging-outline" size={18} color={theme.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>
              Android Battery & Background Optimization
            </Text>
          </View>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Some Android OEMs (such as Xiaomi/MIUI, Samsung, and OnePlus) aggressively suspend background alarms. For highest reliability, set CSE Compass battery usage to &quot;Unrestricted&quot; in device App Settings.
          </Text>
        </View>

        {/* Reminders List */}
        <Text style={[styles.listHeading, { color: theme.textPrimary }]}>
          SCHEDULED ALERTS ({upcomingReminders.length})
        </Text>

        {upcomingReminders.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Ionicons name="notifications-off-outline" size={36} color={theme.textMuted} style={{ marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Pending Reminders</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              When you schedule a task or assessment with a notification trigger, it will appear here.
            </Text>
          </View>
        ) : (
          upcomingReminders.map((rem) => (
            <View
              key={rem.id}
              style={[styles.remCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            >
              <View style={[styles.bellBox, { backgroundColor: `${theme.primary}18` }]}>
                <Ionicons name="notifications" size={16} color={theme.primary} />
              </View>

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text numberOfLines={1} style={[styles.remTitle, { color: theme.textPrimary }]}>
                  {rem.task_title || 'Academic Task'}
                </Text>
                <Text style={[styles.remType, { color: theme.primary }]}>
                  {NotificationService.getReminderLabel(rem.reminder_type)}
                </Text>
                <Text style={[styles.remTime, { color: theme.textSecondary }]}>
                  ⏰ Scheduled for: {new Date(rem.scheduled_time).toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleCancelReminder(rem.id)}
                style={styles.cancelTouch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle-outline" size={20} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  permCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  permHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  permDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  permActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  permActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  listHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emptyBox: {
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  remCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  bellBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  remType: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  remTime: {
    fontSize: 11,
    marginTop: 2,
  },
  cancelTouch: {
    padding: 4,
  },
});
