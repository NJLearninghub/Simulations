import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function FilterBar({ label, options, selected, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, selected === opt && styles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 8, paddingHorizontal: 16, letterSpacing: 0.8 },
  scroll: { paddingHorizontal: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
