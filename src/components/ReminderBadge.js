import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function ReminderBadge({ date }) {
  if (!date) return null;
  const diff  = Math.ceil((new Date(date) - new Date()) / 86400000);
  const color = diff < 0 ? COLORS.danger : diff <= 2 ? COLORS.warning : COLORS.info;
  const label = diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Today!' : `${diff}d left`;

  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text style={[styles.text, { color }]}>🔔 {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, marginTop: 4 },
  text:  { fontSize: 11, fontWeight: '700' },
});
