import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Alert, ActivityIndicator, Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { STD_OPTIONS, SUBJECT_OPTIONS } from '../constants/filters';
import { setAdminPin } from '../utils/pinStorage';

function getFileType(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.tsx') || lower.endsWith('.jsx') || lower.endsWith('.ts')) return 'tsx';
  return 'html';
}

function PickerModal({ visible, options, onSelect, onClose, title }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={pickerStyles.sheet}>
          <Text style={pickerStyles.sheetTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={pickerStyles.option}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={pickerStyles.optionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionText: { fontSize: 15, color: '#334155' },
});

export default function AdminScreen() {
  const [title, setTitle] = useState('');
  const [std, setStd] = useState('Class 9');
  const [subject, setSubject] = useState('Science');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [simulations, setSimulations] = useState([]);
  const [loadingSims, setLoadingSims] = useState(true);
  const [stdPickerVisible, setStdPickerVisible] = useState(false);
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSection, setPinSection] = useState(false);

  const fetchSimulations = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'simulations'));
      setSimulations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      Alert.alert('Error', 'Could not load simulations list.');
    } finally {
      setLoadingSims(false);
    }
  }, []);

  useEffect(() => { fetchSimulations(); }, [fetchSimulations]);

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/html', 'text/plain', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Could not open file picker.');
    }
  }

  async function handleUpload() {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title.'); return; }
    if (!selectedFile) { Alert.alert('Error', 'Please select an HTML or TSX file.'); return; }

    const fileType = getFileType(selectedFile.name);
    setUploading(true);
    try {
      const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);
      const id = Date.now().toString();
      const ext = fileType === 'tsx' ? 'tsx' : 'html';
      const storageRef = ref(storage, `simulations/${id}.${ext}`);
      const mimeType = fileType === 'tsx' ? 'text/plain' : 'text/html';
      const blob = new Blob([fileContent], { type: mimeType });
      await uploadBytes(storageRef, blob);
      const htmlUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'simulations'), {
        title: title.trim(),
        std,
        subject,
        description: description.trim(),
        htmlUrl,
        fileType,
        requiresInternet: true,
        addedAt: serverTimestamp(),
      });

      Alert.alert('Success', `"${title.trim()}" uploaded successfully!`);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setStd('Class 9');
      setSubject('Science');
      fetchSimulations();
    } catch (e) {
      Alert.alert('Upload Failed', e.message || 'An error occurred. Check Firebase config.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(sim) {
    Alert.alert(
      'Delete Simulation',
      `Delete "${sim.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'simulations', sim.id));
              setSimulations(prev => prev.filter(s => s.id !== sim.id));
            } catch {
              Alert.alert('Error', 'Could not delete simulation.');
            }
          },
        },
      ]
    );
  }

  async function handlePinChange() {
    if (newPin !== confirmPin) { Alert.alert('Error', 'PINs do not match.'); return; }
    try {
      await setAdminPin(newPin);
      Alert.alert('Success', 'Admin PIN updated.');
      setNewPin('');
      setConfirmPin('');
      setPinSection(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  const detectedType = selectedFile ? getFileType(selectedFile.name) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add New Simulation</Text>

        <Text style={styles.fieldLabel}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Photosynthesis Process"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.fieldLabel}>Class / Standard *</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setStdPickerVisible(true)}>
          <Text style={styles.pickerBtnText}>{std}</Text>
          <Text style={styles.pickerArrow}>▾</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Subject *</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setSubjectPickerVisible(true)}>
          <Text style={styles.pickerBtnText}>{subject}</Text>
          <Text style={styles.pickerArrow}>▾</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Brief description of the simulation..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.fieldLabel}>Simulation File * (.html or .tsx)</Text>
        <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
          <Text style={styles.fileBtnText}>
            {selectedFile ? `✓ ${selectedFile.name}` : '📁  Pick HTML or TSX File'}
          </Text>
        </TouchableOpacity>
        {detectedType && (
          <View style={styles.typeBadgeRow}>
            <View style={[styles.typeBadge, detectedType === 'tsx' ? styles.typeBadgeTsx : styles.typeBadgeHtml]}>
              <Text style={styles.typeBadgeText}>
                {detectedType === 'tsx' ? '⚛️ TSX — React Component' : '🌐 HTML Simulation'}
              </Text>
            </View>
            {detectedType === 'tsx' && (
              <Text style={styles.tsxHint}>Main component must be named <Text style={styles.tsxHintBold}>App</Text></Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.uploadBtnText}>Upload Simulation</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Existing Simulations ({simulations.length})</Text>
        {loadingSims
          ? <ActivityIndicator color="#1e40af" style={{ marginTop: 16 }} />
          : simulations.length === 0
            ? <Text style={styles.noSims}>No simulations uploaded yet.</Text>
            : simulations.map(sim => (
                <View key={sim.id} style={styles.simRow}>
                  <View style={styles.simInfo}>
                    <Text style={styles.simTitle}>{sim.title}</Text>
                    <Text style={styles.simMeta}>
                      {sim.subject} · {sim.std}
                      {sim.fileType === 'tsx' ? ' · ⚛️ TSX' : ' · 🌐 HTML'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(sim)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))
        }
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={() => setPinSection(!pinSection)} style={styles.pinToggle}>
          <Text style={styles.pinToggleText}>{pinSection ? 'Cancel' : 'Change Admin PIN'}</Text>
        </TouchableOpacity>
        {pinSection && (
          <View style={styles.pinForm}>
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="New PIN (4-6 digits)"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <TextInput
              style={styles.input}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirm New PIN"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <TouchableOpacity style={styles.savePinBtn} onPress={handlePinChange}>
              <Text style={styles.savePinBtnText}>Save New PIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <PickerModal
        visible={stdPickerVisible}
        options={STD_OPTIONS.filter(o => o !== 'All')}
        onSelect={setStd}
        onClose={() => setStdPickerVisible(false)}
        title="Select Class / Standard"
      />
      <PickerModal
        visible={subjectPickerVisible}
        options={SUBJECT_OPTIONS.filter(o => o !== 'All')}
        onSelect={setSubject}
        onClose={() => setSubjectPickerVisible(false)}
        title="Select Subject"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#f8fafc',
  },
  pickerBtnText: { fontSize: 15, color: '#1e293b' },
  pickerArrow: { fontSize: 16, color: '#64748b' },
  fileBtn: {
    borderWidth: 1.5,
    borderColor: '#1e40af',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#eff6ff',
  },
  fileBtnText: { fontSize: 14, color: '#1e40af', fontWeight: '500' },
  typeBadgeRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  typeBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  typeBadgeTsx: { backgroundColor: '#ede9fe' },
  typeBadgeHtml: { backgroundColor: '#e0f2fe' },
  typeBadgeText: { fontSize: 13, fontWeight: '600' },
  tsxHint: { fontSize: 12, color: '#64748b' },
  tsxHintBold: { fontWeight: '700', color: '#7c3aed' },
  uploadBtn: {
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  uploadBtnDisabled: { backgroundColor: '#93c5fd' },
  uploadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  noSims: { color: '#94a3b8', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  simInfo: { flex: 1 },
  simTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  simMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  pinToggle: { alignItems: 'center', padding: 8 },
  pinToggleText: { color: '#1e40af', fontWeight: '600', fontSize: 15 },
  pinForm: { marginTop: 12 },
  savePinBtn: {
    backgroundColor: '#1e40af',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  savePinBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
