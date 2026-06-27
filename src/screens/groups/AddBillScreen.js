import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Platform, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore, useBillStore } from '../../store';
import { COLORS, SPACING, RADIUS, CATEGORIES, CAT_ICONS } from '../../theme';
import Avatar from '../../components/Avatar';
import { scheduleReminder } from '../../services/notifications';

// Light theme colors for this screen only
const L = {
  bg:        '#ffffff',
  surface:   '#f5f5f5',
  border:    '#e0e0e0',
  text:      '#1a1a1a',
  textSub:   '#555555',
  textMuted: '#999999',
  primary:   '#10b981',
  divider:   '#eeeeee',
};

export default function AddBillScreen({ route, navigation }) {
  const { group, members } = route.params;
  const { profile }  = useAuthStore();
  const { addBill }   = useBillStore();

  const [title,             setTitle]             = useState('');
  const [amount,            setAmount]            = useState('');
  const [category,          setCategory]          = useState('Food');
  const [note,              setNote]              = useState('');
  const [paidBy,            setPaidBy]            = useState(profile?.id);
  const [splitAmong,        setSplitAmong]        = useState(members.map(m => m.id));
  const [date,              setDate]              = useState(new Date());
  const [showDatePicker,    setShowDatePicker]    = useState(false);
  const [reminderDate,      setReminderDate]      = useState(null);
  const [showReminderPicker,setShowReminderPicker]= useState(false);
  const [receiptPhoto,      setReceiptPhoto]      = useState(null);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState('');

  const toggleSplit = (id) => {
    setSplitAmong(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  // ── Camera / Gallery ───────────────────────────────────────────────────────
  const handleCamera = async () => {
    Alert.alert('Add Receipt', 'Choose an option', [
      {
        text: '📷 Take Photo', onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permission needed', 'Allow camera access to take a photo'); return; }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
          if (!result.canceled) setReceiptPhoto(result.assets[0].uri);
        },
      },
      {
        text: '🖼️ Choose from Gallery', onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permission needed', 'Allow gallery access to pick a photo'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });
          if (!result.canceled) setReceiptPhoto(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim())          { setError('Please enter a bill name!'); return; }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) { setError('Please enter a valid amount!'); return; }
    if (!paidBy)                 { setError('Select who paid!'); return; }
    if (splitAmong.length === 0) { setError('Select at least 1 member!'); return; }

    setLoading(true); setError('');
    const { data, error: err } = await addBill({
      group_id:      group.id,
      title:         title.trim(),
      amount:        parseFloat(amount),
      paid_by:       paidBy,
      split_among:   splitAmong,
      category,
      note:          note.trim(),
      date:          date.toISOString().split('T')[0],
      reminder_date: reminderDate ? reminderDate.toISOString().split('T')[0] : null,
      receipt_photo: receiptPhoto || null,
      settled:       [],
    }, group.id, profile.id);

    if (err) { setError(err.message); setLoading(false); return; }
    if (reminderDate && data) await scheduleReminder(data, reminderDate);
    setLoading(false);
    navigation.goBack();
  };

  const perPerson = amount && splitAmong.length
    ? (parseFloat(amount) / splitAmong.length).toFixed(2)
    : null;

  const paidByName = members.find(m => m.id === paidBy)?.name?.split(' ')[0] || 'you';
  const isToday = date.toDateString() === new Date().toDateString();
  const dateLabel = isToday ? 'Today' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Top bar (Splitwise-style) ── */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.topBtn}>
          <Text style={s.topBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Add an expense</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={s.topSaveBtn}>
          {loading
            ? <ActivityIndicator color={L.primary} size="small" />
            : <Text style={s.topSaveTxt}>Save</Text>}
        </TouchableOpacity>
      </View>

      {/* ── With whom ── */}
      <View style={s.withRow}>
        <Text style={s.withText}>
          With <Text style={s.withBold}>you</Text>
          {members.filter(m => m.id !== profile?.id).length > 0
            ? <Text> and: <Text style={s.withBold}>{members.filter(m => m.id !== profile?.id).map(m => m.name.split(' ')[0]).join(', ')}</Text></Text>
            : null}
        </Text>
      </View>

      <View style={s.divider} />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Description + Amount row ── */}
        <View style={s.mainInputRow}>
          <View style={s.descIconBox}>
            <Text style={s.descIcon}>📋</Text>
          </View>
          <TextInput
            style={s.descInput}
            placeholder="Enter a description"
            placeholderTextColor={L.textMuted}
            value={title}
            onChangeText={t => { setTitle(t); setError(''); }}
          />
        </View>

        <View style={s.mainInputRow}>
          <View style={s.descIconBox}>
            <Text style={s.descIcon}>₹</Text>
          </View>
          <TextInput
            style={[s.descInput, s.amountInput]}
            placeholder="0.00"
            placeholderTextColor={L.textMuted}
            value={amount}
            onChangeText={t => { setAmount(t); setError(''); }}
            keyboardType="numeric"
          />
        </View>

        <View style={s.divider} />

        {/* ── Paid by + split ── */}
        <View style={s.splitRow}>
          <Text style={s.splitRowText}>
            Paid by <Text style={s.splitChip}>{paidByName}</Text>
            {'  '}and split{'  '}
            <Text style={s.splitChip}>equally</Text>
          </Text>
        </View>

        {/* ── Who paid chips ── */}
        <Text style={s.label}>WHO PAID?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {members.map(u => (
            <TouchableOpacity
              key={u.id}
              style={[s.personChip, paidBy === u.id && s.personChipActive]}
              onPress={() => setPaidBy(u.id)}
            >
              <Text style={[s.personChipText, paidBy === u.id && { color: '#fff' }]}>
                {u.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.divider} />

        {/* ── Split among ── */}
        <View style={s.rowBetween}>
          <Text style={s.label}>SPLIT AMONG</Text>
          <TouchableOpacity onPress={() => setSplitAmong(members.map(u => u.id))}>
            <Text style={s.selectAllText}>Select all</Text>
          </TouchableOpacity>
        </View>
        {members.map(u => (
          <TouchableOpacity key={u.id} style={s.memberRow} onPress={() => toggleSplit(u.id)}>
            <Avatar name={u.name} size={34} uri={u.avatar_url} />
            <Text style={s.memberName}>{u.name}{u.id === profile?.id ? ' (You)' : ''}</Text>
            <View style={[s.checkbox, splitAmong.includes(u.id) && s.checkboxActive]}>
              {splitAmong.includes(u.id) && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
        {perPerson && (
          <View style={s.perPersonBox}>
            <Text style={s.perPersonText}>₹{perPerson} per person</Text>
          </View>
        )}

        <View style={s.divider} />

        {/* ── Category ── */}
        <Text style={s.label}>CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[s.catChip, category === c && s.catChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={{ fontSize: 15, marginRight: 5 }}>{CAT_ICONS[c]}</Text>
              <Text style={[s.catChipText, category === c && { color: '#fff' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.divider} />

        {/* ── Bottom row: Date · Group · Camera · Note ── */}
        <View style={s.bottomRow}>
          {/* Date */}
          <TouchableOpacity style={s.bottomBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={s.bottomBtnIcon}>📅</Text>
            <Text style={s.bottomBtnLabel}>{dateLabel}</Text>
          </TouchableOpacity>

          {/* Reminder */}
          <TouchableOpacity style={s.bottomBtn} onPress={() => setShowReminderPicker(true)}>
            <Text style={s.bottomBtnIcon}>🔔</Text>
            <Text style={s.bottomBtnLabel}>
              {reminderDate
                ? reminderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : 'Reminder'}
            </Text>
          </TouchableOpacity>

          {/* Camera */}
          <TouchableOpacity style={s.bottomBtn} onPress={handleCamera}>
            <Text style={s.bottomBtnIcon}>📷</Text>
            <Text style={s.bottomBtnLabel}>{receiptPhoto ? '✓ Receipt' : 'Receipt'}</Text>
          </TouchableOpacity>

          {/* Note icon */}
          <TouchableOpacity style={s.bottomBtn}>
            <Text style={s.bottomBtnIcon}>📝</Text>
            <Text style={s.bottomBtnLabel}>Note</Text>
          </TouchableOpacity>
        </View>

        {/* Date pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }}
            maximumDate={new Date()}
          />
        )}
        {showReminderPicker && (
          <DateTimePicker
            value={reminderDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => { setShowReminderPicker(false); if (d) setReminderDate(d); }}
            minimumDate={new Date()}
          />
        )}

        {/* Note input */}
        <TextInput
          style={s.noteInput}
          placeholder="Add a note..."
          placeholderTextColor={L.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
        />

        {/* Receipt preview */}
        {receiptPhoto && (
          <View style={s.receiptBox}>
            <Image source={{ uri: receiptPhoto }} style={s.receiptImg} resizeMode="cover" />
            <TouchableOpacity style={s.removeReceipt} onPress={() => setReceiptPhoto(null)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: L.bg },

  // Top bar
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: L.bg },
  topBtn:      { width: 40, alignItems: 'flex-start' },
  topBtnText:  { fontSize: 20, color: L.textSub },
  topTitle:    { fontSize: 17, fontWeight: '600', color: L.text },
  topSaveBtn:  { width: 50, alignItems: 'flex-end' },
  topSaveTxt:  { fontSize: 16, fontWeight: '700', color: L.primary },

  // With row
  withRow:     { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: L.bg },
  withText:    { fontSize: 14, color: L.textSub },
  withBold:    { fontWeight: '700', color: L.text },

  divider:     { height: 1, backgroundColor: L.divider, marginVertical: 4 },

  scroll:      { paddingBottom: 60 },

  // Main inputs
  mainInputRow:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  descIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  descIcon:    { fontSize: 18, color: L.textSub },
  descInput:   { flex: 1, fontSize: 16, color: L.text, borderBottomWidth: 1.5, borderBottomColor: L.primary, paddingBottom: 6 },
  amountInput: { fontSize: 28, fontWeight: '300', color: L.textMuted },

  // Paid by / split
  splitRow:    { paddingHorizontal: 16, paddingVertical: 12 },
  splitRowText:{ fontSize: 14, color: L.textSub },
  splitChip:   { fontWeight: '700', color: L.text },

  // Labels
  label:       { fontSize: 11, fontWeight: '700', color: L.textMuted, letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 16, marginTop: 12 },

  // Chips
  chipScroll:  { paddingHorizontal: 16, marginBottom: 12 },
  personChip:  { backgroundColor: L.surface, borderWidth: 1, borderColor: L.border, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  personChipActive: { backgroundColor: L.primary, borderColor: L.primary },
  personChipText: { fontSize: 13, fontWeight: '600', color: L.textSub },
  catChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: L.surface, borderWidth: 1, borderColor: L.border, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  catChipActive: { backgroundColor: L.primary, borderColor: L.primary },
  catChipText: { fontSize: 13, fontWeight: '600', color: L.textSub },

  // Member rows
  rowBetween:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 12, marginBottom: 8 },
  selectAllText: { fontSize: 12, fontWeight: '700', color: L.primary },
  memberRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: L.divider },
  memberName:  { flex: 1, fontSize: 15, color: L.text },
  checkbox:    { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { borderColor: L.primary, backgroundColor: L.primary },
  perPersonBox:{ marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: '#e6f9f3', borderRadius: RADIUS.md },
  perPersonText: { color: L.primary, fontWeight: '600', fontSize: 13, textAlign: 'center' },

  // Bottom action row (Splitwise-style)
  bottomRow:   { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, paddingHorizontal: 8, backgroundColor: L.bg },
  bottomBtn:   { alignItems: 'center', gap: 4, flex: 1 },
  bottomBtnIcon: { fontSize: 22 },
  bottomBtnLabel: { fontSize: 11, color: L.textSub, fontWeight: '500' },

  // Note input
  noteInput:   { marginHorizontal: 16, marginTop: 4, padding: 12, fontSize: 14, color: L.text, minHeight: 60 },

  // Receipt
  receiptBox:  { marginHorizontal: 16, marginTop: 8, borderRadius: RADIUS.md, overflow: 'hidden' },
  receiptImg:  { width: '100%', height: 160 },
  removeReceipt: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },

  error:       { color: COLORS.danger, fontSize: 13, textAlign: 'center', marginTop: 8, marginHorizontal: 16 },
});
