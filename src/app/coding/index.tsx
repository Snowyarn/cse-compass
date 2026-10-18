import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import {
  CodingProblem,
  CodingDifficulty,
  CodingPlatform,
  CodingLanguage,
  CodingTopic,
} from '../../types';
import { getLocalDateString } from '../../utils/date';

const PLATFORMS: CodingPlatform[] = ['LeetCode', 'Codeforces', 'HackerRank', 'GeeksforGeeks', 'CodeChef', 'Other'];
const LANGUAGES: CodingLanguage[] = ['C++', 'Python', 'Java', 'C', 'JavaScript', 'TypeScript', 'Go', 'Rust'];
const DIFFICULTIES: CodingDifficulty[] = ['Easy', 'Medium', 'Hard'];
const TOPICS: CodingTopic[] = [
  'Arrays',
  'Strings',
  'Linked Lists',
  'Stacks & Queues',
  'Trees',
  'Graphs',
  'DP',
  'Recursion',
  'Sorting & Searching',
  'Bit Manipulation',
  'Math',
  'Greedy',
  'Other',
];

export default function CodingTrackerScreen() {
  const { theme } = useTheme();
  const { codingProblems, createCodingProblem, updateCodingProblem, deleteCodingProblem, showToast } = useApp();

  // Filters
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Add Problem Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<CodingPlatform>('LeetCode');
  const [language, setLanguage] = useState<CodingLanguage>('C++');
  const [difficulty, setDifficulty] = useState<CodingDifficulty>('Medium');
  const [topic, setTopic] = useState<CodingTopic>('Arrays');
  const [notes, setNotes] = useState('');
  const [problemUrl, setProblemUrl] = useState('');

  // Stats calculation
  const totalSolved = useMemo(() => codingProblems.filter((p) => p.status === 'solved').length, [codingProblems]);
  const easyCount = useMemo(() => codingProblems.filter((p) => p.difficulty === 'Easy' && p.status === 'solved').length, [codingProblems]);
  const medCount = useMemo(() => codingProblems.filter((p) => p.difficulty === 'Medium' && p.status === 'solved').length, [codingProblems]);
  const hardCount = useMemo(() => codingProblems.filter((p) => p.difficulty === 'Hard' && p.status === 'solved').length, [codingProblems]);

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    return codingProblems.filter((p) => {
      if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;
      if (selectedTopic !== 'all' && p.topic !== selectedTopic) return false;
      return true;
    });
  }, [codingProblems, selectedDifficulty, selectedTopic]);

  const handleSaveProblem = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter the problem title or number.');
      return;
    }

    createCodingProblem({
      title: title.trim(),
      platform,
      language,
      difficulty,
      topic,
      attempt_date: getLocalDateString(),
      status: 'solved',
      notes: notes.trim(),
      problem_url: problemUrl.trim() || undefined,
    });

    showToast('Problem added to practice tracker! 💻', 'success');
    setShowAddModal(false);
    setTitle('');
    setNotes('');
    setProblemUrl('');
  };

  const handleToggleStatus = (p: CodingProblem) => {
    const nextStatus: 'solved' | 'attempted' | 'to_review' =
      p.status === 'solved' ? 'to_review' : p.status === 'to_review' ? 'attempted' : 'solved';
    updateCodingProblem({ ...p, status: nextStatus });
    showToast(`Status updated to ${nextStatus.replace('_', ' ')}`, 'info');
  };

  const getDifficultyColor = (diff: CodingDifficulty) => {
    switch (diff) {
      case 'Easy':
        return theme.success;
      case 'Medium':
        return theme.warning;
      case 'Hard':
        return theme.danger;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Coding Practice</Text>
        <TouchableOpacity
          style={[styles.addHeaderBtn, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addHeaderBtnText}>Log Problem</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Practice Analytics Banner */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Text style={[styles.statsCardHeading, { color: theme.textPrimary }]}>
            DSA Problem Solving Portfolio
          </Text>
          <Text style={[styles.statsCardSub, { color: theme.textSecondary }]}>
            Mastering algorithms for technical interviews and competitive programming
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>{totalSolved}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Solved</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.success }]}>{easyCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Easy</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.warning }]}>{medCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Medium</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: theme.danger }]}>{hardCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Hard</Text>
            </View>
          </View>
        </View>

        {/* Difficulty Filter Chips */}
        <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>FILTER BY DIFFICULTY</Text>
        <View style={styles.chipsRow}>
          {['all', 'Easy', 'Medium', 'Hard'].map((d) => {
            const isSelected = selectedDifficulty === d;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setSelectedDifficulty(d)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {d === 'all' ? 'All Difficulties' : d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Topic Filter Chips */}
        <Text style={[styles.filterLabel, { color: theme.textSecondary, marginTop: 10 }]}>FILTER BY TOPIC</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
          {['all', ...TOPICS].map((t) => {
            const isSelected = selectedTopic === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setSelectedTopic(t)}
                style={[
                  styles.chipSmall,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isSelected ? '#FFFFFF' : theme.textSecondary,
                    fontSize: 11,
                    fontWeight: isSelected ? '700' : '500',
                  }}
                >
                  {t === 'all' ? 'All Topics' : t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Problem List */}
        <Text style={[styles.filterLabel, { color: theme.textSecondary, marginTop: 14 }]}>
          SOLVED PROBLEMS ({filteredProblems.length})
        </Text>

        {filteredProblems.map((p) => {
          const diffColor = getDifficultyColor(p.difficulty);
          const isSolved = p.status === 'solved';

          return (
            <View
              key={p.id}
              style={[styles.problemCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            >
              <View style={styles.problemHeader}>
                <TouchableOpacity onPress={() => handleToggleStatus(p)} style={styles.statusBtn}>
                  <Ionicons
                    name={isSolved ? 'checkmark-circle' : 'sync-circle'}
                    size={22}
                    color={isSolved ? theme.success : theme.warning}
                  />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.problemTitle, { color: theme.textPrimary }]}>{p.title}</Text>
                  <View style={styles.badgeGroup}>
                    <View style={[styles.pill, { backgroundColor: `${diffColor}20` }]}>
                      <Text style={[styles.pillText, { color: diffColor }]}>{p.difficulty}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: `${theme.accent}18` }]}>
                      <Text style={[styles.pillText, { color: theme.accent }]}>{p.topic}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: theme.surfaceSubtle }]}>
                      <Text style={[styles.pillText, { color: theme.textMuted }]}>{p.language}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: theme.surfaceSubtle }]}>
                      <Text style={[styles.pillText, { color: theme.textSecondary }]}>{p.platform}</Text>
                    </View>
                  </View>
                </View>

                {p.problem_url ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(p.problem_url!)}
                    style={[styles.linkBtn, { borderColor: theme.border }]}
                  >
                    <Ionicons name="open-outline" size={16} color={theme.primary} />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Delete Problem', `Remove "${p.title}" from your coding tracker?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          deleteCodingProblem(p.id);
                          showToast('Problem deleted', 'info');
                        },
                      },
                    ]);
                  }}
                  style={[styles.linkBtn, { borderColor: theme.borderSubtle, marginLeft: 6 }]}
                >
                  <Ionicons name="trash-outline" size={15} color={theme.danger} />
                </TouchableOpacity>
              </View>

              {p.notes ? (
                <View style={[styles.notesContainer, { backgroundColor: theme.surfaceSubtle, flexDirection: 'row', alignItems: 'flex-start', gap: 6 }]}>
                  <Ionicons name="bulb-outline" size={14} color={theme.primary} style={{ marginTop: 2 }} />
                  <Text style={[styles.notesText, { color: theme.textSecondary, flex: 1 }]}>
                    {p.notes}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Add Problem Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Log Solved Problem</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Problem Title *</Text>
            <TextInput
              placeholder="e.g. 3Sum (LC #15)"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Difficulty</Text>
            <View style={styles.optionsRow}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDifficulty(d)}
                  style={[
                    styles.optionBtn,
                    {
                      backgroundColor: difficulty === d ? getDifficultyColor(d) : theme.inputBg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionBtnText,
                      { color: difficulty === d ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' },
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Platform</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {PLATFORMS.map((plat) => (
                <TouchableOpacity
                  key={plat}
                  onPress={() => setPlatform(plat)}
                  style={[
                    styles.chipSmall,
                    {
                      backgroundColor: platform === plat ? theme.primary : theme.inputBg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: platform === plat ? '#FFFFFF' : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                    {plat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Programming Language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[
                    styles.chipSmall,
                    {
                      backgroundColor: language === lang ? theme.primary : theme.inputBg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: language === lang ? '#FFFFFF' : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DSA Topic</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
              {TOPICS.map((top) => (
                <TouchableOpacity
                  key={top}
                  onPress={() => setTopic(top)}
                  style={[
                    styles.chipSmall,
                    {
                      backgroundColor: topic === top ? theme.primary : theme.inputBg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: topic === top ? '#FFFFFF' : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                    {top}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Key Takeaways & Complexity Notes</Text>
            <TextInput
              placeholder="e.g. Solved with Two Pointers in O(N log N) time after sorting..."
              placeholderTextColor={theme.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={[styles.inputMulti, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Problem Link (URL)</Text>
            <TextInput
              placeholder="https://leetcode.com/problems/..."
              placeholderTextColor={theme.textMuted}
              value={problemUrl}
              onChangeText={setProblemUrl}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              autoCapitalize="none"
              keyboardType="url"
            />

            <TouchableOpacity
              style={[styles.submitProblemBtn, { backgroundColor: theme.primary }]}
              onPress={handleSaveProblem}
            >
              <Text style={styles.submitProblemBtnText}>Save to Practice Portfolio</Text>
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
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  statsCardHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsCardSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  problemCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusBtn: {
    marginRight: 10,
    marginTop: 1,
  },
  problemTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  badgeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  linkBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  notesContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 12,
    lineHeight: 17,
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
  fieldLabel: {
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
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionBtnText: {
    fontSize: 12,
  },
  chipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  submitProblemBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  submitProblemBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
