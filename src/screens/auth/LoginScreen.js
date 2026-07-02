import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, signInWithGoogle } from '../../services/auth';
import { COLORS, SPACING, RADIUS } from '../../theme';

const FEATURES = [
  { icon: '👥', title: 'Group Expenses', desc: 'Trip, ghar, ya koi bhi group — sab ka hisaab ek jagah' },
  { icon: '💸', title: 'UPI Settlement', desc: 'QR code se seedha UPI payment — koi jhanjhat nahi' },
  { icon: '📊', title: 'Smart Tracking', desc: 'Kaun kitna deta hai — real-time balance tracking' },
  { icon: '🔔', title: 'Instant Alerts', desc: 'Bill add hone pe turant notification' },
];

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [tab,      setTab]      = useState('login'); // 'login' | 'about'

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email aur password dono chahiye!');
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

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.logoWrap}>
            <Image source={require('../../assets/icon.png')} style={s.logo} resizeMode="contain" />
          </View>
          <Text style={s.appName}>Splitsathi</Text>
          <Text style={s.tagline}>Dosto ke saath kharche baantao, aasani se</Text>
        </View>

        {/* ── Tab Bar ── */}
        <View style={s.tabBar}>
          <TouchableOpacity style={[s.tabBtn, tab === 'login' && s.tabBtnActive]} onPress={() => setTab('login')}>
            <Text style={[s.tabBtnText, tab === 'login' && s.tabBtnTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabBtn, tab === 'about' && s.tabBtnActive]} onPress={() => setTab('about')}>
            <Text style={[s.tabBtnText, tab === 'about' && s.tabBtnTextActive]}>App ke baare mein</Text>
          </TouchableOpacity>
        </View>

        {tab === 'login' ? (
          <View style={s.formCard}>
            {/* Google Login */}
            <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={gLoading}>
              {gLoading ? <ActivityIndicator color="#333" /> : (
                <>
                  <Text style={s.googleIcon}>G</Text>
                  <Text style={s.googleText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>ya email se login karo</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Email */}
            <Text style={s.label}>EMAIL</Text>
            <TextInput
              style={s.input}
              placeholder="aapka@email.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password */}
            <Text style={s.label}>PASSWORD</Text>
            <View style={s.passWrap}>
              <TextInput
                style={[s.input, { marginBottom: 0, flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPass')} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
              <Text style={s.forgotText}>Password bhool gaye?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.loginBtnText}>Log In</Text>}
            </TouchableOpacity>

            {/* Sign Up */}
            <View style={s.signupRow}>
              <Text style={s.signupText}>Naye hain? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={s.signupLink}>Account banao →</Text>
              </TouchableOpacity>
            </View>

            {/* OTP Login */}
            <TouchableOpacity onPress={() => navigation.navigate('OTP')} style={s.otpBtn}>
              <Text style={s.otpText}>📱 OTP se login karo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── About Tab ── */
          <View style={s.aboutCard}>
            <Text style={s.aboutHeading}>Splitsathi kya hai?</Text>
            <Text style={s.aboutDesc}>
              Splitsathi India ka best free expense splitting app hai. Trips, ghar, office — kahi bhi group expenses easily manage karo aur UPI se seedha settle karo.
            </Text>

            {FEATURES.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={s.featureIconWrap}>
                  <Text style={s.featureIcon}>{f.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}

            <View style={s.statsRow}>
              {[['Free', '100%'], ['Users', '1000+'], ['Rating', '4.8⭐']].map(([label, val], i) => (
                <View key={i} style={s.statBox}>
                  <Text style={s.statVal}>{val}</Text>
                  <Text style={s.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.loginBtn} onPress={() => setTab('login')}>
              <Text style={s.loginBtnText}>Shuru Karo →</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.footer}>
          Login karke aap hamari{' '}
          <Text style={{ color: COLORS.primary }}>Privacy Policy</Text>
          {' '}aur{' '}
          <Text style={{ color: COLORS.primary }}>Terms of Service</Text>
          {' '}se agree karte hain.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0a0f1e' },
  scroll: { paddingHorizontal: SPACING.md, paddingBottom: 40 },

  // Header
  header:   { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  logoWrap: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#1a2744', alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  logo:     { width: 60, height: 60 },
  appName:  { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 6 },
  tagline:  { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 },

  // Tab
  tabBar:         { flexDirection: 'row', backgroundColor: '#1a2744', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn:         { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive:   { backgroundColor: COLORS.primary },
  tabBtnText:     { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 },
  tabBtnTextActive: { color: '#fff' },

  // Form Card
  formCard: { backgroundColor: '#111827', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },

  // Google
  googleBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, gap: 10, marginBottom: 20 },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: '#333' },

  // Divider
  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  // Input
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: '#1a2744', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, marginBottom: 16 },

  // Password
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2744', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 12, paddingRight: 12 },
  eyeBtn:   { padding: 4 },

  // Forgot
  forgotText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  // Login Button
  loginBtn:     { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Signup
  signupRow:  { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  signupText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  signupLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },

  // OTP
  otpBtn:  { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  otpText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },

  // About
  aboutCard:    { backgroundColor: '#111827', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  aboutHeading: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  aboutDesc:    { color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22, marginBottom: 24 },

  featureRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 18 },
  featureIconWrap:{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#1a2744', alignItems: 'center', justifyContent: 'center' },
  featureIcon:    { fontSize: 20 },
  featureTitle:   { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 3 },
  featureDesc:    { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18 },

  statsRow: { flexDirection: 'row', backgroundColor: '#1a2744', borderRadius: 14, padding: 16, marginBottom: 20, justifyContent: 'space-around' },
  statBox:  { alignItems: 'center' },
  statVal:  { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 4 },
  statLabel:{ color: 'rgba(255,255,255,0.5)', fontSize: 12 },

  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 24, lineHeight: 18 },
});
