import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { ReminderType } from '../../types';
import { NotificationService } from '../../services/notificationService';

export default function ProfileScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { settings, updateSettings, resetAllData, showToast } = useApp();

  const [hasNotifPerm, setHasNotifPerm] = useState<boolean | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userName, setUserName] = useState(settings.user_name);
  const [collegeName, setCollegeName] = useState(settings.college_name);
  const [semester, setSemester] = useState(settings.semester.toString());

  useEffect(() => {
    NotificationService.checkPermissions().then(setHasNotifPerm);
  }, []);

  const handleSaveProfile = () => {
    updateSettings({
      user_name: userName.trim() || 'Alex Chen',
      college_name: collegeName.trim() || 'School of Computer Science & Eng.',
      semester: parseInt(semester, 10) || 3,
    });
    setIsEditingProfile(false);
    showToast('Profile information updated successfully!', 'success');
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Application Data?',
      'This will restore all default CSE subjects, sample tasks, and settings. Any custom tasks or notes you created will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Database',
          style: 'destructive',
          onPress: () => {
            resetAllData();
            showToast('Application data reset to clean defaults.', 'info');
          },
        },
      ]
    );
  };

  const reminderOptions: { id: ReminderType; label: string }[] = [
    { id: 'preset_5m', label: '5 minutes before deadline' },
    { id: 'preset_15m', label: '15 minutes before deadline' },
    { id: 'preset_30m', label: '30 minutes before deadline' },
    { id: 'preset_1h', label: '1 hour before deadline' },
    { id: 'same_day_9am', label: 'Day of deadline (9:00 AM)' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
          Profile & Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitials}>
                {settings.user_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.profileName, { color: theme.textPrimary }]}>
                {settings.user_name}
              </Text>
              <Text style={[styles.profileSub, { color: theme.textSecondary }]}>
                B.Tech Computer Science • Semester {settings.semester}
              </Text>
              <Text style={[styles.collegeSub, { color: theme.textMuted }]}>
                {settings.college_name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsEditingProfile(!isEditingProfile)}
              style={[styles.editProfileBtn, { borderColor: theme.border, backgroundColor: theme.surfaceSubtle }]}
            >
              <Ionicons
                name={isEditingProfile ? 'close' : 'pencil'}
                size={16}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Edit form toggle */}
          {isEditingProfile && (
            <View style={[styles.editForm, { borderTopColor: theme.divider }]}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Full Name</Text>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              />

              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>College / University</Text>
              <TextInput
                value={collegeName}
                onChangeText={setCollegeName}
                style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              />

              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Current Semester (1 - 8)</Text>
              <TextInput
                value={semester}
                onChangeText={setSemester}
                keyboardType="numeric"
                style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveBtnText}>Save Profile Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section: Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance & Theme</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.themeSelectorRow}>
            {[
              { id: 'dark', label: 'Dark Navy', icon: 'moon' as const },
              { id: 'light', label: 'Light Clean', icon: 'sunny' as const },
              { id: 'system', label: 'System Default', icon: 'phone-portrait' as const },
            ].map((t) => {
              const isSelected = themeMode === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setThemeMode(t.id as any)}
                  style={[
                    styles.themeOptionBtn,
                    {
                      backgroundColor: isSelected ? `${theme.primary}20` : 'transparent',
                      borderColor: isSelected ? theme.primary : theme.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={isSelected ? theme.primary : theme.textMuted}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isSelected ? theme.primary : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Academic & Timer Preferences */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Study & Focus Settings</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingRowTitle, { color: theme.textPrimary }]}>
                Pomodoro Focus Interval
              </Text>
              <Text style={[styles.settingRowSub, { color: theme.textSecondary }]}>
                Work session duration in minutes
              </Text>
            </View>
            <View style={styles.numberStepper}>
              <TouchableOpacity
                onPress={() =>
                  updateSettings({ pomodoro_work_mins: Math.max(10, settings.pomodoro_work_mins - 5) })
                }
                style={[styles.stepperBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="remove" size={14} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.stepperVal, { color: theme.textPrimary }]}>
                {settings.pomodoro_work_mins}m
              </Text>
              <TouchableOpacity
                onPress={() =>
                  updateSettings({ pomodoro_work_mins: Math.min(90, settings.pomodoro_work_mins + 5) })
                }
                style={[styles.stepperBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="add" size={14} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingRowTitle, { color: theme.textPrimary }]}>
                Break Duration
              </Text>
              <Text style={[styles.settingRowSub, { color: theme.textSecondary }]}>
                Rest period between deep focus sprints
              </Text>
            </View>
            <View style={styles.numberStepper}>
              <TouchableOpacity
                onPress={() =>
                  updateSettings({ pomodoro_break_mins: Math.max(2, settings.pomodoro_break_mins - 1) })
                }
                style={[styles.stepperBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="remove" size={14} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.stepperVal, { color: theme.textPrimary }]}>
                {settings.pomodoro_break_mins}m
              </Text>
              <TouchableOpacity
                onPress={() =>
                  updateSettings({ pomodoro_break_mins: Math.min(30, settings.pomodoro_break_mins + 1) })
                }
                style={[styles.stepperBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="add" size={14} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section: Default Reminders */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Default Task Reminder</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          {reminderOptions.map((opt, idx) => {
            const isSelected = settings.default_reminder === opt.id;
            return (
              <React.Fragment key={opt.id}>
                {idx > 0 && <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />}
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => updateSettings({ default_reminder: opt.id })}
                >
                  <Text style={[styles.settingRowTitle, { color: isSelected ? theme.primary : theme.textPrimary }]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* Section: Data & Backup */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Data Management & Safety</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/data-management')}
          >
            <View style={[styles.linkIconCircle, { backgroundColor: `${theme.primary}18` }]}>
              <Ionicons name="cloud-download-outline" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.linkRowTitle, { color: theme.textPrimary }]}>
                Export & Restore Database
              </Text>
              <Text style={[styles.linkRowSub, { color: theme.textSecondary }]}>
                Save offline JSON backups or export tasks to CSV
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

          {hasNotifPerm === false && (
            <>
              <TouchableOpacity
                style={[styles.linkRow, { backgroundColor: `${theme.danger}15` }]}
                onPress={async () => {
                  const res = await NotificationService.requestPermissions();
                  setHasNotifPerm(res.granted);
                  if (res.granted) {
                    showToast('Notification permission granted!', 'success');
                  } else {
                    Alert.alert(
                      'Notifications Disabled',
                      'Please open device Settings -> Apps -> CSE Compass -> Notifications and toggle notifications ON to receive deadline alarms.'
                    );
                  }
                }}
              >
                <View style={[styles.linkIconCircle, { backgroundColor: `${theme.danger}25` }]}>
                  <Ionicons name="notifications-off-outline" size={18} color={theme.danger} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.linkRowTitle, { color: theme.danger, fontWeight: '700' }]}>
                    Enable Deadline Notifications
                  </Text>
                  <Text style={[styles.linkRowSub, { color: theme.textSecondary }]}>
                    Permissions are currently disabled. Tap to grant permission.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.danger} />
              </TouchableOpacity>
              <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />
            </>
          )}

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/reminders')}
          >
            <View style={[styles.linkIconCircle, { backgroundColor: `${theme.warning}18` }]}>
              <Ionicons name="notifications-outline" size={18} color={theme.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.linkRowTitle, { color: theme.textPrimary }]}>
                Upcoming Scheduled Notifications
              </Text>
              <Text style={[styles.linkRowSub, { color: theme.textSecondary }]}>
                Manage active device alerts and exact alarms
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/onboarding')}
          >
            <View style={[styles.linkIconCircle, { backgroundColor: `${theme.accent}18` }]}>
              <Ionicons name="help-buoy-outline" size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.linkRowTitle, { color: theme.textPrimary }]}>
                View Welcome Tour & Guide
              </Text>
              <Text style={[styles.linkRowSub, { color: theme.textSecondary }]}>
                Review app features and B.Tech CSE planner guide
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Danger Zone */}
        <Text style={[styles.sectionTitle, { color: theme.danger }]}>Danger Zone</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surface, borderColor: theme.dangerSubtle }]}>
          <TouchableOpacity style={styles.linkRow} onPress={handleResetData}>
            <View style={[styles.linkIconCircle, { backgroundColor: theme.dangerSubtle }]}>
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.linkRowTitle, { color: theme.danger }]}>
                Reset All Application Data
              </Text>
              <Text style={[styles.linkRowSub, { color: theme.textSecondary }]}>
                Restores starter curriculum and clears all custom entries
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About Info */}
        <View style={styles.aboutFooter}>
          <Text style={[styles.aboutTitle, { color: theme.textMuted }]}>
            CSE Compass • Version 1.0.0
          </Text>
          <Text style={[styles.aboutSubtitle, { color: theme.textMuted }]}>
            Crafted for Computer Science & Engineering Students • 100% Offline-First
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileSub: {
    fontSize: 12,
    marginTop: 2,
  },
  collegeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  editProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editForm: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  formInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  saveBtn: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  settingsGroup: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
  },
  themeOptionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 11,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingRowTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingRowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
  },
  numberStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  linkIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRowTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  linkRowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  aboutFooter: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 24,
  },
  aboutTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  aboutSubtitle: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
