import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { signIn, signInWithGoogle } from '../../services/auth';

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error,    setError]    = useState('');

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) { setError('Enter email and password!'); return; }
    if (!email.includes('@'))       { setError('Enter a valid email!');       return; }
    setLoading(true); setError('');
    const { error: err } = await signIn(email.trim(), password);
    if (err) setError('Incorrect email or password!');
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) Alert.alert('Error', err.message);
    setGLoading(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <Text style={s.logoEmoji}>💸</Text>
          <Text style={s.logoTitle}>SplitSaathi</Text>
          <Text style={s.logoSub}>Split expenses with friends</Text>
        </View>

        {/* Google Button */}
        <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={gLoading} activeOpacity={0.85}>
          {gLoading
            ? <ActivityIndicator color="#3c4043" />
            : <>
                <Text style={{ fontSize: 20, marginRight: 10 }}>🌐</Text>
                <Text style={s.googleBtnText}>Continue with Google</Text>
              </>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or login with email</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Email */}
        <Text style={s.label}>EMAIL</Text>
        <TextInput
          style={s.input}
          placeholder="you@email.com"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={t => { setEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
        />

        {/* Password */}
        <Text style={s.label}>PASSWORD</Text>
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={COLORS.textMuted}
          value={password}
          onChangeText={t => { setPassword(t); setError(''); }}
          secureTextEntry
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={handleEmailLogin}
        />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={s.forgotBtn} onPress={() => navigation.navigate('ForgotPass')}>
          <Text style={s.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.loginBtn, loading && s.btnDisabled]}
          onPress={handleEmailLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.loginBtnText}>Log In</Text>
          }
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={s.signupRow}>
          <Text style={s.signupText}>New here? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={s.signupLink}>Create account →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.bg },
  scroll:         { flexGrow: 1, padding: SPACING.lg, justifyContent: 'center' },

  logoWrap:       { alignItems: 'center', marginBottom: SPACING.xl },
  logoEmoji:      { fontSize: 60, marginBottom: SPACING.sm },
  logoTitle:      { color: COLORS.text, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  logoSub:        { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },

  googleBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, marginBottom: SPACING.lg },
  googleBtnText:  { color: '#3c4043', fontWeight: '700', fontSize: 16 },

  dividerRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  dividerLine:    { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText:    { color: COLORS.textMuted, fontSize: 12, marginHorizontal: 10 },

  label:          { color: COLORS.textSub, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.8 },
  input:          { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, color: COLORS.text, fontSize: 16, marginBottom: SPACING.md },

  forgotBtn:      { alignSelf: 'flex-end', marginBottom: SPACING.lg },
  forgotText:     { color: COLORS.textMuted, fontSize: 13 },

  loginBtn:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', marginBottom: SPACING.lg },
  btnDisabled:    { opacity: 0.5 },
  loginBtnText:   { color: '#fff', fontWeight: '800', fontSize: 17 },

  signupRow:      { flexDirection: 'row', justifyContent: 'center' },
  signupText:     { color: COLORS.textMuted, fontSize: 14 },
  signupLink:     { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  error:          { color: COLORS.danger, fontSize: 13, marginBottom: SPACING.sm },
});
