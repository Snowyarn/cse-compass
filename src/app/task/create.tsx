import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import {
  TaskCategory,
  TaskPriority,
  TaskType,
  ReminderType,
} from '../../types';
import { NotificationService } from '../../services/notificationService';

const TASK_CATEGORIES: TaskCategory[] = [
  'Lectures and classwork',
  'Assignments',
  'Data Structures and Algorithms',
  'Operating Systems',
  'Database Management Systems',
  'Computer Organization and Architecture',
  'Discrete Mathematics',
  'Programming in C/C++',
  'Exams and revision',
  'Labs and practicals',
  'Coding practice',
  'Computer Science projects',
  'Internship and placement preparation',
  'Personal tasks',
];

const TASK_TYPES: { id: TaskType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'assignment', label: 'Assignment', icon: 'document-text-outline' },
  { id: 'lab', label: 'Lab / Practical', icon: 'flask-outline' },
  { id: 'exam', label: 'Exam / Test', icon: 'school-outline' },
  { id: 'coding', label: 'Coding Practice', icon: 'code-slash-outline' },
  { id: 'project', label: 'Project Task', icon: 'git-branch-outline' },
  { id: 'lecture', label: 'Lecture / Class', icon: 'book-outline' },
  { id: 'revision', label: 'Revision', icon: 'refresh-outline' },
  { id: 'personal', label: 'Personal', icon: 'person-outline' },
];

export default function CreateTaskScreen() {
  const { theme } = useTheme();
  const { subjects, settings, createTask, showToast } = useApp();
  const params = useLocalSearchParams<{ initialDate?: string; subjectId?: string }>();

  // State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(params.subjectId || null);
  const [category, setCategory] = useState<TaskCategory>('Assignments');
  const [taskType, setTaskType] = useState<TaskType>('assignment');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  // Dates
  const [dueDate, setDueDate] = useState<string>(
    params.initialDate || new Date().toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState('23:59');

  // Duration
  const [estimatedMinutes, setEstimatedMinutes] = useState('45');

  // Subtasks
  const [subtasks, setSubtasks] = useState<{ title: string }[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // Reminders
  const [selectedReminderTypes, setSelectedReminderTypes] = useState<ReminderType[]>([
    settings.default_reminder || 'preset_15m',
  ]);

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<'daily' | 'weekly' | 'weekdays'>('weekly');

  // Tags
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Subtask helpers
  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasks([...subtasks, { title: newSubtaskInput.trim() }]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // Tag helpers
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Reminder toggle
  const toggleReminderPreset = (type: ReminderType) => {
    if (selectedReminderTypes.includes(type)) {
      setSelectedReminderTypes(selectedReminderTypes.filter((t) => t !== type));
    } else {
      setSelectedReminderTypes([...selectedReminderTypes, type]);
    }
  };

  // Quick Date Selectors
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDueDate(d.toISOString().split('T')[0]);
  };

  // Submit Handler
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Task Title Required', 'Please enter a title for this academic task.');
      return;
    }

    // Build reminders array
    const remindersToSchedule = selectedReminderTypes.map((remType) => {
      const trigger = NotificationService.calculateTriggerDate(dueDate, dueTime, remType);
      return {
        reminder_type: remType,
        scheduled_time: trigger ? trigger.toISOString() : new Date().toISOString(),
      };
    });

    try {
      const result = await createTask(
        {
          id: `task-${Date.now()}`,
          title: title.trim(),
          description: description.trim(),
          subject_id: selectedSubjectId || undefined,
          category,
          task_type: taskType,
          due_date: dueDate || undefined,
          due_time: dueTime || undefined,
          priority,
          estimated_minutes: parseInt(estimatedMinutes, 10) || 30,
          completed: false,
          is_recurring: isRecurring,
          recurrence_rule: isRecurring ? recurrenceRule : null,
          tags,
        },
        subtasks,
        remindersToSchedule
      );

      if (result.reminderScheduled) {
        showToast('Task & notifications scheduled successfully! 🎯', 'success');
      } else {
        showToast(result.warning || 'Task created successfully', 'info');
      }

      router.back();
    } catch (e: any) {
      Alert.alert('Error', `Could not create task: ${e.message}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Task Title Input */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>TASK TITLE *</Text>
        <TextInput
          placeholder="e.g. Implement Dijkstra's Shortest Path in C++"
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
          style={[
            styles.titleInput,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
        />

        {/* Notes / Description Input */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>DETAILED NOTES & INSTRUCTIONS</Text>
        <TextInput
          placeholder="Add references, textbook pages, lab deliverables, or algorithm pointers..."
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={[
            styles.descriptionInput,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.textPrimary,
            },
          ]}
        />

        {/* Subject Picker */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>LINKED CSE SUBJECT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChipsRow}>
          <TouchableOpacity
            onPress={() => setSelectedSubjectId(null)}
            style={[
              styles.choiceChip,
              {
                backgroundColor: selectedSubjectId === null ? `${theme.primary}20` : theme.surface,
                borderColor: selectedSubjectId === null ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.choiceChipText,
                { color: selectedSubjectId === null ? theme.primary : theme.textSecondary, fontWeight: '600' },
              ]}
            >
              None / General
            </Text>
          </TouchableOpacity>

          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => setSelectedSubjectId(sub.id)}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: isSelected ? `${sub.color}25` : theme.surface,
                    borderColor: isSelected ? sub.color : theme.border,
                  },
                ]}
              >
                <View style={[styles.chipDot, { backgroundColor: sub.color }]} />
                <Text
                  style={[
                    styles.choiceChipText,
                    { color: isSelected ? sub.color : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {sub.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Task Type Grid */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>TASK TYPE</Text>
        <View style={styles.typesGrid}>
          {TASK_TYPES.map((t) => {
            const isSelected = taskType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTaskType(t.id)}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: isSelected ? `${theme.primary}18` : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Ionicons
                  name={t.icon}
                  size={16}
                  color={isSelected ? theme.primary : theme.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: isSelected ? theme.primary : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Priority Selector */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>PRIORITY LEVEL</Text>
        <View style={styles.priorityRow}>
          {[
            { id: 'low', label: 'Low', color: theme.textMuted },
            { id: 'medium', label: 'Medium', color: theme.info },
            { id: 'high', label: 'High', color: theme.warning },
            { id: 'urgent', label: 'Urgent', color: theme.danger },
          ].map((p) => {
            const isSelected = priority === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setPriority(p.id as TaskPriority)}
                style={[
                  styles.priorityBtn,
                  {
                    backgroundColor: isSelected ? `${p.color}20` : theme.surface,
                    borderColor: isSelected ? p.color : theme.border,
                  },
                ]}
              >
                <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                <Text
                  style={[
                    styles.priorityBtnText,
                    { color: isSelected ? p.color : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Deadline & Quick Dates */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>DEADLINE & DUE DATE</Text>
        <View style={styles.quickDateRow}>
          <TouchableOpacity
            style={[styles.quickDateBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
            onPress={() => setQuickDate(0)}
          >
            <Text style={[styles.quickDateText, { color: theme.textPrimary }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickDateBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
            onPress={() => setQuickDate(1)}
          >
            <Text style={[styles.quickDateText, { color: theme.textPrimary }]}>Tomorrow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickDateBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
            onPress={() => setQuickDate(3)}
          >
            <Text style={[styles.quickDateText, { color: theme.textPrimary }]}>In 3 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickDateBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
            onPress={() => setQuickDate(7)}
          >
            <Text style={[styles.quickDateText, { color: theme.textPrimary }]}>Next Week</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateInputsRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subLabel, { color: theme.textMuted }]}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2026-10-15"
              placeholderTextColor={theme.textMuted}
              style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            />
          </View>
          <View style={{ width: 120 }}>
            <Text style={[styles.subLabel, { color: theme.textMuted }]}>Due Time (HH:mm)</Text>
            <TextInput
              value={dueTime}
              onChangeText={setDueTime}
              placeholder="23:59"
              placeholderTextColor={theme.textMuted}
              style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            />
          </View>
        </View>

        {/* Reminders Selection */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>SMART SCHEDULED REMINDERS</Text>
        <View style={styles.remindersCard}>
          {[
            { id: 'preset_5m' as ReminderType, label: '5 minutes before' },
            { id: 'preset_15m' as ReminderType, label: '15 minutes before' },
            { id: 'preset_30m' as ReminderType, label: '30 minutes before' },
            { id: 'preset_1h' as ReminderType, label: '1 hour before deadline' },
            { id: 'day_before_9am' as ReminderType, label: 'Day before (9:00 AM)' },
          ].map((rem) => {
            const isSelected = selectedReminderTypes.includes(rem.id);
            return (
              <TouchableOpacity
                key={rem.id}
                onPress={() => toggleReminderPreset(rem.id)}
                style={[
                  styles.reminderRow,
                  {
                    backgroundColor: isSelected ? `${theme.primary}12` : 'transparent',
                    borderBottomColor: theme.divider,
                  },
                ]}
              >
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={isSelected ? theme.primary : theme.textMuted}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.reminderRowText,
                    { color: isSelected ? theme.primary : theme.textPrimary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {rem.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Estimated Duration */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>ESTIMATED TIME REQUIRED (MINS)</Text>
        <View style={styles.durationRow}>
          {['15', '30', '45', '60', '90', '120'].map((mins) => {
            const isSelected = estimatedMinutes === mins;
            return (
              <TouchableOpacity
                key={mins}
                onPress={() => setEstimatedMinutes(mins)}
                style={[
                  styles.durationBtn,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.durationBtnText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {mins}m
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subtasks / Checklist Builder */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>
          CHECKLIST & SUBTASKS ({subtasks.length})
        </Text>
        <View style={[styles.subtaskInputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            placeholder="Add subtask step (e.g. Graph Adjacency List)..."
            placeholderTextColor={theme.textMuted}
            value={newSubtaskInput}
            onChangeText={setNewSubtaskInput}
            style={[styles.subtaskTextInput, { color: theme.textPrimary }]}
            onSubmitEditing={handleAddSubtask}
          />
          <TouchableOpacity
            style={[styles.addSubtaskBtn, { backgroundColor: theme.primary }]}
            onPress={handleAddSubtask}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {subtasks.map((st, idx) => (
          <View
            key={idx}
            style={[styles.subtaskItemRow, { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle }]}
          >
            <Ionicons name="ellipse-outline" size={14} color={theme.textMuted} style={{ marginRight: 8 }} />
            <Text style={[styles.subtaskItemText, { color: theme.textPrimary }]}>{st.title}</Text>
            <TouchableOpacity onPress={() => handleRemoveSubtask(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={15} color={theme.danger} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Tags Builder */}
        <Text style={[styles.inputHeading, { color: theme.textSecondary }]}>TAGS</Text>
        <View style={[styles.subtaskInputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            placeholder="Add tag (e.g. C++, Graph, MidSem)..."
            placeholderTextColor={theme.textMuted}
            value={tagInput}
            onChangeText={setTagInput}
            style={[styles.subtaskTextInput, { color: theme.textPrimary }]}
            onSubmitEditing={handleAddTag}
          />
          <TouchableOpacity
            style={[styles.addSubtaskBtn, { backgroundColor: theme.surfaceSubtle }]}
            onPress={handleAddTag}
          >
            <Ionicons name="pricetag-outline" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((t) => (
              <View key={t} style={[styles.tagBadge, { backgroundColor: `${theme.primary}18`, borderColor: theme.primary }]}>
                <Text style={[styles.tagText, { color: theme.primary }]}>#{t}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(t)}>
                  <Ionicons name="close-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Recurrence Toggle */}
        <View style={[styles.recurrenceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.recurrenceHeader}>
            <View>
              <Text style={[styles.recurrenceTitle, { color: theme.textPrimary }]}>Recurring Task</Text>
              <Text style={[styles.recurrenceSub, { color: theme.textSecondary }]}>Repeat on a regular schedule</Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {isRecurring && (
            <View style={styles.recurrenceOptionsRow}>
              {(['daily', 'weekdays', 'weekly'] as const).map((rule) => {
                const isSelected = recurrenceRule === rule;
                return (
                  <TouchableOpacity
                    key={rule}
                    onPress={() => setRecurrenceRule(rule)}
                    style={[
                      styles.ruleBtn,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surfaceSubtle,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ruleBtnText,
                        { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {rule.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.saveTaskButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveTaskButtonText}>Save Task & Arm Reminders</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  titleInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionInput: {
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  horizontalChipsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  choiceChipText: {
    fontSize: 12,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    width: '48%',
  },
  typeButtonText: {
    fontSize: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityBtnText: {
    fontSize: 11,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  quickDateBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  remindersCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  reminderRowText: {
    fontSize: 13,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  durationBtnText: {
    fontSize: 12,
  },
  subtaskInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 12,
    height: 42,
    marginBottom: 8,
  },
  subtaskTextInput: {
    flex: 1,
    fontSize: 13,
  },
  addSubtaskBtn: {
    width: 42,
    height: 42,
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  subtaskItemText: {
    flex: 1,
    fontSize: 13,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recurrenceCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  recurrenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recurrenceTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recurrenceSub: {
    fontSize: 11,
    marginTop: 2,
  },
  recurrenceOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ruleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  ruleBtnText: {
    fontSize: 11,
  },
  saveTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveTaskButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
