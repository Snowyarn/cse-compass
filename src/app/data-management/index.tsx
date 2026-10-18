import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { Repository } from '../../database/repository';
import { getLocalDateString } from '../../utils/date';

export default function DataManagementScreen() {
  const { theme } = useTheme();
  const { refreshAllData, resetAllData, showToast } = useApp();

  const [importJsonText, setImportJsonText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

  // Export JSON
  const handleExportJson = async () => {
    try {
      const jsonContent = Repository.exportFullDatabaseJson();
      const fileName = `cse_compass_backup_${getLocalDateString()}.json`;
      const file = new File(Paths.cache, fileName);
      if (!file.exists) {
        file.create();
      }
      file.write(jsonContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export CSE Compass Backup',
        });
        showToast('JSON backup exported successfully!', 'success');
      } else {
        Alert.alert('Backup Generated', `Saved locally at: ${file.uri}`);
      }
    } catch (e: any) {
      Alert.alert('Export Error', e.message);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const csvContent = Repository.exportTasksCsv();
      const fileName = `cse_tasks_${getLocalDateString()}.csv`;
      const file = new File(Paths.cache, fileName);
      if (!file.exists) {
        file.create();
      }
      file.write(csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Tasks CSV',
        });
        showToast('Tasks CSV exported!', 'success');
      } else {
        Alert.alert('CSV Generated', `Saved locally at: ${file.uri}`);
      }
    } catch (e: any) {
      Alert.alert('Export Error', e.message);
    }
  };

  // Import from picked file
  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const pickedAsset = result.assets[0];
      const pickedFile = new File(pickedAsset.uri);
      const content = await pickedFile.text();
      const res = Repository.importFullDatabaseJson(content);

      if (res.success) {
        refreshAllData();
        showToast('Backup restored successfully!', 'success');
        router.back();
      } else {
        Alert.alert('Import Failed', res.message);
      }
    } catch (e: any) {
      Alert.alert('Import Error', e.message);
    }
  };

  // Import from pasted text
  const handleImportPasted = () => {
    if (!importJsonText.trim()) {
      Alert.alert('Empty Input', 'Please paste valid backup JSON content.');
      return;
    }

    const res = Repository.importFullDatabaseJson(importJsonText.trim());
    if (res.success) {
      refreshAllData();
      showToast('Database restored successfully!', 'success');
      setImportJsonText('');
      setShowPasteBox(false);
      router.back();
    } else {
      Alert.alert('Validation Error', res.message);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Application Data?',
      'This will reset your database to fresh default state and remove your custom data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            resetAllData();
            showToast('All data reset to defaults.', 'info');
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: theme.textPrimary }]}>Data & Backup</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.infoBanner, { backgroundColor: `${theme.primary}12`, borderColor: theme.primary }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: theme.primary }]}>100% Offline-First Architecture</Text>
            <Text style={[styles.bannerSub, { color: theme.textSecondary }]}>
              All tasks, subjects, reminders, and study logs are stored locally in an embedded SQLite database on your device. No cloud account or external servers needed.
            </Text>
          </View>
        </View>

        {/* Export Options */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>EXPORT DATA</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <TouchableOpacity style={styles.actionRow} onPress={handleExportJson}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}18` }]}>
              <Ionicons name="document-text" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Export Full Database (JSON)</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Complete backup of tasks, subjects, syllabus, coding logs & settings
              </Text>
            </View>
            <Ionicons name="share-outline" size={18} color={theme.primary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity style={styles.actionRow} onPress={handleExportCsv}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.success}18` }]}>
              <Ionicons name="grid" size={18} color={theme.success} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Export Tasks Spreadsheet (CSV)</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Readable spreadsheet export of all your academic tasks
              </Text>
            </View>
            <Ionicons name="share-outline" size={18} color={theme.success} />
          </TouchableOpacity>
        </View>

        {/* Import & Restore */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary, marginTop: 16 }]}>RESTORE DATA</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <TouchableOpacity style={styles.actionRow} onPress={handleImportFile}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.accent}18` }]}>
              <Ionicons name="folder-open" size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Restore from File (.json)</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Pick a previously exported JSON backup from device storage
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity style={styles.actionRow} onPress={() => setShowPasteBox(!showPasteBox)}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.warning}18` }]}>
              <Ionicons name="code" size={18} color={theme.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Paste JSON String Directly</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Manually paste backup text into editor
              </Text>
            </View>
            <Ionicons name={showPasteBox ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {showPasteBox && (
            <View style={styles.pasteContainer}>
              <TextInput
                placeholder="Paste JSON content here..."
                placeholderTextColor={theme.textMuted}
                value={importJsonText}
                onChangeText={setImportJsonText}
                multiline
                numberOfLines={6}
                style={[styles.pasteInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              />
              <TouchableOpacity
                style={[styles.applyImportBtn, { backgroundColor: theme.primary }]}
                onPress={handleImportPasted}
              >
                <Text style={styles.applyImportBtnText}>Validate & Restore Database</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Reset */}
        <Text style={[styles.sectionHeading, { color: theme.danger, marginTop: 16 }]}>FACTORY DEFAULTS</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.dangerSubtle }]}>
          <TouchableOpacity style={styles.actionRow} onPress={handleReset}>
            <View style={[styles.iconCircle, { backgroundColor: theme.dangerSubtle }]}>
              <Ionicons name="refresh" size={18} color={theme.danger} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.danger }]}>Reset App Data to Clean State</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Clears custom modifications and restores fresh B.Tech curriculum
              </Text>
            </View>
          </TouchableOpacity>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  bannerSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  pasteContainer: {
    padding: 14,
    paddingTop: 0,
  },
  pasteInput: {
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  applyImportBtn: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  applyImportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
