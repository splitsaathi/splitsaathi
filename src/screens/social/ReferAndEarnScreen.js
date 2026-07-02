import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import { useAuthStore } from '../../store';
import * as Clipboard from 'expo-clipboard';

const MOCK_REFERRALS = [
  { id: '1', name: 'Arjun Sharma', date: '2026-06-20', points: 50, txnId: 'TXN001', status: 'Credited' },
  { id: '2', name: 'Priya Patel',  date: '2026-06-18', points: 50, txnId: 'TXN002', status: 'Credited' },
  { id: '3', name: 'Rahul Verma',  date: '2026-06-15', points: 50, txnId: 'TXN003', status: 'Pending'  },
];

export default function ReferAndEarnScreen({ navigation }) {
  const { profile }     = useAuthStore();
  const [tab, setTab]   = useState('invite');
  const [copied, setCopied] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const rewardPoints = 150;

  const referralCode = `SPLIT${(profile?.name || 'USER').slice(0,4).toUpperCase()}${1234}`;
  const referralLink = `https://Splitsathi.com/join?ref=${referralCode}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Hey! Join me on Splitsathi — the best app for splitting expenses!\nUse my code ${referralCode} and we both get ₹50!\n\n${referralLink}`,
    });
  };

  const handleInviteByEmail = () => {
    if (!friendEmail.includes('@')) { Alert.alert('Error', 'Enter a valid email!'); return; }
    Alert.alert('✅ Invite Sent!', `Invitation sent to ${friendEmail}`);
    setFriendEmail('');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>‹</Text></TouchableOpacity>
        <Text style={s.title}>Refer & Earn</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.heroCard}>
          <Text style={s.heroEmoji}>🎁</Text>
          <Text style={s.heroTitle}>Invite Friends, Earn Rewards!</Text>
          <Text style={s.heroSub}>For every friend who signs up, you both get <Text style={s.gold}>₹50</Text> credited!</Text>
          <View style={s.pointsBadge}>
            <Text style={s.pointsVal}>{rewardPoints}</Text>
            <Text style={s.pointsLabel}>⭐ Reward Points</Text>
          </View>
        </View>

        <View style={s.codeCard}>
          <Text style={s.label}>YOUR REFERRAL CODE</Text>
          <View style={s.codeRow}>
            <Text style={s.codeText}>{referralCode}</Text>
            <TouchableOpacity style={[s.copyBtn, copied && { backgroundColor: '#16a34a' }]} onPress={handleCopy}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{copied ? '✓ Copied!' : '📋 Copy'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.linkText} numberOfLines={1}>{referralLink}</Text>
        </View>

        <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
          <Text style={s.shareBtnText}>📤 Share Referral Link</Text>
        </TouchableOpacity>

        <View style={s.tabRow}>
          {[['invite','✉️ Invite'],['history','📋 History']].map(([t,l]) => (
            <TouchableOpacity key={t} style={[s.tabBtn, tab===t && s.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab===t && { color:'#fff' }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'invite' && (
          <View style={s.card}>
            <Text style={s.label}>INVITE BY EMAIL</Text>
            <View style={s.inviteRow}>
              <TextInput style={s.inviteInput} placeholder="friend@email.com" placeholderTextColor={COLORS.textMuted}
                value={friendEmail} onChangeText={setFriendEmail} keyboardType="email-address" autoCapitalize="none" />
              <TouchableOpacity style={s.inviteBtn} onPress={handleInviteByEmail}>
                <Text style={{ color:'#fff', fontWeight:'700', fontSize:13 }}>Send</Text>
              </TouchableOpacity>
            </View>
            <View style={s.stepsCard}>
              <Text style={s.label}>HOW IT WORKS</Text>
              {['Share your referral link','Friend signs up on Splitsathi','Both get ₹50 reward points! 🎉'].map((t,i) => (
                <View key={i} style={s.stepRow}>
                  <View style={s.stepBadge}><Text style={{ color:'#fff', fontWeight:'700', fontSize:12 }}>{i+1}</Text></View>
                  <Text style={s.stepText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 'history' && (
          <View>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom: SPACING.sm }}>
              <Text style={s.label}>TOTAL EARNED</Text>
              <Text style={{ color: COLORS.primary, fontSize:18, fontWeight:'800' }}>₹{MOCK_REFERRALS.filter(r=>r.status==='Credited').length*50}</Text>
            </View>
            {MOCK_REFERRALS.map(r => (
              <View key={r.id} style={s.histCard}>
                <View style={s.histAvatar}><Text style={{ color:'#fff', fontWeight:'700' }}>{r.name[0]}</Text></View>
                <View style={{ flex:1, marginLeft:12 }}>
                  <Text style={{ color: COLORS.text, fontWeight:'600', fontSize:14 }}>{r.name}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize:11, marginTop:2 }}>{r.date} · {r.txnId}</Text>
                </View>
                <View style={{ alignItems:'flex-end' }}>
                  <Text style={{ color: COLORS.primary, fontWeight:'700', fontSize:14 }}>+{r.points} pts</Text>
                  <Text style={{ color: r.status==='Credited'? COLORS.primary : COLORS.saffron, fontSize:11, fontWeight:'600', marginTop:2 }}>{r.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md }}>
          <Text style={{ color: COLORS.textMuted, fontSize:11, lineHeight:18 }}>🛡️ Points credited within 24 hours of friend's first expense. Max ₹500/month. T&C apply.</Text>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor: COLORS.bg },
  header:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  backText:{ fontSize:28, color: COLORS.primary, lineHeight:32 },
  title:   { color: COLORS.primary, fontSize:17, fontWeight:'700' },
  scroll:  { padding: SPACING.md },
  label:   { color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:8 },
  card:    { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, ...SHADOW.sm },

  heroCard:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems:'center', marginBottom: SPACING.md },
  heroEmoji:  { fontSize:48, marginBottom: SPACING.sm },
  heroTitle:  { color:'#fff', fontSize:20, fontWeight:'700', textAlign:'center', marginBottom:8 },
  heroSub:    { color:'rgba(255,255,255,0.75)', fontSize:13, textAlign:'center', lineHeight:20, marginBottom: SPACING.md },
  gold:       { color: COLORS.gold, fontWeight:'800' },
  pointsBadge:{ backgroundColor:'rgba(255,255,255,0.12)', borderRadius: RADIUS.lg, paddingHorizontal:24, paddingVertical:12, alignItems:'center' },
  pointsVal:  { color: COLORS.gold, fontSize:28, fontWeight:'800' },
  pointsLabel:{ color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:2 },

  codeCard:  { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, ...SHADOW.sm },
  codeRow:   { flexDirection:'row', alignItems:'center', marginBottom:8 },
  codeText:  { flex:1, color: COLORS.primary, fontSize:22, fontWeight:'800', letterSpacing:2 },
  copyBtn:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal:14, paddingVertical:8 },
  linkText:  { color: COLORS.textMuted, fontSize:11 },

  shareBtn:     { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, padding:15, alignItems:'center', marginBottom: SPACING.lg },
  shareBtnText: { color:'#78350f', fontWeight:'700', fontSize:16 },

  tabRow:      { flexDirection:'row', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg, padding:4, marginBottom: SPACING.md },
  tabBtn:      { flex:1, paddingVertical:10, alignItems:'center', borderRadius: RADIUS.md },
  tabBtnActive:{ backgroundColor: COLORS.primary },
  tabText:     { color: COLORS.textMuted, fontWeight:'600', fontSize:13 },

  inviteRow:  { flexDirection:'row', gap:10, marginBottom: SPACING.md },
  inviteInput:{ flex:1, borderBottomWidth:1.5, borderBottomColor: COLORS.borderLight, paddingVertical:10, color: COLORS.text, fontSize:14 },
  inviteBtn:  { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal:16, justifyContent:'center' },

  stepsCard: { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.sm },
  stepRow:   { flexDirection:'row', alignItems:'center', marginBottom:10 },
  stepBadge: { width:26, height:26, borderRadius:13, backgroundColor: COLORS.primary, alignItems:'center', justifyContent:'center', marginRight:12 },
  stepText:  { color: COLORS.textSub, fontSize:13, flex:1 },

  histCard:   { flexDirection:'row', alignItems:'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom:8, borderWidth:1, borderColor: COLORS.borderLight },
  histAvatar: { width:38, height:38, borderRadius:19, backgroundColor: COLORS.primaryLight, alignItems:'center', justifyContent:'center' },
});

