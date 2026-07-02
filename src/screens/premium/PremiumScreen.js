import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';

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
  const [plan, setPlan]     = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const plans = {
    monthly: { price: 99,  label: 'Monthly', sub: '₹99/month', badge: null },
    yearly:  { price: 799, label: 'Yearly',  sub: '₹799/year', badge: 'Save 33%' },
  };

  const handleUpgrade = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  if (success) return (
    <SafeAreaView style={[s.safe, { alignItems:'center', justifyContent:'center', padding: SPACING.lg }]}>
      <Text style={{ fontSize:64, marginBottom: SPACING.md }}>🎉</Text>
      <Text style={[s.heroTitle, { textAlign:'center', marginBottom:8 }]}>Welcome to Premium!</Text>
      <Text style={{ color: COLORS.textMuted, fontSize:14, textAlign:'center', marginBottom: SPACING.xl }}>You now have access to all premium features. Enjoy!</Text>
      <TouchableOpacity style={s.upgradeBtn} onPress={() => navigation.goBack()}>
        <Text style={s.upgradeBtnText}>Start Exploring ✨</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>‹</Text></TouchableOpacity>
        <Text style={s.title}>Go Premium</Text>
        <View style={{ width:36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={{ fontSize:48, marginBottom: SPACING.sm }}>💎</Text>
          <Text style={s.heroTitle}>Splitsathi Premium</Text>
          <Text style={s.heroSub}>Unlock all features. Split smarter, settle faster.</Text>
        </View>

        {/* Plan selector */}
        <View style={s.planRow}>
          {Object.entries(plans).map(([key, pl]) => (
            <TouchableOpacity key={key} style={[s.planCard, plan===key && s.planCardActive]} onPress={() => setPlan(key)}>
              {pl.badge && <View style={s.planBadge}><Text style={s.planBadgeText}>{pl.badge}</Text></View>}
              <Text style={[s.planLabel, plan===key && { color:'#fff' }]}>{pl.label}</Text>
              <Text style={[s.planPrice, plan===key && { color:'#fff' }]}>{pl.sub}</Text>
              <View style={[s.planRadio, plan===key && s.planRadioActive]}>
                {plan===key && <View style={s.planRadioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features list */}
        <View style={s.featuresCard}>
          <Text style={s.featuresTitle}>EVERYTHING INCLUDED</Text>
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

        {/* Upgrade button */}
        <TouchableOpacity style={[s.upgradeBtn, loading && { opacity:0.7 }]} onPress={handleUpgrade} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.upgradeBtnText}>🚀 Upgrade to {plans[plan].label} — {plans[plan].sub}</Text>}
        </TouchableOpacity>

        <Text style={{ color: COLORS.textMuted, fontSize:11, textAlign:'center', marginTop: SPACING.sm }}>
          Secure payment · Cancel anytime · 7-day free trial
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

  heroCard:  { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems:'center', marginBottom: SPACING.md },
  heroTitle: { color:'#fff', fontSize:22, fontWeight:'700', marginBottom:8 },
  heroSub:   { color:'rgba(255,255,255,0.75)', fontSize:13, textAlign:'center' },

  planRow:      { flexDirection:'row', gap:12, marginBottom: SPACING.md },
  planCard:     { flex:1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth:2, borderColor: COLORS.borderLight, alignItems:'center', position:'relative', overflow:'visible' },
  planCardActive:{ borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  planBadge:    { position:'absolute', top:-10, backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingHorizontal:10, paddingVertical:3 },
  planBadgeText:{ color:'#78350f', fontSize:10, fontWeight:'800' },
  planLabel:    { color: COLORS.text, fontWeight:'700', fontSize:14, marginBottom:4 },
  planPrice:    { color: COLORS.textMuted, fontSize:13, marginBottom:12 },
  planRadio:    { width:22, height:22, borderRadius:11, borderWidth:2, borderColor: COLORS.border, alignItems:'center', justifyContent:'center' },
  planRadioActive:{ borderColor:'#fff' },
  planRadioDot: { width:10, height:10, borderRadius:5, backgroundColor:'#fff' },

  featuresCard:  { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, ...SHADOW.sm },
  featuresTitle: { color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom: SPACING.sm },
  featureRow:    { flexDirection:'row', alignItems:'center', paddingVertical:12 },
  featureIconBox:{ width:40, height:40, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceHigh, alignItems:'center', justifyContent:'center' },
  featureTitle:  { color: COLORS.text, fontWeight:'600', fontSize:14 },
  featureSub:    { color: COLORS.textMuted, fontSize:12, marginTop:1 },

  upgradeBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding:16, alignItems:'center', marginBottom: SPACING.sm },
  upgradeBtnText: { color:'#fff', fontWeight:'700', fontSize:15 },
});

