import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';

export default function TravelHubScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Travel</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>
        <Text style={styles.subtitle}>Plan trips, compare fares, check tickets — all in one place</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('TripSuggestions')}
        >
          <Text style={styles.cardIcon}>🧳</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.cardTitle}>Trip Suggestions</Text>
            <Text style={styles.cardDesc}>Tumhare nearby popular trips, cost breakdown ke saath</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('RideCompare')}
        >
          <Text style={styles.cardIcon}>🚕</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.cardTitle}>Book a Ride</Text>
            <Text style={styles.cardDesc}>Get fare estimates from Uber and book a ride</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('TrainBus')}
        >
          <Text style={styles.cardIcon}>🚆</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.cardTitle}>Train / Bus</Text>
            <Text style={styles.cardDesc}>Check availability on IRCTC and redBus</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            ℹ️ Splitsathi doesn't book directly. We take you to the right place (app or website) where you can see real, live prices and book.
          </Text>
        </View>
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

  subtitle: { color: COLORS.textSub, fontSize: 14, marginBottom: SPACING.lg, marginTop: SPACING.sm },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm,
  },
  cardIcon:  { fontSize: 32 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  cardDesc:  { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  arrow:     { color: COLORS.textMuted, fontSize: 18 },

  noteBox: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  noteText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18 },
});

