import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Linking, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useFriendStore } from '../../store';
import { COLORS, SPACING, RADIUS } from '../../theme';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import { sendWhatsAppInvite } from '../../services/contacts';
import { removeFriend } from '../../services/database';

export default function FriendsScreen({ navigation }) {
  const { profile } = useAuthStore();
  const { friends, loadFriends } = useFriendStore();
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState(null);

  useEffect(() => { if (profile?.id) loadFriends(profile.id); }, [profile?.id]);

  const filtered = friends.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRemoveFriend = (friend) => {
    const doRemove = async () => {
      setRemoving(friend.id);
      const { error } = await removeFriend(profile.id, friend.id);
      if (error) {
        Alert.alert('Error', 'Could not remove friend. Try again.');
      } else {
        await loadFriends(profile.id);
      }
      setRemoving(null);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${friend.name} from friends?`)) doRemove();
    } else {
      Alert.alert(
        'Remove Friend',
        `Are you sure you want to remove ${friend.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: doRemove },
        ]
      );
    }
  };

  // Web pe contacts hide karo
  const quickButtons = [
    ...(Platform.OS !== 'web' ? [{ icon: '📱', label: 'Contacts', color: '#6366f1' }] : []),
    { icon: '💬', label: 'WhatsApp', color: '#25d366' },
    { icon: '📧', label: 'Email',    color: '#818cf8' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddFriend')}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Quick add methods */}
      <View style={styles.quickRow}>
        {quickButtons.map(w => (
          <TouchableOpacity
            key={w.label}
            style={[styles.quickBtn, { backgroundColor: w.color + '11', borderColor: w.color + '33' }]}
            onPress={() => navigation.navigate('AddFriend', { initialTab: w.label.toLowerCase() })}
          >
            <Text style={{ fontSize: 22 }}>{w.icon}</Text>
            <Text style={[styles.quickLabel, { color: w.color }]}>{w.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {friends.length > 0 && (
        <View style={{ paddingHorizontal: SPACING.md }}>
          <TextInput
            style={styles.search}
            placeholder="🔍 Search friends..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {friends.length === 0 ? (
          <EmptyState
            emoji="👥"
            text="No friends yet.&#10;Add via Search, WhatsApp or Email!"
            actionLabel="+ Add Friend"
            onAction={() => navigation.navigate('AddFriend')}
          />
        ) : (
          filtered.map(f => (
            <View key={f.id} style={styles.friendCard}>
              <Avatar name={f.name} size={42} uri={f.avatar_url} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.friendName}>{f.name}</Text>
                <Text style={styles.friendMeta}>{f.email || f.phone}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {f.phone && Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => sendWhatsAppInvite(f.phone, profile.name)}
                  >
                    <Text style={{ fontSize: 16 }}>💬</Text>
                  </TouchableOpacity>
                )}
                {f.email && (
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => Linking.openURL(`mailto:${f.email}`)}
                  >
                    <Text style={{ fontSize: 16 }}>📧</Text>
                  </TouchableOpacity>
                )}
                {/* Remove Button */}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveFriend(f)}
                  disabled={removing === f.id}
                >
                  <Text style={styles.removeBtnText}>
                    {removing === f.id ? '...' : '✕'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.bg },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:      { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  addBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  quickRow:   { flexDirection: 'row', gap: 8, padding: SPACING.md },
  quickBtn:   { flex: 1, alignItems: 'center', gap: 4, borderRadius: RADIUS.md, borderWidth: 1, padding: 12 },
  quickLabel: { fontSize: 11, fontWeight: '700' },
  search:     { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: SPACING.md },
  scroll:     { padding: SPACING.md, paddingTop: 0, paddingBottom: 100 },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  friendName: { color: COLORS.text, fontWeight: '600' },
  friendMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  iconBtn:    { backgroundColor: COLORS.bg, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  removeBtn:  { backgroundColor: 'rgba(239,68,68,0.1)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  removeBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
});

