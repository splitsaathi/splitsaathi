import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function EmptyState({ emoji = '📭', text, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</Text>
      <Text style={styles.text}>{text}</Text>
      {actionLabel && (
        <TouchableOpacity style={styles.btn} onPress={onAction}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:    { alignItems: 'center', padding: 48 },
  text:    { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  btn:     { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

