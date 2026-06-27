import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { sendOTP, verifyOTP } from '../../services/auth';

export default function OTPScreen({ route, navigation }) {
  const { phone } = route.params || {};
  const [otp,     setOtp]     = useState(['','','','']);
  const [loading, setLoading] = useState(false);
  const [resending,setResending]=useState(false);
  const [error,   setError]   = useState('');
  const [timer,   setTimer]   = useState(30);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  // Start countdown
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1); // Only last char
    setOtp(newOtp);
    setError('');
    if (val && idx < 3) refs[idx + 1].current?.focus();
    if (!val && idx > 0) refs[idx - 1].current?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 4) { setError('Please enter the 4-digit OTP!'); return; }
    setLoading(true); setError('');
    const { error: err } = await verifyOTP(`+91${phone}`, code);
    if (err) setError('Incorrect or expired OTP!');
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    await sendOTP(`+91${phone}`);
    setResending(false);
    setTimer(30);
    setOtp(['','','','']);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <View style={s.container}>
          <TouchableOpacity onPress={()=>navigation.goBack()} style={{marginBottom: SPACING.lg}}>
            <Text style={{color: COLORS.textMuted, fontSize:16}}>← Back</Text>
          </TouchableOpacity>

          <Text style={s.title}>Verify OTP 📱</Text>
          <Text style={s.sub}>
            We sent a 4-digit OTP to +91 {phone}
          </Text>

          {/* OTP Boxes */}
          <View style={s.otpRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={refs[idx]}
                style={[s.otpBox, digit && s.otpBoxFilled]}
                value={digit}
                onChangeText={val => handleOtpChange(val, idx)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.verifyBtn, loading && {opacity:0.7}]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={s.verifyBtnText}>Verify ✓</Text>
            }
          </TouchableOpacity>

          {/* Resend */}
          <View style={s.resendRow}>
            {timer > 0
              ? <Text style={s.timerText}>Resend in ({timer}s)</Text>
              : <TouchableOpacity onPress={handleResend} disabled={resending}>
                  {resending
                    ? <ActivityIndicator size="small" color={COLORS.primary}/>
                    : <Text style={s.resendLink}>🔄 Resend OTP</Text>
                  }
                </TouchableOpacity>
            }
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor: COLORS.bg },
  container:    { flex:1, padding: SPACING.lg, justifyContent:'center' },
  title:        { color: COLORS.text, fontSize:26, fontWeight:'800', marginBottom:8 },
  sub:          { color: COLORS.textMuted, fontSize:14, marginBottom: SPACING.xl, lineHeight:20 },
  otpRow:       { flexDirection:'row', gap:12, marginBottom: SPACING.lg, justifyContent:'center' },
  otpBox:       { width:64, height:72, backgroundColor: COLORS.surface, borderWidth:1, borderColor: COLORS.border, borderRadius: RADIUS.md, textAlign:'center', fontSize:28, fontWeight:'800', color: COLORS.text },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor:'rgba(16,185,129,0.1)' },
  error:        { color: COLORS.danger, fontSize:13, textAlign:'center', marginBottom: SPACING.md },
  verifyBtn:    { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding:16, alignItems:'center', marginBottom: SPACING.lg },
  verifyBtnText:{ color:'#fff', fontWeight:'800', fontSize:17 },
  resendRow:    { alignItems:'center' },
  timerText:    { color: COLORS.textMuted, fontSize:14 },
  resendLink:   { color: COLORS.primary, fontWeight:'700', fontSize:15 },
});
