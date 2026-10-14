import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { SyllabusUnit, SyllabusTopic } from '../../types';
import { Repository } from '../../database/repository';

export default function SyllabusScreen() {
  const { theme } = useTheme();
  const { subjects, showToast } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [syllabus, setSyllabus] = useState<SyllabusUnit[]>([]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const loadSyllabus = () => {
    if (selectedSubjectId) {
      setSyllabus(Repository.getSyllabusForSubject(selectedSubjectId));
    }
  };

  useEffect(() => {
    loadSyllabus();
  }, [selectedSubjectId]);

  const handleTopicStatusCycle = (topic: SyllabusTopic) => {
    const nextStatus: 'not_started' | 'in_progress' | 'completed' =
      topic.status === 'not_started'
        ? 'in_progress'
        : topic.status === 'in_progress'
        ? 'completed'
        : 'not_started';

    Repository.updateTopicStatus(topic.id, nextStatus);
    loadSyllabus();
  };

  const handleIncrementRevision = (topic: SyllabusTopic) => {
    Repository.updateTopicStatus(topic.id, topic.status, topic.revision_count + 1, topic.notes);
    loadSyllabus();
    showToast(`Revision count updated for ${topic.title}`, 'info');
  };

  // Stats for this subject
  const totalTopics = syllabus.reduce((acc, u) => acc + (u.topics?.length || 0), 0);
  const completedTopics = syllabus.reduce(
    (acc, u) => acc + (u.topics?.filter((t) => t.status === 'completed').length || 0),
    0
  );
  const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Header Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Syllabus Tracker</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Subject Selector Horizontal Strip */}
      <View style={styles.subjectStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectStrip}>
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => setSelectedSubjectId(sub.id)}
                style={[
                  styles.subjectStripPill,
                  {
                    backgroundColor: isSelected ? sub.color : theme.surface,
                    borderColor: isSelected ? sub.color : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subjectStripText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {sub.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {selectedSubject && (
          <View style={[styles.overviewCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <Text style={[styles.overviewTitle, { color: theme.textPrimary }]}>
              {selectedSubject.name}
            </Text>
            <Text style={[styles.overviewSub, { color: theme.textSecondary }]}>
              {completedTopics} of {totalTopics} topics completed • {selectedSubject.credits} Credits
            </Text>

            <View style={styles.progressRow}>
              <View style={[styles.progressTrack, { backgroundColor: theme.borderSubtle }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPct}%`, backgroundColor: selectedSubject.color },
                  ]}
                />
              </View>
              <Text style={[styles.progressPercentText, { color: selectedSubject.color }]}>
                {progressPct}%
              </Text>
            </View>
          </View>
        )}

        {/* Units List */}
        {syllabus.map((unit) => (
          <View
            key={unit.id}
            style={[styles.unitCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          >
            <View style={styles.unitHeader}>
              <Text style={[styles.unitBadge, { color: selectedSubject?.color || theme.primary }]}>
                UNIT {unit.unit_number}
              </Text>
              <Text style={[styles.unitName, { color: theme.textPrimary }]}>{unit.title}</Text>
            </View>

            {unit.topics?.map((t) => {
              const isDone = t.status === 'completed';
              const isInProg = t.status === 'in_progress';

              return (
                <View
                  key={t.id}
                  style={[
                    styles.topicCard,
                    {
                      backgroundColor: isDone ? `${theme.success}10` : theme.surfaceSubtle,
                      borderColor: isDone ? theme.success : theme.borderSubtle,
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleTopicStatusCycle(t)}
                    style={styles.checkTouch}
                  >
                    <Ionicons
                      name={
                        isDone
                          ? 'checkmark-circle'
                          : isInProg
                          ? 'time-outline'
                          : 'ellipse-outline'
                      }
                      size={20}
                      color={isDone ? theme.success : isInProg ? theme.warning : theme.textMuted}
                    />
                  </TouchableOpacity>

                  <View style={{ flex: 1, paddingRight: 6 }}>
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
                    <View style={styles.metaRow}>
                      <Text
                        style={[
                          styles.statusLabel,
                          { color: isDone ? theme.success : isInProg ? theme.warning : theme.textMuted },
                        ]}
                      >
                        {t.status.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={[styles.revisionCount, { color: theme.textSecondary }]}>
                        • {t.revision_count} Revisions
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.revBtn, { borderColor: theme.border }]}
                    onPress={() => handleIncrementRevision(t)}
                  >
                    <Ionicons name="refresh" size={13} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))}
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
  subjectStripContainer: {
    paddingVertical: 10,
  },
  subjectStrip: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subjectStripPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  subjectStripText: {
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  overviewCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  overviewSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '800',
  },
  unitCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  unitHeader: {
    marginBottom: 10,
  },
  unitBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  unitName: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  checkTouch: {
    padding: 2,
    marginRight: 8,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  revisionCount: {
    fontSize: 10,
    marginLeft: 4,
  },
  revBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
