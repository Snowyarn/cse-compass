import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { Repository } from '../../database/repository';
import { NotificationService } from '../../services/notificationService';
import { getLocalDateString, addDaysToLocalDate } from '../../utils/date';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { toggleTask, deleteTask, updateTask, toggleSubtask, createTask, refreshAllData, showToast } = useApp();

  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const loadTask = React.useCallback(() => {
    if (!id) return;
    const t = Repository.getTaskById(id);
    if (t) {
      setTask(t);
      setEditTitle(t.title);
      setEditDesc(t.description || '');
      setEditDueDate(t.due_date || '');
      setEditDueTime(t.due_time || '');
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  if (!task) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.notFoundText, { color: theme.textSecondary }]}>Task not found.</Text>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Return</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleToggle = async () => {
    const updated = await toggleTask(task.id);
    setTask(updated);
    showToast(updated.completed ? 'Task completed! Great work!' : 'Task reopened', 'success');
  };

  const handleSaveEdits = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Required', 'Task title cannot be empty.');
      return;
    }
    const updated = await updateTask({
      id: task.id,
      title: editTitle.trim(),
      description: editDesc.trim(),
      due_date: editDueDate || undefined,
      due_time: editDueTime || undefined,
    });
    setTask(updated);
    setIsEditing(false);
    showToast('Task updated successfully!', 'success');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task?',
      'Are you sure you want to delete this task? All scheduled reminders and subtasks will also be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTask(task.id);
            showToast('Task removed', 'info');
            router.back();
          },
        },
      ]
    );
  };

  const handleDuplicate = async () => {
    const copy = {
      ...task,
      id: `task-${Date.now()}`,
      title: `${task.title} (Copy)`,
      completed: false,
      completed_at: undefined,
    };
    const subtasksToCopy = task.subtasks?.map((s) => ({ title: s.title })) || [];
    const remindersToCopy = task.reminders?.map((r) => ({
      reminder_type: r.reminder_type,
      scheduled_time: r.scheduled_time,
    })) || [];

    await createTask(copy, subtasksToCopy, remindersToCopy);
    showToast('Task duplicated!', 'success');
    router.back();
  };

  const handleSnooze = async () => {
    // Snooze due date by +1 day using local date utility
    const currentDueDate = task.due_date || getLocalDateString();
    const newDueDate = addDaysToLocalDate(currentDueDate, 1);

    const updated = await updateTask({
      id: task.id,
      due_date: newDueDate,
    });
    setTask(updated);
    showToast(`Task snoozed to ${newDueDate}`, 'info');
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    Repository.addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    refreshAllData();
    loadTask();
  };

  const handleToggleSubtaskItem = (subtaskId: string) => {
    toggleSubtask(subtaskId);
    loadTask();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Top Action Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backTouch}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.topRightActions}>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.topActionIcon}>
            <Ionicons name={isEditing ? 'close' : 'create-outline'} size={20} color={theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDuplicate} style={styles.topActionIcon}>
            <Ionicons name="copy-outline" size={19} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} style={styles.topActionIcon}>
            <Ionicons name="trash-outline" size={19} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Status Toggle Header */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggle}
          style={[
            styles.statusHeaderCard,
            {
              backgroundColor: task.completed ? `${theme.success}15` : theme.surface,
              borderColor: task.completed ? theme.success : theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.checkboxBig,
              {
                backgroundColor: task.completed ? theme.success : 'transparent',
                borderColor: task.completed ? theme.success : theme.textMuted,
              },
            ]}
          >
            {task.completed && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.statusHeaderText,
                { color: task.completed ? theme.success : theme.textPrimary },
              ]}
            >
              {task.completed ? 'Completed' : 'Mark as Complete'}
            </Text>
            {task.completed_at && (
              <Text style={[styles.statusSubText, { color: theme.textMuted }]}>
                Finished on {new Date(task.completed_at).toLocaleString()}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Title & Description View or Edit */}
        {isEditing ? (
          <View style={[styles.editCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Task Title</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              style={[styles.editInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Notes / Description</Text>
            <TextInput
              value={editDesc}
              onChangeText={setEditDesc}
              multiline
              numberOfLines={4}
              style={[styles.editInputMulti, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Due Date (YYYY-MM-DD)</Text>
                <TextInput
                  value={editDueDate}
                  onChangeText={setEditDueDate}
                  style={[styles.editInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                />
              </View>
              <View style={{ width: 110 }}>
                <Text style={[styles.editLabel, { color: theme.textSecondary }]}>Time (HH:mm)</Text>
                <TextInput
                  value={editDueTime}
                  onChangeText={setEditDueTime}
                  style={[styles.editInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveEditBtn, { backgroundColor: theme.primary }]}
              onPress={handleSaveEdits}
            >
              <Text style={styles.saveEditBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.detailsView}>
            <Text style={[styles.taskTitle, { color: theme.textPrimary }]}>{task.title}</Text>

            {task.description ? (
              <Text style={[styles.taskDescription, { color: theme.textSecondary }]}>
                {task.description}
              </Text>
            ) : null}

            {/* Badges / Metadata */}
            <View style={styles.metaRow}>
              {task.subject_name && (
                <View style={[styles.pillBadge, { backgroundColor: `${task.subject_color || theme.primary}20` }]}>
                  <Ionicons name="book-outline" size={12} color={task.subject_color || theme.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.pillBadgeText, { color: task.subject_color || theme.primary }]}>
                    {task.subject_code || task.subject_name}
                  </Text>
                </View>
              )}

              <View style={[styles.pillBadge, { backgroundColor: theme.surfaceSubtle }]}>
                <Text style={[styles.pillBadgeText, { color: theme.textSecondary, textTransform: 'capitalize' }]}>
                  {task.category}
                </Text>
              </View>

              <View
                style={[
                  styles.pillBadge,
                  {
                    backgroundColor:
                      task.priority === 'urgent'
                        ? `${theme.danger}20`
                        : task.priority === 'high'
                        ? `${theme.warning}20`
                        : theme.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillBadgeText,
                    {
                      color:
                        task.priority === 'urgent'
                          ? theme.danger
                          : task.priority === 'high'
                          ? theme.warning
                          : theme.textSecondary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {task.priority.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Quick Action Snooze & Focus */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={handleSnooze}
              >
                <Ionicons name="alarm-outline" size={16} color={theme.warning} style={{ marginRight: 6 }} />
                <Text style={[styles.quickActionBtnText, { color: theme.textPrimary }]}>Snooze +1 Day</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() =>
                  router.push({
                    pathname: '/timer',
                    params: { taskId: task.id, subjectId: task.subject_id || '' },
                  })
                }
              >
                <Ionicons name="play" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.quickActionBtnText, { color: '#FFFFFF' }]}>Start Timer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Subtask Checklist Section */}
        <View style={styles.subtasksSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Checklist ({task.subtasks?.length || 0})
          </Text>

          <View style={[styles.subtaskInputCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              placeholder="Add checklist item..."
              placeholderTextColor={theme.textMuted}
              value={newSubtaskTitle}
              onChangeText={setNewSubtaskTitle}
              style={[styles.subtaskInput, { color: theme.textPrimary }]}
              onSubmitEditing={handleAddSubtask}
            />
            <TouchableOpacity onPress={handleAddSubtask} style={[styles.subtaskAddBtn, { backgroundColor: theme.primary }]}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {task.subtasks?.map((st) => (
            <TouchableOpacity
              key={st.id}
              activeOpacity={0.8}
              onPress={() => handleToggleSubtaskItem(st.id)}
              style={[
                styles.subtaskRow,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.subtaskBox,
                  {
                    backgroundColor: st.completed ? theme.success : 'transparent',
                    borderColor: st.completed ? theme.success : theme.textMuted,
                  },
                ]}
              >
                {st.completed && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text
                style={[
                  styles.subtaskTitle,
                  {
                    color: st.completed ? theme.textMuted : theme.textPrimary,
                    textDecorationLine: st.completed ? 'line-through' : 'none',
                  },
                ]}
              >
                {st.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scheduled Reminders List */}
        <View style={styles.remindersSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Scheduled Device Notifications
          </Text>
          {task.reminders && task.reminders.length > 0 ? (
            task.reminders.map((rem) => (
              <View
                key={rem.id}
                style={[styles.reminderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name="notifications" size={16} color={theme.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.remCardLabel, { color: theme.textPrimary }]}>
                    {NotificationService.getReminderLabel(rem.reminder_type)}
                  </Text>
                  <Text style={[styles.remCardTime, { color: theme.textSecondary }]}>
                    {new Date(rem.scheduled_time).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.remStatusBadge, { backgroundColor: `${theme.primary}18` }]}>
                  <Text style={[styles.remStatusText, { color: theme.primary }]}>{rem.status.toUpperCase()}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.noRemindersText, { color: theme.textMuted }]}>
              No scheduled reminders for this task.
            </Text>
          )}
        </View>

        {/* Timestamps */}
        <View style={styles.metaFooter}>
          <Text style={[styles.metaFooterText, { color: theme.textMuted }]}>
            Created: {new Date(task.created_at).toLocaleString()}
          </Text>
          <Text style={[styles.metaFooterText, { color: theme.textMuted }]}>
            Last Updated: {new Date(task.updated_at).toLocaleString()}
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backTouch: {
    padding: 4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topActionIcon: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  checkboxBig: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  detailsView: {
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  editCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  editInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  editInputMulti: {
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  saveEditBtn: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveEditBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  subtasksSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  subtaskInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 10,
    height: 42,
    marginBottom: 10,
  },
  subtaskInput: {
    flex: 1,
    fontSize: 13,
  },
  subtaskAddBtn: {
    width: 42,
    height: 42,
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  subtaskBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subtaskTitle: {
    fontSize: 13,
    flex: 1,
  },
  remindersSection: {
    marginBottom: 20,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  remCardLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  remCardTime: {
    fontSize: 11,
    marginTop: 2,
  },
  remStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  remStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  noRemindersText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  metaFooter: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  metaFooterText: {
    fontSize: 11,
  },
});
