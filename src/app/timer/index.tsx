import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { NotificationService } from '../../services/notificationService';

type TimerMode = 'work' | 'break';

export default function TimerScreen() {
  const { theme } = useTheme();
  const { subjects, tasks, settings, studySessions, logStudySession, showToast } = useApp();
  const params = useLocalSearchParams<{ taskId?: string; subjectId?: string }>();

  const [mode, setMode] = useState<TimerMode>('work');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(params.subjectId || null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(params.taskId || null);

  // Timer duration in seconds
  const workSeconds = (settings.pomodoro_work_mins || 25) * 60;
  const breakSeconds = (settings.pomodoro_break_mins || 5) * 60;

  const [timeLeft, setTimeLeft] = useState(workSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const notificationIdRef = useRef<string | null>(null);

  // Interval timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerComplete = async () => {
    setIsRunning(false);

    if (mode === 'work') {
      const minutesCompleted = settings.pomodoro_work_mins || 25;
      logStudySession({
        subject_id: selectedSubjectId || undefined,
        task_id: selectedTaskId || undefined,
        start_time: new Date(Date.now() - minutesCompleted * 60 * 1000).toISOString(),
        duration_minutes: minutesCompleted,
        notes: 'Pomodoro focus sprint',
        session_type: 'pomodoro',
      });

      showToast(`🎯 Fantastic! ${minutesCompleted} mins logged. Take a 5 min break!`, 'success');
      setMode('break');
      setTimeLeft(breakSeconds);
    } else {
      showToast('Break is over! Ready for another focus session?', 'info');
      setMode('work');
      setTimeLeft(workSeconds);
    }
  };

  const handleStart = async () => {
    setIsRunning(true);
    // Schedule background completion alert
    const targetMins = Math.ceil(timeLeft / 60);
    const sub = subjects.find((s) => s.id === selectedSubjectId);
    const notifId = await NotificationService.scheduleFocusTimerEnd(
      targetMins,
      sub ? sub.name : 'Computer Science Study'
    );
    notificationIdRef.current = notifId;
  };

  const handlePause = () => {
    setIsRunning(false);
    if (notificationIdRef.current) {
      NotificationService.cancelNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (notificationIdRef.current) {
      NotificationService.cancelNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    setTimeLeft(mode === 'work' ? workSeconds : breakSeconds);
  };

  const handleSwitchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    if (notificationIdRef.current) {
      NotificationService.cancelNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? workSeconds : breakSeconds);
  };

  // Formatted mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Study hours by subject calculation
  const subjectHours = useMemo(() => {
    const map: Record<string, number> = {};
    studySessions.forEach((sess) => {
      const key = sess.subject_id || 'General';
      map[key] = (map[key] || 0) + sess.duration_minutes;
    });
    return map;
  }, [studySessions]);

  const totalStudyMinutes = useMemo(() => {
    return studySessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  }, [studySessions]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Study & Focus Timer</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mode Toggle (Work / Break) */}
        <View style={[styles.modeToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: mode === 'work' ? theme.primary : 'transparent' }]}
            onPress={() => handleSwitchMode('work')}
          >
            <Ionicons
              name="flash"
              size={15}
              color={mode === 'work' ? '#FFFFFF' : theme.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === 'work' ? '#FFFFFF' : theme.textSecondary, fontWeight: mode === 'work' ? '700' : '500' },
              ]}
            >
              Focus Sprint ({settings.pomodoro_work_mins}m)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: mode === 'break' ? theme.success : 'transparent' }]}
            onPress={() => handleSwitchMode('break')}
          >
            <Ionicons
              name="cafe-outline"
              size={15}
              color={mode === 'break' ? '#FFFFFF' : theme.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === 'break' ? '#FFFFFF' : theme.textSecondary, fontWeight: mode === 'break' ? '700' : '500' },
              ]}
            >
              Rest Break ({settings.pomodoro_break_mins}m)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Circular Display */}
        <View style={styles.clockContainer}>
          <View
            style={[
              styles.clockRing,
              {
                borderColor: mode === 'work' ? theme.primary : theme.success,
                backgroundColor: theme.surface,
              },
            ]}
          >
            <Text style={[styles.clockTime, { color: theme.textPrimary }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={[styles.clockStatus, { color: mode === 'work' ? theme.primary : theme.success }]}>
              {isRunning ? 'FOCUSING' : 'PAUSED'}
            </Text>
          </View>
        </View>

        {/* Controls Row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtnSecondary, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBtnPrimary,
              { backgroundColor: mode === 'work' ? theme.primary : theme.success },
            ]}
            onPress={isRunning ? handlePause : handleStart}
          >
            <Ionicons name={isRunning ? 'pause' : 'play'} size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtnSecondary, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleTimerComplete}
          >
            <Ionicons name="checkmark-done" size={20} color={theme.success} />
          </TouchableOpacity>
        </View>

        {/* Associate with Subject */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          Associate with B.Tech Subject
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectsRow}>
          <TouchableOpacity
            onPress={() => setSelectedSubjectId(null)}
            style={[
              styles.subjectPill,
              {
                backgroundColor: selectedSubjectId === null ? `${theme.primary}20` : theme.surface,
                borderColor: selectedSubjectId === null ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.subjectPillText,
                { color: selectedSubjectId === null ? theme.primary : theme.textSecondary },
              ]}
            >
              General Focus
            </Text>
          </TouchableOpacity>

          {subjects.map((s) => {
            const isSelected = selectedSubjectId === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedSubjectId(s.id)}
                style={[
                  styles.subjectPill,
                  {
                    backgroundColor: isSelected ? `${s.color}25` : theme.surface,
                    borderColor: isSelected ? s.color : theme.border,
                  },
                ]}
              >
                <View style={[styles.pillDot, { backgroundColor: s.color }]} />
                <Text
                  style={[
                    styles.subjectPillText,
                    { color: isSelected ? s.color : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {s.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Study Analytics Snapshot */}
        <View style={[styles.analyticsCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.analyticsHeader}>
            <Ionicons name="stats-chart-outline" size={18} color={theme.primary} />
            <Text style={[styles.analyticsTitle, { color: theme.textPrimary }]}>
              Cumulative Study Hours: {Math.round(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m
            </Text>
          </View>

          {subjects.map((sub) => {
            const mins = subjectHours[sub.id] || 0;
            const pct = totalStudyMinutes > 0 ? Math.round((mins / totalStudyMinutes) * 100) : 0;

            return (
              <View key={sub.id} style={styles.subStatRow}>
                <View style={styles.subStatLabelRow}>
                  <Text style={[styles.subStatName, { color: theme.textPrimary }]}>{sub.name}</Text>
                  <Text style={[styles.subStatMins, { color: sub.color }]}>{mins} mins ({pct}%)</Text>
                </View>
                <View style={[styles.statTrack, { backgroundColor: theme.borderSubtle }]}>
                  <View style={[styles.statFill, { width: `${pct}%`, backgroundColor: sub.color }]} />
                </View>
              </View>
            );
          })}
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
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  modeBtnText: {
    fontSize: 12,
  },
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  clockRing: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  clockTime: {
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1,
  },
  clockStatus: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 20,
  },
  controlBtnPrimary: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  controlBtnSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 10,
  },
  subjectsRow: {
    gap: 8,
    paddingBottom: 16,
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subjectPillText: {
    fontSize: 12,
  },
  analyticsCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginTop: 10,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  subStatRow: {
    marginBottom: 10,
  },
  subStatLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subStatName: {
    fontSize: 12,
    fontWeight: '600',
  },
  subStatMins: {
    fontSize: 11,
    fontWeight: '700',
  },
  statTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 2,
  },
});
