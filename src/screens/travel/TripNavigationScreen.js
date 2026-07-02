import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';

const TRANSPORT_ICONS = { Bike:'🏍️', Cab:'🚗', Bus:'🚌', Train:'🚆', Flight:'✈️' };

const TRIP_TRANSPORT = {
  '1': [{ type:'Bike', route:'Adventure Route · Scenic', price:1200, time:'5.5 hrs' }, { type:'Cab', route:'Private SUV · Doorstep', price:5400, time:'4.5 hrs' }, { type:'Bus', route:'Luxury Volvo · AC', price:850, time:'6 hrs' }, { type:'Train', route:'Express · Shatabdi', price:1100, time:'5 hrs' }, { type:'Flight', route:'Nearest: Pantnagar', price:3200, time:'1.5 hrs' }],
  '2': [{ type:'Bus', route:'Deluxe AC', price:650, time:'5 hrs' }, { type:'Cab', route:'Shared Cab', price:1800, time:'4 hrs' }, { type:'Train', route:'Jan Shatabdi', price:900, time:'6 hrs' }],
  '3': [{ type:'Train', route:'Shatabdi · Daily', price:1200, time:'5 hrs' }, { type:'Bus', route:'Rajasthan Roadways AC', price:600, time:'8 hrs' }, { type:'Flight', route:'Jaipur Airport', price:4200, time:'1 hr' }, { type:'Cab', route:'One Way Drop', price:6500, time:'6 hrs' }],
  default: [{ type:'Bus', route:'State Express · AC', price:800, time:'5 hrs' }, { type:'Cab', route:'Private Cab', price:3500, time:'4 hrs' }, { type:'Train', route:'Express Train', price:1000, time:'5.5 hrs' }],
};

const WEATHER_ICONS = { sunny:'☀️', cloudy:'⛅', rainy:'🌧️', windy:'💨', snowy:'❄️' };

export default function TripNavigationScreen({ route, navigation }) {
  const { trip } = route?.params || {};
  const [selectedTransport, setSelectedTransport] = useState(null);
  const transportOptions = TRIP_TRANSPORT[trip?.id] || TRIP_TRANSPORT['default'];

  const mockWeather = [
    { day:'Today',   temp:'28°C', low:'18°C', icon:'sunny',  rain:'5%'  },
    { day:'Fri',     temp:'25°C', low:'16°C', icon:'cloudy', rain:'20%' },
    { day:'Sat',     temp:'22°C', low:'14°C', icon:'rainy',  rain:'70%' },
    { day:'Sun',     temp:'26°C', low:'17°C', icon:'sunny',  rain:'10%' },
    { day:'Mon',     temp:'29°C', low:'19°C', icon:'sunny',  rain:'5%'  },
  ];

  const highlights = trip?.tags || ['Great Views','Local Food','Photo Spots','Guided Tours'];

  const handleBookTransport = (t) => {
    const urls = { Train: 'https://www.irctc.co.in', Bus: 'https://www.redbus.in', Flight: 'https://www.makemytrip.com', Cab: 'https://www.uber.com', Bike: 'https://www.royalenfield.com' };
    Linking.openURL(urls[t.type] || 'https://google.com').catch(console.log);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>‹</Text></TouchableOpacity>
        <Text style={s.title}>Transport & Navigation</Text>
        <View style={{ width:36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Trip hero */}
        <View style={s.heroCard}>
          <View style={[s.heroBg, { backgroundColor: COLORS.primary }]}>
            <Text style={s.heroEmoji}>{trip?.emoji || '🏕️'}</Text>
            <View style={s.premiumTagBadge}><Text style={s.premiumTagText}>FEATURED TRIP</Text></View>
            <Text style={s.heroTitle}>{trip?.title || 'Adventure'}</Text>
            <View style={s.heroMeta}>
              <Text style={s.heroMetaText}>📍 {trip?.state || 'India'}</Text>
              <Text style={s.heroMetaText}>⭐ {trip?.rating || '4.8'} ({trip?.reviews || '1k'} reviews)</Text>
            </View>
          </View>
        </View>

        {/* Distance card */}
        <View style={s.distCard}>
          <View>
            <Text style={s.distLabel}>ESTIMATED DISTANCE</Text>
            <Text style={s.distVal}>{trip?.dist || 300} km <Text style={s.distSub}>from your location</Text></Text>
          </View>
          <TouchableOpacity style={s.mapBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent(trip?.title || 'India')}`)}>
            <Text style={s.mapBtnText}>🗺️</Text>
          </TouchableOpacity>
        </View>

        {/* Live route card */}
        <View style={s.routeCard}>
          <View style={s.routeLiveBadge}><Text style={s.routeLiveText}>● LIVE ROUTE ACTIVE</Text></View>
          <View style={s.routeMapPlaceholder}>
            <Text style={{ fontSize:48 }}>🗺️</Text>
            <Text style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:8 }}>Interactive map — {trip?.title}</Text>
            <TouchableOpacity style={s.openMapsBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent(trip?.title || '')}`)}>
              <Text style={s.openMapsBtnText}>Open in Google Maps →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weather Forecast */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🌤️ Weather Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {mockWeather.map((w,i) => (
              <View key={i} style={[s.weatherCard, i===0 && s.weatherCardToday]}>
                <Text style={[s.weatherDay, i===0 && { color:'#fff' }]}>{w.day}</Text>
                <Text style={s.weatherIcon}>{WEATHER_ICONS[w.icon]}</Text>
                <Text style={[s.weatherTemp, i===0 && { color:'#fff' }]}>{w.temp}</Text>
                <Text style={[s.weatherLow, i===0 && { color:'rgba(255,255,255,0.6)' }]}>{w.low}</Text>
                <Text style={[s.weatherRain, i===0 && { color:'rgba(255,255,255,0.7)' }]}>💧{w.rain}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* How to get there */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🚀 How to Get There</Text>
            <View style={s.infoBadge}><Text style={s.infoBadgeText}>ℹ Live prices</Text></View>
          </View>
          {transportOptions.map((t,i) => (
            <TouchableOpacity key={i} style={[s.transportRow, selectedTransport===i && s.transportRowActive]}
              onPress={() => setSelectedTransport(i)}>
              <Text style={s.transportIcon}>{TRANSPORT_ICONS[t.type]}</Text>
              <View style={{ flex:1, marginLeft:12 }}>
                <Text style={s.transportType}>{t.type === 'Cab' ? 'Ride by Cab' : t.type === 'Bike' ? 'Ride by Bike' : `${t.type}`}</Text>
                <Text style={s.transportRoute}>{t.route}</Text>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={[s.transportPrice, selectedTransport===i && { color:'#fff' }]}>₹{t.price.toLocaleString('en-IN')}</Text>
                <Text style={[s.transportTime, selectedTransport===i && { color:'rgba(255,255,255,0.7)' }]}>{t.time}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {selectedTransport !== null && (
            <TouchableOpacity style={s.bookBtn} onPress={() => handleBookTransport(transportOptions[selectedTransport])}>
              <Text style={s.bookBtnText}>Book {transportOptions[selectedTransport].type} →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Trip Highlights */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>✨ Trip Highlights</Text>
          <View style={s.highlightsGrid}>
            {highlights.map((h,i) => (
              <View key={i} style={s.highlightChip}>
                <Text style={s.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📖 About the Experience</Text>
          <View style={s.aboutCard}>
            <Text style={s.aboutText}>{trip?.desc || 'An amazing adventure awaits you at this destination. Explore the best of India with your friends!'}</Text>
          </View>
        </View>

        {/* Add to group button */}
        <TouchableOpacity style={s.addToGroupBtn} onPress={() => navigation.getParent()?.navigate('Groups')}>
          <Text style={s.addToGroupBtnText}>➕ Create Group for This Trip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.journalBtn} onPress={() => navigation.navigate('TravelJournal', { tripName: trip?.title })}>
          <Text style={s.journalBtnText}>📔 Open Travel Journal</Text>
        </TouchableOpacity>

        <View style={{ height:80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor: COLORS.bg },
  header:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  backText:{ fontSize:28, color: COLORS.primary, lineHeight:32 },
  title:   { color: COLORS.primary, fontSize:15, fontWeight:'700' },
  scroll:  { paddingBottom:80 },

  heroCard: { marginBottom: SPACING.md },
  heroBg:   { padding: SPACING.lg, alignItems:'center', paddingBottom: SPACING.xl },
  heroEmoji:{ fontSize:56, marginBottom: SPACING.sm },
  premiumTagBadge:{ backgroundColor:'rgba(233,195,73,0.3)', borderRadius: RADIUS.sm, paddingHorizontal:10, paddingVertical:4, marginBottom:8 },
  premiumTagText: { color: COLORS.gold, fontSize:10, fontWeight:'800', letterSpacing:1 },
  heroTitle:{ color:'#fff', fontSize:22, fontWeight:'700', textAlign:'center', marginBottom:8 },
  heroMeta: { flexDirection:'row', gap:16 },
  heroMetaText:{ color:'rgba(255,255,255,0.75)', fontSize:13 },

  distCard: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  distLabel:{ color: COLORS.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:4 },
  distVal:  { color: COLORS.text, fontSize:22, fontWeight:'700' },
  distSub:  { color: COLORS.textMuted, fontWeight:'400', fontSize:14 },
  mapBtn:   { width:44, height:44, borderRadius:22, backgroundColor: COLORS.surfaceHigh, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: COLORS.borderLight },
  mapBtnText:{ fontSize:22 },

  routeCard:            { marginHorizontal: SPACING.md, borderRadius: RADIUS.xl, overflow:'hidden', marginBottom: SPACING.md, ...SHADOW.md },
  routeLiveBadge:       { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical:8 },
  routeLiveText:        { color: COLORS.gold, fontSize:11, fontWeight:'700', letterSpacing:0.5 },
  routeMapPlaceholder:  { backgroundColor: COLORS.primaryDark, height:160, alignItems:'center', justifyContent:'center', padding: SPACING.md },
  openMapsBtn:          { marginTop: SPACING.sm, backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, paddingHorizontal:16, paddingVertical:8 },
  openMapsBtnText:      { color:'#78350f', fontWeight:'700', fontSize:13 },

  section:       { marginHorizontal: SPACING.md, marginBottom: SPACING.lg },
  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  sectionTitle:  { color: COLORS.text, fontWeight:'700', fontSize:16, marginBottom:12 },
  infoBadge:     { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.sm, paddingHorizontal:8, paddingVertical:4 },
  infoBadgeText: { color: COLORS.textMuted, fontSize:11 },

  weatherCard:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding:12, marginRight:10, alignItems:'center', minWidth:70, borderWidth:1, borderColor: COLORS.borderLight },
  weatherCardToday: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  weatherDay:       { color: COLORS.textMuted, fontSize:11, fontWeight:'700', marginBottom:4 },
  weatherIcon:      { fontSize:22, marginBottom:4 },
  weatherTemp:      { color: COLORS.text, fontWeight:'700', fontSize:14 },
  weatherLow:       { color: COLORS.textMuted, fontSize:11, marginTop:2 },
  weatherRain:      { color: COLORS.textMuted, fontSize:10, marginTop:2 },

  transportRow:        { flexDirection:'row', alignItems:'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom:8, borderWidth:1, borderColor: COLORS.borderLight },
  transportRowActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  transportIcon:       { fontSize:26, width:36, textAlign:'center' },
  transportType:       { color: COLORS.text, fontWeight:'600', fontSize:14 },
  transportRoute:      { color: COLORS.textMuted, fontSize:12, marginTop:2 },
  transportPrice:      { color: COLORS.primary, fontWeight:'800', fontSize:15 },
  transportTime:       { color: COLORS.textMuted, fontSize:11, marginTop:2 },
  bookBtn:             { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, padding:14, alignItems:'center', marginTop:4 },
  bookBtnText:         { color:'#78350f', fontWeight:'700', fontSize:15 },

  highlightsGrid:{ flexDirection:'row', flexWrap:'wrap', gap:8 },
  highlightChip: { backgroundColor: COLORS.primary+'12', borderRadius: RADIUS.full, paddingHorizontal:14, paddingVertical:7, borderWidth:1, borderColor: COLORS.primary+'30' },
  highlightText: { color: COLORS.primary, fontSize:13, fontWeight:'600' },

  aboutCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth:1, borderColor: COLORS.borderLight },
  aboutText: { color: COLORS.textSub, fontSize:14, lineHeight:22 },

  addToGroupBtn:     { marginHorizontal: SPACING.md, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding:15, alignItems:'center', marginBottom: SPACING.sm },
  addToGroupBtnText: { color:'#fff', fontWeight:'700', fontSize:15 },
  journalBtn:        { marginHorizontal: SPACING.md, backgroundColor: COLORS.goldLight, borderRadius: RADIUS.md, padding:15, alignItems:'center' },
  journalBtnText:    { color:'#78350f', fontWeight:'700', fontSize:15 },
});

