// ── Popular India trip destinations with cost-breakdown estimates ───────────
// Costs are rough PER-PERSON estimates in ₹, for budget-to-mid-range travel.
// travel = round-trip transport, stay = per-night hotel/hostel avg, food = per-day.

export const DESTINATIONS = [
  { name: 'Goa',            type: 'Beach',     lat: 15.2993, lng: 74.1240, idealDays: '3-4', travelPer100km: 350, stayPerNight: 1500, foodPerDay: 700 },
  { name: 'Manali',         type: 'Hills',     lat: 32.2432, lng: 77.1892, idealDays: '4-5', travelPer100km: 320, stayPerNight: 1200, foodPerDay: 600 },
  { name: 'Jaipur',         type: 'Heritage',  lat: 26.9124, lng: 75.7873, idealDays: '2-3', travelPer100km: 300, stayPerNight: 1300, foodPerDay: 600 },
  { name: 'Rishikesh',      type: 'Adventure', lat: 30.0869, lng: 78.2676, idealDays: '2-3', travelPer100km: 320, stayPerNight: 900,  foodPerDay: 500 },
  { name: 'Udaipur',        type: 'Heritage',  lat: 24.5854, lng: 73.7125, idealDays: '2-3', travelPer100km: 300, stayPerNight: 1500, foodPerDay: 650 },
  { name: 'Shimla',         type: 'Hills',     lat: 31.1048, lng: 77.1734, idealDays: '3-4', travelPer100km: 320, stayPerNight: 1400, foodPerDay: 650 },
  { name: 'Mussoorie',      type: 'Hills',     lat: 30.4598, lng: 78.0664, idealDays: '2-3', travelPer100km: 320, stayPerNight: 1300, foodPerDay: 600 },
  { name: 'Jim Corbett',    type: 'Wildlife',  lat: 29.5300, lng: 78.7747, idealDays: '2-3', travelPer100km: 320, stayPerNight: 1800, foodPerDay: 700 },
  { name: 'Agra',           type: 'Heritage',  lat: 27.1767, lng: 78.0081, idealDays: '1-2', travelPer100km: 300, stayPerNight: 1200, foodPerDay: 550 },
  { name: 'Nainital',       type: 'Hills',     lat: 29.3919, lng: 79.4542, idealDays: '2-3', travelPer100km: 320, stayPerNight: 1400, foodPerDay: 600 },
  { name: 'Mount Abu',      type: 'Hills',     lat: 24.5926, lng: 72.7156, idealDays: '2-3', travelPer100km: 300, stayPerNight: 1300, foodPerDay: 600 },
  { name: 'Pondicherry',    type: 'Beach',     lat: 11.9416, lng: 79.8083, idealDays: '2-3', travelPer100km: 320, stayPerNight: 1400, foodPerDay: 650 },
  { name: 'Munnar',         type: 'Hills',     lat: 10.0889, lng: 77.0595, idealDays: '3-4', travelPer100km: 330, stayPerNight: 1500, foodPerDay: 650 },
  { name: 'Alleppey',       type: 'Backwaters',lat: 9.4981,  lng: 76.3388, idealDays: '2-3', travelPer100km: 330, stayPerNight: 2000, foodPerDay: 700 },
  { name: 'Coorg',          type: 'Hills',     lat: 12.3375, lng: 75.8069, idealDays: '3-4', travelPer100km: 330, stayPerNight: 1600, foodPerDay: 650 },
  { name: 'Mahabaleshwar',  type: 'Hills',     lat: 17.9307, lng: 73.6477, idealDays: '2-3', travelPer100km: 300, stayPerNight: 1500, foodPerDay: 650 },
  { name: 'Lonavala',       type: 'Hills',     lat: 18.7546, lng: 73.4062, idealDays: '1-2', travelPer100km: 300, stayPerNight: 1400, foodPerDay: 600 },
  { name: 'Darjeeling',     type: 'Hills',     lat: 27.0410, lng: 88.2663, idealDays: '3-4', travelPer100km: 320, stayPerNight: 1300, foodPerDay: 600 },
  { name: 'Gangtok',        type: 'Hills',     lat: 27.3389, lng: 88.6065, idealDays: '4-5', travelPer100km: 330, stayPerNight: 1500, foodPerDay: 650 },
  { name: 'Varanasi',       type: 'Heritage',  lat: 25.3176, lng: 82.9739, idealDays: '2-3', travelPer100km: 300, stayPerNight: 1000, foodPerDay: 500 },
  { name: 'Amritsar',       type: 'Heritage',  lat: 31.6340, lng: 74.8723, idealDays: '2',   travelPer100km: 300, stayPerNight: 1100, foodPerDay: 500 },
  { name: 'Mysore',         type: 'Heritage',  lat: 12.2958, lng: 76.6394, idealDays: '2',   travelPer100km: 300, stayPerNight: 1200, foodPerDay: 550 },
  { name: 'Ooty',           type: 'Hills',     lat: 11.4102, lng: 76.6950, idealDays: '3',   travelPer100km: 330, stayPerNight: 1400, foodPerDay: 600 },
  { name: 'Hampi',          type: 'Heritage',  lat: 15.3350, lng: 76.4600, idealDays: '2',   travelPer100km: 320, stayPerNight: 1000, foodPerDay: 500 },
];

// ── Haversine distance (km) ──────────────────────────────────────────────────
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// ── Get nearby destinations sorted by distance, with cost estimate ──────────
export const getNearbyTrips = (userLat, userLng, maxResults = 10) => {
  return DESTINATIONS
    .map(d => {
      const distKm = haversineKm(userLat, userLng, d.lat, d.lng);
      const days   = parseInt(d.idealDays.split('-')[1] || d.idealDays.split('-')[0]);
      const nights = Math.max(days - 1, 1);

      const travel = Math.round((distKm / 100) * d.travelPer100km * 2); // round trip
      const stay   = d.stayPerNight * nights;
      const food   = d.foodPerDay * days;
      const total  = travel + stay + food;

      // ±15% range for realistic estimate
      const low  = Math.round(total * 0.85);
      const high = Math.round(total * 1.15);

      return {
        ...d,
        distanceKm: Math.round(distKm),
        tripType: distKm < 250 ? 'Weekend Trip' : distKm < 600 ? 'Short Trip' : 'Long Trip',
        breakdown: { travel, stay, food },
        costLow: low,
        costHigh: high,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, maxResults);
};

