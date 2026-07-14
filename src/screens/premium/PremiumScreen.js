import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, RADIUS } from '../../theme';
import { useAuthStore } from '../../store';

const SUPABASE_URL = 'https://bmhgnbvaufeafhennvaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaGduYnZhdWZlYWZoZW5udmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzI4MTcsImV4cCI6MjA5NzU0ODgxN30.ZQXBEI23RMG5qIJAmGdKvcgPciPj2Jlpyd3XqSRSRpc';

// ── Luxury gold-on-black palette — kept local to this screen ────────────────
const GOLD = {
  bg:        '#0A0A0D',
  surface:   '#16151B',
  surfaceHi: '#1F1D26',
  border:    '#2B2833',
  gold:      '#D4AF37',
  goldPale:  '#F1E2B0',
  goldDim:   '#8A7638',
  text:      '#F5F3EE',
  textMuted: '#9A968E',
};

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

  // ── Animations ──────────────────────────────────────────────────────────
  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(18)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const shimmerX  = useRef(new Animated.Value(-1)).current;
  const featureAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade,  { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(shimmerX, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true, delay: 400 })
    ).start();

    Animated.stagger(70, featureAnims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    )).start();
  }, []);

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
      setSuccess(true);
    }
    setLoading(false);
  };

  const formatDate = (d) => d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  if (checking) {
    return (
      <SafeAreaView style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={GOLD.gold} />
      </SafeAreaView>
    );
  }

  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale    = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  // ── Success / Already-claimed screen ──────────────────────────────────────
  if (success || alreadyClaimed) return (
    <SafeAreaView style={[s.safe, { alignItems:'center', justifyContent:'center', padding: SPACING.lg }]}>
      <Animated.View style={[s.glowRing, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <Text style={{ fontSize:72, marginBottom: SPACING.md }}>👑</Text>
      <Text style={s.successTitle}>
        {alreadyClaimed && !success ? 'You\'re Already Premium' : 'Premium Unlocked'}
      </Text>
      <View style={s.goldDivider} />
      <Text style={s.successSub}>
        Full access, every feature, until{'\n'}
        <Text style={{ fontWeight:'800', color: GOLD.gold }}>{formatDate(expiryDate)}</Text>
      </Text>
      <View style={s.freeBadgeBig}>
        <Text style={{ color: GOLD.bg, fontWeight:'800', fontSize:12, letterSpacing:1 }}>12 MONTHS · ₹0 · NO CARD NEEDED</Text>
      </View>
      <TouchableOpacity style={[s.upgradeBtn, { marginTop: SPACING.xl }]} onPress={() => navigation.goBack()}>
        <Text style={s.upgradeBtnText}>ENTER SPLITSAATHI</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  // ── Main offer screen ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>‹</Text></TouchableOpacity>
        <Text style={s.headerTitle}>MEMBERSHIP</Text>
        <View style={{ width:36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Animated.View style={{ opacity: heroFade, transform: [{ translateY: heroSlide }] }}>
          <View style={s.launchBadge}>
            <Text style={s.launchBadgeText}>LAUNCH OFFER · LIMITED TIME</Text>
          </View>

          <View style={s.heroCard}>
            <Animated.View style={[s.glowRing, s.glowRingSmall, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
            <Text style={{ fontSize:44, marginBottom: SPACING.sm }}>👑</Text>
            <Text style={s.heroFreeText}>FREE</Text>
            <View style={s.goldDivider} />
            <Text style={s.heroTitle}>Full membership, 12 months</Text>
            <Text style={s.heroSub}>
              To celebrate our launch, every feature below is on the house —{'\n'}no card, no catch, no charge for a full year.
            </Text>
          </View>
        </Animated.View>

        {/* Why free explainer */}
        <View style={s.whyCard}>
          <Text style={s.whyIcon}>◆</Text>
          <Text style={s.whyText}>
            Payments are rolling out soon. Until then, everyone gets the{' '}
            <Text style={{ fontWeight:'800', color: GOLD.goldPale }}>complete Premium experience free</Text> — genuinely, no strings attached.
          </Text>
        </View>

        {/* Features list */}
        <Text style={s.featuresTitle}>EVERYTHING INCLUDED</Text>
        <View style={s.featuresCard}>
          {FEATURES.map((f,i) => (
            <Animated.View
              key={i}
              style={[
                s.featureRow,
                i < FEATURES.length-1 && { borderBottomWidth:1, borderBottomColor: GOLD.border },
                { opacity: featureAnims[i], transform: [{ translateX: featureAnims[i].interpolate({ inputRange:[0,1], outputRange:[14,0] }) }] },
              ]}
            >
              <View style={s.featureIconBox}><Text style={{ fontSize:18 }}>{f.icon}</Text></View>
              <View style={{ flex:1, marginLeft:12 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureSub}>{f.sub}</Text>
              </View>
              <Text style={s.checkMark}>✓</Text>
            </Animated.View>
          ))}
        </View>

        {/* Claim button */}
        <TouchableOpacity style={[s.upgradeBtn, loading && { opacity:0.7 }]} onPress={handleClaim} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={GOLD.bg} /> : <Text style={s.upgradeBtnText}>CLAIM MY FREE YEAR</Text>}
        </TouchableOpacity>

        <Text style={s.finePrint}>No payment info required · Activates instantly · Cancel anytime</Text>
        <View style={{ height:60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor: GOLD.bg },
  header:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding: SPACING.md, backgroundColor: GOLD.bg, borderBottomWidth:1, borderBottomColor: GOLD.border },
  backText:{ fontSize:28, color: GOLD.gold, lineHeight:32 },
  headerTitle: { color: GOLD.goldPale, fontSize:13, fontWeight:'700', letterSpacing:3 },
  scroll:  { padding: SPACING.md },

  launchBadge:     { alignSelf:'center', borderWidth:1, borderColor: GOLD.gold, borderRadius: RADIUS.full, paddingHorizontal:16, paddingVertical:6, marginBottom: SPACING.md },
  launchBadgeText: { color: GOLD.gold, fontWeight:'700', fontSize:10, letterSpacing:1.5 },

  heroCard:     { backgroundColor: GOLD.surface, borderRadius: RADIUS.xl, borderWidth:1, borderColor: GOLD.border, padding: SPACING.xl, alignItems:'center', marginBottom: SPACING.md, overflow:'hidden' },
  heroFreeText: { color: GOLD.gold, fontSize:46, fontWeight:'900', letterSpacing:6 },
  goldDivider:  { width:36, height:2, backgroundColor: GOLD.gold, borderRadius:1, marginVertical:12 },
  heroTitle:    { color: GOLD.text, fontSize:17, fontWeight:'700', marginBottom:10, textAlign:'center' },
  heroSub:      { color: GOLD.textMuted, fontSize:13, textAlign:'center', lineHeight:19 },

  glowRing:      { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor: GOLD.gold, top:-40, alignSelf:'center' },
  glowRingSmall: { width:140, height:140, borderRadius:70, top:-20 },

  whyCard:  { flexDirection:'row', backgroundColor: GOLD.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth:1, borderColor: GOLD.border, marginBottom: SPACING.lg, gap:10, alignItems:'flex-start' },
  whyIcon:  { fontSize:14, color: GOLD.gold, marginTop:2 },
  whyText:  { flex:1, color: GOLD.textMuted, fontSize:13, lineHeight:19 },

  featuresTitle: { color: GOLD.goldDim, fontSize:11, fontWeight:'700', letterSpacing:2, marginBottom: SPACING.sm, marginLeft:4 },
  featuresCard:  { backgroundColor: GOLD.surface, borderRadius: RADIUS.xl, borderWidth:1, borderColor: GOLD.border, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg, overflow:'hidden' },
  featureRow:    { flexDirection:'row', alignItems:'center', paddingVertical:14 },
  featureIconBox:{ width:38, height:38, borderRadius: RADIUS.md, backgroundColor: GOLD.surfaceHi, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: GOLD.border },
  featureTitle:  { color: GOLD.text, fontWeight:'600', fontSize:14 },
  featureSub:    { color: GOLD.textMuted, fontSize:12, marginTop:1 },
  checkMark:     { color: GOLD.gold, fontSize:16, fontWeight:'800' },

  upgradeBtn:     { backgroundColor: GOLD.gold, borderRadius: RADIUS.md, padding:16, alignItems:'center', marginBottom: SPACING.sm },
  upgradeBtnText: { color: GOLD.bg, fontWeight:'800', fontSize:14, letterSpacing:1.5 },
  finePrint:      { color: GOLD.textMuted, fontSize:11, textAlign:'center', marginTop: SPACING.sm },

  successTitle: { color: GOLD.text, fontSize:22, fontWeight:'800', textAlign:'center', letterSpacing:0.5 },
  successSub:   { color: GOLD.textMuted, fontSize:14, textAlign:'center', lineHeight:20, marginBottom: SPACING.md },
  freeBadgeBig: { borderWidth:1, borderColor: GOLD.gold, backgroundColor: GOLD.gold, borderRadius: RADIUS.full, paddingHorizontal:18, paddingVertical:8 },
});
