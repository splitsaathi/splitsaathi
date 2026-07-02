import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';

const formatDateForIRCTC = (date) => {
  // IRCTC expects DD-MM-YYYY in search URL
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const formatDateForRedbus = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

export default function TrainBusScreen({ navigation }) {
  const [mode, setMode]   = useState('train'); // train | bus
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [date, setDate]   = useState(new Date(Date.now() + 86400000)); // tomorrow default
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError('');
    if (!from.trim() || !to.trim()) {
      setError('Please enter both From and To');
      return;
    }

    let url;
    if (mode === 'train') {
      // IRCTC's official search page (login required on their site, this just shows availability)
      url = `https://www.irctc.co.in/nget/train-search`;
      // IRCTC is an SPA and doesn't reliably support deep search-params — so we open their site directly
      // and the user enters from/to/date themselves (as also shown on screen earlier).
    } else {
      const fromSlug = from.trim().toLowerCase().replace(/\s+/g, '-');
      const toSlug   = to.trim().toLowerCase().replace(/\s+/g, '-');
      url = `https://www.redbus.in/bus-tickets/${fromSlug}-to-${toSlug}?fromCityName=${encodeURIComponent(from)}&toCityName=${encodeURIComponent(to)}&onward=${formatDateForRedbus(date)}`;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setError('Could not open browser. Check if the app is installed.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Train / Bus</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'train' && styles.toggleBtnActive]}
            onPress={() => setMode('train')}
          >
            <Text style={[styles.toggleText, mode === 'train' && styles.toggleTextActive]}>🚆 Train</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'bus' && styles.toggleBtnActive]}
            onPress={() => setMode('bus')}
          >
            <Text style={[styles.toggleText, mode === 'bus' && styles.toggleTextActive]}>🚌 Bus</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          ℹ️ This app doesn't book directly — it opens {mode === 'train' ? 'IRCTC' : 'redBus'} so you can check availability and book there.
        </Text>

        <Text style={styles.label}>From</Text>
        <TextInput
          style={styles.input}
          placeholder={mode === 'train' ? 'Station or city, e.g. New Delhi' : 'City, e.g. Delhi'}
          placeholderTextColor={COLORS.textMuted}
          value={from}
          onChangeText={setFrom}
        />

        <Text style={styles.label}>To</Text>
        <TextInput
          style={styles.input}
          placeholder={mode === 'train' ? 'Station or city, e.g. Mumbai Central' : 'City, e.g. Mumbai'}
          placeholderTextColor={COLORS.textMuted}
          value={to}
          onChangeText={setTo}
        />

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
          <Text style={{ color: COLORS.text }}>
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, selected) => {
              setShowPicker(Platform.OS === 'ios');
              if (selected) setDate(selected);
            }}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>
            {mode === 'train' ? 'Check on IRCTC →' : 'Check on redBus →'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  back:  { color: COLORS.textSub, fontSize: 15 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '700' },

  toggleRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 4, marginTop: SPACING.sm },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  toggleText: { color: COLORS.textSub, fontWeight: '700', fontSize: 14 },
  toggleTextActive: { color: '#fff' },

  disclaimer: {
    color: COLORS.info, fontSize: 12, backgroundColor: 'rgba(99,102,241,0.1)',
    padding: SPACING.sm, borderRadius: RADIUS.md, marginTop: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
  },

  label: { color: COLORS.textSub, fontSize: 13, fontWeight: '600', marginTop: SPACING.sm, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border,
  },
  error: { color: COLORS.danger, marginTop: SPACING.sm, fontSize: 13 },

  searchBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 16,
    alignItems: 'center', marginTop: SPACING.lg, ...SHADOW.sm,
  },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

