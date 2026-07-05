import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, signInWithGoogle } from '../../services/auth';
import { COLORS, SPACING, RADIUS } from '../../theme';

const { width, height } = Dimensions.get('window');

// Fetched from Admin Panel -> Settings -> Branding (same logo shown there)
const SUPABASE_URL = 'https://bmhgnbvaufeafhennvaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaGduYnZhdWZlYWZoZW5udmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzI4MTcsImV4cCI6MjA5NzU0ODgxN30.ZQXBEI23RMG5qIJAmGdKvcgPciPj2Jlpyd3XqSRSRpc';

const FEATURES = [
  { icon: '✈️', label: 'trips' },
  { icon: '🏠', label: 'housemates' },
  { icon: '❤️', label: 'your partner' },
  { icon: '✨', label: 'anyone' },
];

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [view,     setView]     = useState('landing'); // 'landing' | 'login'
  const [logoUrl,  setLogoUrl]  = useState(null);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/app_settings?key=eq.logo_url&select=value`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (data && data[0] && data[0].value) setLogoUrl(data[0].value); })
      .catch(() => {}); // silently keep emoji fallback if this fails
  }, []);

  const Logo = ({ size = 24, textStyle }) =>
    logoUrl
      ? <Image source={{ uri: logoUrl }} style={{ width: size, height: size, borderRadius: size * 0.2 }} />
      : <Text style={textStyle}>💰</Text>;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) Alert.alert('Login Failed', error.message);
  };

  const handleGoogle = async () => {
    setGLoading(true);
    const { error } = await signInWithGoogle();
    setGLoading(false);
    if (error) Alert.alert('Google Login Failed', error.message);
  };

  if (view === 'login') {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={s.loginScroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity onPress={() => setView('landing')} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={s.logoRow}>
            <Logo size={28} textStyle={s.logoEmoji} />
            <Text style={s.logoText}>Splitsathi</Text>
          </View>

          <Text style={s.loginTitle}>Log in to your account</Text>

          {/* Google */}
          <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={gLoading}>
            {gLoading ? <ActivityIndicator color="#333" /> : (
              <>
                <Text style={s.googleG}>G</Text>
                <Text style={s.googleTxt}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={s.divRow}>
            <View style={s.divLine} /><Text style={s.divTxt}>or</Text><View style={s.divLine} />
          </View>

          <Text style={s.fieldLabel}>EMAIL</Text>
          <TextInput style={s.input} placeholder="you@email.com" placeholderTextColor="#999"
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.fieldLabel}>PASSWORD</Text>
          <View style={s.passRow}>
            <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="••••••••"
              placeholderTextColor="#999" value={password} onChangeText={setPassword}
              secureTextEntry={!showPass} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
              <Text>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPass')} style={{ alignSelf: 'flex-end', marginTop: 8, marginBottom: 20 }}>
            <Text style={s.forgotTxt}>Forgot your password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.loginBtnTxt}>Log In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('OTP')} style={s.otpBtn}>
            <Text style={s.otpTxt}>📱 Log in with phone number</Text>
          </TouchableOpacity>

          <View style={s.signupRow}>
            <Text style={s.signupTxt}>New to Splitsathi? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={s.signupLink}>Sign up for free →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LANDING PAGE ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.landingSafe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Nav */}
        <View style={s.nav}>
          <View style={s.navLogo}>
            <Logo size={24} textStyle={s.navLogoEmoji} />
            <Text style={s.navLogoTxt}>Splitsathi</Text>
          </View>
          <View style={s.navActions}>
            <TouchableOpacity onPress={() => setView('login')}>
              <Text style={s.navLogin}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.navSignup} onPress={() => navigation.navigate('SignUp')}>
              <Text style={s.navSignupTxt}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroLeft}>
            <Text style={s.heroHeadline}>
              Less stress when{'\n'}sharing expenses
            </Text>
            <Text style={s.heroSub}>
              <Text style={s.heroHighlight}>on trips.</Text>
            </Text>

            {/* Feature icons */}
            <View style={s.featureIcons}>
              {FEATURES.map((f, i) => (
                <TouchableOpacity key={i} style={s.featureIcon}>
                  <Text style={{ fontSize: 24 }}>{f.icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.heroDesc}>
              Keep track of your shared expenses and balances with housemates, trips, groups, friends, and family.
            </Text>

            <TouchableOpacity style={s.heroSignupBtn} onPress={() => navigation.navigate('SignUp')}>
              <Text style={s.heroSignupTxt}>Sign up</Text>
            </TouchableOpacity>

            <Text style={s.heroPlatform}>Free for 📱 iPhone,  Android, and web.</Text>
          </View>

          {/* Hero Graphic */}
          <View style={s.heroRight}>
            <Image
              source={require('../../assets/images/hero-friends.png')}
              style={s.heroImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Features Section */}
        <View style={s.featSection}>
          <Text style={s.featTitle}>Everything you need to split expenses</Text>
          <View style={s.featGrid}>
            {[
              { icon: '👥', title: 'Groups', desc: 'Create groups for trips, homes, or any shared expense.' },
              { icon: '💸', title: 'UPI Payments', desc: 'Settle up directly via UPI — scan QR and pay instantly.' },
              { icon: '📊', title: 'Balance Tracking', desc: 'See who owes what in real-time across all your groups.' },
              { icon: '🔔', title: 'Reminders', desc: 'Get notified when bills are added or payments are due.' },
              { icon: '🗺️', title: 'Trip Planning', desc: 'Discover and plan trips with expense splitting built in.' },
              { icon: '💬', title: 'Group Chat', desc: 'Chat with your group right inside the app.' },
            ].map((f, i) => (
              <View key={i} style={s.featCard}>
                <Text style={s.featIcon}>{f.icon}</Text>
                <Text style={s.featCardTitle}>{f.title}</Text>
                <Text style={s.featCardDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsSection}>
          {[['1,000+', 'Users'], ['₹0', 'Forever free'], ['4.8 ⭐', 'Rating'], ['50+', 'Cities']].map(([val, label], i) => (
            <View key={i} style={s.statItem}>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={s.ctaSection}>
          <Text style={s.ctaTitle}>Start splitting expenses today</Text>
          <Text style={s.ctaDesc}>Free for iPhone, Android, and web. No credit card required.</Text>
          <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('SignUp')}>
            <Text style={s.ctaBtnTxt}>Get started for free →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView('login')}>
            <Text style={s.ctaLogin}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>© 2026 Splitsathi · splitsathi.com</Text>
          <Text style={s.footerTxt}>Made with ❤️ in India 🇮🇳</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const GREEN = '#1eb8a0';
const DARK_BG = '#f5f5f0';

const s = StyleSheet.create({
  // Login view
  safe:        { flex: 1, backgroundColor: '#fff' },
  loginScroll: { padding: 24, paddingTop: 16 },
  backBtn:     { marginBottom: 16 },
  backText:    { color: GREEN, fontSize: 15, fontWeight: '600' },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  logoEmoji:   { fontSize: 28 },
  logoText:    { fontSize: 22, fontWeight: '700', color: '#222' },
  loginTitle:  { fontSize: 24, fontWeight: '700', color: '#222', marginBottom: 24 },
  googleBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, paddingVertical: 14, marginBottom: 20 },
  googleG:     { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleTxt:   { fontSize: 15, fontWeight: '600', color: '#333' },
  divRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  divLine:     { flex: 1, height: 1, backgroundColor: '#eee' },
  divTxt:      { color: '#999', fontSize: 13 },
  fieldLabel:  { fontSize: 11, fontWeight: '700', color: '#666', letterSpacing: 1, marginBottom: 8 },
  input:       { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, fontSize: 15, color: '#222', marginBottom: 16, backgroundColor: '#fafafa' },
  passRow:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, backgroundColor: '#fafafa', paddingRight: 12, marginBottom: 8 },
  eyeBtn:      { padding: 4 },
  forgotTxt:   { color: GREEN, fontSize: 13, fontWeight: '600' },
  loginBtn:    { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  loginBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  otpBtn:      { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 20 },
  otpTxt:      { color: '#555', fontSize: 14, fontWeight: '600' },
  signupRow:   { flexDirection: 'row', justifyContent: 'center' },
  signupTxt:   { color: '#666', fontSize: 14 },
  signupLink:  { color: GREEN, fontSize: 14, fontWeight: '700' },

  // Landing
  landingSafe: { flex: 1, backgroundColor: '#fff' },
  nav:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  navLogo:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogoEmoji:{ fontSize: 24 },
  navLogoTxt:  { fontSize: 18, fontWeight: '700', color: '#222' },
  navActions:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navLogin:    { color: GREEN, fontWeight: '600', fontSize: 15 },
  navSignup:   { backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  navSignupTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  // Hero
  hero:        { flexDirection: 'row', padding: 24, paddingTop: 40, backgroundColor: '#f7f7f2', minHeight: 320 },
  heroLeft:    { flex: 1.2 },
  heroRight:   { flex: 0.8, alignItems: 'center', justifyContent: 'center' },
  heroImage:   { width: 260, height: 320, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  heroHeadline:{ fontSize: 28, fontWeight: '800', color: '#1a1a1a', lineHeight: 36, marginBottom: 4 },
  heroSub:     { marginBottom: 16 },
  heroHighlight:{ fontSize: 28, fontWeight: '800', color: GREEN },
  featureIcons:{ flexDirection: 'row', gap: 12, marginBottom: 16 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
  heroDesc:    { color: '#555', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  heroSignupBtn:{ backgroundColor: GREEN, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 28, alignSelf: 'flex-start', marginBottom: 12 },
  heroSignupTxt:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  heroPlatform:{ color: '#888', fontSize: 12 },

  // Hero graphic
  heroGraphic: { width: 160, height: 200, position: 'relative' },
  tri:         { position: 'absolute', width: 0, height: 0, borderLeftWidth: 25, borderRightWidth: 25, borderBottomWidth: 40, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  triDark:     { position: 'absolute', width: 0, height: 0, borderLeftWidth: 20, borderRightWidth: 20, borderBottomWidth: 32, borderLeftColor: 'transparent', borderRightColor: 'transparent' },

  // Features
  featSection: { padding: 24, backgroundColor: '#fff' },
  featTitle:   { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 20, textAlign: 'center' },
  featGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featCard:    { width: '47%', backgroundColor: '#f7f7f2', borderRadius: 12, padding: 16 },
  featIcon:    { fontSize: 28, marginBottom: 8 },
  featCardTitle:{ fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 4 },
  featCardDesc: { fontSize: 12, color: '#666', lineHeight: 18 },

  // Stats
  statsSection:{ flexDirection: 'row', backgroundColor: GREEN, padding: 24, justifyContent: 'space-around' },
  statItem:    { alignItems: 'center' },
  statVal:     { color: '#fff', fontWeight: '800', fontSize: 20, marginBottom: 4 },
  statLabel:   { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  // CTA
  ctaSection:  { padding: 32, alignItems: 'center', backgroundColor: '#f7f7f2' },
  ctaTitle:    { fontSize: 22, fontWeight: '800', color: '#222', textAlign: 'center', marginBottom: 8 },
  ctaDesc:     { color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  ctaBtn:      { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 14 },
  ctaBtnTxt:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  ctaLogin:    { color: GREEN, fontSize: 14, fontWeight: '600' },

  // Footer
  footer:      { padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', gap: 4 },
  footerTxt:   { color: '#999', fontSize: 12 },
});
