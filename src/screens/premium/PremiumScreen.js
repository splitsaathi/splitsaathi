import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import { useAuthStore } from '../../store';

const SUPABASE_URL = 'https://bmhgnbvaufeafhennvaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaGduYnZhdWZlYWZoZW5udmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzI4MTcsImV4cCI6MjA5NzU0ODgxN30.ZQXBEI23RMG5qIJAmGdKvcgPciPj2Jlpyd3XqSRSRpc';

const FEATURES = [
  { icon: '📊', title: 'Unlimited Expense History', sub: 'Store all bills forever, never lose track' },
  { icon: '📈', title: 'Advanced Analytics',        sub: 'Pie & bar charts, spending trends' },
  { icon: '💳', title: 'UPI Auto-Settle',           sub: 'One-tap payment with UPI integration' },
  { icon: '🔔', title: 'Smart Reminders',           sub: 'Auto-nudge friends before due dates' },
  { icon: '📁', title: 'PDF & Excel Export',        sub: 'Professional reports, email directly' },
  { icon: '🌍', title: 'Multi-Currency',            sub: 'Split in any currency, convert automatically' },
  { icon: '🤝', title: 'Priority Support',          sub: '24/7 dedicated support team' },
  { icon: '✨', title: 'AI Bill Scanner',           sub: 'Scan receipts, auto-extract line items' },
];

export default function PremiumScreen({ navigation }) {
  const { profile, setProfile } = useAuthStore();
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);

  // Check if this user already claimed the free year
  useEffect(() => {
    if (!profile?.id) { setChecking(false); return; }
    fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}&select=premium_until`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
      .then(res => res.json())
      .then(rows => {
        const until = rows?.[0]?.premium_until;
        if (until && new Date(until) > new Date()) {
          setAlreadyClaimed(true);
          setExpiryDate(new Date(until));
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [profile?.id]);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      if (profile?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ premium_until: oneYearFromNow.toISOString(), is_premium: true }),
        });
        setProfile({ ...profile, premium_until: oneYearFromNow.toISOString(), is_premium: true });
      }
      setExpiryDate(oneYearFromNow);
      setSuccess(true);
    } catch (e) {
      // Even if the backend save fails, don't block the user with an error —
      // just let them proceed; worst case they can re-claim next visit.
      setSuccess(true);
    }
    setLoading(false);
  };

  const formatDate = (d) => d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  if (checking) {
    return (
      <SafeAreaView style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // ── Success / Already-claimed screen ──────────────────────────────────────
  if (success || alreadyClaimed) return (
    <SafeAreaView style={[s.safe, { alignItems:'center', justifyContent:'center', padding: SPACING.lg }]}>
      <Text style={{ fontSize:72, marginBottom: SPACING.md }}>🎉</Text>
      <Text style={[s.heroTitle, { color: COLORS.text, textAlign:'center', marginBottom:8 }]}>
        {alreadyClaimed && !success ? 'You\'re Already Premium!' : 'Premium Unlocked — Free!'}
      </Text>
      <Text style={{ color: COLORS.textMuted, fontSize:14, textAlign:'center', marginBottom: SPACING.md, lineHeight: 20 }}>
        Enjoy every premium feature at no cost until{'\n'}
        <Text style={{ fontWeight:'800', color: COLORS.primary }}>{formatDate(expiryDate)}</Text>
      </Text>
      <View style={s.freeBadgeBig}>
        <Text style={{ color:'#fff', fontWeight:'800', fontSize:13 }}>🎁 12 MONTHS · ₹0 · NO CARD NEEDED</Text>
      </View>
      <TouchableOpacity style={[s.upgradeBtn, { marginTop: SPACING.xl }]} onPress={() => navigation.goBack()}>
        <Text style={s.upgradeBtnText}>Start Exploring ✨</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  // ── Main offer screen ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>‹</Text></TouchableOpacity>
        <Text style={s.title}>Go Premium</Text>
        <View style={{ width:36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Launch offer badge */}
        <View style={s.launchBadge}>
          <Text style={s.launchBadgeText}>🚀 LAUNCH OFFER — LIMITED TIME</Text>
        </View>

        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={{ fontSize:52, marginBottom: SPACING.sm }}>🎁</Text>
          <Text style={s.heroFreeText}>FREE</Text>
          <Text style={s.heroTitle}>for a full 12 months</Text>
          <Text style={s.heroSub}>
            To celebrate our launch, every feature below is on us —{'\n'}no card, no catch, no charge for a whole year.
          </Text>
        </View>

        {/* Why free explainer */}
        <View style={s.whyCard}>
          <Text style={s.whyIcon}>💚</Text>
          <Text style={s.whyText}>
            We're rolling out payments soon. Until then, everyone gets the{' '}
            <Text style={{ fontWeight:'800', color: COLORS.text }}>full Premium experience free</Text> — genuinely, no strings attached.
          </Text>
        </View>

        {/* Features list */}
        <View style={s.featuresCard}>
          <Text style={s.featuresTitle}>EVERYTHING INCLUDED — FREE FOR 1 YEAR</Text>
          {FEATURES.map((f,i) => (
            <View key={i} style={[s.featureRow, i < FEATURES.length-1 && { borderBottomWidth:1, borderBottomColor: COLORS.borderLight }]}>
              <View style={s.featureIconBox}><Text style={{ fontSize:20 }}>{f.icon}</Text></View>
              <View style={{ flex:1, marginLeft:12 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureSub}>{f.sub}</Text>
              </View>
              <Text style={{ color: COLORS.primary, fontSize:16, fontWeight:'700' }}>✓</Text>
            </View>
          ))}
        </View>

        {/* Claim button */}
        <TouchableOpacity style={[s.upgradeBtn, loading && { opacity:0.7 }]} onPress={handleClaim} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.upgradeBtnText}>🎉 Claim My Free Year</Text>}
        </TouchableOpacity>

        <Text style={{ color: COLORS.textMuted, fontSize:11, textAlign:'center', marginTop: SPACING.sm }}>
          No payment info required · Activates instantly · Cancel anytime
        </Text>
        <View style={{ height:60 }} />
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

  launchBadge:     { alignSelf:'center', backgroundColor: '#fef3c7', borderWidth:1, borderColor:'#f59e0b', borderRadius: RADIUS.full, paddingHorizontal:16, paddingVertical:6, marginBottom: SPACING.md },
  launchBadgeText: { color:'#92400e', fontWeight:'800', fontSize:12, letterSpacing:0.5 },

  heroCard:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems:'center', marginBottom: SPACING.md },
  heroFreeText: { color:'#fff', fontSize:44, fontWeight:'900', letterSpacing:2, marginBottom:-4 },
  heroTitle:    { color:'#fff', fontSize:20, fontWeight:'700', marginBottom:10 },
  heroSub:      { color:'rgba(255,255,255,0.85)', fontSize:13, textAlign:'center', lineHeight:19 },

  whyCard:  { flexDirection:'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, gap:10, alignItems:'flex-start' },
  whyIcon:  { fontSize:22 },
  whyText:  { flex:1, color: COLORS.textSub, fontSize:13, lineHeight:19 },

  featuresCard:  { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, ...SHADOW.sm },
  featuresTitle: { color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom: SPACING.sm },
  featureRow:    { flexDirection:'row', alignItems:'center', paddingVertical:12 },
  featureIconBox:{ width:40, height:40, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceHigh, alignItems:'center', justifyContent:'center' },
  featureTitle:  { color: COLORS.text, fontWeight:'600', fontSize:14 },
  featureSub:    { color: COLORS.textMuted, fontSize:12, marginTop:1 },

  upgradeBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding:16, alignItems:'center', marginBottom: SPACING.sm },
  upgradeBtnText: { color:'#fff', fontWeight:'700', fontSize:15 },

  freeBadgeBig: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal:18, paddingVertical:8 },
});
