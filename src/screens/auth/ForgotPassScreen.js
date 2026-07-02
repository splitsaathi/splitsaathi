// ForgotPassScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { resetPassword } from '../../services/auth';

export default function ForgotPassScreen({ navigation }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleReset = async () => {
    if (!email.includes('@')) { setError('Please enter a valid email!'); return; }
    setLoading(true);
    const { error: err } = await resetPassword(email.trim());
    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: COLORS.bg, padding: SPACING.lg }}>
      <TouchableOpacity onPress={()=>navigation.goBack()} style={{ marginBottom: SPACING.lg }}>
        <Text style={{ color: COLORS.textMuted, fontSize:16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ color: COLORS.text, fontSize:26, fontWeight:'800', marginBottom:4 }}>Password Reset 🔑</Text>
      <Text style={{ color: COLORS.textMuted, fontSize:14, marginBottom: SPACING.xl }}>
        Enter your email — we'll send a reset link
      </Text>

      {sent ? (
        <View style={{ alignItems:'center', marginTop: SPACING.xl }}>
          <Text style={{ fontSize:52, marginBottom: SPACING.md }}>📧</Text>
          <Text style={{ color: COLORS.text, fontSize:18, fontWeight:'700', marginBottom:8, textAlign:'center' }}>Link Sent!</Text>
          <Text style={{ color: COLORS.textMuted, fontSize:14, textAlign:'center' }}>
            A password reset link has been sent to {email}.
          </Text>
          <TouchableOpacity style={{ marginTop: SPACING.xl, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding:14, paddingHorizontal:32 }} onPress={()=>navigation.navigate('Login')}>
            <Text style={{ color:'#fff', fontWeight:'700', fontSize:16 }}>Log In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={{ color: COLORS.textSub, fontSize:12, fontWeight:'700', marginBottom:6 }}>EMAIL</Text>
          <TextInput
            style={{ backgroundColor: COLORS.surface, borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding:14, color: COLORS.text, fontSize:16, marginBottom: SPACING.md }}
            placeholder="you@email.com" placeholderTextColor={COLORS.textMuted}
            value={email} onChangeText={t=>{setEmail(t);setError('');}}
            keyboardType="email-address" autoCapitalize="none"
          />
          {error ? <Text style={{ color: COLORS.danger, fontSize:13, marginBottom: SPACING.sm }}>{error}</Text> : null}
          <TouchableOpacity style={[{ backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding:16, alignItems:'center' }, loading && {opacity:0.7}]} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={{ color:'#fff', fontWeight:'800', fontSize:17 }}>Send Reset Link</Text>}
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

