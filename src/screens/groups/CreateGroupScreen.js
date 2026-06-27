import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useGroupStore, useFriendStore } from '../../store';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import Avatar from '../../components/Avatar';

const ICONS = ['✈️','🏠','🍕','🎉','🏕️','💼','🎮','🚂','🏖️','🎓','🏋️','🎵'];

export default function CreateGroupScreen({ navigation }) {
  const { profile }              = useAuthStore();
  const { createGroup }          = useGroupStore();
  const { friends, loadFriends } = useFriendStore();

  const [name,    setName]    = useState('');
  const [icon,    setIcon]    = useState('✈️');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { if (profile?.id) loadFriends(profile.id); }, [profile?.id]);

  const toggle = (id) => setMembers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleCreate = async () => {
    if (!name.trim())       { setError('Please enter a group name!'); return; }
    if (members.length < 1) { setError('Select at least 1 member!'); return; }
    setLoading(true); setError('');
    const { error: err } = await createGroup(name.trim(), icon, profile.id, members);
    if (err) { setError(err.message); setLoading(false); return; }
    setLoading(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Create New Group</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Icon picker */}
        <View style={s.card}>
          <Text style={s.label}>GROUP ICON</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            {ICONS.map(ic => (
              <TouchableOpacity key={ic} style={[s.iconBtn, icon === ic && s.iconBtnActive]} onPress={() => setIcon(ic)}>
                <Text style={s.iconEmoji}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Name */}
        <View style={s.card}>
          <Text style={s.label}>GROUP NAME *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Goa Trip 2026"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={t => { setName(t); setError(''); }}
            autoFocus
          />
        </View>

        {/* Members */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.label}>ADD MEMBERS *</Text>
            {friends.length > 0 && (
              <TouchableOpacity onPress={() => setMembers(friends.map(f => f.id))}>
                <Text style={s.selectAll}>Select all</Text>
              </TouchableOpacity>
            )}
          </View>

          {friends.length === 0 ? (
            <View style={s.noFriends}>
              <Text style={s.noFriendsText}>Add friends first to include them in a group</Text>
              <TouchableOpacity style={s.addFriendsBtn} onPress={() => navigation.getParent()?.getParent()?.navigate('Friends')}>
                <Text style={s.addFriendsBtnText}>+ Add Friends</Text>
              </TouchableOpacity>
            </View>
          ) : (
            friends.map(f => {
              const selected = members.includes(f.id);
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[s.memberRow, selected && s.memberRowActive]}
                  onPress={() => toggle(f.id)}
                  activeOpacity={0.7}
                >
                  <Avatar name={f.name} size={38} uri={f.avatar_url} />
                  <Text style={[s.memberName, selected && { color: COLORS.primary, fontWeight: '700' }]}>
                    {f.name}
                  </Text>
                  <View style={[s.checkbox, selected && s.checkboxActive]}>
                    {selected && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Current user — always included */}
          <View style={[s.memberRow, s.memberRowActive]}>
            <Avatar name={profile?.name || '?'} size={38} uri={profile?.avatar_url} />
            <Text style={[s.memberName, { color: COLORS.primary, fontWeight: '700' }]}>
              {profile?.name} (You)
            </Text>
            <View style={s.checkboxActive}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>
            </View>
          </View>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={[s.createBtn, loading && { opacity: 0.6 }]} onPress={handleCreate} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.createBtnText}>Create Group 🎉</Text>}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn:{ width: 36 },
  backText:{ fontSize: 28, color: COLORS.primary, lineHeight: 32 },
  title:  { color: COLORS.primary, fontSize: 17, fontWeight: '700' },
  scroll: { padding: SPACING.md, paddingBottom: 100 },

  card:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, ...SHADOW.sm },
  label:  { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  input:  { borderBottomWidth: 1.5, borderBottomColor: COLORS.borderLight, paddingVertical: 10, color: COLORS.text, fontSize: 16 },

  iconBtn:      { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: COLORS.borderLight },
  iconBtnActive:{ backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary, borderWidth: 2 },
  iconEmoji:    { fontSize: 22 },

  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  selectAll:    { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  memberRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  memberRowActive: { backgroundColor: COLORS.primary + '06' },
  memberName:      { flex: 1, fontSize: 15, color: COLORS.text },
  checkbox:        { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive:  { width: 24, height: 24, borderRadius: 12, borderColor: COLORS.primary, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  noFriends:       { alignItems: 'center', paddingVertical: SPACING.lg },
  noFriendsText:   { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.md, textAlign: 'center' },
  addFriendsBtn:   { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 10 },
  addFriendsBtnText:{ color: COLORS.primary, fontWeight: '700', fontSize: 13 },

  error:      { color: COLORS.owe, fontSize: 13, textAlign: 'center', marginBottom: SPACING.sm },
  createBtn:  { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 15, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
