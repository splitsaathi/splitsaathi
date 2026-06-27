import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import { getNearbyTrips } from '../../utils/tripSuggestions';

const TYPE_COLORS = {
  Beach:       '#06b6d4',
  Hills:       '#10b981',
  Heritage:    '#f59e0b',
  Adventure:   '#ef4444',
  Wildlife:    '#84cc16',
  Backwaters:  '#3b82f6',
};

export default function TripSuggestionsScreen({ navigation }) {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [trips, setTrips]       = useState([]);
  const [cityName, setCityName] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadNearby();
  }, []);

  const loadNearby = async () => {
    setLoading(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is needed to show nearby trips.');
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;

      // Reverse geocode for friendly city name (best-effort, optional)
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (places?.[0]) setCityName(places[0].city || places[0].subregion || '');
      } catch {}

      const nearby = getNearbyTrips(latitude, longitude, 12);
      setTrips(nearby);
    } catch {
      setError('Could not get location. Turn on GPS and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trip Suggestions</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding trips near you...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>📍</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadNearby}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}>
          <Text style={styles.subtitle}>
            {cityName ? `Popular trips near ${cityName} 🧳` : 'Popular trips near you 🧳'}
          </Text>
          <Text style={styles.disclaimerText}>
            ⚠️ Estimated cost hai — actual booking ke time price alag ho sakta hai.
          </Text>

          {trips.map(trip => {
            const expanded = expandedId === trip.name;
            return (
              <TouchableOpacity
                key={trip.name}
                style={styles.card}
                onPress={() => setExpandedId(expanded ? null : trip.name)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.cardName}>{trip.name}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[trip.type] || COLORS.info) + '22' }]}>
                        <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[trip.type] || COLORS.info }]}>{trip.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardMeta}>
                      {trip.distanceKm} km · {trip.tripType} · {trip.idealDays} din
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.costRange}>₹{trip.costLow.toLocaleString('en-IN')}</Text>
                    <Text style={styles.costSub}>–₹{trip.costHigh.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {expanded && (
                  <View style={styles.breakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>🚌 Travel (round-trip)</Text>
                      <Text style={styles.breakdownVal}>₹{trip.breakdown.travel.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>🏨 Stay</Text>
                      <Text style={styles.breakdownVal}>₹{trip.breakdown.stay.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>🍽️ Food</Text>
                      <Text style={styles.breakdownVal}>₹{trip.breakdown.food.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={[styles.breakdownRow, { marginTop: 6, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 }]}>
                      <Text style={[styles.breakdownLabel, { fontWeight: '800', color: COLORS.text }]}>Total (per person)</Text>
                      <Text style={[styles.breakdownVal, { fontWeight: '800', color: COLORS.primary }]}>
                        ₹{trip.costLow.toLocaleString('en-IN')}–₹{trip.costHigh.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                )}

                <Text style={styles.expandHint}>{expanded ? 'Show less ▲' : 'View breakdown ▼'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  loadingText: { color: COLORS.textSub, marginTop: SPACING.md, textAlign: 'center' },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { color: COLORS.textSub, textAlign: 'center', marginBottom: SPACING.lg },
  retryBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: RADIUS.md },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  subtitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  disclaimerText: { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.lg },

  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardName: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  cardMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },

  costRange: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  costSub:   { color: COLORS.textMuted, fontSize: 12 },

  breakdown: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { color: COLORS.textSub, fontSize: 13 },
  breakdownVal:   { color: COLORS.text, fontSize: 13, fontWeight: '600' },

  expandHint: { color: COLORS.primaryLight, fontSize: 11, fontWeight: '600', marginTop: 8, textAlign: 'center' },
});
