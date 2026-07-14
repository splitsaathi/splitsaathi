import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useGroupStore, useBillStore, useFriendStore } from '../../store';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import Avatar from '../../components/Avatar';
import { signOut } from '../../services/auth';

export default function AccountScreen({ navigation }) {
  const { profile, clear }   = useAuthStore();
  const CUR = profile?.currency_symbol || '₹';
  const CUR_CODE = profile?.currency_code || 'INR';
  const { groups }            = useGroupStore();
  const { bills }             = useBillStore();
  const { friends }           = useFriendStore();
  const [notifs, setNotifs]   = useState(true);
  const totalBills = Object.values(bills).flat().length;

  const handleLogout = () => {
    const doLogout = async () => { await signOut(); clear(); };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) doLogout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const MENU = [
    { title: 'Account', items: [
      { icon: '✏️', label: 'Edit Profile',   onPress: () => navigation.navigate('EditProfile') },
    ]},
    { title: 'Preferences', items: [
      { icon: '🔔', label: 'Notifications', right: <Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: COLORS.primary }} thumbColor="#fff" /> },
      { icon: CUR,  label: 'Currency',      right: <Text style={s.menuRight}>{CUR_CODE} {CUR}</Text> },
    ]},
    { title: 'Rewards', items: [
      { icon: '🎁', label: 'Refer & Earn',     onPress: () => navigation.navigate('ReferAndEarn') },
      { icon: '💎', label: 'Go Premium',         onPress: () => navigation.navigate('Premium') },
    ]},
    { title: 'Support', items: [
      { icon: '❓', label: 'Help & FAQ',       onPress: () => {} },
      { icon: '⭐', label: 'Rate the App',     onPress: () => {} },
      { icon: '📤', label: 'Share with Friend',onPress: () => {} },
      { icon: '📄', label: 'Privacy Policy',   onPress: () => {} },
      { icon: '📋', label: 'Terms of Service', onPress: () => {} },
    ]},
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.profileBg}>
            <Avatar name={profile?.name || '?'} size={72} uri={profile?.avatar_url} />
          </View>
          <Text style={s.profileName}>{profile?.name}</Text>
          <Text style={s.profileEmail}>{profile?.email}</Text>
          {profile?.upi_id && <Text style={s.profileUpi}>💳 UPI: {profile.upi_id}</Text>}
          <TouchableOpacity style={s.editProfileBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={s.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Groups',  value: groups.length,   icon: '👥' },
            { label: 'Bills',   value: totalBills,       icon: '🧾' },
            { label: 'Friends', value: friends.length,   icon: '🤝' },
          ].map(st => (
            <View key={st.label} style={s.statBox}>
              <Text style={s.statIcon}>{st.icon}</Text>
              <Text style={s.statVal}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu sections */}
        {MENU.map(section => (
          <View key={section.title} style={s.menuSection}>
            <Text style={s.menuSectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={s.menuCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.menuRow, idx < section.items.length - 1 && s.menuRowBorder]}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                  activeOpacity={item.onPress ? 0.7 : 1}
                >
                  <Text style={s.menuIcon}>{item.icon}</Text>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <View style={{ marginLeft: 'auto' }}>
                    {item.right || <Text style={s.menuArrow}>›</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>🚪  Logout</Text>
        </TouchableOpacity>

        <Text style={s.version}>Splitsathi v1.0.0 · Heritage Edition</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  header:  { padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title:   { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  scroll:  { padding: SPACING.md },

  // Profile card
  profileCard:    { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  profileBg:      { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12, padding: 3 },
  profileName:    { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  profileEmail:   { color: COLORS.textMuted, fontSize: 13, marginBottom: 4 },
  profileUpi:     { color: COLORS.primary, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  editProfileBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 20, paddingVertical: 8 },
  editProfileText:{ color: COLORS.primary, fontWeight: '700', fontSize: 13 },

  // Stats
  statsRow:  { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, ...SHADOW.sm },
  statBox:   { flex: 1, alignItems: 'center' },
  statIcon:  { fontSize: 22, marginBottom: 4 },
  statVal:   { color: COLORS.primary, fontSize: 22, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  // Menu
  menuSection:     { marginBottom: SPACING.md },
  menuSectionTitle:{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  menuCard:        { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm },
  menuRow:         { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuRowBorder:   { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  menuIcon:        { fontSize: 18, marginRight: 14, width: 24, textAlign: 'center' },
  menuLabel:       { color: COLORS.text, fontSize: 15 },
  menuArrow:       { color: COLORS.textMuted, fontSize: 20 },
  menuRight:       { color: COLORS.textMuted, fontSize: 14 },

  // Logout
  logoutBtn:  { backgroundColor: '#fff0f0', borderWidth: 1, borderColor: '#fecaca', borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', marginBottom: SPACING.md },
  logoutText: { color: COLORS.owe, fontWeight: '700', fontSize: 16 },
  version:    { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginBottom: SPACING.md },
});

