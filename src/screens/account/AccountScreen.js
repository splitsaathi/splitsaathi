import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch, Platform, Modal, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useGroupStore, useBillStore, useFriendStore } from '../../store';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import Avatar from '../../components/Avatar';
import { signOut } from '../../services/auth';

const FAQS = [
  { q: 'How do I split a bill with friends?', a: 'Open a group, tap "+ Add Bill", enter the amount and who\'s involved — SplitSaathi divides it automatically.' },
  { q: 'How do I settle up with someone?', a: 'Go to the bill or group balance, tap "Settle" next to their name, and confirm — or pay via UPI directly if they\'ve added a UPI ID.' },
  { q: 'Can I change my currency?', a: 'Yes — your currency is set from your country at signup. Update your country in your profile to change it.' },
  { q: 'Is my data safe?', a: 'Yes. Your bills, groups, and messages are only visible to you and the people you share them with.' },
  { q: 'How do I add a friend?', a: 'Go to Friends → Add Friend, then search by name, email, or phone, or invite them via WhatsApp/Email.' },
  { q: 'Can I use this outside India?', a: 'Yes — SplitSaathi works worldwide. UPI settle-up currently only works for Indian bank accounts.' },
];

const PRIVACY_POLICY = `Last updated: July 2026

SplitSaathi collects only what's needed to run the app: your name, email, phone (optional), and the expenses/groups you create. If you add a UPI ID, it's shown only to people you split bills with, so they can pay you.

We never sell your data. Your bills and group chats are private — visible only to you and people you're grouped with.

You can delete your account and data anytime from Account settings, or by contacting us.

This is a summary for a small, independently-run app — for questions, reach out via the Help section.`;

const TERMS_OF_SERVICE = `Last updated: July 2026

SplitSaathi is a free tool to help you split and track shared expenses with friends, family, and groups.

By using the app, you agree to: use it for lawful purposes, keep your account secure, and not misuse the friend/group features to spam or harass others.

SplitSaathi is provided "as is" — we work hard to keep it reliable, but can't guarantee it will always be error-free. UPI settlements happen directly between users; SplitSaathi does not hold or process your money.

We may update these terms as the app grows. Continued use means you accept the latest version.`;

export default function AccountScreen({ navigation }) {
  const { profile, clear }   = useAuthStore();
  const CUR = profile?.currency_symbol || '₹';
  const CUR_CODE = profile?.currency_code || 'INR';
  const { groups }            = useGroupStore();
  const { bills }             = useBillStore();
  const { friends }           = useFriendStore();
  const [notifs, setNotifs]   = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'faq' | 'privacy' | 'terms' | null
  const totalBills = Object.values(bills).flat().length;

  const handleRate = () => {
    const msg = 'Thanks for the love! We\'re not on the App Store/Play Store just yet — once we launch there, you\'ll be first to know. For now, tell your friends about us instead? 💚';
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Rate SplitSaathi', msg);
  };

  const handleShare = async () => {
    const message = 'I use SplitSaathi to split expenses with friends — it\'s free and makes settling up so much easier! Check it out: https://www.splitsathi.com';
    if (Platform.OS === 'web') {
      if (navigator.share) {
        try { await navigator.share({ title: 'SplitSaathi', text: message, url: 'https://www.splitsathi.com' }); }
        catch (e) { /* user cancelled share — no-op */ }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        window.alert('Link copied! Paste it anywhere to share with friends.');
      }
    } else {
      await Share.share({ message });
    }
  };

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
      { icon: '❓', label: 'Help & FAQ',       onPress: () => setActiveModal('faq') },
      { icon: '⭐', label: 'Rate the App',     onPress: handleRate },
      { icon: '📤', label: 'Share with Friend',onPress: handleShare },
      { icon: '📄', label: 'Privacy Policy',   onPress: () => setActiveModal('privacy') },
      { icon: '📋', label: 'Terms of Service', onPress: () => setActiveModal('terms') },
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

      <Modal visible={!!activeModal} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {activeModal === 'faq' ? 'Help & FAQ' : activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
              {activeModal === 'faq' && FAQS.map((f, i) => (
                <View key={i} style={s.faqItem}>
                  <Text style={s.faqQ}>{f.q}</Text>
                  <Text style={s.faqA}>{f.a}</Text>
                </View>
              ))}
              {activeModal === 'privacy' && <Text style={s.legalText}>{PRIVACY_POLICY}</Text>}
              {activeModal === 'terms' && <Text style={s.legalText}>{TERMS_OF_SERVICE}</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  // Support modal (FAQ / Privacy / Terms)
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: COLORS.bg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '80%', minHeight: '50%' },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  modalTitle:   { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  modalClose:   { color: COLORS.textMuted, fontSize: 18, padding: 4 },
  faqItem:      { marginBottom: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  faqQ:         { color: COLORS.text, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  faqA:         { color: COLORS.textSub, fontSize: 13, lineHeight: 20 },
  legalText:    { color: COLORS.textSub, fontSize: 13, lineHeight: 21 },
});

