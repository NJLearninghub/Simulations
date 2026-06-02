import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SUBJECT_COLORS } from '../constants/filters';

export default function SimulationCard({ simulation, onPress }) {
  const color = SUBJECT_COLORS[simulation.subject] || '#64748b';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{simulation.title}</Text>
        <View style={styles.tags}>
          <View style={[styles.subjectTag, { backgroundColor: color + '20', borderColor: color }]}>
            <Text style={[styles.subjectText, { color }]}>{simulation.subject}</Text>
          </View>
        </View>
        <Text style={styles.std}>{simulation.std}</Text>
        {simulation.requiresInternet && (
          <Text style={styles.netBadge}>⚡ Online</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    minHeight: 140,
  },
  colorBar: { height: 5 },
  body: { padding: 12, flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  subjectTag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  subjectText: { fontSize: 11, fontWeight: '600' },
  std: { fontSize: 12, color: '#64748b', marginTop: 2 },
  netBadge: { fontSize: 11, color: '#0891b2', marginTop: 4 },
});
