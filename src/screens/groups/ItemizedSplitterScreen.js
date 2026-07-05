import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, SafeAreaView
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOW, CAT_ICONS } from '../../theme';
import Avatar from '../../components/Avatar';

export default function ItemizedSplitterScreen({ route, navigation }) {
  const { members = [], profile, onSave } = route?.params || {};
  const CUR = profile?.currency_symbol || '₹';

  const [items, setItems]   = useState([{ id: '1', name: '', price: '', participants: members.map(m => m.id) }]);
  const [paidBy, setPaidBy] = useState(profile?.id || '');

  const addItem = () => setItems(p => [...p, { id: Date.now().toString(), name: '', price: '', participants: members.map(m => m.id) }]);
  const removeItem = (id) => { if (items.length > 1) setItems(p => p.filter(i => i.id !== id)); };
  const updateItem = (id, field, val) => setItems(p => p.map(i => i.id === id ? { ...i, [field]: val } : i));
  const toggleParticipant = (itemId, uid) => {
    setItems(p => p.map(i => {
      if (i.id !== itemId) return i;
      const already = i.participants.includes(uid);
      if (already && i.participants.length === 1) { Alert.alert('Error', 'At least 1 participant per item'); return i; }
      return { ...i, participants: already ? i.participants.filter(x => x !== uid) : [...i.participants, uid] };
    }));
  };

  const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);

  // Per-person share calculation
  const sharesMap = {};
  members.forEach(m => { sharesMap[m.id] = 0; });
  items.forEach(item => {
    const amt = parseFloat(item.price) || 0;
    if (item.participants.length === 0) return;
    const share = amt / item.participants.length;
    item.participants.forEach(uid => { sharesMap[uid] = (sharesMap[uid] || 0) + share; });
  });

  const getName = (id) => id === profile?.id ? 'You' : members.find(m => m.id === id)?.name || 'User';

  const handleSave = () => {
    const invalid = items.find(i => !i.name.trim() || !i.price || parseFloat(i.price) <= 0);
    if (invalid) { Alert.alert('Error', 'Please fill all item names and prices!'); return; }
    onSave?.({ items, total, paidBy, sharesMap });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Itemized Split</Text>
        <TouchableOpacity onPress={handleSave} style={s.saveBtn}>
          <Text style={s.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Info banner */}
        <View style={s.infoBanner}>
          <Text style={s.infoText}>💡 Split each item among only the people who consumed it. Great for restaurants!</Text>
        </View>

        {/* Items */}
        {items.map((item, idx) => (
          <View key={item.id} style={s.itemCard}>
            <View style={s.itemHeader}>
              <Text style={s.itemNum}>Item {idx + 1}</Text>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(item.id)} style={s.removeBtn}>
                  <Text style={s.removeBtnText}>✕ Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={s.itemInputRow}>
              <TextInput style={[s.input, { flex: 1, marginRight: 10 }]} placeholder="Item name (e.g. Pizza)" placeholderTextColor={COLORS.textMuted}
                value={item.name} onChangeText={t => updateItem(item.id, 'name', t)} />
              <View style={s.priceInputWrap}>
                <Text style={s.rupeeSign}>{CUR}</Text>
                <TextInput style={s.priceInput} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric" value={item.price} onChangeText={t => updateItem(item.id, 'price', t)} />
              </View>
            </View>

            <Text style={s.splitLabel}>Split among:</Text>
            <View style={s.participantRow}>
              {members.map(m => {
                const selected = item.participants.includes(m.id);
                return (
                  <TouchableOpacity key={m.id} style={[s.participantChip, selected && s.participantChipActive]}
                    onPress={() => toggleParticipant(item.id, m.id)}>
                    <Text style={[s.participantName, selected && { color: '#fff' }]}>{m.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {item.price && parseFloat(item.price) > 0 && item.participants.length > 0 && (
              <Text style={s.perPersonHint}>
                {CUR}{(parseFloat(item.price) / item.participants.length).toFixed(2)} per person
              </Text>
            )}
          </View>
        ))}

        {/* Add item button */}
        <TouchableOpacity style={s.addItemBtn} onPress={addItem}>
          <Text style={s.addItemBtnText}>+ Add Item</Text>
        </TouchableOpacity>

        {/* Total & shares summary */}
        {total > 0 && (
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>Summary</Text>
            <View style={s.summaryTotalRow}>
              <Text style={s.summaryTotalLabel}>Total Bill</Text>
              <Text style={s.summaryTotalAmt}>{CUR}{total.toFixed(2)}</Text>
            </View>
            <View style={s.divider} />
            <Text style={s.summarySubTitle}>Individual Shares</Text>
            {members.map(m => (
              <View key={m.id} style={s.shareRow}>
                <Avatar name={m.name} size={28} uri={m.avatar_url} />
                <Text style={s.shareName}>{getName(m.id)}</Text>
                <Text style={s.shareAmt}>{CUR}{(sharesMap[m.id] || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Who paid */}
        <View style={s.paidByCard}>
          <Text style={s.paidByTitle}>WHO PAID THE BILL?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {members.map(m => (
              <TouchableOpacity key={m.id} style={[s.paidChip, paidBy === m.id && s.paidChipActive]}
                onPress={() => setPaidBy(m.id)}>
                <Text style={[s.paidChipText, paidBy === m.id && { color: '#fff' }]}>{getName(m.id)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={s.saveFullBtn} onPress={handleSave}>
          <Text style={s.saveFullBtnText}>💾 Save Itemized Split</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn: { width: 36 },
  backText:{ fontSize: 28, color: COLORS.primary, lineHeight: 32 },
  title:   { color: COLORS.primary, fontSize: 17, fontWeight: '700' },
  saveBtn: { width: 50, alignItems: 'flex-end' },
  saveText:{ color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  scroll:  { padding: SPACING.md },

  infoBanner: { backgroundColor: COLORS.primary + '12', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  infoText:   { color: COLORS.primary, fontSize: 13, lineHeight: 18 },

  itemCard:    { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  itemHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  itemNum:     { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  removeBtn:   { backgroundColor: '#fef2f2', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 },
  removeBtnText:{ color: COLORS.owe, fontSize: 12, fontWeight: '700' },
  itemInputRow:{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  input:       { borderBottomWidth: 1.5, borderBottomColor: COLORS.borderLight, paddingVertical: 8, color: COLORS.text, fontSize: 14 },
  priceInputWrap:{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: COLORS.primary, paddingBottom: 8, minWidth: 90 },
  rupeeSign:   { color: COLORS.primary, fontWeight: '700', fontSize: 15, marginRight: 2 },
  priceInput:  { color: COLORS.text, fontSize: 16, fontWeight: '600', minWidth: 70 },
  splitLabel:  { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  participantRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  participantChip:  { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.borderLight },
  participantChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  participantName:  { fontSize: 13, fontWeight: '600', color: COLORS.textSub },
  perPersonHint:{ color: COLORS.primary, fontSize: 12, fontWeight: '600', marginTop: 8 },

  addItemBtn:    { borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', marginBottom: SPACING.md },
  addItemBtnText:{ color: COLORS.primary, fontWeight: '700', fontSize: 15 },

  summaryCard:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, ...SHADOW.sm },
  summaryTitle:      { color: COLORS.text, fontWeight: '700', fontSize: 16, marginBottom: SPACING.sm },
  summaryTotalRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryTotalLabel: { color: COLORS.textSub, fontWeight: '600', fontSize: 14 },
  summaryTotalAmt:   { color: COLORS.primary, fontWeight: '800', fontSize: 20 },
  divider:           { height: 1, backgroundColor: COLORS.borderLight, marginBottom: SPACING.sm },
  summarySubTitle:   { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  shareRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  shareName:         { flex: 1, marginLeft: 10, color: COLORS.text, fontSize: 14 },
  shareAmt:          { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  paidByCard:    { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SPACING.md },
  paidByTitle:   { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  paidChip:      { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: COLORS.borderLight },
  paidChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  paidChipText:  { fontSize: 13, fontWeight: '600', color: COLORS.textSub },

  saveFullBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 15, alignItems: 'center' },
  saveFullBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

