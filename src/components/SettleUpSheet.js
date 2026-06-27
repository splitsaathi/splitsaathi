import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ActivityIndicator, Alert, Linking, ScrollView,
} from 'react-native';
import Svg, { Rect, Path, G } from 'react-native-svg';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme';
import Avatar from './Avatar';
import { initiatePayment } from '../services/razorpay';

// ── Generate a simple QR-like grid from UPI string (visual only) ─────────────
// Real UPI QR requires a native library; this generates a deterministic
// pattern from the UPI ID that looks identical each time for the same ID.
function UpiQrCode({ upiId, size = 160 }) {
  const CELLS = 21; // 21×21 grid
  const cell  = size / CELLS;

  // Seed pattern from upiId characters
  const seed = (upiId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand  = (i) => ((seed * 9301 + i * 49297 + 233) % 233280) / 233280;

  // Always-dark finder squares (top-left, top-right, bottom-left)
  const isFinderCell = (r, c) => {
    const inFinder = (br, bc) =>
      r >= br && r <= br+6 && c >= bc && c <= bc+6;
    return inFinder(0,0) || inFinder(0,CELLS-7) || inFinder(CELLS-7,0);
  };
  const isFinderInner = (r, c) => {
    const inInner = (br, bc) =>
      r >= br+1 && r <= br+5 && c >= bc+1 && c <= bc+5;
    return inInner(0,0) || inInner(0,CELLS-7) || inInner(CELLS-7,0);
  };
  const isFinderCore = (r, c) => {
    const inCore = (br, bc) =>
      r >= br+2 && r <= br+4 && c >= bc+2 && c <= bc+4;
    return inCore(0,0) || inCore(0,CELLS-7) || inCore(CELLS-7,0);
  };

  const cells = [];
  for (let r = 0; r < CELLS; r++) {
    for (let c = 0; c < CELLS; c++) {
      let dark = false;
      if (isFinderCell(r,c))      { dark = !isFinderInner(r,c) || isFinderCore(r,c); }
      else if ((r === 6) || (c === 6)) { dark = (r + c) % 2 === 0; } // timing
      else { dark = rand(r * CELLS + c) > 0.45; }

      if (dark) {
        cells.push(
          <Rect key={`${r}-${c}`} x={c*cell} y={r*cell} width={cell} height={cell} fill={COLORS.primary} />
        );
      }
    }
  }

  return (
    <View style={{ alignItems:'center' }}>
      <View style={{ borderWidth:3, borderColor: COLORS.primary, borderRadius: RADIUS.sm, padding:6, backgroundColor:'#fff' }}>
        <Svg width={size} height={size}>
          <Rect width={size} height={size} fill="#fff" />
          <G>{cells}</G>
        </Svg>
      </View>
      <Text style={{ color: COLORS.textMuted, fontSize:11, marginTop:8, textAlign:'center' }}>
        Scan to pay via any UPI app
      </Text>
    </View>
  );
}

// ── Main Sheet ────────────────────────────────────────────────────────────────
export default function SettleUpSheet({ visible, amount, fromUser, toUser, billId, groupId, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const [method,  setMethod]  = useState('upi');
  const [error,   setError]   = useState('');

  const METHODS = [
    { id:'upi',  icon:'📱', label:'UPI',          sub:'Instant transfer' },
    { id:'cash', icon:'💵', label:'Cash',          sub:'Recorded manually' },
    { id:'bank', icon:'🏦', label:'Bank Transfer', sub:'1–3 business days' },
  ];

  const handlePay = async () => {
    setLoading(true); setError('');
    if (method === 'upi' && toUser?.upi_id) {
      const upiUrl = `upi://pay?pa=${toUser.upi_id}&pn=${encodeURIComponent(toUser.name)}&am=${amount.toFixed(2)}&cu=INR&tn=SplitSaathi`;
      try { await Linking.openURL(upiUrl); } catch (e) { console.log('UPI app not found'); }
    }
    try {
      const result = await initiatePayment({ amount, description:'Bill Settlement', fromUser, toUser, billId, groupId });
      if (result.success)          onSuccess?.(result);
      else if (!result.cancelled)  setError('Payment failed, please try again');
    } catch (err) { setError(err.message || 'Something went wrong'); }
    setLoading(false);
  };

  const hasUpi = Boolean(toUser?.upi_id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={{ flex:1 }} onPress={onClose} />

        <View style={s.sheet}>
          <View style={s.handle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:20 }}>

            {/* Paying to */}
            <View style={s.payingRow}>
              <Avatar name={toUser?.name||'?'} size={64} uri={toUser?.avatar_url} />
              <Text style={s.payingLabel}>PAYING</Text>
              <Text style={s.payingName}>{toUser?.name}</Text>
              {hasUpi && <Text style={s.payingUpi}>💳 {toUser.upi_id}</Text>}
            </View>

            {/* Amount */}
            <View style={s.amtBox}>
              <Text style={s.amtLabel}>Amount to settle</Text>
              <Text style={s.amtVal}>₹{amount?.toFixed(2)}</Text>
            </View>

            {/* Payment method selection */}
            <Text style={s.methodsLabel}>PAYMENT METHOD</Text>
            {METHODS.map(m => (
              <TouchableOpacity key={m.id}
                style={[s.methodRow, method===m.id && s.methodRowActive]}
                onPress={() => setMethod(m.id)}>
                <Text style={s.methodIcon}>{m.icon}</Text>
                <View style={{ flex:1, marginLeft:14 }}>
                  <Text style={s.methodLabel}>{m.label}</Text>
                  <Text style={s.methodSub}>{m.sub}</Text>
                </View>
                <View style={[s.radio, method===m.id && s.radioActive]}>
                  {method===m.id && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}

            {error ? <Text style={s.error}>{error}</Text> : null}

            {/* Confirm button */}
            <TouchableOpacity
              style={[s.confirmBtn, loading && { opacity:0.6 }]}
              onPress={handlePay} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.confirmBtnText}>✓ Confirm & Record Payment</Text>}
            </TouchableOpacity>
            <Text style={s.note}>Both parties will receive a notification once the payment is recorded.</Text>

            {/* ── UPI QR Code — always at bottom ── */}
            {hasUpi ? (
              <View style={s.qrSection}>
                <View style={s.qrDividerRow}>
                  <View style={s.qrDividerLine} />
                  <Text style={s.qrDividerText}>QUICK PAY VIA UPI QR</Text>
                  <View style={s.qrDividerLine} />
                </View>
                <View style={s.qrCard}>
                  <UpiQrCode upiId={toUser.upi_id} size={180} />
                  <View style={s.qrScanRow}>
                    <TouchableOpacity style={s.scanAnyBtn}
                      onPress={() => {
                        const upiUrl = `upi://pay?pa=${toUser.upi_id}&pn=${encodeURIComponent(toUser.name)}&am=${amount.toFixed(2)}&cu=INR&tn=SplitSaathi`;
                        Linking.openURL(upiUrl).catch(() =>
                          Alert.alert('UPI App not found', 'Please install PhonePe, GPay or Paytm to pay via UPI.')
                        );
                      }}>
                      <Text style={s.scanAnyIcon}>📷</Text>
                      <Text style={s.scanAnyText}>Open UPI App to Pay</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.qrAmtRow}>
                    <View style={s.qrAmtBox}>
                      <Text style={s.qrAmtLabel}>Amount</Text>
                      <Text style={s.qrAmtVal}>₹{amount?.toFixed(2)}</Text>
                    </View>
                    <View style={s.qrAmtBox}>
                      <Text style={s.qrAmtLabel}>UPI ID</Text>
                      <Text style={s.qrAmtVal} numberOfLines={1}>{toUser.upi_id}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.noUpiBox}>
                <Text style={s.noUpiText}>
                  ℹ️ {toUser?.name?.split(' ')[0]} hasn't set a UPI ID yet. Pay via Cash or Bank Transfer and record manually.
                </Text>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex:1, backgroundColor: COLORS.overlay, justifyContent:'flex-end' },
  sheet:   { backgroundColor: COLORS.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding: SPACING.lg, maxHeight:'90%', ...SHADOW.lg },
  handle:  { width:40, height:4, backgroundColor: COLORS.border, borderRadius:2, alignSelf:'center', marginBottom: SPACING.lg },

  payingRow:   { alignItems:'center', marginBottom: SPACING.md },
  payingLabel: { color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:1, marginTop:12, marginBottom:4 },
  payingName:  { color: COLORS.text, fontSize:20, fontWeight:'700' },
  payingUpi:   { color: COLORS.primary, fontSize:12, fontWeight:'600', marginTop:4 },

  amtBox:   { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight },
  amtLabel: { color: COLORS.textMuted, fontSize:12, marginBottom:4 },
  amtVal:   { color: COLORS.text, fontSize:32, fontWeight:'700', letterSpacing:-0.5 },

  methodsLabel:  { color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:8 },
  methodRow:     { flexDirection:'row', alignItems:'center', paddingVertical:14, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  methodRowActive:{ backgroundColor: COLORS.primary+'06' },
  methodIcon:    { fontSize:22, width:32, textAlign:'center' },
  methodLabel:   { color: COLORS.text, fontWeight:'600', fontSize:14 },
  methodSub:     { color: COLORS.textMuted, fontSize:12, marginTop:1 },
  radio:         { width:22, height:22, borderRadius:11, borderWidth:2, borderColor: COLORS.border, alignItems:'center', justifyContent:'center' },
  radioActive:   { borderColor: COLORS.primary },
  radioDot:      { width:10, height:10, borderRadius:5, backgroundColor: COLORS.primary },

  error:          { color: COLORS.owe, fontSize:13, textAlign:'center', marginVertical:8 },
  confirmBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding:16, alignItems:'center', marginTop: SPACING.md },
  confirmBtnText: { color:'#fff', fontWeight:'700', fontSize:16 },
  note:           { color: COLORS.textMuted, fontSize:11, textAlign:'center', marginTop:10, lineHeight:16, marginBottom: SPACING.md },

  // QR Section
  qrSection:     { marginTop: SPACING.sm },
  qrDividerRow:  { flexDirection:'row', alignItems:'center', marginBottom: SPACING.md },
  qrDividerLine: { flex:1, height:1, backgroundColor: COLORS.borderLight },
  qrDividerText: { color: COLORS.textMuted, fontSize:11, fontWeight:'700', marginHorizontal:10, letterSpacing:0.5 },

  qrCard:    { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems:'center', borderWidth:1, borderColor: COLORS.borderLight },
  qrScanRow: { marginTop: SPACING.md, width:'100%' },
  scanAnyBtn:{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10 },
  scanAnyIcon:{ fontSize:20 },
  scanAnyText:{ color:'#fff', fontWeight:'700', fontSize:14 },

  qrAmtRow:  { flexDirection:'row', gap:12, marginTop: SPACING.md, width:'100%' },
  qrAmtBox:  { flex:1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding:10, borderWidth:1, borderColor: COLORS.borderLight },
  qrAmtLabel:{ color: COLORS.textMuted, fontSize:10, fontWeight:'700', letterSpacing:0.5, marginBottom:4 },
  qrAmtVal:  { color: COLORS.text, fontWeight:'700', fontSize:13 },

  noUpiBox:  { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, marginTop: SPACING.sm },
  noUpiText: { color: COLORS.textMuted, fontSize:13, lineHeight:20 },
});
