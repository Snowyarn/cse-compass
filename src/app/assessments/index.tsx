import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { AssessmentType } from '../../types';

const ASSESSMENT_TYPES: { id: AssessmentType; label: string }[] = [
  { id: 'mid_sem', label: 'Mid-Sem Exam' },
  { id: 'end_sem', label: 'End-Sem Final' },
  { id: 'lab_exam', label: 'Lab Practical' },
  { id: 'viva', label: 'Viva Voce' },
  { id: 'internal', label: 'Internal Test' },
  { id: 'assignment', label: 'Major Assignment' },
];

export default function AssessmentsScreen() {
  const { theme } = useTheme();
  const { assessments, subjects, createAssessment, toggleAssessment, deleteAssessment, showToast } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('mid_sem');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('10:00');
  const [totalMarks, setTotalMarks] = useState('50');
  const [weightage, setWeightage] = useState('20');
  const [notes, setNotes] = useState('');

  // Days remaining calculation
  const getRemainingDays = (dateStr: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'pending') return !a.completed;
      if (activeFilter === 'completed') return a.completed;
      return a.assessment_type === activeFilter;
    });
  }, [assessments, activeFilter]);

  const handleSaveAssessment = () => {
    if (!title.trim() || !dueDate.trim() || !subjectId) {
      Alert.alert('Required Fields', 'Please enter title, due date, and select a subject.');
      return;
    }

    createAssessment({
      title: title.trim(),
      subject_id: subjectId,
      assessment_type: assessmentType,
      due_date: dueDate.trim(),
      due_time: dueTime.trim() || undefined,
      total_marks: parseInt(totalMarks, 10) || 50,
      weightage: parseInt(weightage, 10) || 20,
      notes: notes.trim(),
      completed: false,
    });

    showToast('Assessment scheduled with exam countdown! 🎓', 'success');
    setShowAddModal(false);
    setTitle('');
    setNotes('');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Exams & Assessments</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Schedule</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['all', 'pending', 'mid_sem', 'end_sem', 'lab_exam', 'viva', 'completed'].map((f) => {
            const isSelected = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {f.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Assessment Cards */}
        {filteredAssessments.map((a) => {
          const diffDays = getRemainingDays(a.due_date);
          const isUrgent = diffDays >= 0 && diffDays <= 3;
          const isOverdue = diffDays < 0;

          return (
            <View
              key={a.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: isUrgent ? theme.danger : theme.cardBorder,
                  borderLeftWidth: 4,
                  borderLeftColor: a.subject_color || theme.primary,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <TouchableOpacity onPress={() => toggleAssessment(a.id)} style={styles.checkBtn}>
                  <Ionicons
                    name={a.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={a.completed ? theme.success : theme.textMuted}
                  />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: a.completed ? theme.textMuted : theme.textPrimary,
                        textDecorationLine: a.completed ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {a.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.subBadge, { color: a.subject_color || theme.primary }]}>
                      {a.subject_name}
                    </Text>
                    <Text style={[styles.metaItem, { color: theme.textSecondary }]}>
                      • {a.assessment_type.replace('_', ' ').toUpperCase()}
                    </Text>
                    {a.total_marks ? (
                      <Text style={[styles.metaItem, { color: theme.textMuted }]}>
                        • {a.total_marks} Marks ({a.weightage}% wt)
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Countdown Badge */}
                {!a.completed && (
                  <View
                    style={[
                      styles.countdownBadge,
                      {
                        backgroundColor: isUrgent
                          ? `${theme.danger}20`
                          : isOverdue
                          ? `${theme.danger}20`
                          : `${theme.primary}18`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countdownText,
                        {
                          color: isUrgent ? theme.danger : isOverdue ? theme.danger : theme.primary,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {diffDays === 0
                        ? 'TODAY'
                        : diffDays === 1
                        ? '1 DAY'
                        : diffDays > 1
                        ? `${diffDays} DAYS`
                        : `${Math.abs(diffDays)}d AGO`}
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.cardFooter, { borderTopColor: theme.divider }]}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                  <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                    Date: {a.due_date} {a.due_time ? `@ ${a.due_time}` : ''}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => deleteAssessment(a.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {a.notes ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Ionicons name="document-text-outline" size={14} color={theme.textMuted} />
                  <Text style={[styles.notesText, { color: theme.textSecondary, flex: 1 }]}>
                    {a.notes}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Add Assessment Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Schedule Assessment</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Title *</Text>
            <TextInput
              placeholder="e.g. Operating Systems Mid-Sem Exam"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Subject *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {subjects.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => setSubjectId(sub.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: subjectId === sub.id ? `${sub.color}25` : theme.inputBg,
                      borderColor: subjectId === sub.id ? sub.color : theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: subjectId === sub.id ? sub.color : theme.textSecondary, fontSize: 11, fontWeight: '700' }}>
                    {sub.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Assessment Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {ASSESSMENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setAssessmentType(t.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: assessmentType === t.id ? theme.primary : theme.inputBg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: assessmentType === t.id ? '#FFFFFF' : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Date (YYYY-MM-DD) *</Text>
                <TextInput
                  placeholder="2026-10-25"
                  placeholderTextColor={theme.textMuted}
                  value={dueDate}
                  onChangeText={setDueDate}
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                />
              </View>
              <View style={{ width: 110 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Time</Text>
                <TextInput
                  placeholder="10:00"
                  placeholderTextColor={theme.textMuted}
                  value={dueTime}
                  onChangeText={setDueTime}
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Total Marks</Text>
                <TextInput
                  value={totalMarks}
                  onChangeText={setTotalMarks}
                  keyboardType="numeric"
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Weightage %</Text>
                <TextInput
                  value={weightage}
                  onChangeText={setWeightage}
                  keyboardType="numeric"
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Syllabus Units / Notes</Text>
            <TextInput
              placeholder="e.g. Units 1 and 2: Process Scheduling, Threads, Concurrency..."
              placeholderTextColor={theme.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={[styles.inputMulti, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSaveAssessment}
            >
              <Text style={styles.saveBtnText}>Save Assessment</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkBtn: {
    marginRight: 10,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  subBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaItem: {
    fontSize: 11,
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countdownText: {
    fontSize: 10,
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
    gap: 6,
  },
  dateText: {
    fontSize: 12,
  },
  notesText: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  inputMulti: {
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  saveBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
