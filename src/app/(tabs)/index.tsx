import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { CircularProgress } from '../../components/CircularProgress';
import { TaskCard } from '../../components/TaskCard';
import { FocusTaskCard } from '../../components/FocusTaskCard';
import { EmptyState } from '../../components/EmptyState';
import { getRecommendedFocusTask } from '../../utils/taskRanking';
import { getLocalDateString } from '../../utils/date';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { tasks, subjects, assessments, upcomingReminders, settings, refreshAllData, isLoading } = useApp();

  // Greeting by time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Formatted date string
  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    };
    return new Date().toLocaleDateString(undefined, options);
  }, []);

  const todayStr = useMemo(() => getLocalDateString(), []);

  // Filter tasks for dashboard
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.due_date === todayStr);
  }, [tasks, todayStr]);

  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed && t.due_date && t.due_date < todayStr);
  }, [tasks, todayStr]);

  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && t.due_date && t.due_date > todayStr)
      .slice(0, 3);
  }, [tasks, todayStr]);

  // Today's completion rate
  const todayStats = useMemo(() => {
    if (todayTasks.length === 0) return { total: 0, completed: 0, percentage: 0 };
    const completed = todayTasks.filter((t) => t.completed).length;
    return {
      total: todayTasks.length,
      completed,
      percentage: Math.round((completed / todayTasks.length) * 100),
    };
  }, [todayTasks]);

  // Overall syllabus progress
  const averageSyllabusProgress = useMemo(() => {
    if (subjects.length === 0) return 0;
    const sum = subjects.reduce((acc, s) => acc + (s.syllabus_progress || 0), 0);
    return Math.round(sum / subjects.length);
  }, [subjects]);

  // Next scheduled reminder
  const nextReminder = useMemo(() => {
    if (upcomingReminders.length === 0) return null;
    return upcomingReminders[0];
  }, [upcomingReminders]);

  // Recommended focus task
  const recommended = useMemo(() => {
    return getRecommendedFocusTask(tasks);
  }, [tasks]);

  // Weekly productivity: completed in last 7 days
  const completedCount = useMemo(() => {
    return tasks.filter((t) => t.completed).length;
  }, [tasks]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.divider }]}>
        <View>
          <Text style={[styles.dateSubtitle, { color: theme.textSecondary }]}>
            {formattedDate}
          </Text>
          <Text style={[styles.greetingTitle, { color: theme.textPrimary }]}>
            {greeting}, {settings.user_name.split(' ')[0]} 👋
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push('/reminders')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={19} color={theme.textPrimary} />
            {upcomingReminders.length > 0 && (
              <View style={[styles.notificationDot, { backgroundColor: theme.danger }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => router.push('/task/create')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshAllData} tintColor={theme.primary} />}
      >
        {/* Overdue Alert Banner if overdue tasks exist */}
        {overdueTasks.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(tabs)/tasks', params: { filter: 'overdue' } })}
            style={[styles.overdueBanner, { backgroundColor: theme.dangerSubtle, borderColor: theme.danger }]}
          >
            <Ionicons name="alert-circle" size={20} color={theme.danger} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.overdueTitle, { color: theme.danger }]}>
                {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}!
              </Text>
              <Text style={[styles.overdueSubtitle, { color: theme.textSecondary }]}>
                Tap to review and clear pending academic deadlines.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.danger} />
          </TouchableOpacity>
        )}

        {/* Daily Progress & Academic Snapshot Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.summaryLeft}>
            <Text style={[styles.summaryCardTitle, { color: theme.textPrimary }]}>
              Today&apos;s Execution
            </Text>
            <Text style={[styles.summaryCardSub, { color: theme.textSecondary }]}>
              {todayStats.completed} of {todayStats.total} tasks completed
            </Text>

            <View style={styles.miniStatsRow}>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatNum, { color: theme.primary }]}>
                  {tasks.filter((t) => !t.completed).length}
                </Text>
                <Text style={[styles.miniStatLabel, { color: theme.textMuted }]}>
                  Pending
                </Text>
              </View>

              <View style={[styles.miniStatDivider, { backgroundColor: theme.divider }]} />

              <View style={styles.miniStat}>
                <Text style={[styles.miniStatNum, { color: theme.success }]}>
                  {averageSyllabusProgress}%
                </Text>
                <Text style={[styles.miniStatLabel, { color: theme.textMuted }]}>
                  Syllabus
                </Text>
              </View>

              <View style={[styles.miniStatDivider, { backgroundColor: theme.divider }]} />

              <View style={styles.miniStat}>
                <Text style={[styles.miniStatNum, { color: theme.accent }]}>
                  {assessments.filter((a) => !a.completed).length}
                </Text>
                <Text style={[styles.miniStatLabel, { color: theme.textMuted }]}>
                  Exams
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryRight}>
            <CircularProgress
              percentage={todayStats.percentage}
              size={90}
              strokeWidth={8}
              label={todayStats.total === 0 ? 'Clear' : 'Done'}
            />
          </View>
        </View>

        {/* Next Scheduled Reminder Pill */}
        {nextReminder && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/reminders')}
            style={[styles.reminderPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          >
            <View style={[styles.bellIconBox, { backgroundColor: `${theme.primary}20` }]}>
              <Ionicons name="notifications" size={15} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.reminderLabel, { color: theme.textMuted }]}>
                NEXT REMINDER
              </Text>
              <Text numberOfLines={1} style={[styles.reminderTaskTitle, { color: theme.textPrimary }]}>
                {nextReminder.task_title}
              </Text>
            </View>
            <Text style={[styles.reminderTime, { color: theme.primary }]}>
              {new Date(nextReminder.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick Academic Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            onPress={() => router.push('/task/create')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: `${theme.primary}18` }]}>
              <Ionicons name="add" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.textPrimary }]}>Add Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            onPress={() => router.push('/timer')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: `${theme.warning}18` }]}>
              <Ionicons name="timer-outline" size={18} color={theme.warning} />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.textPrimary }]}>Study Timer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            onPress={() => router.push('/coding')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: `${theme.accent}18` }]}>
              <Ionicons name="code-slash" size={18} color={theme.accent} />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.textPrimary }]}>Coding Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            onPress={() => router.push('/syllabus')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: `${theme.success}18` }]}>
              <Ionicons name="book-outline" size={18} color={theme.success} />
            </View>
            <Text style={[styles.actionBtnLabel, { color: theme.textPrimary }]}>Syllabus</Text>
          </TouchableOpacity>
        </View>

        {/* Focus Task Recommendation */}
        {recommended && (
          <View style={styles.sectionContainer}>
            <FocusTaskCard task={recommended.task} reason={recommended.reason} />
          </View>
        )}

        {/* Today's Tasks Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Today&apos;s Schedule
              </Text>
              <View style={[styles.countBadge, { backgroundColor: `${theme.primary}18` }]}>
                <Text style={[styles.countText, { color: theme.primary }]}>
                  {todayTasks.length}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {todayTasks.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No tasks scheduled for today"
              description="You have cleared everything for today! Plan ahead or take on an upcoming challenge."
              actionLabel="Add Task for Today"
              onAction={() => router.push('/task/create')}
            />
          ) : (
            todayTasks.map((t) => <TaskCard key={t.id} task={t} />)
          )}
        </View>

        {/* Upcoming Academic Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Upcoming Deadlines
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
                <Text style={[styles.seeAllText, { color: theme.primary }]}>Calendar</Text>
              </TouchableOpacity>
            </View>

            {upcomingDeadlines.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </View>
        )}

        {/* Weekly Productivity Summary */}
        <View style={[styles.productivityCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.productivityHeader}>
            <Ionicons name="trending-up" size={18} color={theme.success} />
            <Text style={[styles.productivityTitle, { color: theme.textPrimary }]}>
              Weekly Momentum
            </Text>
          </View>
          <Text style={[styles.productivityDesc, { color: theme.textSecondary }]}>
            You have completed {completedCount} academic tasks so far. Consistent daily output is the key to mastering your B.Tech CSE coursework.
          </Text>
          <TouchableOpacity
            style={[styles.analyticsLinkBtn, { borderColor: theme.border }]}
            onPress={() => router.push('/analytics')}
          >
            <Text style={[styles.analyticsLinkText, { color: theme.primary }]}>
              Open Analytics Dashboard
            </Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primary} />
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  overdueTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  overdueSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLeft: {
    flex: 1,
    paddingRight: 10,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCardSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  miniStatDivider: {
    width: 1,
    height: 24,
  },
  summaryRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  bellIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  reminderTaskTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  reminderTime: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  productivityCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  productivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  productivityTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  productivityDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  analyticsLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  analyticsLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
