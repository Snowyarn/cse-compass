import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Task } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { router } from 'expo-router';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  showSubject?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, showSubject = true }) => {
  const { theme } = useTheme();
  const { toggleTask, deleteTask, showToast } = useApp();

  const handleToggle = async (e?: any) => {
    e?.stopPropagation?.();
    const updated = await toggleTask(task.id);
    if (updated.completed) {
      showToast('Task marked as completed! 🎉', 'success');
    } else {
      showToast('Task reopened', 'info');
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/task/${task.id}`);
    }
  };

  // Due Date & Overdue Calculation
  const isOverdue = React.useMemo(() => {
    if (task.completed || !task.due_date) return false;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (task.due_date < todayStr) return true;
    if (task.due_date === todayStr && task.due_time) {
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMins = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMins}`;
      return task.due_time < currentTime;
    }
    return false;
  }, [task.completed, task.due_date, task.due_time]);

  const isDueToday = React.useMemo(() => {
    if (!task.due_date) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return task.due_date === todayStr;
  }, [task.due_date]);

  // Subtask progress
  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

  // Priority color
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'urgent':
        return theme.danger;
      case 'high':
        return theme.warning;
      case 'medium':
        return theme.info;
      case 'low':
      default:
        return theme.textMuted;
    }
  };

  const priorityColor = getPriorityColor();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: isOverdue ? theme.danger : theme.cardBorder,
          borderLeftWidth: isOverdue ? 4 : 1,
          borderLeftColor: isOverdue ? theme.danger : (task.subject_color || theme.cardBorder),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        {/* Checkbox button */}
        <TouchableOpacity
          onPress={handleToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[
            styles.checkbox,
            {
              borderColor: task.completed ? theme.success : theme.textMuted,
              backgroundColor: task.completed ? theme.success : 'transparent',
            },
          ]}
        >
          {task.completed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </TouchableOpacity>

        {/* Title and tags */}
        <View style={styles.contentColumn}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                color: task.completed ? theme.textMuted : theme.textPrimary,
                textDecorationLine: task.completed ? 'line-through' : 'none',
              },
            ]}
          >
            {task.title}
          </Text>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            {/* Subject Tag */}
            {showSubject && task.subject_name && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${task.subject_color || theme.primary}18` },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: task.subject_color || theme.primary },
                  ]}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.badgeText,
                    { color: task.subject_color || theme.primary },
                  ]}
                >
                  {task.subject_code || task.subject_name}
                </Text>
              </View>
            )}

            {/* Priority Tag */}
            <View
              style={[
                styles.badge,
                { backgroundColor: `${priorityColor}18` },
              ]}
            >
              <Text style={[styles.badgeText, { color: priorityColor, fontWeight: '700' }]}>
                {task.priority.toUpperCase()}
              </Text>
            </View>

            {/* Estimated Minutes */}
            {task.estimated_minutes && task.estimated_minutes > 0 ? (
              <View style={[styles.badge, { backgroundColor: theme.surfaceSubtle }]}>
                <Ionicons name="time-outline" size={11} color={theme.textMuted} style={{ marginRight: 2 }} />
                <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                  {task.estimated_minutes}m
                </Text>
              </View>
            ) : null}

            {/* Active Reminder Indicator */}
            {task.reminders && task.reminders.length > 0 && !task.completed && (
              <View style={[styles.badge, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="notifications" size={10} color={theme.primary} style={{ marginRight: 2 }} />
                <Text style={[styles.badgeText, { color: theme.primary, fontWeight: '600' }]}>
                  {task.reminders.length}
                </Text>
              </View>
            )}

            {/* Recurring Task Icon */}
            {task.is_recurring && (
              <Ionicons name="repeat" size={13} color={theme.textMuted} style={{ marginLeft: 2 }} />
            )}
          </View>
        </View>
      </View>

      {/* Subtasks Progress Bar if present */}
      {subtasksCount > 0 && (
        <View style={styles.subtaskContainer}>
          <View style={styles.subtaskHeader}>
            <Text style={[styles.subtaskText, { color: theme.textSecondary }]}>
              Checklist: {completedSubtasks}/{subtasksCount}
            </Text>
            <Text style={[styles.subtaskText, { color: theme.textSecondary }]}>
              {Math.round((completedSubtasks / subtasksCount) * 100)}%
            </Text>
          </View>
          <View style={[styles.subtaskTrack, { backgroundColor: theme.borderSubtle }]}>
            <View
              style={[
                styles.subtaskFill,
                {
                  width: `${(completedSubtasks / subtasksCount) * 100}%`,
                  backgroundColor: completedSubtasks === subtasksCount ? theme.success : theme.primary,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Card Footer: Due Date / Overdue Status */}
      {task.due_date && (
        <View style={[styles.cardFooter, { borderTopColor: theme.divider }]}>
          <View style={styles.dateRow}>
            <Ionicons
              name={isOverdue ? 'alert-circle' : 'calendar-outline'}
              size={13}
              color={isOverdue ? theme.danger : isDueToday ? theme.warning : theme.textMuted}
            />
            <Text
              style={[
                styles.dateText,
                {
                  color: isOverdue
                    ? theme.danger
                    : isDueToday
                    ? theme.warning
                    : theme.textSecondary,
                  fontWeight: isOverdue || isDueToday ? '700' : '500',
                },
              ]}
            >
              {isOverdue ? 'Overdue: ' : isDueToday ? 'Today, ' : ''}
              {task.due_date} {task.due_time ? `@ ${task.due_time}` : ''}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  contentColumn: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtaskContainer: {
    marginTop: 10,
    paddingTop: 8,
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subtaskText: {
    fontSize: 11,
    fontWeight: '500',
  },
  subtaskTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  subtaskFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
  },
});
