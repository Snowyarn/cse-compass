import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { router } from 'expo-router';

interface FocusTaskCardProps {
  task: Task;
  reason: string;
}

export const FocusTaskCard: React.FC<FocusTaskCardProps> = ({ task, reason }) => {
  const { theme } = useTheme();
  const { toggleTask, showToast } = useApp();

  const handleComplete = async (e: any) => {
    e.stopPropagation();
    await toggleTask(task.id);
    showToast('Focus task completed! Awesome progress!', 'success');
  };

  const handleStartTimer = (e: any) => {
    e.stopPropagation();
    router.push({
      pathname: '/timer',
      params: { taskId: task.id, subjectId: task.subject_id || '' },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/task/${task.id}`)}
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.primary,
          shadowColor: theme.primary,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.headerTag}>
          <Ionicons name="sparkles" size={14} color={theme.accent} />
          <Text style={[styles.headerTagText, { color: theme.accent }]}>
            NEXT BEST FOCUS TASK
          </Text>
        </View>

        {reason ? (
          <View style={[styles.reasonBadge, { backgroundColor: `${theme.primary}25` }]}>
            <Text style={[styles.reasonText, { color: theme.primaryLight }]}>
              {reason}
            </Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={2} style={[styles.title, { color: theme.textPrimary }]}>
        {task.title}
      </Text>

      {task.description ? (
        <Text numberOfLines={2} style={[styles.description, { color: theme.textSecondary }]}>
          {task.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        {task.subject_name && (
          <View style={[styles.metaPill, { backgroundColor: `${task.subject_color || theme.primary}18` }]}>
            <View style={[styles.dot, { backgroundColor: task.subject_color || theme.primary }]} />
            <Text style={[styles.metaPillText, { color: task.subject_color || theme.primary }]}>
              {task.subject_code || task.subject_name}
            </Text>
          </View>
        )}

        {task.estimated_minutes ? (
          <View style={[styles.metaPill, { backgroundColor: theme.surfaceSubtle }]}>
            <Ionicons name="time-outline" size={12} color={theme.textMuted} />
            <Text style={[styles.metaPillText, { color: theme.textSecondary }]}>
              {task.estimated_minutes} min focus
            </Text>
          </View>
        ) : null}

        {task.due_date && (
          <View style={[styles.metaPill, { backgroundColor: theme.surfaceSubtle }]}>
            <Ionicons name="calendar-outline" size={12} color={theme.textMuted} />
            <Text style={[styles.metaPillText, { color: theme.textSecondary }]}>
              {task.due_date}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleStartTimer}
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="play" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.primaryButtonText}>Start Focus Session</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleComplete}
          style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <Ionicons name="checkmark-done" size={16} color={theme.success} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  reasonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
