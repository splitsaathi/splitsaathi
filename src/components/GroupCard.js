import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

// A rotating set of soft pastel background colors for the group avatar,
// picked deterministically from the group id so each group always gets
// the same color (Splitwise does the same thing with its group photos).
const AVATAR_COLORS = ['#dbeafe', '#fce7f3', '#dcfce7', '#fef3c7', '#ede9fe', '#ffe4e6', '#e0f2fe', '#fef9c3'];
const avatarColorFor = (id) => {
  const str = String(id || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function GroupCard({ group, memberCount, billCount, net, onPress, currencySymbol = '₹' }) {
  const settled = net === 0 || Math.abs(net) < 0.01;
  const youAreOwed = net > 0;

  let statusText, statusColor;
  if (billCount === 0) {
    statusText = 'No expenses yet';
    statusColor = COLORS.textMuted;
  } else if (settled) {
    statusText = 'Settled up';
    statusColor = COLORS.textMuted;
  } else if (youAreOwed) {
    statusText = `You are owed ${currencySymbol}${Math.abs(net).toFixed(2)}`;
    statusColor = '#2e7d32';
  } else {
    statusText = `You owe ${currencySymbol}${Math.abs(net).toFixed(2)}`;
    statusColor = '#e05353';
  }

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.avatar, { backgroundColor: avatarColorFor(group.id) }]}>
        <Text style={{ fontSize: 22 }}>{group.icon}</Text>
      </View>

      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
        <Text style={[styles.status, { color: statusColor }]} numberOfLines={1}>{statusText}</Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        {!settled && billCount > 0 && (
          <Text style={[styles.amount, { color: youAreOwed ? '#2e7d32' : '#e05353' }]}>
            {youAreOwed ? '+' : '-'}{currencySymbol}{Math.abs(net).toFixed(2)}
          </Text>
        )}
        <Text style={styles.meta}>{memberCount} {memberCount === 1 ? 'member' : 'members'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight || COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name:   { color: COLORS.text, fontWeight: '700', fontSize: 16 },
  status: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  amount: { fontWeight: '700', fontSize: 15 },
  meta:   { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
