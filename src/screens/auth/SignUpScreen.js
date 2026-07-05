import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ScrollView, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { signUp } from '../../services/auth';

const SUPABASE_URL = 'https://bmhgnbvaufeafhennvaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaGduYnZhdWZlYWZoZW5udmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzI4MTcsImV4cCI6MjA5NzU0ODgxN30.ZQXBEI23RMG5qIJAmGdKvcgPciPj2Jlpyd3XqSRSRpc';

const COUNTRIES = [
  { name: 'India', code: 'IN', currency: 'INR', symbol: '₹' },
  { name: 'United States', code: 'US', currency: 'USD', symbol: '$' },
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£' },
  { name: 'United Arab Emirates', code: 'AE', currency: 'AED', symbol: 'د.إ' },
  { name: 'Canada', code: 'CA', currency: 'CAD', symbol: 'C$' },
  { name: 'Australia', code: 'AU', currency: 'AUD', symbol: 'A$' },
  { name: 'Singapore', code: 'SG', currency: 'SGD', symbol: 'S$' },
  { name: 'Germany', code: 'DE', currency: 'EUR', symbol: '€' },
  { name: 'France', code: 'FR', currency: 'EUR', symbol: '€' },
  { name: 'Italy', code: 'IT', currency: 'EUR', symbol: '€' },
  { name: 'Spain', code: 'ES', currency: 'EUR', symbol: '€' },
  { name: 'Netherlands', code: 'NL', currency: 'EUR', symbol: '€' },
  { name: 'Japan', code: 'JP', currency: 'JPY', symbol: '¥' },
  { name: 'China', code: 'CN', currency: 'CNY', symbol: '¥' },
  { name: 'South Korea', code: 'KR', currency: 'KRW', symbol: '₩' },
  { name: 'Malaysia', code: 'MY', currency: 'MYR', symbol: 'RM' },
  { name: 'Thailand', code: 'TH', currency: 'THB', symbol: '฿' },
  { name: 'Indonesia', code: 'ID', currency: 'IDR', symbol: 'Rp' },
  { name: 'Philippines', code: 'PH', currency: 'PHP', symbol: '₱' },
  { name: 'Vietnam', code: 'VN', currency: 'VND', symbol: '₫' },
  { name: 'Nepal', code: 'NP', currency: 'NPR', symbol: 'रु' },
  { name: 'Sri Lanka', code: 'LK', currency: 'LKR', symbol: 'Rs' },
  { name: 'Bangladesh', code: 'BD', currency: 'BDT', symbol: '৳' },
  { name: 'Pakistan', code: 'PK', currency: 'PKR', symbol: '₨' },
  { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', symbol: 'ر.س' },
  { name: 'Qatar', code: 'QA', currency: 'QAR', symbol: 'ر.ق' },
  { name: 'South Africa', code: 'ZA', currency: 'ZAR', symbol: 'R' },
  { name: 'Nigeria', code: 'NG', currency: 'NGN', symbol: '₦' },
  { name: 'Kenya', code: 'KE', currency: 'KES', symbol: 'KSh' },
  { name: 'Brazil', code: 'BR', currency: 'BRL', symbol: 'R$' },
  { name: 'Mexico', code: 'MX', currency: 'MXN', symbol: '$' },
  { name: 'Russia', code: 'RU', currency: 'RUB', symbol: '₽' },
  { name: 'Switzerland', code: 'CH', currency: 'CHF', symbol: 'CHF' },
  { name: 'Sweden', code: 'SE', currency: 'SEK', symbol: 'kr' },
  { name: 'Norway', code: 'NO', currency: 'NOK', symbol: 'kr' },
  { name: 'New Zealand', code: 'NZ', currency: 'NZD', symbol: 'NZ$' },
  { name: 'Other / Not Listed', code: 'XX', currency: 'USD', symbol: '$' },
];

export default function SignUpScreen({ navigation }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [country,  setCountry]  = useState(null);
  const [stateVal, setStateVal] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const handleSignUp = async () => {
    if (!name.trim())         { setError('Please enter your name!');                  return; }
    if (!email.includes('@')) { setError('Please enter a valid email!');              return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters!'); return; }
    if (password !== confirm)  { setError('Passwords do not match!');                 return; }
    if (!country)              { setError('Please select your country!');             return; }
    if (!stateVal.trim())      { setError('Please enter your state!');                return; }

    setLoading(true); setError('');
    const result = await signUp(email.trim(), password, name.trim());
    const err = result?.error;
    if (err) {
      if (err.message.includes('already registered'))
        setError('This email is already registered! Please log in.');
      else setError(err.message);
      setLoading(false);
      return;
    }

    try {
      const userId = result?.data?.user?.id || result?.user?.id || result?.data?.session?.user?.id;
      if (userId) {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({
            country: country.name,
            state: stateVal.trim(),
            currency_code: country.currency,
            currency_symbol: country.symbol,
          }),
        });
      }
    } catch (e) { /* non-fatal */ }

    setSuccess(true);
    setLoading(false);
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) return (
    <SafeAreaView style={[s.safe, s.successCenter]}>
      <Text style={s.successEmoji}>📧</Text>
      <Text style={s.successTitle}>Verify Your Email!</Text>
      <Text style={s.successSub}>
        A verification link has been sent to {email}.{'\n'}Click the link, then log in.
      </Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')}>
        <Text style={s.btnText}>Log In →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      {/* ScrollView only — no KeyboardAvoidingView on Android (fixes flicker) */}
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // On iOS use automaticallyAdjustKeyboardInsets instead of KAV
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: SPACING.md }}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Create Account ✨</Text>
        <Text style={s.sub}>Completely free • No credit card</Text>

        <Text style={s.label}>YOUR NAME *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Rahul Sharma"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={t => { setName(t); setError(''); }}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={s.label}>EMAIL *</Text>
        <TextInput
          style={s.input}
          placeholder="you@email.com"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={t => { setEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <Text style={s.label}>PASSWORD * (min 6 characters)</Text>
        <TextInput
          style={s.input}
          placeholder="Create a strong password"
          placeholderTextColor={COLORS.textMuted}
          value={password}
          onChangeText={t => { setPassword(t); setError(''); }}
          secureTextEntry
          returnKeyType="next"
        />

        <Text style={s.label}>CONFIRM PASSWORD *</Text>
        <TextInput
          style={s.input}
          placeholder="Re-enter same password"
          placeholderTextColor={COLORS.textMuted}
          value={confirm}
          onChangeText={t => { setConfirm(t); setError(''); }}
          secureTextEntry
          returnKeyType="next"
        />

        <Text style={s.label}>COUNTRY * (sets your currency)</Text>
        <TouchableOpacity style={s.input} onPress={() => setShowCountryPicker(true)}>
          <Text style={{ color: country ? COLORS.text : COLORS.textMuted, fontSize: 16 }}>
            {country ? `${country.symbol}  ${country.name} (${country.currency})` : 'Select your country'}
          </Text>
        </TouchableOpacity>

        <Text style={s.label}>STATE / REGION *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Maharashtra, California, Ontario..."
          placeholderTextColor={COLORS.textMuted}
          value={stateVal}
          onChangeText={t => { setStateVal(t); setError(''); }}
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
        />

        <Modal visible={showCountryPicker} animationType="slide" transparent onRequestClose={() => setShowCountryPicker(false)}>
          <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
            <View style={{ backgroundColor: COLORS.bg, borderTopLeftRadius:20, borderTopRightRadius:20, maxHeight:'70%', padding: SPACING.md }}>
              <Text style={{ color: COLORS.text, fontWeight:'800', fontSize:18, marginBottom:12 }}>Select Your Country</Text>
              <FlatList
                data={COUNTRIES}
                keyExtractor={c => c.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ paddingVertical:14, borderBottomWidth:1, borderBottomColor: COLORS.border, flexDirection:'row', justifyContent:'space-between' }}
                    onPress={() => { setCountry(item); setShowCountryPicker(false); setError(''); }}
                  >
                    <Text style={{ color: COLORS.text, fontSize:16 }}>{item.name}</Text>
                    <Text style={{ color: COLORS.textMuted, fontSize:15 }}>{item.symbol} {item.currency}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={{ marginTop:12, alignItems:'center', padding:12 }} onPress={() => setShowCountryPicker(false)}>
                <Text style={{ color: COLORS.primary, fontWeight:'700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.7 }]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Create Account ✨</Text>
          }
        </TouchableOpacity>

        <View style={s.loginRow}>
          <Text style={s.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.loginLink}>Log in →</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.terms}>
          By creating an account, you agree to our{' '}
          <Text style={s.termsLink}>Terms</Text>
          {' '}and{' '}
          <Text style={s.termsLink}>Privacy Policy</Text>.
        </Text>

        {/* Bottom padding so last field is not hidden behind keyboard */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { flexGrow: 1, padding: SPACING.lg },

  // Success
  successCenter:{ alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  successEmoji: { fontSize: 64, marginBottom: SPACING.lg },
  successTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: SPACING.sm, textAlign: 'center' },
  successSub:   { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },

  // Form
  back:         { color: COLORS.textMuted, fontSize: 16 },
  title:        { color: COLORS.text, fontSize: 28, fontWeight: '800', marginBottom: 4 },
  sub:          { color: COLORS.primary, fontSize: 14, fontWeight: '600', marginBottom: SPACING.lg },
  label:        { color: COLORS.textSub, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.8 },
  input:        { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, color: COLORS.text, fontSize: 16, marginBottom: SPACING.md },
  error:        { color: COLORS.danger, fontSize: 13, marginBottom: SPACING.sm },

  // Button
  btn:          { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', marginBottom: SPACING.lg },
  btnText:      { color: '#fff', fontWeight: '800', fontSize: 17 },

  // Footer
  loginRow:     { flexDirection: 'row', justifyContent: 'center', marginBottom: SPACING.lg },
  loginText:    { color: COLORS.textMuted, fontSize: 14 },
  loginLink:    { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  terms:        { color: COLORS.textDisabled, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  termsLink:    { color: COLORS.textMuted, textDecorationLine: 'underline' },
});

