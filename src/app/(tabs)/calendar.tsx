import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState } from '../../components/EmptyState';
import { getLocalDateString } from '../../utils/date';

type CalendarViewMode = 'month' | 'week' | 'agenda';

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { tasks, assessments } = useApp();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    getLocalDateString()
  );

  const todayStr = useMemo(() => getLocalDateString(), []);

  // Jump to today
  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(getLocalDateString(now));
  };

  // Month navigation
  const handlePrev = () => {
    if (viewMode === 'month') {
      const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      setCurrentDate(prev);
    } else {
      const prev = new Date(currentDate);
      prev.setDate(currentDate.getDate() - 7);
      setCurrentDate(prev);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setCurrentDate(next);
    } else {
      const next = new Date(currentDate);
      next.setDate(currentDate.getDate() + 7);
      setCurrentDate(next);
    }
  };

  // Month/Year string
  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Map of date string -> items (tasks + assessments)
  const dateItemsMap = useMemo(() => {
    const map: Record<string, { hasExam: boolean; hasAssignment: boolean; hasCoding: boolean; hasOther: boolean; count: number }> = {};

    tasks.forEach((t) => {
      if (t.due_date) {
        if (!map[t.due_date]) {
          map[t.due_date] = { hasExam: false, hasAssignment: false, hasCoding: false, hasOther: false, count: 0 };
        }
        map[t.due_date].count++;
        if (t.task_type === 'exam') map[t.due_date].hasExam = true;
        else if (t.task_type === 'assignment' || t.task_type === 'lab') map[t.due_date].hasAssignment = true;
        else if (t.task_type === 'coding') map[t.due_date].hasCoding = true;
        else map[t.due_date].hasOther = true;
      }
    });

    assessments.forEach((a) => {
      if (a.due_date) {
        if (!map[a.due_date]) {
          map[a.due_date] = { hasExam: true, hasAssignment: false, hasCoding: false, hasOther: false, count: 0 };
        }
        map[a.due_date].count++;
        map[a.due_date].hasExam = true;
      }
    });

    return map;
  }, [tasks, assessments]);

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: getLocalDateString(prevDate),
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        dateStr: getLocalDateString(d),
        dayNumber: i,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete rows of 7
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextDate = new Date(year, month + 1, i);
        days.push({
          dateStr: getLocalDateString(nextDate),
          dayNumber: i,
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [currentDate]);

  // Week days
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day; // Sunday of this week
    const weekStart = new Date(curr.setDate(diff));

    const days: { dateStr: string; dayNumber: number; dayName: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push({
        dateStr: getLocalDateString(d),
        dayNumber: d.getDate(),
        dayName: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      });
    }
    return days;
  }, [currentDate]);

  // Tasks for currently selected date
  const selectedDateTasks = useMemo(() => {
    return tasks.filter((t) => t.due_date === selectedDateStr);
  }, [tasks, selectedDateStr]);

  // Selected date assessments
  const selectedDateAssessments = useMemo(() => {
    return assessments.filter((a) => a.due_date === selectedDateStr);
  }, [assessments, selectedDateStr]);

  // Agenda items grouped by date
  const agendaDates = useMemo(() => {
    const dates = Object.keys(dateItemsMap).sort();
    return dates.map((dateStr) => {
      const dayTasks = tasks.filter((t) => t.due_date === dateStr);
      const dayAssessments = assessments.filter((a) => a.due_date === dateStr);
      return {
        dateStr,
        tasks: dayTasks,
        assessments: dayAssessments,
      };
    });
  }, [dateItemsMap, tasks, assessments]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.divider }]}>
        <View>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            Academic Calendar
          </Text>
          <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            Plan lectures, assignments, and exams
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.todayButton, { backgroundColor: `${theme.primary}18`, borderColor: theme.primary }]}
          onPress={handleJumpToToday}
        >
          <Ionicons name="today-outline" size={14} color={theme.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.todayButtonText, { color: theme.primary }]}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle Segment */}
      <View style={styles.modeToggleContainer}>
        <View style={[styles.segmentTrack, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {(['month', 'week', 'agenda'] as CalendarViewMode[]).map((mode) => {
            const isActive = viewMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.segmentButton,
                  { backgroundColor: isActive ? theme.primary : 'transparent' },
                ]}
                onPress={() => setViewMode(mode)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isActive ? '#FFFFFF' : theme.textSecondary, fontWeight: isActive ? '700' : '500' },
                  ]}
                >
                  {mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Month / Week Navigator Header */}
      {viewMode !== 'agenda' && (
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={handlePrev} style={[styles.navArrow, { borderColor: theme.border }]}>
            <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.monthLabel, { color: theme.textPrimary }]}>
            {monthYearLabel}
          </Text>

          <TouchableOpacity onPress={handleNext} style={[styles.navArrow, { borderColor: theme.border }]}>
            <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Content depending on view mode */}
      {viewMode === 'month' && (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Day of Week Headers */}
          <View style={styles.dayOfWeekHeaderRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <View key={idx} style={styles.dayOfWeekCell}>
                <Text style={[styles.dayOfWeekText, { color: theme.textMuted }]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Month Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, idx) => {
              const isSelected = item.dateStr === selectedDateStr;
              const isToday = item.dateStr === todayStr;
              const dayMeta = dateItemsMap[item.dateStr];

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDateStr(item.dateStr)}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : isToday
                        ? `${theme.primary}15`
                        : 'transparent',
                      borderRadius: 10,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayCellNumber,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isToday
                          ? theme.primary
                          : item.isCurrentMonth
                          ? theme.textPrimary
                          : theme.textMuted,
                        fontWeight: isSelected || isToday ? '700' : '500',
                      },
                    ]}
                  >
                    {item.dayNumber}
                  </Text>

                  {/* Marker dots */}
                  {dayMeta && (
                    <View style={styles.markerDotsRow}>
                      {dayMeta.hasExam && (
                        <View style={[styles.markerDot, { backgroundColor: isSelected ? '#FFFFFF' : theme.danger }]} />
                      )}
                      {dayMeta.hasAssignment && (
                        <View style={[styles.markerDot, { backgroundColor: isSelected ? '#FFFFFF' : theme.info }]} />
                      )}
                      {dayMeta.hasCoding && (
                        <View style={[styles.markerDot, { backgroundColor: isSelected ? '#FFFFFF' : theme.success }]} />
                      )}
                      {dayMeta.hasOther && !dayMeta.hasExam && !dayMeta.hasAssignment && (
                        <View style={[styles.markerDot, { backgroundColor: isSelected ? '#FFFFFF' : theme.warning }]} />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Marker Legend */}
          <View style={[styles.legendRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>Exam</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.info }]} />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>Assignment/Lab</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>Coding</Text>
            </View>
          </View>

          {/* Selected Date Tasks Section */}
          <View style={styles.selectedDateSection}>
            <View style={styles.selectedHeader}>
              <View>
                <Text style={[styles.selectedDateTitle, { color: theme.textPrimary }]}>
                  {selectedDateStr === todayStr ? 'Today, ' : ''}
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={[styles.selectedDateSub, { color: theme.textSecondary }]}>
                  {selectedDateTasks.length + selectedDateAssessments.length} item(s) scheduled
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.addForDateBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: '/task/create', params: { initialDate: selectedDateStr } })}
              >
                <Ionicons name="add" size={16} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.addForDateText, { color: theme.primary }]}>Add for Date</Text>
              </TouchableOpacity>
            </View>

            {/* Assessment Cards if any for this day */}
            {selectedDateAssessments.map((a) => (
              <View
                key={a.id}
                style={[styles.examCard, { backgroundColor: `${theme.danger}12`, borderColor: theme.danger }]}
              >
                <Ionicons name="school" size={18} color={theme.danger} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.examTitle, { color: theme.danger }]}>
                    {a.title}
                  </Text>
                  <Text style={[styles.examSub, { color: theme.textSecondary }]}>
                    {a.assessment_type.toUpperCase()} • {a.due_time || 'Time TBA'} • {a.total_marks || 0} Marks
                  </Text>
                </View>
              </View>
            ))}

            {selectedDateTasks.length === 0 && selectedDateAssessments.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="No tasks on this date"
                description="Your schedule is open on this day. Schedule a lecture review or study sprint."
                actionLabel="Create Task for Date"
                onAction={() =>
                  router.push({ pathname: '/task/create', params: { initialDate: selectedDateStr } })
                }
              />
            ) : (
              selectedDateTasks.map((t) => <TaskCard key={t.id} task={t} />)
            )}
          </View>
        </ScrollView>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Week Strip */}
          <View style={styles.weekStrip}>
            {weekDays.map((item, idx) => {
              const isSelected = item.dateStr === selectedDateStr;
              const isToday = item.dateStr === todayStr;
              const dayMeta = dateItemsMap[item.dateStr];

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedDateStr(item.dateStr)}
                  style={[
                    styles.weekDayCard,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : isToday
                        ? `${theme.primary}18`
                        : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.weekDayName,
                      { color: isSelected ? '#FFFFFF' : theme.textMuted },
                    ]}
                  >
                    {item.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.weekDayNumber,
                      { color: isSelected ? '#FFFFFF' : theme.textPrimary, fontWeight: '700' },
                    ]}
                  >
                    {item.dayNumber}
                  </Text>
                  {dayMeta && (
                    <View
                      style={[
                        styles.weekDot,
                        { backgroundColor: isSelected ? '#FFFFFF' : theme.accent },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Tasks */}
          <View style={styles.selectedDateSection}>
            <View style={styles.selectedHeader}>
              <Text style={[styles.selectedDateTitle, { color: theme.textPrimary }]}>
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>

              <TouchableOpacity
                style={[styles.addForDateBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push({ pathname: '/task/create', params: { initialDate: selectedDateStr } })}
              >
                <Ionicons name="add" size={16} color={theme.primary} />
                <Text style={[styles.addForDateText, { color: theme.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {selectedDateTasks.length === 0 ? (
              <EmptyState
                icon="sunny-outline"
                title="Free day!"
                description="No tasks scheduled for this day."
                actionLabel="Schedule Task"
                onAction={() =>
                  router.push({ pathname: '/task/create', params: { initialDate: selectedDateStr } })
                }
              />
            ) : (
              selectedDateTasks.map((t) => <TaskCard key={t.id} task={t} />)
            )}
          </View>
        </ScrollView>
      )}

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <FlatList
          data={agendaDates}
          keyExtractor={(item) => item.dateStr}
          contentContainerStyle={styles.agendaContent}
          renderItem={({ item }) => (
            <View style={styles.agendaDayGroup}>
              <View style={[styles.agendaHeader, { backgroundColor: theme.surfaceSubtle }]}>
                <Ionicons name="calendar-outline" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.agendaHeaderText, { color: theme.textPrimary }]}>
                  {item.dateStr === todayStr ? 'Today • ' : ''}
                  {new Date(item.dateStr + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {item.assessments.map((a) => (
                <View
                  key={a.id}
                  style={[styles.examCard, { backgroundColor: `${theme.danger}12`, borderColor: theme.danger, marginHorizontal: 16 }]}
                >
                  <Ionicons name="school" size={16} color={theme.danger} style={{ marginRight: 8 }} />
                  <Text style={[styles.examTitle, { color: theme.danger }]}>
                    {a.title} ({a.assessment_type})
                  </Text>
                </View>
              ))}

              <View style={{ paddingHorizontal: 16 }}>
                {item.tasks.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title="No upcoming scheduled dates"
              description="Tasks with due dates will populate your chronological agenda here."
              actionLabel="Add Dated Task"
              onAction={() => router.push('/task/create')}
            />
          }
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modeToggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  dayOfWeekHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeekText: {
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  dayCellNumber: {
    fontSize: 13,
  },
  markerDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    position: 'absolute',
    bottom: 3,
  },
  markerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
  },
  selectedDateSection: {
    padding: 16,
    paddingBottom: 40,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectedDateSub: {
    fontSize: 12,
    marginTop: 1,
  },
  addForDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  addForDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  examTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  examSub: {
    fontSize: 11,
    marginTop: 2,
  },
  weekStrip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  weekDayCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '600',
  },
  weekDayNumber: {
    fontSize: 15,
  },
  weekDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  agendaContent: {
    paddingBottom: 40,
  },
  agendaDayGroup: {
    marginBottom: 16,
  },
  agendaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
  },
  agendaHeaderText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
