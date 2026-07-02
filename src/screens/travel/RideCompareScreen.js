import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Linking, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import {
  geocodePlace, haversineKm, estimateFaresByVehicle,
  getUberDeepLink, getUberStoreLink,
} from '../../utils/fareEstimate';

export default function RideCompareScreen({ navigation }) {
  const [pickupText, setPickupText] = useState('');
  const [dropText, setDropText]     = useState('');
  const [pickup, setPickup]         = useState(null); // {lat,lng,name}
  const [drop, setDrop]             = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [fares, setFares]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleFindRoute = async () => {
    setError('');
    if (!pickupText.trim() || !dropText.trim()) {
      setError('Please enter both Pickup and Drop locations');
      return;
    }
    setLoading(true);
    setFares([]);
    setPickup(null);
    setDrop(null);

    try {
      const p = await geocodePlace(pickupText);
      // Nominatim usage policy: thoda gap rakho consecutive calls mein
      await new Promise(r => setTimeout(r, 1100));
      const d = await geocodePlace(dropText);

      if (!p || !d) {
        setError('Location not found. Try a more specific name (like area + city).');
        setLoading(false);
        return;
      }

      setPickup(p);
      setDrop(d);
      const km = haversineKm(p.lat, p.lng, d.lat, d.lng);
      setDistanceKm(km);
      setFares(estimateFaresByVehicle(km));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openUber = async () => {
    const link = getUberDeepLink(pickup, drop);
    try {
      const can = await Linking.canOpenURL(link);
      if (can) await Linking.openURL(link);
      else await Linking.openURL(getUberStoreLink(Platform.OS));
    } catch {
      await Linking.openURL(getUberStoreLink(Platform.OS));
    }
  };

  // Simple Leaflet map preview via WebView — free, no API key
  const mapHtml = (pickup && drop) ? `
    <!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>html,body,#map{height:100%;margin:0;padding:0;}</style>
    </head><body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const map = L.map('map', { zoomControl:false, attributionControl:false });
        const bounds = L.latLngBounds([${pickup.lat},${pickup.lng}], [${drop.lat},${drop.lng}]);
        map.fitBounds(bounds, { padding:[30,30] });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([${pickup.lat},${pickup.lng}]).addTo(map).bindPopup('Pickup');
        L.marker([${drop.lat},${drop.lng}]).addTo(map).bindPopup('Drop');
        L.polyline([[${pickup.lat},${pickup.lng}],[${drop.lat},${drop.lng}]], {color:'#10b981', weight:3, dashArray:'6,6'}).addTo(map);
      </script>
    </body></html>
  ` : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Book a Ride</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}>
        <View style={styles.uberBanner}>
          <Text style={styles.uberBannerIcon}>🚗</Text>
          <Text style={styles.uberBannerText}>Book a ride on Uber</Text>
        </View>

        <Text style={styles.disclaimer}>
          ⚠️ Distance and fare are estimated. Check the actual price in the Uber app.
        </Text>

        <Text style={styles.label}>Pickup</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Connaught Place, Delhi"
          placeholderTextColor={COLORS.textMuted}
          value={pickupText}
          onChangeText={setPickupText}
        />

        <Text style={styles.label}>Drop</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Indira Gandhi Airport, Delhi"
          placeholderTextColor={COLORS.textMuted}
          value={dropText}
          onChangeText={setDropText}
        />
        <Text style={styles.hint}>
          💡 Enter area/landmark + city name, like "Andheri Station, Mumbai"
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.estimateBtn} onPress={handleFindRoute} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.estimateBtnText}>Find Route 🔍</Text>}
        </TouchableOpacity>

        {pickup && drop && (
          <View style={styles.mapBox}>
            <WebView
              source={{ html: mapHtml }}
              style={{ flex: 1 }}
              scrollEnabled={false}
            />
          </View>
        )}

        {distanceKm && (
          <Text style={styles.distanceText}>
            📍 ~{distanceKm.toFixed(1)} km
          </Text>
        )}

        {fares.length > 0 && (
          <View style={{ marginTop: SPACING.md }}>
            <Text style={styles.resultHeader}>Vehicle ke hisaab se estimated fare</Text>
            {fares.map(f => (
              <View key={f.key} style={styles.fareCard}>
                <View style={styles.fareRow}>
                  <Text style={styles.fareIcon}>{f.icon}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.fareName}>{f.name}</Text>
                    <Text style={styles.fareDuration}>~{f.durationMin} min</Text>
                  </View>
                  <Text style={styles.farePrice}>₹{f.low}–₹{f.high}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.bookBtn} onPress={openUber}>
              <Text style={styles.bookBtnText}>Book on Uber →</Text>
            </TouchableOpacity>
          </View>
        )}
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

  uberBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#000',
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
  },
  uberBannerIcon: { fontSize: 26, marginRight: 10 },
  uberBannerText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  disclaimer: {
    color: COLORS.warning, fontSize: 12, backgroundColor: 'rgba(245,158,11,0.1)',
    padding: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },

  label: { color: COLORS.textSub, fontSize: 13, fontWeight: '600', marginTop: SPACING.sm, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border,
  },
  hint: { color: COLORS.textMuted, fontSize: 11, marginTop: 6 },
  error: { color: COLORS.danger, marginTop: SPACING.sm, fontSize: 13 },

  estimateBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 16,
    alignItems: 'center', marginTop: SPACING.lg, ...SHADOW.sm, minHeight: 52, justifyContent: 'center',
  },
  estimateBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  mapBox: {
    height: 180, borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },

  distanceText: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginTop: SPACING.sm, textAlign: 'center' },

  resultHeader: { color: COLORS.textSub, fontSize: 13, fontWeight: '600', marginBottom: SPACING.sm },

  fareCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  fareRow: { flexDirection: 'row', alignItems: 'center' },
  fareIcon: { fontSize: 26 },
  fareName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  fareDuration: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  farePrice: { color: COLORS.text, fontSize: 16, fontWeight: '800' },

  bookBtn: {
    marginTop: SPACING.sm, paddingVertical: 14, borderRadius: RADIUS.md,
    backgroundColor: '#000', alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

