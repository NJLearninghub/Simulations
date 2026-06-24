import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Pressable, StatusBar,
} from 'react-native';
import { STD_OPTIONS, SUBJECT_OPTIONS } from '../constants/filters';
import FilterBar from '../components/FilterBar';
import PinModal from '../components/PinModal';

export default function HomeScreen({ navigation }) {
  const [selectedStd, setSelectedStd] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [showPinModal, setShowPinModal] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  function handleTitleTap() {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setShowPinModal(true);
    }
  }

  return (
    <>
      <StatusBar backgroundColor="#1e40af" barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={handleTitleTap}>
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🎓</Text>
            <Text style={styles.heroTitle}>NJ Learning Hub</Text>
            <Text style={styles.heroSub}>Interactive Academic Simulations</Text>
          </View>
        </Pressable>

        <View style={styles.filtersCard}>
          <FilterBar
            label="CLASS / STANDARD"
            options={STD_OPTIONS}
            selected={selectedStd}
            onSelect={setSelectedStd}
          />
          <FilterBar
            label="SUBJECT"
            options={SUBJECT_OPTIONS}
            selected={selectedSubject}
            onSelect={setSelectedSubject}
          />
        </View>

        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('SimulationList', { std: selectedStd, subject: selectedSubject })}
          activeOpacity={0.85}
        >
          <Text style={styles.browseBtnText}>Browse Simulations →</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Tap the banner 5× to access admin panel</Text>

        <PinModal
          visible={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={() => {
            setShowPinModal(false);
            navigation.navigate('Admin');
          }}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8fafc', paddingBottom: 40 },
  hero: {
    backgroundColor: '#1e40af',
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  heroEmoji: { fontSize: 52, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  heroSub: { fontSize: 14, color: '#bfdbfe', marginTop: 8, textAlign: 'center' },
  filtersCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 24,
  },
  browseBtn: {
    backgroundColor: '#1e40af',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
  },
  browseBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  hint: { textAlign: 'center', color: '#cbd5e1', fontSize: 11, marginTop: 24 },
});
