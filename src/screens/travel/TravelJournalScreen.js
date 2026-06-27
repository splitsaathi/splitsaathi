import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';

const FEELINGS = ['🧗 Adventurous','🧘 Peaceful','😊 Happy','🤩 Excited','🌅 Cozy','😴 Tired'];

export default function TravelJournalScreen({ route, navigation }) {
  const { tripName = 'My Trip' } = route?.params || {};
  const [memories, setMemories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes]       = useState('');
  const [feeling, setFeeling]   = useState(FEELINGS[2]);
  const [photo, setPhoto]       = useState(null);

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [16,9] });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleSave = () => {
    if (!location.trim()) { Alert.alert('Error', 'Enter a location tag!'); return; }
    const newMem = {
      id:       Date.now().toString(),
      location: location.trim(),
      notes:    notes.trim(),
      feeling,
      photo,
      date:     new Date().toISOString().split('T')[0],
    };
    setMemories(p => [newMem, ...p]);
    setLocation(''); setNotes(''); setFeeling(FEELINGS[2]); setPhoto(null); setShowForm(false);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>‹</Text></TouchableOpacity>
        <Text style={s.title}>Travel Journal</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(p => !p)}>
          <Text style={s.addBtnText}>{showForm ? '✕' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Trip name banner */}
        <View style={s.tripBanner}>
          <Text style={s.tripBannerEmoji}>🧳</Text>
          <View>
            <Text style={s.tripBannerTitle}>{tripName}</Text>
            <Text style={s.tripBannerSub}>{memories.length} memories captured</Text>
          </View>
        </View>

        {/* Add memory form */}
        {showForm && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>📍 New Memory</Text>

            <Text style={s.label}>LOCATION TAG *</Text>
            <TextInput style={s.input} placeholder="e.g. Ramganga River Crossing" placeholderTextColor={COLORS.textMuted}
              value={location} onChangeText={setLocation} />

            <Text style={s.label}>NOTES</Text>
            <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="What happened here..." placeholderTextColor={COLORS.textMuted}
              value={notes} onChangeText={setNotes} multiline />

            <Text style={s.label}>HOW ARE YOU FEELING?</Text>
            <View style={s.feelingRow}>
              {FEELINGS.map(f => (
                <TouchableOpacity key={f} style={[s.feelingChip, feeling===f && s.feelingChipActive]} onPress={() => setFeeling(f)}>
                  <Text style={[s.feelingText, feeling===f && { color:'#fff' }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>PHOTO (OPTIONAL)</Text>
            <TouchableOpacity style={s.photoBtn} onPress={handlePickPhoto}>
              {photo
                ? <Image source={{ uri: photo }} style={s.photoPreview} resizeMode="cover" />
                : <Text style={s.photoBtnText}>📷 Add Photo</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveBtnText}>💾 Save Memory</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Memories list */}
        {memories.length === 0 && !showForm ? (
          <View style={s.empty}>
            <Text style={{ fontSize:48, marginBottom:12 }}>📖</Text>
            <Text style={s.emptyTitle}>No memories yet</Text>
            <Text style={s.emptySub}>Tap "+ Add" to capture your first travel memory!</Text>
          </View>
        ) : (
          memories.map(mem => (
            <View key={mem.id} style={s.memCard}>
              {mem.photo && <Image source={{ uri: mem.photo }} style={s.memPhoto} resizeMode="cover" />}
              <View style={s.memBody}>
                <View style={s.memTopRow}>
                  <Text style={s.memLocation}>📍 {mem.location}</Text>
                  <Text style={s.memDate}>{mem.date}</Text>
                </View>
                <Text style={s.memFeeling}>{mem.feeling}</Text>
                {mem.notes ? <Text style={s.memNotes}>{mem.notes}</Text> : null}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor: COLORS.bg },
  header:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  backText:{ fontSize:28, color: COLORS.primary, lineHeight:32 },
  title:   { color: COLORS.primary, fontSize:17, fontWeight:'700' },
  addBtn:  { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal:14, paddingVertical:7 },
  addBtnText:{ color:'#fff', fontWeight:'700', fontSize:13 },
  scroll:  { padding: SPACING.md },
  label:   { color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:8, marginTop: SPACING.sm },
  input:   { backgroundColor: COLORS.surface, borderWidth:1, borderColor: COLORS.borderLight, borderRadius: RADIUS.md, padding:12, color: COLORS.text, fontSize:14, marginBottom: SPACING.sm },

  tripBanner:      { flexDirection:'row', alignItems:'center', gap:12, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md },
  tripBannerEmoji: { fontSize:36 },
  tripBannerTitle: { color:'#fff', fontWeight:'700', fontSize:17 },
  tripBannerSub:   { color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:2 },

  formCard:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, marginBottom: SPACING.md, ...SHADOW.md },
  formTitle:  { color: COLORS.primary, fontWeight:'700', fontSize:16, marginBottom: SPACING.sm },
  feelingRow: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom: SPACING.sm },
  feelingChip:     { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.full, paddingHorizontal:12, paddingVertical:7, borderWidth:1, borderColor: COLORS.borderLight },
  feelingChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  feelingText:{ fontSize:12, fontWeight:'600', color: COLORS.textSub },
  photoBtn:    { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, height:100, alignItems:'center', justifyContent:'center', marginBottom: SPACING.md, overflow:'hidden', borderWidth:1, borderColor: COLORS.borderLight, borderStyle:'dashed' },
  photoBtnText:{ color: COLORS.textMuted, fontWeight:'600', fontSize:14 },
  photoPreview:{ width:'100%', height:'100%' },
  saveBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding:14, alignItems:'center' },
  saveBtnText: { color:'#fff', fontWeight:'700', fontSize:15 },

  empty:      { alignItems:'center', paddingVertical:60 },
  emptyTitle: { color: COLORS.text, fontWeight:'700', fontSize:16, marginBottom:6 },
  emptySub:   { color: COLORS.textMuted, fontSize:13, textAlign:'center' },

  memCard:    { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, marginBottom: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, overflow:'hidden', ...SHADOW.sm },
  memPhoto:   { width:'100%', height:160 },
  memBody:    { padding: SPACING.md },
  memTopRow:  { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  memLocation:{ color: COLORS.primary, fontWeight:'700', fontSize:14, flex:1 },
  memDate:    { color: COLORS.textMuted, fontSize:11 },
  memFeeling: { color: COLORS.textSub, fontSize:13, marginBottom:6 },
  memNotes:   { color: COLORS.text, fontSize:14, lineHeight:20 },
});
