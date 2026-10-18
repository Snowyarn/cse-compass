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
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { Subject, SyllabusUnit, SyllabusTopic, Task } from '../../types';
import { Repository } from '../../database/repository';
import { TaskCard } from '../../components/TaskCard';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { deleteSubject, showToast } = useApp();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [syllabus, setSyllabus] = useState<SyllabusUnit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'syllabus' | 'tasks' | 'assessments'>('syllabus');

  // New Unit / Topic Modal/Inputs
  const [newTopicUnitId, setNewTopicUnitId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [showAddUnitInput, setShowAddUnitInput] = useState(false);

  const loadData = React.useCallback(() => {
    if (!id) return;
    const sub = Repository.getSubjectById(id);
    if (sub) {
      setSubject(sub);
      setSyllabus(Repository.getSyllabusForSubject(id));
      setTasks(Repository.getAllTasks({ subjectId: id }));
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!subject) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.notFoundText, { color: theme.textSecondary }]}>Subject not found.</Text>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Return</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleTopicStatusCycle = (topic: SyllabusTopic) => {
    const nextStatus: 'not_started' | 'in_progress' | 'completed' =
      topic.status === 'not_started'
        ? 'in_progress'
        : topic.status === 'in_progress'
        ? 'completed'
        : 'not_started';

    Repository.updateTopicStatus(topic.id, nextStatus);
    loadData();
  };

  const handleIncrementRevision = (topic: SyllabusTopic) => {
    Repository.updateTopicStatus(topic.id, topic.status, topic.revision_count + 1, topic.notes);
    loadData();
    showToast(`Revision count updated to ${topic.revision_count + 1}`, 'info');
  };

  const handleAddTopic = (unitId: string) => {
    if (!newTopicTitle.trim()) return;
    Repository.addTopic(unitId, subject.id, newTopicTitle.trim());
    setNewTopicTitle('');
    setNewTopicUnitId(null);
    loadData();
    showToast('Topic added to unit', 'success');
  };

  const handleAddUnit = () => {
    if (!newUnitTitle.trim()) return;
    Repository.addUnit(subject.id, newUnitTitle.trim());
    setNewUnitTitle('');
    setShowAddUnitInput(false);
    loadData();
    showToast('Syllabus unit created', 'success');
  };

  const handleDeleteSubject = () => {
    Alert.alert(
      'Remove Subject?',
      `Are you sure you want to remove ${subject.name}? This will delete all associated syllabus topics and assessments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteSubject(subject.id);
            showToast('Subject removed', 'info');
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Top Header Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backTouch}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteSubject} style={styles.deleteTouch}>
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subject Header Card */}
        <View style={[styles.subjectHeroCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.heroRow}>
            <View style={[styles.heroIconBox, { backgroundColor: subject.color }]}>
              <Ionicons name="book" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.codeBadgeRow}>
                <Text style={[styles.codeBadge, { color: subject.color }]}>{subject.code}</Text>
                <Text style={[styles.creditBadge, { color: theme.textMuted }]}>
                  {subject.credits} Credits • Sem {subject.semester}
                </Text>
              </View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>{subject.name}</Text>
              {subject.instructor ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="person-outline" size={13} color={theme.textMuted} />
                  <Text style={[styles.instructorHero, { color: theme.textSecondary, marginTop: 0 }]}>
                    {subject.instructor}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.heroProgressSection}>
            <View style={styles.progressTextRow}>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                Syllabus Mastery
              </Text>
              <Text style={[styles.progressVal, { color: subject.color }]}>
                {subject.syllabus_progress}%
              </Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: theme.borderSubtle }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${subject.syllabus_progress}%`, backgroundColor: subject.color },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabBarTrack, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.tabBtn, { backgroundColor: activeTab === 'syllabus' ? theme.primary : 'transparent' }]}
            onPress={() => setActiveTab('syllabus')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'syllabus' ? '#FFFFFF' : theme.textSecondary, fontWeight: activeTab === 'syllabus' ? '700' : '500' },
              ]}
            >
              Syllabus Units
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, { backgroundColor: activeTab === 'tasks' ? theme.primary : 'transparent' }]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'tasks' ? '#FFFFFF' : theme.textSecondary, fontWeight: activeTab === 'tasks' ? '700' : '500' },
              ]}
            >
              Tasks ({tasks.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Syllabus Tab View */}
        {activeTab === 'syllabus' && (
          <View>
            {syllabus.map((unit) => (
              <View
                key={unit.id}
                style={[styles.unitCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
              >
                <View style={styles.unitHeader}>
                  <Text style={[styles.unitNum, { color: subject.color }]}>UNIT {unit.unit_number}</Text>
                  <Text style={[styles.unitTitle, { color: theme.textPrimary }]}>{unit.title}</Text>
                </View>

                {unit.topics && unit.topics.length > 0 ? (
                  unit.topics.map((t) => {
                    const isDone = t.status === 'completed';
                    const isInProg = t.status === 'in_progress';

                    return (
                      <View
                        key={t.id}
                        style={[
                          styles.topicRow,
                          {
                            backgroundColor: isDone ? `${theme.success}10` : theme.surfaceSubtle,
                            borderColor: isDone ? theme.success : theme.borderSubtle,
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.topicStatusBtn}
                          onPress={() => handleTopicStatusCycle(t)}
                        >
                          <Ionicons
                            name={
                              isDone
                                ? 'checkmark-circle'
                                : isInProg
                                ? 'time-outline'
                                : 'ellipse-outline'
                            }
                            size={18}
                            color={isDone ? theme.success : isInProg ? theme.warning : theme.textMuted}
                          />
                        </TouchableOpacity>

                        <View style={{ flex: 1, paddingHorizontal: 8 }}>
                          <Text
                            style={[
                              styles.topicTitle,
                              {
                                color: isDone ? theme.textMuted : theme.textPrimary,
                                textDecorationLine: isDone ? 'line-through' : 'none',
                              },
                            ]}
                          >
                            {t.title}
                          </Text>
                          <View style={styles.topicMetaRow}>
                            <Text
                              style={[
                                styles.topicStatusLabel,
                                {
                                  color: isDone
                                    ? theme.success
                                    : isInProg
                                    ? theme.warning
                                    : theme.textMuted,
                                },
                              ]}
                            >
                              {t.status.replace('_', ' ').toUpperCase()}
                            </Text>
                            <Text style={[styles.revisionLabel, { color: theme.textSecondary }]}>
                              • {t.revision_count} Revisions
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.revisionBtn, { borderColor: theme.border }]}
                          onPress={() => handleIncrementRevision(t)}
                        >
                          <Ionicons name="refresh" size={13} color={theme.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                ) : (
                  <Text style={[styles.emptyUnitText, { color: theme.textMuted }]}>
                    No topics listed under this unit.
                  </Text>
                )}

                {/* Add Topic Input within this Unit */}
                {newTopicUnitId === unit.id ? (
                  <View style={styles.addTopicBox}>
                    <TextInput
                      placeholder="Topic name (e.g. Infix to Postfix conversion)..."
                      placeholderTextColor={theme.textMuted}
                      value={newTopicTitle}
                      onChangeText={setNewTopicTitle}
                      style={[styles.topicInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                      onSubmitEditing={() => handleAddTopic(unit.id)}
                    />
                    <View style={styles.addTopicActions}>
                      <TouchableOpacity
                        style={[styles.topicCancelBtn, { borderColor: theme.border }]}
                        onPress={() => {
                          setNewTopicUnitId(null);
                          setNewTopicTitle('');
                        }}
                      >
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.topicSaveBtn, { backgroundColor: theme.primary }]}
                        onPress={() => handleAddTopic(unit.id)}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addTopicInlineBtn}
                    onPress={() => setNewTopicUnitId(unit.id)}
                  >
                    <Ionicons name="add" size={16} color={subject.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.addTopicInlineText, { color: subject.color }]}>Add Topic to Unit</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Add New Unit Input / Button */}
            {showAddUnitInput ? (
              <View style={[styles.addUnitCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.addUnitHeading, { color: theme.textPrimary }]}>Create New Syllabus Unit</Text>
                <TextInput
                  placeholder="e.g. Unit 5: Distributed Systems & Concurrency"
                  placeholderTextColor={theme.textMuted}
                  value={newUnitTitle}
                  onChangeText={setNewUnitTitle}
                  style={[styles.unitInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                />
                <View style={styles.addTopicActions}>
                  <TouchableOpacity
                    style={[styles.topicCancelBtn, { borderColor: theme.border }]}
                    onPress={() => {
                      setShowAddUnitInput(false);
                      setNewUnitTitle('');
                    }}
                  >
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topicSaveBtn, { backgroundColor: theme.primary }]}
                    onPress={handleAddUnit}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Create Unit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addUnitDashedBtn, { borderColor: theme.border, backgroundColor: theme.surfaceSubtle }]}
                onPress={() => setShowAddUnitInput(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.addUnitDashedText, { color: theme.primary }]}>Add Next Syllabus Unit</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tasks Tab View */}
        {activeTab === 'tasks' && (
          <View>
            <TouchableOpacity
              style={[styles.createTaskForSubjectBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push({ pathname: '/task/create', params: { subjectId: subject.id } })}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.createTaskForSubjectText}>Create Task for {subject.code}</Text>
            </TouchableOpacity>

            {tasks.length === 0 ? (
              <View style={styles.emptyTasksBox}>
                <Text style={[styles.emptyTasksText, { color: theme.textMuted }]}>
                  No active tasks for {subject.name}. Tap above to schedule one.
                </Text>
              </View>
            ) : (
              tasks.map((t) => <TaskCard key={t.id} task={t} showSubject={false} />)
            )}
          </View>
        )}
      </ScrollView>
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
  deleteTouch: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  subjectHeroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeBadge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  creditBadge: {
    fontSize: 11,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  instructorHero: {
    fontSize: 12,
    marginTop: 4,
  },
  heroProgressSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  tabBarTrack: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnText: {
    fontSize: 12,
  },
  unitCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  unitHeader: {
    marginBottom: 12,
  },
  unitNum: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  unitTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  topicStatusBtn: {
    padding: 2,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  topicMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  topicStatusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  revisionLabel: {
    fontSize: 10,
    marginLeft: 4,
  },
  revisionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyUnitText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginVertical: 6,
  },
  addTopicInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  addTopicInlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addTopicBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  topicInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    marginBottom: 8,
  },
  addTopicActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  topicCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  topicSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addUnitCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  addUnitHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  unitInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    marginBottom: 10,
  },
  addUnitDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addUnitDashedText: {
    fontSize: 13,
    fontWeight: '700',
  },
  createTaskForSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  createTaskForSubjectText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyTasksBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
