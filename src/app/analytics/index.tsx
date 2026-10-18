import React, { useMemo } from 'react';
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
import { CircularProgress } from '../../components/CircularProgress';

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { tasks, subjects, codingProblems, studySessions, assessments } = useApp();

  // Completion stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Study hours
  const totalStudyMinutes = useMemo(() => {
    return studySessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  }, [studySessions]);

  // Coding stats
  const solvedCount = codingProblems.filter((p) => p.status === 'solved').length;
  const attemptedCount = codingProblems.filter((p) => p.status === 'attempted').length;

  // Subject task breakdown
  const subjectTaskCounts = useMemo(() => {
    const map: Record<string, { total: number; completed: number; name: string; color: string }> = {};
    subjects.forEach((s) => {
      map[s.id] = { total: 0, completed: 0, name: s.code, color: s.color };
    });

    tasks.forEach((t) => {
      if (t.subject_id && map[t.subject_id]) {
        map[t.subject_id].total++;
        if (t.completed) map[t.subject_id].completed++;
      }
    });

    return Object.values(map);
  }, [subjects, tasks]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Academic Analytics</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Hero KPI Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
              Overall Productivity
            </Text>
            <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
              {completedTasks} completed out of {totalTasks} academic tasks
            </Text>

            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiNum, { color: theme.primary }]}>
                  {Math.round(totalStudyMinutes / 60)}h
                </Text>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Deep Work</Text>
              </View>

              <View style={[styles.kpiDivider, { backgroundColor: theme.divider }]} />

              <View style={styles.kpiBox}>
                <Text style={[styles.kpiNum, { color: theme.accent }]}>
                  {solvedCount}
                </Text>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>DSA Solved</Text>
              </View>

              <View style={[styles.kpiDivider, { backgroundColor: theme.divider }]} />

              <View style={styles.kpiBox}>
                <Text style={[styles.kpiNum, { color: theme.success }]}>
                  {assessments.filter((a) => a.completed).length}
                </Text>
                <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Exams Cleared</Text>
              </View>
            </View>
          </View>

          <CircularProgress
            percentage={taskCompletionRate}
            size={95}
            strokeWidth={9}
            label="Rate"
          />
        </View>

        {/* Course-by-Course Task Completion */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          Course Task Completion Rates
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          {subjectTaskCounts.map((sub, idx) => {
            const pct = sub.total > 0 ? Math.round((sub.completed / sub.total) * 100) : 0;
            return (
              <View key={idx} style={styles.subjectStatItem}>
                <View style={styles.statLabelRow}>
                  <Text style={[styles.subjectCode, { color: sub.color }]}>{sub.name}</Text>
                  <Text style={[styles.statFraction, { color: theme.textSecondary }]}>
                    {sub.completed}/{sub.total} tasks ({pct}%)
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: theme.borderSubtle }]}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: sub.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Coding Difficulty Breakdown */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          Coding Problem Proficiency
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.codingStatsRow}>
            <View style={styles.codeStatBox}>
              <Text style={[styles.codeStatNum, { color: theme.textSecondary }]}>
                {attemptedCount}
              </Text>
              <Text style={[styles.codeStatLabel, { color: theme.textSecondary }]}>Attempted</Text>
            </View>

            <View style={styles.codeStatBox}>
              <Text style={[styles.codeStatNum, { color: theme.success }]}>
                {codingProblems.filter((p) => p.difficulty === 'Easy' && p.status === 'solved').length}
              </Text>
              <Text style={[styles.codeStatLabel, { color: theme.textSecondary }]}>Easy Solved</Text>
            </View>

            <View style={styles.codeStatBox}>
              <Text style={[styles.codeStatNum, { color: theme.warning }]}>
                {codingProblems.filter((p) => p.difficulty === 'Medium' && p.status === 'solved').length}
              </Text>
              <Text style={[styles.codeStatLabel, { color: theme.textSecondary }]}>Medium Solved</Text>
            </View>

            <View style={styles.codeStatBox}>
              <Text style={[styles.codeStatNum, { color: theme.danger }]}>
                {codingProblems.filter((p) => p.difficulty === 'Hard' && p.status === 'solved').length}
              </Text>
              <Text style={[styles.codeStatLabel, { color: theme.textSecondary }]}>Hard Solved</Text>
            </View>
          </View>
        </View>
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
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  heroSub: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  kpiBox: {
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  subjectStatItem: {
    marginBottom: 12,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '800',
  },
  statFraction: {
    fontSize: 11,
  },
  track: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2.5,
  },
  codingStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  codeStatBox: {
    alignItems: 'center',
  },
  codeStatNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  codeStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
