import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore, useBillStore } from '../../store';
import { COLORS, SPACING, RADIUS, CAT_ICONS } from '../../theme';
import Avatar from '../../components/Avatar';
import ReminderBadge from '../../components/ReminderBadge';
import SettleUpSheet from '../../components/SettleUpSheet';
import { scheduleReminder, cancelReminder } from '../../services/notifications';

export default function BillDetailScreen({ route, navigation }) {
  const { bill: initialBill, group, members } = route.params;
  const { profile } = useAuthStore();
  const { settle, setReminder, removeReminder, bills } = useBillStore();

  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [settleSheet, setSettleSheet] = useState(null);

  // Get fresh bill data from store
  const bill = (bills[group.id] || []).find(b => b.id === initialBill.id) || initialBill;

  const sp = bill.split_among || [];
  const st = bill.settled || [];
  const pp = bill.amount / sp.length;
  const allSettled = sp.every(m => m === bill.paid_by || st.includes(m));

  const getName = (uid) => {
    if (uid === profile?.id) return 'You';
    return members.find(m => m.id === uid)?.name || 'User';
  };

  const handleSettle = async (uid) => {
    await settle(bill.id, uid, group.id);
  };

  const handlePayNow = (uid) => {
    const payer = members.find(m => m.id === bill.paid_by);
    setSettleSheet({ amount: pp, fromUser: profile, toUser: payer, billId: bill.id, groupId: group.id });
  };

  const handleSetReminder = async (date) => {
    setShowReminderPicker(false);
    await setReminder(bill.id, date.toISOString().split('T')[0], group.id, profile.id);
    await scheduleReminder(bill, date);
  };

  const handleRemoveReminder = async () => {
    if (bill.notification_id) await cancelReminder(bill.notification_id);
    await removeReminder(bill.id, group.id, profile.id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleRow}>
          <View style={styles.catIcon}><Text style={{ fontSize: 28 }}>{CAT_ICONS[bill.category] || '📦'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{bill.title}</Text>
            <Text style={styles.meta}>{bill.date} · {bill.category}</Text>
            {bill.reminder_date && <ReminderBadge date={bill.reminder_date} />}
          </View>
        </View>

        <Text style={styles.amount}>₹{bill.amount.toLocaleString()}</Text>

        {allSettled && (
          <View style={styles.settledBanner}>
            <Text style={styles.settledBannerText}>✅ Fully Settled!</Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Who paid</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Avatar name={getName(bill.paid_by)} size={26} />
            <Text style={styles.payerName}>{getName(bill.paid_by)}</Text>
          </View>
        </View>

        <View style={styles.splitSection}>
          <Text style={styles.splitTitle}>SPLIT ({sp.length} people)</Text>
          {sp.map(uid => {
            const isPayer = uid === bill.paid_by;
            const isSettled = isPayer || st.includes(uid);
            const canSettleManually = !isPayer && !isSettled && (bill.paid_by === profile?.id || uid === profile?.id);
            const canPayViaApp = !isPayer && !isSettled && uid === profile?.id;
            return (
              <View key={uid} style={styles.splitRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Avatar name={getName(uid)} size={28} />
                  <Text style={styles.splitName}>{getName(uid)}</Text>
                  {isPayer && <View style={styles.payerBadge}><Text style={styles.payerBadgeText}>Payer</Text></View>}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.splitAmt, { color: isSettled ? COLORS.primary : COLORS.warning }]}>
                    {isSettled ? '✓ Settled' : `₹${pp.toFixed(2)}`}
                  </Text>
                  {canPayViaApp && (
                    <TouchableOpacity style={styles.payBtn} onPress={handlePayNow}>
                      <Text style={styles.payBtnText}>Pay 💸</Text>
                    </TouchableOpacity>
                  )}
                  {canSettleManually && !canPayViaApp && (
                    <TouchableOpacity style={styles.settleBtn} onPress={() => handleSettle(uid)}>
                      <Text style={styles.settleBtnText}>Settle ✓</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {bill.note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Note: </Text>
            <Text style={styles.noteText}>{bill.note}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.reminderBtn} onPress={() => bill.reminder_date ? handleRemoveReminder() : setShowReminderPicker(true)}>
          <Text style={styles.reminderBtnText}>
            🔔 {bill.reminder_date ? 'Remove Reminder' : 'Set Reminder'}
          </Text>
        </TouchableOpacity>

        {showReminderPicker && (
          <DateTimePicker
            value={new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => { if (d) handleSetReminder(d); else setShowReminderPicker(false); }}
            minimumDate={new Date()}
          />
        )}
      </ScrollView>

      {settleSheet && (
        <SettleUpSheet
          visible
          amount={settleSheet.amount}
          fromUser={settleSheet.fromUser}
          toUser={settleSheet.toUser}
          billId={settleSheet.billId}
          groupId={settleSheet.groupId}
          onSuccess={() => { setSettleSheet(null); Alert.alert('✅ Settled!', 'Payment done'); }}
          onClose={() => setSettleSheet(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { padding: SPACING.md },
  backText:    { color: COLORS.textMuted, fontSize: 16 },
  scroll:      { padding: SPACING.md, paddingBottom: 60 },
  titleRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: SPACING.lg },
  catIcon:     { width: 56, height: 56, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  title:       { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  meta:        { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  amount:      { color: COLORS.text, fontSize: 38, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.lg },
  settledBanner: { backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: RADIUS.md, padding: 10, alignItems: 'center', marginBottom: SPACING.md },
  settledBannerText: { color: COLORS.primary, fontWeight: '700' },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  rowLabel:    { color: COLORS.textMuted, fontSize: 13 },
  payerName:   { color: COLORS.primary, fontWeight: '700' },
  splitSection:{ paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  splitTitle:  { color: COLORS.textMuted, fontSize: 12, marginBottom: 12, letterSpacing: 0.8 },
  splitRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  splitName:   { color: COLORS.text },
  payerBadge:  { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6 },
  payerBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  splitAmt:    { fontWeight: '600' },
  settleBtn:   { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  settleBtnText:{ color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  payBtn:      { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  payBtnText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  noteBox:     { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.sm, padding: 14, marginVertical: SPACING.md },
  noteLabel:   { color: COLORS.textMuted, fontSize: 12 },
  noteText:    { color: COLORS.textSub, fontSize: 13 },
  reminderBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', marginTop: SPACING.md },
  reminderBtnText: { color: COLORS.textSub, fontWeight: '600' },
});
