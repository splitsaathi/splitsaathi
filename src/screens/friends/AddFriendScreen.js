import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useFriendStore } from '../../store';
import { COLORS, SPACING, RADIUS } from '../../theme';
import Avatar from '../../components/Avatar';
import { getPhoneContacts, sendWhatsAppInvite, sendEmailInvite } from '../../services/contacts';
import { searchUsers } from '../../services/database';

export default function AddFriendScreen({ route, navigation }) {
  const initialTab = route.params?.initialTab || 'search';
  const { profile } = useAuthStore();
  const { addFriend, loadFriends } = useFriendStore();

  const [tab,      setTab]      = useState(initialTab);
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [added,    setAdded]    = useState(new Set());

  // Contacts tab
  const [contactsPerm, setContactsPerm] = useState('prompt');
  const [contacts,     setContacts]     = useState([]);
  const [contactSearch,setContactSearch]= useState('');
  const [selected,     setSelected]     = useState([]);

  // WhatsApp / Email tabs
  const [waNum,    setWaNum]    = useState('');
  const [emailInv, setEmailInv] = useState('');
  const [copied,   setCopied]   = useState(false);

  const inviteLink = `https://Splitsathi.com/join/${profile?.id || 'invite'}`;

  const doSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;
    setLoading(true);
    const { data } = await searchUsers(q);
    setResults((data || []).filter(u => u.id !== profile?.id));
    setLoading(false);
  };

  // Auto search jab valid email type ho
  useEffect(() => {
    if (query.includes('@') && query.includes('.') && query.length > 5) {
      const timer = setTimeout(() => doSearch(query), 600);
      return () => clearTimeout(timer);
    }
    if (!query.trim()) setResults([]);
  }, [query]);

  const doAddFriend = async (friend) => {
    const { error } = await addFriend(profile.id, friend.id);
    if (error && !error.message?.includes('duplicate')) {
      Alert.alert('Error', error.message); return;
    }
    setAdded(p => new Set([...p, friend.id]));
    await loadFriends(profile.id);
  };

  const loadContacts = async () => {
    setLoading(true);
    const { granted, contacts: list } = await getPhoneContacts();
    if (!granted) { setContactsPerm('denied'); setLoading(false); return; }
    setContactsPerm('granted');
    setContacts(list);
    setLoading(false);
  };

  const addSelectedContacts = async () => {
    for (const c of selected) {
      if (c.appUser) await doAddFriend(c.appUser);
    }
    Alert.alert('✅ Done!', `${selected.filter(c => c.appUser).length} friend(s) added`);
    setSelected([]);
  };

  const copyLink = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(inviteLink);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      Alert.alert('Error', 'Could not copy link');
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phone?.includes(contactSearch)
  );

  // Web pe Contacts tab hide karo
  const TABS = [
    { id: 'search',   label: '🔍 Search'   },
    ...(Platform.OS !== 'web' ? [{ id: 'contacts', label: '📱 Contacts' }] : []),
    { id: 'whatsapp', label: '💬 WhatsApp'  },
    { id: 'email',    label: '📧 Email'     },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Friend</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── SEARCH TAB ── */}
        {tab === 'search' && (
          <View>
            <Text style={styles.hint}>
              Email type karo — automatically search hoga ✨
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Email ya naam type karo..."
                placeholderTextColor={COLORS.textMuted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => doSearch()}
                returnKeyType="search"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={() => doSearch()}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Auto search indicator */}
            {query.includes('@') && loading && (
              <Text style={styles.autoSearchText}>🔍 Searching...</Text>
            )}
            {query.includes('@') && !loading && results.length === 0 && query.length > 5 && (
              <Text style={styles.noResultEmail}>
                No user found with this email. You can invite them below! 👇
              </Text>
            )}

            {loading && !query.includes('@') && (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            )}

            {results.map(u => (
              <View key={u.id} style={styles.resultCard}>
                <Avatar name={u.name} size={42} uri={u.avatar_url} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.resultName}>{u.name}</Text>
                  <Text style={styles.resultEmail}>{u.email}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, added.has(u.id) && styles.addBtnDone]}
                  onPress={() => doAddFriend(u)}
                  disabled={added.has(u.id)}
                >
                  <Text style={styles.addBtnText}>{added.has(u.id) ? '✓ Added' : '+ Add'}</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Agar email se nahi mila to invite option */}
            {query.includes('@') && !loading && results.length === 0 && query.length > 5 && (
              <View style={styles.inviteCard}>
                <Text style={styles.inviteTitle}>Invite karo Splitsathi pe!</Text>
                <Text style={styles.inviteDesc}>{query} abhi Splitsathi pe nahi hai.</Text>
                <TouchableOpacity
                  style={styles.inviteBtn}
                  onPress={() => {
                    setEmailInv(query);
                    setTab('email');
                  }}
                >
                  <Text style={styles.inviteBtnText}>📧 Email Invite Bhejo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inviteBtn, { backgroundColor: '#25d366', marginTop: 8 }]}
                  onPress={() => setTab('whatsapp')}
                >
                  <Text style={styles.inviteBtnText}>💬 WhatsApp Invite Bhejo</Text>
                </TouchableOpacity>
              </View>
            )}

            {results.length === 0 && query && !loading && !query.includes('@') && (
              <Text style={styles.noResult}>No user found for "{query}"</Text>
            )}
          </View>
        )}

        {/* ── CONTACTS TAB (Only Native) ── */}
        {tab === 'contacts' && Platform.OS !== 'web' && (
          <View>
            {contactsPerm === 'prompt' && (
              <View style={styles.permBox}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📱</Text>
                <Text style={styles.permTitle}>Phone Contacts Access</Text>
                <Text style={styles.permDesc}>
                  Find friends from your contacts and invite them to Splitsathi.
                </Text>
                <TouchableOpacity style={styles.permBtn} onPress={loadContacts} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.permBtnText}>📱 Allow Contacts Access</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
            {contactsPerm === 'denied' && (
              <View style={styles.permBox}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🚫</Text>
                <Text style={styles.permDesc}>Permission denied. Use Search tab instead.</Text>
                <TouchableOpacity style={styles.permBtn} onPress={() => setTab('search')}>
                  <Text style={styles.permBtnText}>Search Friends</Text>
                </TouchableOpacity>
              </View>
            )}
            {contactsPerm === 'granted' && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="🔍 Name or number..."
                  placeholderTextColor={COLORS.textMuted}
                  value={contactSearch}
                  onChangeText={setContactSearch}
                />
                {filteredContacts.map(c => {
                  const isSelected = !!selected.find(x => x.id === c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.contactCard, isSelected && styles.contactCardSelected]}
                      onPress={() => {
                        if (c.appUser && added.has(c.appUser.id)) return;
                        setSelected(p => p.find(x => x.id === c.id) ? p.filter(x => x.id !== c.id) : [...p, c]);
                      }}
                    >
                      <Avatar name={c.name} size={42} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.resultName}>{c.name}</Text>
                        <Text style={styles.resultEmail}>+91 {c.phone}</Text>
                      </View>
                      {c.onApp && <View style={styles.onAppBadge}><Text style={styles.onAppText}>On App ✓</Text></View>}
                    </TouchableOpacity>
                  );
                })}
                {selected.length > 0 && (
                  <TouchableOpacity style={styles.addAllBtn} onPress={addSelectedContacts}>
                    <Text style={styles.addAllBtnText}>Add {selected.length} Friend{selected.length > 1 ? 's' : ''}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── WHATSAPP TAB ── */}
        {tab === 'whatsapp' && (
          <View>
            <View style={styles.waHeader}>
              <Text style={{ fontSize: 36 }}>💬</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.waTitle}>WhatsApp Invite</Text>
                <Text style={styles.waDesc}>Send an invite link to a friend on WhatsApp</Text>
              </View>
            </View>

            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}><Text style={{ color: COLORS.textSub }}>🇮🇳 +91</Text></View>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="9876543210" placeholderTextColor={COLORS.textMuted}
                value={waNum} onChangeText={t => setWaNum(t.replace(/\D/g, ''))}
                maxLength={10} keyboardType="phone-pad"
              />
            </View>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8, marginBottom: SPACING.lg }}>
              A ready-made invite message will be sent with your referral link
            </Text>
            <TouchableOpacity
              style={styles.waBtn}
              onPress={() => {
                if (waNum.length < 10) { Alert.alert('Error', 'Enter a 10-digit number!'); return; }
                sendWhatsAppInvite(waNum, profile?.name || 'Someone');
              }}
            >
              <Text style={styles.waBtnText}>💬 Send Invite on WhatsApp</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginHorizontal: 12 }}>or share your invite link</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            </View>

            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>{inviteLink}</Text>
              <TouchableOpacity style={[styles.copyBtn, copied && styles.copyBtnDone]} onPress={copyLink}>
                <Text style={[styles.copyBtnText, copied && { color: COLORS.primary }]}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── EMAIL TAB ── */}
        {tab === 'email' && (
          <View>
            <View style={styles.waHeader}>
              <Text style={{ fontSize: 36 }}>📧</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.waTitle}>Email Invite</Text>
                <Text style={styles.waDesc}>Send an invitation to any email address</Text>
              </View>
            </View>

            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="friend@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={emailInv}
              onChangeText={setEmailInv}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <Text style={{ color: COLORS.textSub, fontSize: 13, lineHeight: 20 }}>
                <Text style={{ color: COLORS.text, fontWeight: '700' }}>{profile?.name}</Text>
                {' '}invited you{' '}
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>on Splitsathi</Text>.{'\n'}
                Join now to split expenses easily! 🎉{'\n'}
                <Text style={{ color: COLORS.primary }}>{inviteLink}</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.waBtn}
              onPress={() => {
                if (!emailInv.includes('@')) { Alert.alert('Error', 'Enter a valid email!'); return; }
                sendEmailInvite(emailInv, profile?.name || 'Someone');
              }}
            >
              <Text style={styles.waBtnText}>📧 Send Email Invite</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginHorizontal: 12 }}>or copy your invite link</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            </View>

            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>{inviteLink}</Text>
              <TouchableOpacity style={[styles.copyBtn, copied && styles.copyBtnDone]} onPress={copyLink}>
                <Text style={[styles.copyBtnText, copied && { color: COLORS.primary }]}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.bg },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText:       { color: COLORS.textMuted, fontSize: 16, width: 60 },
  headerTitle:    { color: COLORS.text, fontWeight: '700', fontSize: 16 },
  tabScroll:      { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexGrow: 0 },
  tab:            { paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: COLORS.primary },
  tabText:        { color: COLORS.textMuted, fontWeight: '600', fontSize: 13 },
  tabTextActive:  { color: COLORS.primary },
  scroll:         { padding: SPACING.md, paddingBottom: 60 },
  hint:           { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.md },
  autoSearchText: { color: COLORS.primary, fontSize: 12, marginTop: -8, marginBottom: 8 },
  noResultEmail:  { color: COLORS.textMuted, fontSize: 13, marginTop: -4, marginBottom: 12, textAlign: 'center' },
  searchRow:      { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  input:          { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: SPACING.md },
  searchBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 16, justifyContent: 'center' },
  label:          { color: COLORS.textSub, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.8 },
  resultCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  resultName:     { color: COLORS.text, fontWeight: '600' },
  resultEmail:    { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  addBtn:         { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnDone:     { backgroundColor: 'transparent', borderColor: COLORS.border },
  addBtnText:     { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  noResult:       { color: COLORS.textMuted, textAlign: 'center', padding: 20 },
  inviteCard:     { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginTop: 8, alignItems: 'center' },
  inviteTitle:    { color: COLORS.text, fontWeight: '700', fontSize: 15, marginBottom: 6 },
  inviteDesc:     { color: COLORS.textMuted, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  inviteBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 13, width: '100%', alignItems: 'center' },
  inviteBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  permBox:        { alignItems: 'center', padding: 24, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  permTitle:      { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  permDesc:       { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  permBtn:        { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 24, paddingVertical: 13, width: '100%', alignItems: 'center' },
  permBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  contactCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  contactCardSelected: { borderColor: COLORS.primary, backgroundColor: 'rgba(16,185,129,0.05)' },
  onAppBadge:     { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  onAppText:      { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  addAllBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 15, alignItems: 'center', marginTop: SPACING.md },
  addAllBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  waHeader:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(37,211,102,0.08)', borderWidth: 1, borderColor: 'rgba(37,211,102,0.25)', borderRadius: RADIUS.lg, padding: 14, marginBottom: SPACING.lg },
  waTitle:        { color: '#25d366', fontWeight: '700', fontSize: 15 },
  waDesc:         { color: COLORS.textMuted, fontSize: 13 },
  phoneRow:       { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  countryCode:    { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, justifyContent: 'center' },
  waBtn:          { backgroundColor: '#25d366', borderRadius: RADIUS.lg, padding: 15, alignItems: 'center' },
  waBtnText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  divider:        { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  linkBox:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  linkText:       { color: COLORS.textSub, fontSize: 13, flex: 1, marginRight: 8 },
  copyBtn:        { borderWidth: 1, borderColor: COLORS.info, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 6 },
  copyBtnDone:    { borderColor: COLORS.primary },
  copyBtnText:    { color: COLORS.info, fontWeight: '600', fontSize: 12 },
  previewBox:     { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  previewLabel:   { color: COLORS.textMuted, fontSize: 11, marginBottom: 6, textTransform: 'uppercase' },
});

