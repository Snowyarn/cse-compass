import React, { useState } from 'react';
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
import { Project } from '../../types';
import { Repository } from '../../database/repository';

export default function ProjectsScreen() {
  const { theme } = useTheme();
  const { projects, createProject, toggleMilestone, deleteProject, showToast, refreshAllData } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [targetDeadline, setTargetDeadline] = useState('');

  // Inline milestone addition
  const [activeProjectIdForMilestone, setActiveProjectIdForMilestone] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const handleCreateProject = () => {
    if (!name.trim() || !techStack.trim()) {
      Alert.alert('Required Fields', 'Please enter project name and technology stack.');
      return;
    }

    createProject({
      name: name.trim(),
      description: description.trim(),
      tech_stack: techStack.trim(),
      repo_url: repoUrl.trim() || undefined,
      target_deadline: targetDeadline.trim() || undefined,
      status: 'in_progress',
    });

    showToast('CSE Project created! 🚀', 'success');
    setShowAddModal(false);
    setName('');
    setDescription('');
    setTechStack('');
    setRepoUrl('');
    setTargetDeadline('');
  };

  const handleAddMilestoneInline = (projectId: string) => {
    if (!newMilestoneTitle.trim()) return;
    const db = Repository.createProject; // trigger re-render
    const dbInst = require('../../database/db').getDb();
    const msId = `ms-${Date.now()}`;
    dbInst.runSync(
      'INSERT INTO project_milestones (id, project_id, title, completed) VALUES (?, ?, ?, 0)',
      [msId, projectId, newMilestoneTitle.trim()]
    );
    setNewMilestoneTitle('');
    setActiveProjectIdForMilestone(null);
    refreshAllData();
    showToast('Milestone added!', 'success');
  };

  const handleDeleteProject = (p: Project) => {
    Alert.alert(
      'Delete Project?',
      `Are you sure you want to delete ${p.name}? All milestone records will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProject(p.id);
            showToast('Project removed', 'info');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>CSE Projects & Repos</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Project</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {projects.map((p) => {
          const milestones = p.milestones || [];
          const completedCount = milestones.filter((m) => m.completed).length;

          return (
            <View
              key={p.id}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="git-branch" size={20} color={theme.primary} />
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.projectName, { color: theme.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.techStack, { color: theme.accent }]}>
                    🛠 {p.tech_stack}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => handleDeleteProject(p)}>
                  <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {p.description ? (
                <Text style={[styles.descText, { color: theme.textSecondary }]}>
                  {p.description}
                </Text>
              ) : null}

              {/* Progress bar */}
              <View style={styles.progressRow}>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                    Milestone Completion
                  </Text>
                  <Text style={[styles.progressPercent, { color: theme.primary }]}>
                    {p.progress_percentage}% ({completedCount}/{milestones.length})
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: theme.borderSubtle }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${p.progress_percentage}%`,
                        backgroundColor: p.progress_percentage === 100 ? theme.success : theme.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Milestones checklist */}
              <View style={styles.milestonesSection}>
                <Text style={[styles.milestonesHeader, { color: theme.textMuted }]}>
                  PROJECT MILESTONES
                </Text>

                {milestones.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => toggleMilestone(m.id)}
                    style={[styles.milestoneRow, { backgroundColor: theme.surfaceSubtle }]}
                  >
                    <Ionicons
                      name={m.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={m.completed ? theme.success : theme.textMuted}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.milestoneTitle,
                        {
                          color: m.completed ? theme.textMuted : theme.textPrimary,
                          textDecorationLine: m.completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {m.title}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Inline add milestone */}
                {activeProjectIdForMilestone === p.id ? (
                  <View style={styles.addMilestoneInputBox}>
                    <TextInput
                      placeholder="Next milestone (e.g. Docker containerization)..."
                      placeholderTextColor={theme.textMuted}
                      value={newMilestoneTitle}
                      onChangeText={setNewMilestoneTitle}
                      style={[styles.milestoneInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                      onSubmitEditing={() => handleAddMilestoneInline(p.id)}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                      <TouchableOpacity
                        onPress={() => setActiveProjectIdForMilestone(null)}
                        style={[styles.cancelBtn, { borderColor: theme.border }]}
                      >
                        <Text style={{ fontSize: 11, color: theme.textSecondary }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAddMilestoneInline(p.id)}
                        style={[styles.saveInlineBtn, { backgroundColor: theme.primary }]}
                      >
                        <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '700' }}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setActiveProjectIdForMilestone(p.id)}
                    style={styles.addMilestoneBtn}
                  >
                    <Ionicons name="add" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.addMilestoneText, { color: theme.primary }]}>Add Milestone</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Repo link & Deadline footer */}
              <View style={[styles.cardFooter, { borderTopColor: theme.divider }]}>
                {p.repo_url ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(p.repo_url!)}
                    style={[styles.repoBtn, { backgroundColor: theme.surfaceSubtle }]}
                  >
                    <Ionicons name="logo-github" size={14} color={theme.textPrimary} style={{ marginRight: 6 }} />
                    <Text style={[styles.repoBtnText, { color: theme.textPrimary }]}>View Repository</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                {p.target_deadline ? (
                  <Text style={[styles.deadlineText, { color: theme.textMuted }]}>
                    Target: {p.target_deadline}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add Project Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Create CSE Project</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Project Name *</Text>
            <TextInput
              placeholder="e.g. Distributed Key-Value Store"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Technology Stack *</Text>
            <TextInput
              placeholder="e.g. Go, gRPC, Docker, Raft consensus"
              placeholderTextColor={theme.textMuted}
              value={techStack}
              onChangeText={setTechStack}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Description & Objectives</Text>
            <TextInput
              placeholder="Explain project architecture, deliverables, and semester goals..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={[styles.inputMulti, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Repository URL</Text>
            <TextInput
              placeholder="https://github.com/..."
              placeholderTextColor={theme.textMuted}
              value={repoUrl}
              onChangeText={setRepoUrl}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Target Deadline (YYYY-MM-DD)</Text>
            <TextInput
              placeholder="2026-11-30"
              placeholderTextColor={theme.textMuted}
              value={targetDeadline}
              onChangeText={setTargetDeadline}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            />

            <TouchableOpacity
              style={[styles.saveProjectBtn, { backgroundColor: theme.primary }]}
              onPress={handleCreateProject}
            >
              <Text style={styles.saveProjectBtnText}>Save Project</Text>
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
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  techStack: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  progressRow: {
    marginTop: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
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
  milestonesSection: {
    marginTop: 12,
    paddingTop: 10,
  },
  milestonesHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 12,
    flex: 1,
  },
  addMilestoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  addMilestoneText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addMilestoneInputBox: {
    marginTop: 6,
  },
  milestoneInput: {
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  saveInlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  repoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  repoBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deadlineText: {
    fontSize: 11,
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
  saveProjectBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveProjectBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
