import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState } from '../../components/EmptyState';
import { TaskSortOption } from '../../database/repository';
import { TaskPriority } from '../../types';
import { getLocalDateString, addDaysToLocalDate } from '../../utils/date';

type FilterTab = 'all' | 'today' | 'overdue' | 'next7days' | 'high_priority' | 'completed';

export default function TasksScreen() {
  const { theme } = useTheme();
  const { tasks, subjects } = useApp();
  const params = useLocalSearchParams<{ filter?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>(
    (params.filter as FilterTab) || 'all'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<TaskSortOption>('deadline');
  const [showSortModal, setShowSortModal] = useState(false);

  const todayStr = useMemo(() => getLocalDateString(), []);

  // Filter and sort tasks in-memory reactively
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q))) ||
          (t.category && t.category.toLowerCase().includes(q))
      );
    }

    // Subject filter
    if (selectedSubjectId) {
      result = result.filter((t) => t.subject_id === selectedSubjectId);
    }

    // Status filter
    switch (activeFilter) {
      case 'today':
        result = result.filter((t) => t.due_date === todayStr && !t.completed);
        break;
      case 'overdue':
        result = result.filter((t) => !t.completed && t.due_date && t.due_date < todayStr);
        break;
      case 'next7days': {
        const next7Str = addDaysToLocalDate(todayStr, 7);
        result = result.filter(
          (t) => !t.completed && t.due_date && t.due_date >= todayStr && t.due_date <= next7Str
        );
        break;
      }
      case 'high_priority':
        result = result.filter(
          (t) => !t.completed && (t.priority === 'urgent' || t.priority === 'high')
        );
        break;
      case 'completed':
        result = result.filter((t) => t.completed);
        break;
      case 'all':
      default:
        // By default, pending first, or everything
        break;
    }

    // Sort order
    result.sort((a, b) => {
      // Completed always sink to bottom unless completed tab
      if (activeFilter !== 'completed' && a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      if (sortOption === 'deadline') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
        return (a.due_time || '23:59').localeCompare(b.due_time || '23:59');
      }

      if (sortOption === 'priority') {
        const order: Record<TaskPriority, number> = { urgent: 1, high: 2, medium: 3, low: 4 };
        return order[a.priority] - order[b.priority];
      }

      if (sortOption === 'created') {
        return b.created_at.localeCompare(a.created_at);
      }

      if (sortOption === 'duration') {
        return (a.estimated_minutes || 0) - (b.estimated_minutes || 0);
      }

      if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      }

      return 0;
    });

    return result;
  }, [tasks, searchQuery, selectedSubjectId, activeFilter, sortOption, todayStr]);

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: tasks.filter((t) => !t.completed).length },
    { id: 'today', label: 'Due Today', count: tasks.filter((t) => t.due_date === todayStr && !t.completed).length },
    { id: 'overdue', label: 'Overdue', count: tasks.filter((t) => !t.completed && t.due_date && t.due_date < todayStr).length },
    {
      id: 'next7days',
      label: 'Next 7 Days',
      count: tasks.filter((t) => {
        const next7 = new Date();
        next7.setDate(next7.getDate() + 7);
        const next7Str = next7.toISOString().split('T')[0];
        return !t.completed && t.due_date && t.due_date >= todayStr && t.due_date <= next7Str;
      }).length,
    },
    { id: 'high_priority', label: 'Urgent / High', count: tasks.filter((t) => !t.completed && (t.priority === 'urgent' || t.priority === 'high')).length },
    { id: 'completed', label: 'Completed', count: tasks.filter((t) => t.completed).length },
  ];

  const sortLabels: Record<TaskSortOption, string> = {
    deadline: 'Deadline (Earliest)',
    priority: 'Priority (Urgent first)',
    created: 'Date Created (Newest)',
    duration: 'Estimated Duration (Shortest)',
    title: 'Task Title (A - Z)',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: theme.divider }]}>
        <View>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            My Tasks
          </Text>
          <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} matching
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setShowSortModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Sort tasks"
            accessibilityRole="button"
          >
            <Ionicons name="swap-vertical" size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryAddBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/task/create')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Create new task"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.primaryAddBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search tasks by title, tag, or category..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.textInput, { color: theme.textPrimary }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs Horizontal Scroll */}
      <View style={styles.filtersScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveFilter(tab.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? theme.primary : theme.surface,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      styles.filterBadge,
                      {
                        backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : theme.surfaceSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        { color: isActive ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Subject Filter Chips */}
      <View style={styles.subjectFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectChipsRow}>
          <TouchableOpacity
            onPress={() => setSelectedSubjectId(null)}
            style={[
              styles.subjectChip,
              {
                backgroundColor: selectedSubjectId === null ? `${theme.primary}20` : 'transparent',
                borderColor: selectedSubjectId === null ? theme.primary : theme.borderSubtle,
              },
            ]}
          >
            <Text
              style={[
                styles.subjectChipText,
                { color: selectedSubjectId === null ? theme.primary : theme.textSecondary, fontWeight: '600' },
              ]}
            >
              All Subjects
            </Text>
          </TouchableOpacity>

          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => setSelectedSubjectId(isSelected ? null : sub.id)}
                style={[
                  styles.subjectChip,
                  {
                    backgroundColor: isSelected ? `${sub.color}25` : 'transparent',
                    borderColor: isSelected ? sub.color : theme.borderSubtle,
                  },
                ]}
              >
                <View style={[styles.chipDot, { backgroundColor: sub.color }]} />
                <Text
                  style={[
                    styles.subjectChipText,
                    { color: isSelected ? sub.color : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {sub.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard task={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-done-circle-outline"
            title={activeFilter === 'completed' ? 'No completed tasks yet' : 'No tasks match criteria'}
            description={
              searchQuery
                ? 'Try adjusting your search terms or clearing the active filters.'
                : 'Stay ahead of assignments, labs, and revisions by creating your next task.'
            }
            actionLabel="Create Task"
            onAction={() => router.push('/task/create')}
          />
        }
      />

      {/* Sort Options Modal */}
      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Sort Tasks By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {(Object.keys(sortLabels) as TaskSortOption[]).map((key) => {
              const isCurrent = sortOption === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.sortOptionRow,
                    { backgroundColor: isCurrent ? `${theme.primary}15` : 'transparent' },
                  ]}
                  onPress={() => {
                    setSortOption(key);
                    setShowSortModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      { color: isCurrent ? theme.primary : theme.textPrimary, fontWeight: isCurrent ? '700' : '500' },
                    ]}
                  >
                    {sortLabels[key]}
                  </Text>
                  {isCurrent && <Ionicons name="checkmark" size={18} color={theme.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
    gap: 4,
  },
  primaryAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
  },
  filtersScrollContainer: {
    paddingVertical: 8,
  },
  filterPillsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterPillText: {
    fontSize: 12,
  },
  filterBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subjectFilterContainer: {
    paddingBottom: 8,
  },
  subjectChipsRow: {
    paddingHorizontal: 16,
    gap: 6,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subjectChipText: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  sortOptionText: {
    fontSize: 13,
  },
});
