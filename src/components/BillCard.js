import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, CAT_ICONS } from '../theme';
import ReminderBadge from './ReminderBadge';

export default function BillCard({ bill, currentUserId, getName, onPress }) {
  const sp = bill.split_among || [];
  const st = bill.settled || [];
  const pp = bill.amount / sp.length;

  const iPaid    = bill.paid_by === currentUserId;
  const iOwe     = !iPaid && sp.includes(currentUserId) && !st.includes(currentUserId);
  const allSett  = sp.every(m => m === bill.paid_by || st.includes(m));
  const myShare  = iPaid ? pp * (sp.length - 1) : iOwe ? pp : 0;
  const label    = allSett ? 'settled' : iPaid ? 'you lent' : iOwe ? 'you borrowed' : '';
  const labelCol = allSett ? COLORS.textMuted : iPaid ? COLORS.lent : COLORS.owe;

  const dt  = new Date(bill.date);
  const mon = dt.toLocaleDateString('en-IN', { month: 'short' });
  const day = dt.getDate();

  return (
    <TouchableOpacity style={[styles.row, allSett && { opacity: 0.55 }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.dateCol}>
        <Text style={styles.dateMon}>{mon}</Text>
        <Text style={styles.dateDay}>{day}</Text>
      </View>
      <View style={styles.iconBox}>
        <Text style={{ fontSize: 20 }}>{CAT_ICONS[bill.category] || '📦'}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>{bill.title}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {iPaid ? 'You' : getName?.(bill.paid_by) || 'Someone'} paid ₹{bill.amount.toLocaleString()}
        </Text>
        {allSett && (
          <View style={styles.settledBadge}><Text style={styles.settledText}>Settled</Text></View>
        )}
        {bill.reminder_date && <ReminderBadge date={bill.reminder_date} />}
      </View>
      <View style={styles.right}>
        <Text style={[styles.label, { color: labelCol }]}>{label}</Text>
        {!allSett && myShare > 0 && (
          <Text style={[styles.amount, { color: labelCol }]}>₹{myShare.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:      { flexDirection:'row', alignItems:'center', padding:14, paddingHorizontal:16, borderBottomWidth:1, borderBottomColor: COLORS.surface, backgroundColor: COLORS.bg },
  dateCol:  { width:36, alignItems:'center', marginRight:12 },
  dateMon:  { color: COLORS.textMuted, fontSize:11, textTransform:'uppercase' },
  dateDay:  { color: COLORS.textSub, fontSize:17, fontWeight:'700', lineHeight:20 },
  iconBox:  { width:44, height:44, borderRadius:10, backgroundColor:'rgba(255,255,255,0.06)', alignItems:'center', justifyContent:'center', marginRight:12 },
  middle:   { flex:1 },
  title:    { color: COLORS.text, fontWeight:'600', fontSize:15 },
  sub:      { color: COLORS.textMuted, fontSize:12, marginTop:2 },
  settledBadge: { backgroundColor:'rgba(16,185,129,0.15)', borderRadius:10, paddingHorizontal:6, paddingVertical:2, alignSelf:'flex-start', marginTop:4 },
  settledText:  { color: COLORS.primary, fontSize:10, fontWeight:'700' },
  right:    { alignItems:'flex-end' },
  label:    { fontSize:11, fontWeight:'600' },
  amount:   { fontSize:15, fontWeight:'700', marginTop:2 },
});
