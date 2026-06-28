import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store';
import { COLORS, SPACING, RADIUS } from '../../theme';
import Avatar from '../../components/Avatar';
import { updateProfile } from '../../services/database';
import { supabase } from '../../services/supabase';

export default function EditProfileScreen({ navigation }) {
  const { profile, setProfile } = useAuthStore();
  const [name,       setName]       = useState(profile?.name    || '');
  const [phone,      setPhone]      = useState(profile?.phone   || '');
  const [upiId,      setUpiId]      = useState(profile?.upi_id || '');
  const [loading,    setLoading]    = useState(false);
  const [avatar,     setAvatar]     = useState(profile?.avatar_url || null);
  const [uploading,  setUploading]  = useState(false);

  // ── Image compress function (10-15kb target) ─────────────────────────────
  const compressImage = (uri) => new Promise((resolve, reject) => {
    if (Platform.OS !== 'web') {
      // Native pe expo-image-picker quality se hi compress hoga
      resolve({ blob: null, isNative: true, uri });
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Max 200x200 pixels — small size = small file
      const MAX = 200;
      let { width, height } = img;
      if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
      else                { width  = Math.round((width  * MAX) / height); height = MAX; }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Quality 0.3 = ~10-15kb for 200x200
      canvas.toBlob(blob => {
        if (blob) resolve({ blob, isNative: false });
        else reject(new Error('Canvas compression failed'));
      }, 'image/jpeg', 0.3);
    };
    img.onerror = reject;
    img.src = uri;
  });

  const [savedMsg, setSavedMsg] = useState(false);

  // ── Delete old avatar from storage ───────────────────────────────────────
  const deleteOldAvatar = async (oldUrl) => {
    if (!oldUrl || !oldUrl.includes('supabase')) return;
    try {
      // URL se path nikalo
      const parts = oldUrl.split('/avatars/');
      if (parts[1]) {
        await supabase.storage.from('avatars').remove([parts[1].split('?')[0]]);
        console.log('Old avatar deleted');
      }
    } catch (e) { console.log('Delete old avatar error:', e); }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission', 'Gallery access chahiye photo upload ke liye');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setUploading(true);
      const uri  = result.assets[0].uri;
      // Fixed path — same file, purana overwrite hoga
      const path = `avatars/${profile.id}.jpg`;

      // Purana avatar delete karo
      await deleteOldAvatar(avatar);

      // Compress karo
      const { blob, isNative } = await compressImage(uri);

      let uploadError;

      if (Platform.OS === 'web' && blob) {
        console.log('Compressed size:', blob.size, 'bytes (~' + Math.round(blob.size/1024) + 'kb)');
        const { error } = await supabase.storage
          .from('avatars')
          .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
        uploadError = error;
      } else {
        const response    = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        const { error } = await supabase.storage
          .from('avatars')
          .upload(path, arrayBuffer, { upsert: true, contentType: 'image/jpeg' });
        uploadError = error;
      }

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Failed', uploadError.message || 'Photo upload nahi ho saka.');
        setUploading(false);
        return;
      }

      // Cache bust karo taaki nayi photo load ho
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatar(data.publicUrl + '?t=' + Date.now());

    } catch (e) {
      console.error('pickImage error:', e);
      Alert.alert('Error', 'Photo pick karne mein problem aayi: ' + e.message);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter your name!'); return; }
    setLoading(true);
    const updates = {
      name:       name.trim(),
      phone:      phone.trim(),
      upi_id:     upiId.trim(),
      avatar_url: avatar,
    };
    const { error } = await updateProfile(profile.id, updates);
    if (error) { Alert.alert('Error', error.message); setLoading(false); return; }
    setProfile({ ...profile, ...updates });
    setLoading(false);
    setSavedMsg(true);
    // Web pe Alert bhi show karo — guaranteed dikhega
    Alert.alert('✅ Successfully Updated!', 'Profile save ho gaya!', [
      { text: 'OK', onPress: () => { setSavedMsg(false); navigation.goBack(); } }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading || uploading}>
          {loading
            ? <ActivityIndicator color={COLORS.primary} />
            : <Text style={styles.saveText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ✅ Success Message */}
      {savedMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✅ Profile Successfully Updated!</Text>
        </View>
      )}

      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          <Avatar name={name || '?'} size={80} uri={avatar} />
          <View style={styles.avatarEdit}>
            {uploading
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Text style={{ fontSize: 14 }}>📷</Text>
            }
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>
          {uploading ? 'Uploading...' : 'Tap to change photo'}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>NAME *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="words"
        />

        <Text style={styles.label}>PHONE</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={{ color: COLORS.textSub }}>🇮🇳 +91</Text>
          </View>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={phone}
            onChangeText={t => setPhone(t.replace(/\D/g, ''))}
            placeholder="9876543210"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <Text style={[styles.label, { marginTop: SPACING.md }]}>UPI ID</Text>
        <TextInput
          style={styles.input}
          value={upiId}
          onChangeText={setUpiId}
          placeholder="yourname@upi"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
        />
        <Text style={styles.hint}>Setting a UPI ID lets friends pay you directly via QR code</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText:    { color: COLORS.textMuted, fontSize: 15 },
  headerTitle: { color: COLORS.text, fontWeight: '700', fontSize: 16 },
  saveText:    { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  avatarSection: { alignItems: 'center', padding: SPACING.xl },
  avatarEdit:  { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.surface, borderRadius: 12, padding: 4, borderWidth: 2, borderColor: COLORS.border },
  avatarHint:  { color: COLORS.textMuted, fontSize: 12, marginTop: 8 },
  form:        { padding: SPACING.md },
  label:       { color: COLORS.textSub, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.8 },
  input:       { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, color: COLORS.text, fontSize: 16, marginBottom: SPACING.md },
  phoneRow:    { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  countryCode: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, justifyContent: 'center' },
  hint:        { color: COLORS.textMuted, fontSize: 12, marginTop: -8, lineHeight: 18 },
  successBanner: { backgroundColor: '#10b981', padding: 14, alignItems: 'center' },
  successText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
