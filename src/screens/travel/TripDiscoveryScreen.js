import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Image, Alert, FlatList, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import { useAuthStore, useGroupStore, useFriendStore } from '../../store';

// ─── Haversine distance ───────────────────────────────────────────────────────
function haversine(lat1,lon1,lat2,lon2){
  const R=6371,d2r=Math.PI/180;
  const dLat=(lat2-lat1)*d2r, dLon=(lon2-lon1)*d2r;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dLon/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

const CAT_COLOR = {
  Wildlife:'#10b981', Adventure:'#3b82f6', Heritage:'#f59e0b',
  Beaches:'#06b6d4', 'Hill Stations':'#8b5cf6', Spiritual:'#f97316',
  Nature:'#84cc16', 'City Tour':'#ec4899', Offbeat:'#14b8a6',
  Pilgrimage:'#a855f7', Desert:'#d97706', Backwaters:'#0ea5e9',
  Trekking:'#ef4444', Skiing:'#60a5fa', Lakes:'#22d3ee',
};

const SUPABASE_URL = 'https://bmhgnbvaufeafhennvaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaGduYnZhdWZlYWZoZW5udmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzI4MTcsImV4cCI6MjA5NzU0ODgxN30.ZQXBEI23RMG5qIJAmGdKvcgPciPj2Jlpyd3XqSRSRpc';

// Trips are managed in the Admin Panel (Explore Trips page) and fetched live here,
// so admins can add/edit/remove trips (including photos) without an app update.
async function fetchDiscoverTrips() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/discover_trips?select=*&is_active=eq.true&order=title.asc&limit=5000`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error('Failed to load trips');
  const rows = await res.json();
  return rows.map(r => ({
    id: r.slug || r.id,
    title: r.title,
    state: r.state,
    country: r.country || 'India',
    lat: r.lat,
    lon: r.lon,
    category: r.category,
    rating: r.rating,
    reviews: r.reviews,
    startsFrom: (r.travel_cost || 0) + (r.stay_cost || 0) + (r.food_cost || 0),
    intensity: r.intensity,
    image: r.image_url,
    tags: r.tags || [],
    highlights: r.highlights || [],
    breakdown: { travel: r.travel_cost || 0, stay: r.stay_cost || 0, food: r.food_cost || 0 },
    description: r.description,
    bestMonths: r.best_months,
  }));
}

const FILTERS  = ['All','Wildlife','Adventure','Heritage','Beaches','Hill Stations','Spiritual','Nature','City Tour','Offbeat','Pilgrimage','Desert','Backwaters','Trekking','Skiing','Lakes'];
const PRICE_F  = ['All','Budget Friendly (Under ₹7k)','Premium (Above ₹7k)'];
const SORT_OPT = [['popular','⭐ Popular'],['distance','📍 Nearest'],['price_asc','💰 Low Price'],['price_desc','💎 Premium']];

// ── Friend picker for Activate & Sync ────────────────────────────────────────
function SyncFriendPicker({ friends, trip, activating, onActivate, onCancel }) {
  const [selected, setSelected] = useState([]);
  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  return (
    <>
      <ScrollView style={{ maxHeight: 220, marginBottom:16 }}>
        {friends.map(f => {
          const isSelected = selected.includes(f.id);
          return (
            <TouchableOpacity key={f.id}
              style={{ flexDirection:'row', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor: COLORS.borderLight, backgroundColor: isSelected ? COLORS.primary+'10' : 'transparent', paddingHorizontal:8, borderRadius:8 }}
              onPress={() => toggle(f.id)}>
              <View style={{ width:36, height:36, borderRadius:18, backgroundColor: COLORS.primary, alignItems:'center', justifyContent:'center', marginRight:12 }}>
                <Text style={{ color:'#fff', fontWeight:'700', fontSize:14 }}>{f.name?.[0]?.toUpperCase()}</Text>
              </View>
              <Text style={{ flex:1, color: COLORS.text, fontSize:14, fontWeight: isSelected ? '700' : '400' }}>{f.name}</Text>
              <View style={{ width:24, height:24, borderRadius:12, borderWidth:2, borderColor: isSelected ? COLORS.primary : COLORS.border, backgroundColor: isSelected ? COLORS.primary : 'transparent', alignItems:'center', justifyContent:'center' }}>
                {isSelected && <Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={{ color: COLORS.textMuted, fontSize:11, textAlign:'center', marginBottom:14 }}>
        {selected.length} friend{selected.length !== 1 ? 's' : ''} selected · ₹{trip.startsFrom.toLocaleString('en-IN')}/person estimated
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: COLORS.primary, borderRadius:14, padding:16, alignItems:'center', marginBottom:10, opacity: activating ? 0.6 : 1 }}
        onPress={() => onActivate(trip, friends.filter(f => selected.includes(f.id)))}
        disabled={activating}
      >
        {activating
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color:'#fff', fontWeight:'800', fontSize:15 }}>🚀 Group Banao & Sync Karo</Text>
        }
      </TouchableOpacity>
      <TouchableOpacity style={{ borderWidth:1, borderColor: COLORS.border, borderRadius:14, padding:14, alignItems:'center' }} onPress={onCancel}>
        <Text style={{ color: COLORS.textSub, fontWeight:'600' }}>Cancel</Text>
      </TouchableOpacity>
    </>
  );
}

export default function TripDiscoveryScreen({ navigation }) {
  const { profile } = useAuthStore();
  const { createGroup } = useGroupStore();
  const { friends, loadFriends } = useFriendStore();
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All'); // 'All' | 'India' | 'International'
  const [userCurrency, setUserCurrency] = useState({ code: 'INR', symbol: '₹' }); // from signup profile
  const [currency,    setCurrency]    = useState('INR'); // 'INR' | user's own currency code
  const [rates,       setRates]       = useState({}); // live INR -> other currencies
  const [sortBy,      setSortBy]      = useState('popular');
  const [locLoading,  setLocLoading]  = useState(false);
  const [userCoords,  setUserCoords]  = useState(null);
  const [cityName,    setCityName]    = useState('');
  const [expanded,    setExpanded]    = useState({});
  const [imgErrors,   setImgErrors]   = useState({});
  const [allTrips,    setAllTrips]    = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError,  setTripsError]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activating,  setActivating]  = useState(false);
  const [syncModal,   setSyncModal]   = useState(null); // trip object

  useEffect(() => { if (profile?.id) loadFriends(profile.id); }, [profile?.id]);
  useEffect(() => {
    if (!profile?.id) return;
    fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}&select=currency_code,currency_symbol`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
      .then(res => res.json())
      .then(rows => {
        const p = rows?.[0];
        if (p?.currency_code) {
          setUserCurrency({ code: p.currency_code, symbol: p.currency_symbol || p.currency_code });
          setCurrency(p.currency_code); // default the browse currency to the user's own
        }
      })
      .catch(() => {}); // keep INR default if this fails
  }, [profile?.id]);
  useEffect(() => { handleGetLocation(); }, []); // auto-sort nearest-to-farthest on load
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/INR')
      .then(res => res.json())
      .then(data => { if (data?.rates) setRates(data.rates); })
      .catch(() => {}); // silently keep INR-only display if this fails
  }, []);

  useEffect(() => {
    setTripsLoading(true);
    setTripsError(false);
    fetchDiscoverTrips()
      .then(setAllTrips)
      .catch(() => setTripsError(true))
      .finally(() => setTripsLoading(false));
  }, []);

  const handleGetLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      setCityName(geo?.city || geo?.region || 'Your Location');
      setSortBy('distance');
    } catch (e) {}
    setLocLoading(false);
  };

  // ── Create Group for a trip ────────────────────────────────────────────────
  const handleCreateGroup = (trip) => {
    Alert.alert(
      '👥 Create Trip Group',
      `"${trip.title}" ke liye ek split group banana chahte ho?\n\n₹${trip.startsFrom.toLocaleString('en-IN')}/person ke hisaab se expenses track kar sakte ho!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✅ Create Group',
          onPress: () => navigation.navigate('Groups', {
            screen: 'CreateGroup',
            params: {
              prefillName: trip.title,
              prefillIcon: '✈️',
              prefillBudget: trip.startsFrom,
            }
          }),
        },
      ]
    );
  };

  // ── Activate & Sync — auto create group ───────────────────────────────────
  const handleActivateSync = async (trip, selectedFriends) => {
    setActivating(true);
    try {
      const groupName = trip.title;
      const memberIds = selectedFriends.map(f => f.id);
      const { error } = await createGroup(groupName, '✈️', profile.id, memberIds);
      if (error) {
        Alert.alert('Error', error.message || 'Group create nahi ho saka');
        setActivating(false);
        return;
      }
      setSyncModal(null);
      setActivating(false);
      Alert.alert(
        '✅ Group Created!',
        `"${groupName}" group ban gaya!\nAb Groups tab mein jaake expenses add karo.`,
        [{ text: 'Groups Tab Kholein →', onPress: () => navigation.getParent()?.navigate('Groups') }, { text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('Error', 'Kuch problem aayi, dobara try karo');
      setActivating(false);
    }
  };

  const tripsWithDist = useMemo(() =>
    allTrips.map(t => {
      const dist = userCoords ? haversine(userCoords.lat, userCoords.lon, t.lat, t.lon) : t.baseDist || 500;
      const dynamicTravel = Math.max(400, Math.round((dist * 2 * 3.5) / 100) * 100);
      const breakdown = { ...t.breakdown, travel: dynamicTravel };
      const startsFrom = dynamicTravel + breakdown.stay + breakdown.food;
      return { ...t, dist, breakdown, startsFrom };
    }), [userCoords]);

  const filtered = useMemo(() => {
    return tripsWithDist.filter(t => {
      const s    = search.toLowerCase();
      const mSrch = !s || t.title.toLowerCase().includes(s) || t.state.toLowerCase().includes(s) || t.category.toLowerCase().includes(s) || t.tags.some(tg => tg.toLowerCase().includes(s));
      const mType  = filter === 'All' || t.category === filter;
      const mRegion = regionFilter === 'All' ||
        (regionFilter === 'India' && t.country === 'India') ||
        (regionFilter === 'International' && t.country !== 'India');
      const mPrice = priceFilter === 'All' ||
        (priceFilter === 'Budget Friendly (Under ₹7k)' && t.startsFrom < 7000) ||
        (priceFilter === 'Premium (Above ₹7k)'         && t.startsFrom >= 7000);
      const mDist = sortBy === 'distance' ? t.dist <= 5000 : true;
      return mSrch && mType && mRegion && mPrice && mDist;
    }).sort((a, b) => {
      if (sortBy === 'distance')   return a.dist - b.dist;
      if (sortBy === 'price_asc')  return a.startsFrom - b.startsFrom;
      if (sortBy === 'price_desc') return b.startsFrom - a.startsFrom;
      return b.rating - a.rating;
    });
  }, [tripsWithDist, search, filter, regionFilter, priceFilter, sortBy]);

  const formatPrice = (inrAmount) => {
    if (currency !== 'INR' && rates[currency]) {
      const converted = Math.round(inrAmount * rates[currency]);
      return `${userCurrency.symbol}${converted.toLocaleString('en-US')}`;
    }
    return `₹${inrAmount.toLocaleString('en-IN')}`;
  };

  const renderTrip = ({ item: trip }) => {
    const isEx = expanded[trip.id];
    const cc   = CAT_COLOR[trip.category] || COLORS.primary;
    return (
      <View style={s.tripCard}>
        <View style={{ position:'relative' }}>
          <View style={[s.tripImage, { backgroundColor: cc, alignItems:'center', justifyContent:'center', position:'absolute', top:0, left:0, right:0 }]}>
            <Text style={{ fontSize:44, opacity:0.5 }}>🏞️</Text>
          </View>
          {!imgErrors[trip.id] && (
            <Image
              source={{ uri: trip.image }}
              style={s.tripImage}
              resizeMode="cover"
              onError={() => setImgErrors(prev => ({ ...prev, [trip.id]: true }))}
            />
          )}
          <View style={s.imageBadgeRow}>
            <View style={[s.badge, { backgroundColor:'rgba(0,0,0,0.72)' }]}>
              <Text style={[s.badgeCatText, { color: cc }]}>{trip.category.toUpperCase()}</Text>
            </View>
            <View style={[s.badge, { backgroundColor:'rgba(0,0,0,0.72)' }]}>
              <Text style={{ color:'#fff', fontSize:11, fontWeight:'800' }}>⭐ {trip.rating}</Text>
            </View>
          </View>
          <View style={[s.intensityBadge, { backgroundColor: trip.intensity === 'Premium' ? '#f59e0b' : trip.intensity === 'Budget' ? '#10b981' : '#6366f1' }]}>
            <Text style={s.intensityText}>{trip.intensity.toUpperCase()}</Text>
          </View>
          {userCoords && (
            <View style={s.distBadge}>
              <Text style={s.distBadgeText}>📍 {trip.dist} km</Text>
            </View>
          )}
        </View>

        <View style={s.cardBody}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
            <Text style={[s.tripTitle, { flex:1, marginRight:8 }]}>{trip.title}</Text>
            <Text style={s.stateText}>{trip.state}</Text>
          </View>
          <Text style={s.metaText}>📍 {userCoords ? `${trip.dist} km away` : trip.state} · Best: {trip.bestMonths}</Text>
          <Text style={s.tripDesc} numberOfLines={isEx ? undefined : 2}>{trip.description}</Text>

          <View style={s.tagsRow}>
            {trip.tags.slice(0,3).map(tag => (
              <View key={tag} style={[s.tagChip, { borderColor: cc+'40', backgroundColor: cc+'12' }]}>
                <Text style={[s.tagText, { color: cc }]}>{tag}</Text>
              </View>
            ))}
          </View>

          {isEx && (
            <>
              <Text style={{ color: COLORS.textMuted, fontSize:12, fontWeight:'700', marginBottom:8 }}>🌟 HIGHLIGHTS</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                {trip.highlights.map((h,i) => (
                  <View key={i} style={{ backgroundColor:'#1e293b', paddingHorizontal:10, paddingVertical:5, borderRadius: RADIUS.md }}>
                    <Text style={{ color:'#e2e8f0', fontSize:11, fontWeight:'600' }}>{h}</Text>
                  </View>
                ))}
              </View>
              <View style={s.statsRow}>
                <View style={s.statBox}><Text style={s.statLabel}>🏨 STAY</Text><Text style={s.statVal}>{formatPrice(trip.breakdown.stay)}</Text></View>
                <View style={s.statBox}><Text style={s.statLabel}>🚗 TRAVEL</Text><Text style={s.statVal}>{formatPrice(trip.breakdown.travel)}</Text></View>
                <View style={s.statBox}><Text style={s.statLabel}>🍔 FOOD</Text><Text style={s.statVal}>{formatPrice(trip.breakdown.food)}</Text></View>
              </View>
            </>
          )}

          <View style={s.cardFooter}>
            <View>
              <Text style={s.priceLabel}>STARTS FROM</Text>
              <Text style={s.priceVal}>{formatPrice(trip.startsFrom)}</Text>
            </View>
            <View style={{ flexDirection:'row', gap:8 }}>
              <TouchableOpacity style={s.expandBtn} onPress={() => setExpanded(p => ({ ...p, [trip.id]: !p[trip.id] }))}>
                <Text style={s.expandBtnText}>{isEx ? 'Less ▲' : 'More ▼'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.viewBtn} onPress={() => navigation.navigate('TripNavigation', { trip })}>
                <Text style={s.viewBtnText}>View →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ✅ Create Group Button */}
          <TouchableOpacity
            style={s.createGroupBtn}
            onPress={() => handleCreateGroup(trip)}
          >
            <Text style={s.createGroupBtnText}>👥 Create Group & Split Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.launchBtn} onPress={() => {
            console.log('Activate pressed', trip.title);
            Alert.alert(
              '🚀 Activate & Sync Split Group',
              `"${trip.title}" trip ke liye group banana chahte ho?\n\n✅ Auto group create hoga\n👥 Friends add kar sakte ho\n💰 Expenses track hoga\n\nEstimated: ₹${trip.startsFrom.toLocaleString('en-IN')}/person`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: '✅ Group Banao!',
                  onPress: () => navigation.navigate('Groups', {
                    screen: 'CreateGroup',
                    params: {
                      prefillName: trip.title,
                      prefillIcon: '✈️',
                    }
                  })
                }
              ]
            );
          }}>
            <Text style={s.launchBtnText}>🚀 Activate & Sync Split Group</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>‹</Text></TouchableOpacity>
        <Text style={s.title}>Explore Trips ({allTrips.length})</Text>
        <TouchableOpacity onPress={() => setShowFilters(p => !p)} style={s.filterToggle}>
          <Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>{showFilters ? 'Hide ▲' : 'Filters ▼'}</Text>
        </TouchableOpacity>
      </View>

      {tripsLoading ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ color: COLORS.textMuted, marginTop:12 }}>Loading trips...</Text>
        </View>
      ) : tripsError ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:24 }}>
          <Text style={{ fontSize:40, marginBottom:12 }}>⚠️</Text>
          <Text style={{ color: COLORS.text, fontWeight:'700', marginBottom:6 }}>Could not load trips</Text>
          <Text style={{ color: COLORS.textMuted, fontSize:13, textAlign:'center', marginBottom:16 }}>Check your internet connection and try again.</Text>
          <TouchableOpacity
            onPress={() => { setTripsLoading(true); setTripsError(false); fetchDiscoverTrips().then(setAllTrips).catch(()=>setTripsError(true)).finally(()=>setTripsLoading(false)); }}
            style={{ backgroundColor: COLORS.primary, borderRadius:10, paddingHorizontal:20, paddingVertical:10 }}>
            <Text style={{ color:'#fff', fontWeight:'700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <>
      {showFilters && (
        <View style={s.filtersPanel}>
          <View style={s.searchWrap}>
            <Text style={{ fontSize:14, marginRight:8 }}>🔍</Text>
            <TextInput style={s.searchInput} placeholder="Search trips, states, activities..."
              placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: COLORS.textMuted, fontSize:18, marginLeft:6 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={s.filterLabel}>REGION</Text>
          <View style={{ flexDirection:'row', gap:8, marginBottom:10 }}>
            {['All','India','International'].map(r => (
              <TouchableOpacity key={r} style={[s.filterChip, regionFilter===r && s.filterChipActive]} onPress={() => setRegionFilter(r)}>
                <Text style={[s.filterChipText, regionFilter===r && { color:'#fff' }]}>{r === 'All' ? '🌍 All' : r === 'India' ? '🇮🇳 India' : '✈️ International'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.filterLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:10 }}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f} style={[s.filterChip, filter===f && { backgroundColor: CAT_COLOR[f]||COLORS.primary, borderColor: CAT_COLOR[f]||COLORS.primary }]} onPress={() => setFilter(f)}>
                <Text style={[s.filterChipText, filter===f && { color:'#fff' }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={s.filterLabel}>BUDGET</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:10 }}>
            {PRICE_F.map(p => (
              <TouchableOpacity key={p} style={[s.filterChip, priceFilter===p && s.filterChipActive]} onPress={() => setPriceFilter(p)}>
                <Text style={[s.filterChipText, priceFilter===p && { color:'#fff' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={s.filterLabel}>CURRENCY</Text>
          <View style={{ flexDirection:'row', gap:8, marginBottom:10 }}>
            <TouchableOpacity style={[s.filterChip, currency==='INR' && s.filterChipActive]} onPress={() => setCurrency('INR')}>
              <Text style={[s.filterChipText, currency==='INR' && { color:'#fff' }]}>₹ INR</Text>
            </TouchableOpacity>
            {userCurrency.code !== 'INR' && (
              <TouchableOpacity style={[s.filterChip, currency===userCurrency.code && s.filterChipActive]} onPress={() => setCurrency(userCurrency.code)}>
                <Text style={[s.filterChipText, currency===userCurrency.code && { color:'#fff' }]}>{userCurrency.symbol} {userCurrency.code}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={s.filterLabel}>SORT BY</Text>
          <View style={{ flexDirection:'row', gap:8, flexWrap:'wrap' }}>
            {SORT_OPT.map(([val,lbl]) => (
              <TouchableOpacity key={val} style={[s.sortBtn, sortBy===val && s.sortBtnActive]} onPress={() => setSortBy(val)}>
                <Text style={[s.sortBtnText, sortBy===val && { color:'#fff' }]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!cityName ? (
        <TouchableOpacity style={s.locBanner} onPress={handleGetLocation} disabled={locLoading}>
          <Text style={s.locBannerText}>📍 Allow Location — Sort {allTrips.length} trips nearest to you (up to 5000 km)</Text>
          {locLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: COLORS.gold, fontWeight:'800', fontSize:13 }}>Allow →</Text>}
        </TouchableOpacity>
      ) : (
        <View style={s.locActive}>
          <Text style={s.locActiveText}>📍 Sorted from <Text style={{ fontWeight:'800' }}>{cityName}</Text> — {filtered.length} trips within 5000 km</Text>
        </View>
      )}

      <View style={s.resultsBar}>
        <Text style={s.resultsCount}>
          {filtered.length} trip{filtered.length !== 1 ? 's' : ''} found
          {filter !== 'All' ? ` · ${filter}` : ''}
          {priceFilter !== 'All' ? ` · ${priceFilter}` : ''}
        </Text>
        {(filter !== 'All' || priceFilter !== 'All' || search) && (
          <TouchableOpacity onPress={() => { setFilter('All'); setPriceFilter('All'); setSearch(''); }}>
            <Text style={{ color: COLORS.owe, fontSize:12, fontWeight:'700' }}>✕ Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        key={`${filter}-${priceFilter}-${regionFilter}-${currency}-${sortBy}-${search}`}
        data={filtered}
        extraData={filtered}
        keyExtractor={item => item.id}
        renderItem={renderTrip}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom:100 }}
        ListFooterComponent={
          <View style={s.curatedCard}>
            <Text style={s.curatedTitle}>Travel with Experts & Enthusiasts</Text>
            <Text style={s.curatedSub}>Join curated group trips across India. Share costs, make memories.</Text>
            {['✅ Verified Hosts','🤝 Transparent Splitting','⭐ Curated Experiences'].map(f => (
              <Text key={f} style={{ color:'rgba(255,255,255,0.85)', fontSize:13, marginBottom:4 }}>{f}</Text>
            ))}
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems:'center', paddingVertical:60 }}>
            <Text style={{ fontSize:48, marginBottom:12 }}>🗺️</Text>
            <Text style={{ color: COLORS.text, fontWeight:'700', fontSize:16, marginBottom:6 }}>No trips found</Text>
            <Text style={{ color: COLORS.textMuted, fontSize:13, textAlign:'center' }}>Try clearing filters or changing search</Text>
            <TouchableOpacity style={{ marginTop:16, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal:20, paddingVertical:10 }}
              onPress={() => { setFilter('All'); setPriceFilter('All'); setSearch(''); }}>
              <Text style={{ color:'#fff', fontWeight:'700' }}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />
      </>
      )}
      {/* ── Activate & Sync Modal ── */}
      <Modal visible={!!syncModal} animationType="slide" transparent onRequestClose={() => setSyncModal(null)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor: COLORS.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <Text style={{ color: COLORS.text, fontWeight:'800', fontSize:18 }}>🚀 Activate Trip Group</Text>
              <TouchableOpacity onPress={() => setSyncModal(null)}>
                <Text style={{ fontSize:22, color: COLORS.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {syncModal && (
              <>
                <View style={{ backgroundColor: COLORS.surfaceHigh, borderRadius:12, padding:14, marginBottom:16 }}>
                  <Text style={{ color: COLORS.text, fontWeight:'700', fontSize:16 }}>{syncModal.title}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize:12, marginTop:4 }}>{syncModal.state} · ₹{syncModal.startsFrom.toLocaleString('en-IN')}/person estimated</Text>
                </View>

                <Text style={{ color: COLORS.textMuted, fontSize:12, fontWeight:'700', marginBottom:10 }}>SAATH JAANE WALE FRIENDS SELECT KARO</Text>

                {friends.length === 0 ? (
                  <View style={{ alignItems:'center', paddingVertical:16 }}>
                    <Text style={{ color: COLORS.textMuted, fontSize:13, textAlign:'center', marginBottom:12 }}>Pehle friends add karo Groups mein jaane se pehle</Text>
                    <TouchableOpacity style={{ borderWidth:1, borderColor: COLORS.primary, borderRadius:8, paddingHorizontal:16, paddingVertical:8 }}
                      onPress={() => { setSyncModal(null); navigation.getParent()?.navigate('Friends'); }}>
                      <Text style={{ color: COLORS.primary, fontWeight:'700' }}>+ Friends Add Karo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <SyncFriendPicker
                    friends={friends}
                    trip={syncModal}
                    activating={activating}
                    onActivate={handleActivateSync}
                    onCancel={() => setSyncModal(null)}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor: COLORS.bg },
  header:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding: SPACING.md, backgroundColor: COLORS.primary },
  backText:{ fontSize:28, color:'#fff', lineHeight:32 },
  title:   { color:'#fff', fontSize:15, fontWeight:'700' },
  filterToggle: { backgroundColor:'rgba(255,255,255,0.2)', borderRadius: RADIUS.sm, paddingHorizontal:12, paddingVertical:6 },
  filtersPanel:{ backgroundColor: COLORS.surface, padding: SPACING.md, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  filterLabel: { color: COLORS.textMuted, fontSize:10, fontWeight:'700', letterSpacing:0.8, marginBottom:8 },
  searchWrap:  { flexDirection:'row', alignItems:'center', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, borderWidth:1, borderColor: COLORS.borderLight, paddingHorizontal:12, marginBottom:12 },
  searchInput: { flex:1, paddingVertical:10, color: COLORS.text, fontSize:14 },
  filterChip:      { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.full, paddingHorizontal:14, paddingVertical:7, marginRight:8, borderWidth:1, borderColor: COLORS.borderLight },
  filterChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText:  { color: COLORS.textSub, fontWeight:'600', fontSize:12 },
  sortBtn:         { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.sm, paddingHorizontal:12, paddingVertical:7, borderWidth:1, borderColor: COLORS.borderLight },
  sortBtnActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortBtnText:     { color: COLORS.textSub, fontSize:12, fontWeight:'600' },
  locBanner:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor: COLORS.primaryLight, padding:12, paddingHorizontal: SPACING.md },
  locBannerText: { color:'rgba(255,255,255,0.9)', fontSize:12, flex:1, marginRight:10 },
  locActive:     { backgroundColor: '#1a56db22', padding:10, paddingHorizontal: SPACING.md, borderBottomWidth:1, borderBottomColor: '#1a56db44' },
  locActiveText: { color: COLORS.primary, fontSize:12, lineHeight:18 },
  resultsBar:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: SPACING.md, paddingVertical:8, backgroundColor: COLORS.surface, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  resultsCount: { color: COLORS.textMuted, fontSize:12, fontWeight:'600' },
  tripCard:  { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, marginBottom: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, overflow:'hidden', ...SHADOW.md },
  tripImage: { width:'100%', height:190 },
  imageBadgeRow: { position:'absolute', top:10, left:10, right:10, flexDirection:'row', justifyContent:'space-between' },
  badge:         { borderRadius: RADIUS.sm, paddingHorizontal:8, paddingVertical:4 },
  badgeCatText:  { fontSize:9, fontWeight:'800', letterSpacing:0.5 },
  intensityBadge:{ position:'absolute', bottom:10, right:10, borderRadius: RADIUS.sm, paddingHorizontal:8, paddingVertical:3 },
  intensityText: { color:'#fff', fontSize:9, fontWeight:'800', letterSpacing:0.5 },
  distBadge:     { position:'absolute', bottom:10, left:10, backgroundColor:'rgba(0,0,0,0.75)', borderRadius: RADIUS.sm, paddingHorizontal:8, paddingVertical:3 },
  distBadgeText: { color:'#fff', fontSize:11, fontWeight:'700' },
  cardBody:      { padding: SPACING.md },
  tripTitle:     { color: COLORS.text, fontWeight:'800', fontSize:16, marginBottom:4 },
  stateText:     { color: COLORS.textMuted, fontSize:11 },
  metaText:      { color: COLORS.textMuted, fontSize:12, marginBottom:8 },
  tripDesc:      { color: COLORS.textSub, fontSize:13, lineHeight:18, marginBottom:10 },
  tagsRow:       { flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:12 },
  tagChip:       { borderRadius: RADIUS.sm, paddingHorizontal:8, paddingVertical:4, borderWidth:1 },
  tagText:       { fontSize:10, fontWeight:'600' },
  statsRow:      { flexDirection:'row', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom:12 },
  statBox:       { flex:1, alignItems:'center' },
  statLabel:     { color: COLORS.textMuted, fontSize:9, fontWeight:'700', letterSpacing:0.5, marginBottom:4 },
  statVal:       { color: COLORS.text, fontWeight:'700', fontSize:11 },
  cardFooter:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTopWidth:1, borderTopColor: COLORS.borderLight, marginBottom:12 },
  priceLabel:    { color: COLORS.textMuted, fontSize:10, fontWeight:'700', letterSpacing:0.5 },
  priceVal:      { color: COLORS.primary, fontWeight:'800', fontSize:20 },
  expandBtn:     { borderWidth:1, borderColor: COLORS.borderLight, borderRadius: RADIUS.sm, paddingHorizontal:10, paddingVertical:7 },
  expandBtnText: { color: COLORS.textSub, fontSize:11, fontWeight:'700' },
  viewBtn:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal:12, paddingVertical:7 },
  viewBtnText:   { color:'#fff', fontWeight:'700', fontSize:12 },
  createGroupBtn:     { backgroundColor: '#10b981', borderRadius: RADIUS.md, height:43, alignItems:'center', justifyContent:'center', marginBottom:8 },
  createGroupBtnText: { color:'#fff', fontWeight:'800', fontSize:13 },
  launchBtn:     { backgroundColor:'#4f46e5', borderRadius: RADIUS.md, height:43, alignItems:'center', justifyContent:'center' },
  launchBtnText: { color:'#fff', fontWeight:'800', fontSize:13 },
  curatedCard:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.lg, marginTop: SPACING.sm, marginBottom: SPACING.lg },
  curatedTitle:  { color:'#fff', fontWeight:'700', fontSize:18, marginBottom:8 },
  curatedSub:    { color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:20, marginBottom: SPACING.md },
});
