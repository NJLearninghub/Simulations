import React, { useState, useEffect, useCallback } from 'react';
import {
  View, FlatList, Text, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import SimulationCard from '../components/SimulationCard';
import FilterBar from '../components/FilterBar';
import { STD_OPTIONS, SUBJECT_OPTIONS } from '../constants/filters';

export default function SimulationListScreen({ route, navigation }) {
  const { std: initStd = 'All', subject: initSubject = 'All' } = route.params || {};
  const [std, setStd] = useState(initStd);
  const [subject, setSubject] = useState(initSubject);
  const [allSimulations, setAllSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchSimulations = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'simulations'));
      setAllSimulations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setError(null);
    } catch (e) {
      setError('Failed to load. Check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSimulations(); }, [fetchSimulations]);

  const filtered = allSimulations.filter(sim => {
    const stdMatch = std === 'All' || sim.std === std;
    const subjectMatch = subject === 'All' || sim.subject === subject;
    return stdMatch && subjectMatch;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Loading simulations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <FilterBar label="CLASS" options={STD_OPTIONS} selected={std} onSelect={setStd} />
        <FilterBar label="SUBJECT" options={SUBJECT_OPTIONS} selected={subject} onSelect={setSubject} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSimulations(); }}
            colors={['#1e40af']}
          />
        }
        renderItem={({ item }) => (
          <SimulationCard
            simulation={item}
            onPress={() => navigation.navigate('SimulationView', {
              title: item.title,
              htmlUrl: item.htmlUrl,
              fileType: item.fileType || 'html',
            })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No simulations found</Text>
            <Text style={styles.emptySub}>
              {std !== 'All' || subject !== 'All'
                ? `for ${subject !== 'All' ? subject : 'any subject'} / ${std !== 'All' ? std : 'any class'}`
                : 'Upload simulations from the Admin panel'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  grid: { padding: 6, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorText: { color: '#dc2626', fontSize: 15, textAlign: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
