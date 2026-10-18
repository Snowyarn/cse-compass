import React, { useState } from 'react';
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
import { SUBJECT_PALETTE } from '../../theme/colors';
import { getLocalDateString } from '../../utils/date';

export default function HubScreen() {
  const { theme } = useTheme();
  const { subjects, assessments, codingProblems, projects, studySessions, settings, createSubject, showToast } = useApp();

  // New Subject Modal State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubCredits, setNewSubCredits] = useState('4');
  const [newSubInstructor, setNewSubInstructor] = useState('');
  const [selectedColor, setSelectedColor] = useState(SUBJECT_PALETTE[0]);

  // Total credits
  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

  // Solved coding count
  const solvedCount = codingProblems.filter((p) => p.status === 'solved').length;

  // Pending assessments
  const pendingAssessments = assessments.filter((a) => !a.completed);
  const nextAssessment = pendingAssessments.length > 0 ? pendingAssessments[0] : null;

  // Today study minutes
  const todayStr = getLocalDateString();
  const todayStudyMins = studySessions
    .filter((s) => s.start_time.startsWith(todayStr))
    .reduce((acc, s) => acc + s.duration_minutes, 0);

  const handleCreateSubject = () => {
    if (!newSubName.trim() || !newSubCode.trim()) {
      Alert.alert('Required Fields', 'Please enter both the subject name and course code.');
      return;
    }

    createSubject({
      id: `sub-${Date.now()}`,
      name: newSubName.trim(),
      code: newSubCode.trim().toUpperCase(),
      semester: settings.semester || 3,
      credits: parseInt(newSubCredits, 10) || 4,
      instructor: newSubInstructor.trim(),
      color: selectedColor,
      icon: 'book',
    });

    showToast('New subject added to semester curriculum!', 'success');
    setShowAddSubjectModal(false);
    setNewSubName('');
    setNewSubCode('');
    setNewSubInstructor('');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: theme.divider }]}>
        <View>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            CSE Hub
          </Text>
          <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            Semester {settings.semester} • {totalCredits} Registered Credits
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addSubjectHeaderBtn, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddSubjectModal(true)}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addSubjectHeaderBtnText}>Add Subject</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Next Academic Assessment Alert if pending */}
        {nextAssessment && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/assessments')}
            style={[styles.assessmentBanner, { backgroundColor: `${theme.danger}14`, borderColor: theme.danger }]}
          >
            <View style={[styles.examIconCircle, { backgroundColor: theme.danger }]}>
              <Ionicons name="school" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.assessmentBannerTag, { color: theme.danger }]}>
                UPCOMING ASSESSMENT
              </Text>
              <Text numberOfLines={1} style={[styles.assessmentBannerTitle, { color: theme.textPrimary }]}>
                {nextAssessment.title}
              </Text>
              <Text style={[styles.assessmentBannerDate, { color: theme.textSecondary }]}>
                Due on {nextAssessment.due_date} {nextAssessment.due_time ? `@ ${nextAssessment.due_time}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.danger} />
          </TouchableOpacity>
        )}

        {/* 4 Feature Launchers Grid */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          Engineering Command Centers
        </Text>

        <View style={styles.launcherGrid}>
          {/* 1. Coding Practice */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/coding')}
            style={[styles.launcherCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          >
            <View style={[styles.launcherIconBox, { backgroundColor: `${theme.accent}18` }]}>
              <Ionicons name="code-slash" size={22} color={theme.accent} />
            </View>
            <Text style={[styles.launcherTitle, { color: theme.textPrimary }]}>
              Coding Practice
            </Text>
            <Text style={[styles.launcherSub, { color: theme.textSecondary }]}>
              {solvedCount} problems solved • LeetCode & DSA
            </Text>
            <View style={styles.launcherBadgeRow}>
              <View style={[styles.pillBadge, { backgroundColor: `${theme.success}18` }]}>
                <Text style={[styles.pillText, { color: theme.success }]}>Active Tracker</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 2. Exams & Assessments */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/assessments')}
            style={[styles.launcherCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          >
            <View style={[styles.launcherIconBox, { backgroundColor: `${theme.danger}18` }]}>
              <Ionicons name="school-outline" size={22} color={theme.danger} />
            </View>
            <Text style={[styles.launcherTitle, { color: theme.textPrimary }]}>
              Assessments & Vivas
            </Text>
            <Text style={[styles.launcherSub, { color: theme.textSecondary }]}>
              {pendingAssessments.length} pending tests & labs
            </Text>
            <View style={styles.launcherBadgeRow}>
              <View style={[styles.pillBadge, { backgroundColor: `${theme.danger}18` }]}>
                <Text style={[styles.pillText, { color: theme.danger }]}>Mid-Sems & Finals</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 3. Projects & Milestones */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/projects')}
            style={[styles.launcherCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          >
            <View style={[styles.launcherIconBox, { backgroundColor: `${theme.primary}18` }]}>
              <Ionicons name="git-network-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.launcherTitle, { color: theme.textPrimary }]}>
              CSE Projects
            </Text>
            <Text style={[styles.launcherSub, { color: theme.textSecondary }]}>
              {projects.length} software architectures & repos
            </Text>
            <View style={styles.launcherBadgeRow}>
              <View style={[styles.pillBadge, { backgroundColor: `${theme.primary}18` }]}>
                <Text style={[styles.pillText, { color: theme.primary }]}>Milestones</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 4. Focus & Pomodoro Timer */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/timer')}
            style={[styles.launcherCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          >
            <View style={[styles.launcherIconBox, { backgroundColor: `${theme.warning}18` }]}>
              <Ionicons name="timer-outline" size={22} color={theme.warning} />
            </View>
            <Text style={[styles.launcherTitle, { color: theme.textPrimary }]}>
              Study Sessions
            </Text>
            <Text style={[styles.launcherSub, { color: theme.textSecondary }]}>
              {todayStudyMins} mins clocked today
            </Text>
            <View style={styles.launcherBadgeRow}>
              <View style={[styles.pillBadge, { backgroundColor: `${theme.warning}18` }]}>
                <Text style={[styles.pillText, { color: theme.warning }]}>Pomodoro</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Subjects & Syllabus Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary, marginBottom: 0 }]}>
            Course Subjects ({subjects.length})
          </Text>
          <TouchableOpacity onPress={() => router.push('/syllabus')}>
            <Text style={[styles.seeAllSyllabus, { color: theme.primary }]}>Full Syllabus Tracker</Text>
          </TouchableOpacity>
        </View>

        {subjects.map((sub) => (
          <TouchableOpacity
            key={sub.id}
            activeOpacity={0.8}
            onPress={() => router.push(`/subject/${sub.id}`)}
            style={[styles.subjectCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          >
            <View style={styles.subjectCardHeader}>
              <View style={[styles.subjectColorIcon, { backgroundColor: sub.color }]}>
                <Ionicons name="book" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.subjectCodeRow}>
                  <Text style={[styles.subjectCode, { color: sub.color }]}>
                    {sub.code}
                  </Text>
                  <Text style={[styles.subjectCredits, { color: theme.textMuted }]}>
                    {sub.credits} Credits • Sem {sub.semester}
                  </Text>
                </View>
                <Text numberOfLines={1} style={[styles.subjectName, { color: theme.textPrimary }]}>
                  {sub.name}
                </Text>
                {sub.instructor ? (
                  <Text style={[styles.instructorText, { color: theme.textSecondary }]}>
                    {sub.instructor}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </View>

            {/* Syllabus progress bar */}
            <View style={styles.syllabusProgressRow}>
              <View style={styles.syllabusLabelRow}>
                <Text style={[styles.syllabusLabel, { color: theme.textSecondary }]}>
                  Syllabus Coverage
                </Text>
                <Text style={[styles.syllabusPercent, { color: sub.color }]}>
                  {sub.syllabus_progress}%
                </Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: theme.borderSubtle }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${sub.syllabus_progress}%`, backgroundColor: sub.color },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Quick Add Custom Subject Button */}
        <TouchableOpacity
          style={[styles.addSubjectDashedBtn, { borderColor: theme.border, backgroundColor: theme.surfaceSubtle }]}
          onPress={() => setShowAddSubjectModal(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.addSubjectDashedText, { color: theme.primary }]}>
            Register New B.Tech Subject
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Subject Modal */}
      <Modal visible={showAddSubjectModal} transparent animationType="slide" onRequestClose={() => setShowAddSubjectModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeading, { color: theme.textPrimary }]}>Add New Subject</Text>
              <TouchableOpacity onPress={() => setShowAddSubjectModal(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Subject Name *</Text>
            <TextInput
              placeholder="e.g. Computer Networks"
              placeholderTextColor={theme.textMuted}
              value={newSubName}
              onChangeText={setNewSubName}
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Course Code *</Text>
                <TextInput
                  placeholder="e.g. CS303"
                  placeholderTextColor={theme.textMuted}
                  value={newSubCode}
                  onChangeText={setNewSubCode}
                  style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                  autoCapitalize="characters"
                />
              </View>

              <View style={{ width: 90 }}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Credits</Text>
                <TextInput
                  placeholder="4"
                  placeholderTextColor={theme.textMuted}
                  value={newSubCredits}
                  onChangeText={setNewSubCredits}
                  keyboardType="numeric"
                  style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Professor / Instructor Name</Text>
            <TextInput
              placeholder="e.g. Dr. A. Ramanujan"
              placeholderTextColor={theme.textMuted}
              value={newSubInstructor}
              onChangeText={setNewSubInstructor}
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Subject Theme Color</Text>
            <View style={styles.colorPaletteRow}>
              {SUBJECT_PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: c,
                      borderWidth: selectedColor === c ? 3 : 0,
                      borderColor: '#FFFFFF',
                    },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
              onPress={handleCreateSubject}
            >
              <Text style={styles.modalSubmitBtnText}>Create Subject</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  addSubjectHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addSubjectHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  assessmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  examIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessmentBannerTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  assessmentBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  assessmentBannerDate: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
  },
  seeAllSyllabus: {
    fontSize: 12,
    fontWeight: '600',
  },
  launcherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  launcherCard: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  launcherIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  launcherTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  launcherSub: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  launcherBadgeRow: {
    flexDirection: 'row',
  },
  pillBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subjectCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  subjectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectColorIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subjectCredits: {
    fontSize: 11,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  instructorText: {
    fontSize: 11,
    marginTop: 2,
  },
  syllabusProgressRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  syllabusLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  syllabusLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  syllabusPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  addSubjectDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  addSubjectDashedText: {
    fontSize: 13,
    fontWeight: '700',
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
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  modalSubmitBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
