import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useBillStore, useGroupStore } from '../../store';
import { COLORS, SPACING, RADIUS, CAT_ICONS } from '../../theme';
import ReminderBadge from '../../components/ReminderBadge';
import Avatar from '../../components/Avatar';

export default function ActivityScreen() {
  const { profile }          = useAuthStore();
  const { bills, getBalances } = useBillStore();
  const { groups, groupMembers } = useGroupStore();

  const getName = (uid) => {
    if (uid === profile?.id) return 'You';
    for (const mem of Object.values(groupMembers)) {
      const u = mem.find(m => m.id === uid);
      if (u) return u.name;
    }
    return 'User';
  };

  const allBills = useMemo(() =>
    Object.values(bills).flat()
      .filter(b => b.paid_by === profile?.id || (b.split_among || []).includes(profile?.id))
      .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)),
    [bills, profile?.id]
  );

  const allBal = useMemo(() => getBalances(allBills, profile?.id), [allBills, profile?.id]);
  const totalOwed = Object.values(allBal).filter(v => v > 0).reduce((a, b) => a + b, 0);
  const totalOwe  = Math.abs(Object.values(allBal).filter(v => v < 0).reduce((a, b) => a + b, 0));
  const upcoming  = allBills.filter(b => b.reminder_date && !(b.split_among || []).every(m => m === b.paid_by || (b.settled || []).includes(m)));

  const getGroupName = (gid) => groups.find(g => g.id === gid)?.name || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Overall Summary */}
        <Text style={styles.sectionTitle}>Overall Balance</Text>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { borderTopColor: COLORS.primary }]}>
            <Text style={styles.summaryLabel}>You're owed</Text>
            <Text style={[styles.summaryVal, { color: COLORS.primary }]}>₹{totalOwed.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: COLORS.danger }]}>
            <Text style={styles.summaryLabel}>You owe</Text>
            <Text style={[styles.summaryVal, { color: COLORS.danger }]}>₹{totalOwe.toFixed(2)}</Text>
          </View>
        </View>

        {/* Pending Reminders */}
        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🔔 Pending Reminders</Text>
            {upcoming.map(b => (
              <View key={b.id} style={styles.reminderCard}>
                <View style={styles.reminderLeft}>
                  <Text style={{ fontSize: 20 }}>{CAT_ICONS[b.category] || '📦'}</Text>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.billTitle}>{b.title}</Text>
                    <Text style={styles.billMeta}>{getGroupName(b.group_id)} · ₹{(b.amount / (b.split_among || [1]).length).toFixed(2)}</Text>
                  </View>
                </View>
                <ReminderBadge date={b.reminder_date} />
              </View>
            ))}
          </>
        )}

        {/* All activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {allBills.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
            <Text style={{ color: COLORS.textMuted }}>No activity yet</Text>
          </View>
        ) : (
          allBills.slice(0, 30).map(b => {
            const sp = b.split_among || [], st = b.settled || [];
            const pp = b.amount / sp.length;
            const iPaid = b.paid_by === profile?.id;
            const iOwe = !iPaid && sp.includes(profile?.id) && !st.includes(profile?.id);
            const allSett = sp.every(m => m === b.paid_by || st.includes(m));
            const dt = new Date(b.date);

            return (
              <View key={b.id} style={[styles.actCard, allSett && { opacity: 0.55 }]}>
                <View style={styles.actIcon}>
                  <Text style={{ fontSize: 18 }}>{CAT_ICONS[b.category] || '📦'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.billTitle}>{b.title}</Text>
                  <Text style={styles.billMeta}>
                    {getGroupName(b.group_id)} · {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {iPaid ? `You paid ₹${b.amount}` : `${getName(b.paid_by)} paid ₹${b.amount}`}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {allSett
                    ? <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '700' }}>Settled</Text>
                    : iPaid
                      ? <Text style={[styles.actAmt, { color: COLORS.primary }]}>+₹{(pp * (sp.length - 1)).toFixed(2)}</Text>
                      : iOwe
                        ? <Text style={[styles.actAmt, { color: COLORS.owe }]}>-₹{pp.toFixed(2)}</Text>
                        : null
                  }
                  <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 }}>
                    {iPaid ? 'you lent' : iOwe ? 'you owe' : ''}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.bg },
  header:     { padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:      { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  scroll:     { padding: SPACING.md, paddingBottom: 100 },
  sectionTitle: { color: COLORS.textSub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
  summaryGrid:{ flexDirection: 'row', gap: 12, marginBottom: SPACING.lg },
  summaryCard:{ flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, borderTopWidth: 3, borderWidth: 1, borderColor: COLORS.border },
  summaryLabel:{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4 },
  summaryVal: { fontSize: 20, fontWeight: '800' },
  reminderCard:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', marginBottom: 8 },
  reminderLeft:{ flexDirection: 'row', alignItems: 'center' },
  actCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  actIcon:    { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  billTitle:  { color: COLORS.text, fontWeight: '600', fontSize: 14 },
  billMeta:   { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  actAmt:     { fontSize: 15, fontWeight: '700' },
  empty:      { alignItems: 'center', padding: 40 },
});
