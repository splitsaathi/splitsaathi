import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { signUp } from '../../services/auth';

export default function SignUpScreen({ navigation }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const handleSignUp = async () => {
    if (!name.trim())         { setError('Please enter your name!');                  return; }
    if (!email.includes('@')) { setError('Please enter a valid email!');              return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters!'); return; }
    if (password !== confirm)  { setError('Passwords do not match!');                 return; }

    setLoading(true); setError('');
    const { error: err } = await signUp(email.trim(), password, name.trim());
    if (err) {
      if (err.message.includes('already registered'))
        setError('This email is already registered! Please log in.');
      else setError(err.message);
    } else {
      setSuccess(true);
    }
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
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
        />

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
