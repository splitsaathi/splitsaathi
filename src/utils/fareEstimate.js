// ── Ride fare estimation (Uber only, by vehicle type) ───────────────────────
// IMPORTANT: These are estimated fares based on formula calculation.
// They do not reflect real-time surge pricing, traffic, or exact app pricing.

const VEHICLE_TYPES = {
  bike: {
    name:   'Bike',
    icon:   '🏍️',
    base:   18,
    perKm:  6,
    perMin: 0.8,
    surgeMin: 1.0,
    surgeMax: 1.25,
  },
  auto: {
    name:   'Auto',
    icon:   '🛺',
    base:   25,
    perKm:  9,
    perMin: 1.0,
    surgeMin: 1.0,
    surgeMax: 1.3,
  },
  car: {
    name:   'Car',
    icon:   '🚗',
    base:   50,
    perKm:  13,
    perMin: 1.8,
    surgeMin: 1.0,
    surgeMax: 1.5,
  },
};

const AVG_SPEED_KMPH = 22; // city-average assumption for duration estimate

export const estimateFaresByVehicle = (distanceKm) => {
  if (!distanceKm || distanceKm <= 0) return [];

  const durationMin = (distanceKm / AVG_SPEED_KMPH) * 60;

  return Object.entries(VEHICLE_TYPES).map(([key, v]) => {
    const raw  = v.base + (distanceKm * v.perKm) + (durationMin * v.perMin);
    const low  = Math.round(raw * v.surgeMin);
    const high = Math.round(raw * v.surgeMax);
    return {
      key,
      name: v.name,
      icon: v.icon,
      low,
      high,
      durationMin: Math.round(durationMin),
    };
  });
};

// ── Geocoding (free, no API key) — OpenStreetMap Nominatim ──────────────────
// Usage policy: max 1 request/sec, identify app via User-Agent.
export const geocodePlace = async (query) => {
  if (!query?.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SplitsathiApp/1.0' },
    });
    const data = await res.json();
    if (!data?.length) return null;
    return {
      lat:  parseFloat(data[0].lat),
      lng:  parseFloat(data[0].lon),
      name: data[0].display_name,
    };
  } catch {
    return null;
  }
};

// ── Distance calc (haversine + road factor) ──────────────────────────────────
export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.3; // ×1.3 road-distance factor
};

// ── Deep links ────────────────────────────────────────────────────────────────
export const getUberDeepLink = (pickup, drop) => {
  if (pickup?.lat && drop?.lat) {
    return `uber://?action=setPickup&pickup[latitude]=${pickup.lat}&pickup[longitude]=${pickup.lng}&dropoff[latitude]=${drop.lat}&dropoff[longitude]=${drop.lng}`;
  }
  return 'uber://';
};

export const getUberStoreLink = (platform) => {
  return platform === 'ios'
    ? 'https://apps.apple.com/app/id368677368'
    : 'https://play.google.com/store/apps/details?id=com.ubercab';
};

