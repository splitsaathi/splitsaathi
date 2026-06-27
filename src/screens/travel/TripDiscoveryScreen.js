import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Image, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';

// ─── Haversine distance ───────────────────────────────────────────────────────
function haversine(lat1,lon1,lat2,lon2){
  const R=6371,d2r=Math.PI/180;
  const dLat=(lat2-lat1)*d2r, dLon=(lon2-lon1)*d2r;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dLon/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

// ─── Category color map ───────────────────────────────────────────────────────
const CAT_COLOR = {
  Wildlife:'#10b981', Adventure:'#3b82f6', Heritage:'#f59e0b',
  Beaches:'#06b6d4', 'Hill Stations':'#8b5cf6', Spiritual:'#f97316',
  Nature:'#84cc16', 'City Tour':'#ec4899', Offbeat:'#14b8a6',
  Pilgrimage:'#a855f7', Desert:'#d97706', Backwaters:'#0ea5e9',
  Trekking:'#ef4444', Skiing:'#60a5fa', Lakes:'#22d3ee',
};

// ─── 100+ Trips — All India ───────────────────────────────────────────────────
const ALL_TRIPS = [
  // ── NORTH INDIA ──────────────────────────────────────────────────────────────
  {id:'tajmahal',    title:'Taj Mahal, Agra',           state:'Uttar Pradesh',   lat:27.17, lon:78.04, category:'Heritage',     rating:4.9, reviews:'12k', startsFrom:1800,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80', tags:['UNESCO','Photography','History','Sunrise'],    highlights:['Taj Mahal at Sunrise','Agra Fort','Fatehpur Sikri'],  breakdown:{travel:600,stay:800,food:400}},
  {id:'varanasi',    title:'Varanasi Ghats',             state:'Uttar Pradesh',   lat:25.31, lon:82.97, category:'Spiritual',    rating:4.8, reviews:'6k',  startsFrom:3500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1561361058-c24e01bfe3e5?w=600&q=80', tags:['Ghats','Aarti','Boat Ride','Temples'],         highlights:['Dashashwamedh Ghat Aarti','Kashi Vishwanath','Sarnath'], breakdown:{travel:1200,stay:1500,food:800}},
  {id:'allahabad',   title:'Prayagraj Sangam',           state:'Uttar Pradesh',   lat:25.43, lon:81.84, category:'Pilgrimage',  rating:4.6, reviews:'3k',  startsFrom:2000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80', tags:['Sangam','Kumbh','Pilgrimage','Holy River'],    highlights:['Triveni Sangam','Anand Bhawan','Allahabad Fort'], breakdown:{travel:800,stay:800,food:400}},
  {id:'lucknow',     title:'Lucknow City of Nawabs',     state:'Uttar Pradesh',   lat:26.84, lon:80.94, category:'City Tour',   rating:4.5, reviews:'2k',  startsFrom:2500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tags:['Biryani','Heritage','Nawabi','Architecture'], highlights:['Bara Imambara','Rumi Darwaza','Hazratganj'], breakdown:{travel:900,stay:1000,food:600}},
  {id:'mathura',     title:'Mathura Vrindavan',          state:'Uttar Pradesh',   lat:27.49, lon:77.67, category:'Pilgrimage',  rating:4.7, reviews:'4k',  startsFrom:1500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Krishna','Temples','Holi','Pilgrimage'],       highlights:['Banke Bihari Temple','ISKCON','Govardhan Hill'], breakdown:{travel:600,stay:600,food:300}},
  {id:'corbett',     title:'Jim Corbett Safari',         state:'Uttarakhand',     lat:29.53, lon:78.77, category:'Wildlife',    rating:4.9, reviews:'2.4k',startsFrom:12500, intensity:'Premium',  image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Tiger','Jungle Safari','Wildlife','Eco'],      highlights:['Dhikala Zone Safari','Corbett Waterfall','Garjiya Devi'], breakdown:{travel:4000,stay:6000,food:2500}},
  {id:'rishikesh',   title:'Rishikesh Adventure Hub',    state:'Uttarakhand',     lat:30.08, lon:78.26, category:'Adventure',   rating:4.8, reviews:'3.8k',startsFrom:4200,  intensity:'Standard', image:'https://images.unsplash.com/photo-1545203149-f4d24ee42c52?w=600&q=80', tags:['Rafting','Bungee','Yoga','Camping'],           highlights:['Ganges Rafting','Laxman Jhula','Bungee Jumping'], breakdown:{travel:1200,stay:1800,food:1200}},
  {id:'haridwar',    title:'Haridwar Har Ki Pauri',      state:'Uttarakhand',     lat:29.94, lon:78.16, category:'Pilgrimage',  rating:4.7, reviews:'5k',  startsFrom:2000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Ganga Aarti','Pilgrimage','Holy Dip','Temples'],highlights:['Har Ki Pauri','Ganga Aarti','Chandi Devi'], breakdown:{travel:800,stay:800,food:400}},
  {id:'mussoorie',   title:'Mussoorie Queen of Hills',   state:'Uttarakhand',     lat:30.45, lon:78.06, category:'Hill Stations',rating:4.5,reviews:'2.2k',startsFrom:4800,  intensity:'Standard', image:'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&q=80', tags:['Hill Station','Waterfalls','Mall Road','Honeymoon'], highlights:['Kempty Falls','Gun Hill','Company Garden'], breakdown:{travel:1500,stay:2200,food:1100}},
  {id:'nainital',    title:'Nainital Lake City',         state:'Uttarakhand',     lat:29.38, lon:79.45, category:'Lakes',       rating:4.6, reviews:'2.8k',startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80', tags:['Lake','Boating','Hill Station','Honeymoon'],   highlights:['Naini Lake Boating','Snow View Point','Jim Corbett'], breakdown:{travel:1600,stay:2000,food:900}},
  {id:'auli',        title:'Auli Skiing Resort',         state:'Uttarakhand',     lat:30.52, lon:79.56, category:'Skiing',      rating:4.7, reviews:'1.2k',startsFrom:9500,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80', tags:['Skiing','Snow','Cable Car','Trekking'],        highlights:['Auli Ski Resort','Nanda Devi View','Gurso Bugyal'], breakdown:{travel:3000,stay:5000,food:1500}},
  {id:'chardham',    title:'Char Dham Yatra',            state:'Uttarakhand',     lat:30.74, lon:79.06, category:'Pilgrimage',  rating:4.9, reviews:'7k',  startsFrom:15000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1583082824910-f7b3c3e71ae3?w=600&q=80', tags:['Kedarnath','Badrinath','Gangotri','Yamunotri'], highlights:['Kedarnath Temple','Badrinath Dham','Valley of Flowers'], breakdown:{travel:6000,stay:6000,food:3000}},
  {id:'manali',      title:'Manali Snow Peaks',          state:'Himachal Pradesh',lat:32.23, lon:77.18, category:'Hill Stations',rating:4.9,reviews:'3.1k',startsFrom:9800,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80', tags:['Snow Trek','Camping','Solang','Rohtang'],      highlights:['Solang Valley','Rohtang Pass','Hadimba Temple'], breakdown:{travel:3500,stay:4500,food:1800}},
  {id:'shimla',      title:'Shimla Colonial Hill Town',  state:'Himachal Pradesh',lat:31.10, lon:77.17, category:'Hill Stations',rating:4.6,reviews:'3.5k',startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80', tags:['Toy Train','Mall Road','Colonial','Snow'],     highlights:['The Ridge','Jakhu Temple','Kufri'], breakdown:{travel:2000,stay:2500,food:1000}},
  {id:'dharamshala', title:'Dharamshala & McLeod Ganj',  state:'Himachal Pradesh',lat:32.21, lon:76.32, category:'Spiritual',   rating:4.7, reviews:'1.9k',startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1583082824910-f7b3c3e71ae3?w=600&q=80', tags:['Dalai Lama','Tibetan','Monastery','Trekking'], highlights:['Tsuglagkhang','Bhagsu Falls','Triund Trek'], breakdown:{travel:2000,stay:2800,food:1200}},
  {id:'spiti',       title:'Spiti Valley Cold Desert',   state:'Himachal Pradesh',lat:32.24, lon:78.03, category:'Offbeat',     rating:4.8, reviews:'920', startsFrom:18000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', tags:['Cold Desert','Monastery','Off-Road','Camping'], highlights:['Key Monastery','Chandratal Lake','Pin Valley'], breakdown:{travel:7000,stay:6000,food:5000}},
  {id:'kasol',       title:'Kasol Parvati Valley',       state:'Himachal Pradesh',lat:32.00, lon:77.31, category:'Offbeat',     rating:4.6, reviews:'1.4k',startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', tags:['Backpacker','Trekking','Cafes','River'],       highlights:['Kheerganga Trek','Chalal Village','Manikaran Sahib'], breakdown:{travel:1800,stay:2000,food:1200}},
  {id:'kufri',       title:'Kufri Snow Point',           state:'Himachal Pradesh',lat:31.09, lon:77.26, category:'Skiing',      rating:4.4, reviews:'1.1k',startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80', tags:['Snow','Skiing','Horses','Fun Park'],           highlights:['Kufri Fun World','Himalayan Nature Park','Chail'], breakdown:{travel:1500,stay:1800,food:700}},
  {id:'amritsar',    title:'Amritsar Golden Temple',     state:'Punjab',          lat:31.63, lon:74.87, category:'Pilgrimage',  rating:4.9, reviews:'8k',  startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=600&q=80', tags:['Golden Temple','Langar','Wagah Border','Sikh'], highlights:['Harmandir Sahib','Jallianwala Bagh','Wagah Border Ceremony'], breakdown:{travel:1200,stay:1500,food:800}},
  {id:'chandigarh',  title:'Chandigarh Planned City',    state:'Punjab/Haryana',  lat:30.73, lon:76.77, category:'City Tour',   rating:4.3, reviews:'1.5k',startsFrom:2500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tags:['Rock Garden','Sukhna Lake','Modern City','Garden'], highlights:['Rock Garden','Sukhna Lake','Capitol Complex'], breakdown:{travel:900,stay:1000,food:600}},
  {id:'leh',         title:'Leh Ladakh Adventure',       state:'Ladakh',          lat:34.15, lon:77.57, category:'Adventure',   rating:4.9, reviews:'4.2k',startsFrom:20000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600&q=80', tags:['Pangong Lake','Monasteries','Bike Trip','High Altitude'], highlights:['Pangong Tso','Nubra Valley','Magnetic Hill','Diskit Monastery'], breakdown:{travel:8000,stay:7000,food:5000}},
  {id:'jammu',       title:'Jammu Vaishno Devi',         state:'J&K',             lat:32.72, lon:74.85, category:'Pilgrimage',  rating:4.8, reviews:'5k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Vaishno Devi','Pilgrimage','Trek','Bhawan'],   highlights:['Vaishno Devi Shrine','Banganga','Bhairon Temple'], breakdown:{travel:2000,stay:2000,food:1000}},
  {id:'srinagar',    title:'Srinagar Dal Lake',          state:'J&K',             lat:34.08, lon:74.79, category:'Lakes',       rating:4.8, reviews:'3.5k',startsFrom:12000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', tags:['Houseboat','Shikara','Dal Lake','Chinar'],     highlights:['Shikara Ride','Mughal Gardens','Gulmarg Gondola'], breakdown:{travel:5000,stay:5000,food:2000}},
  {id:'gulmarg',     title:'Gulmarg Gondola',            state:'J&K',             lat:34.05, lon:74.38, category:'Skiing',      rating:4.8, reviews:'2.1k',startsFrom:14000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80', tags:['Gondola','Skiing','Snow','Golf Course'],       highlights:['Gondola Cable Car','Kongdori','Alpine Meadows'], breakdown:{travel:5000,stay:6000,food:3000}},

  // ── RAJASTHAN ─────────────────────────────────────────────────────────────────
  {id:'jaipur',      title:'Jaipur Pink City',           state:'Rajasthan',       lat:26.91, lon:75.78, category:'Heritage',    rating:4.7, reviews:'5.5k',startsFrom:6500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Amer Fort','Hawa Mahal','Shopping','Heritage'], highlights:['Amer Fort Elephant','Hawa Mahal','City Palace'], breakdown:{travel:2000,stay:3000,food:1500}},
  {id:'jodhpur',     title:'Jodhpur Blue City',          state:'Rajasthan',       lat:26.23, lon:73.02, category:'Heritage',    rating:4.6, reviews:'2.8k',startsFrom:7000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1524230576248-5c50d3ae4f3e?w=600&q=80', tags:['Mehrangarh Fort','Blue City','Rajasthani Food','Heritage'], highlights:['Mehrangarh Fort','Clock Tower Bazar','Umaid Bhawan'], breakdown:{travel:2500,stay:3200,food:1300}},
  {id:'udaipur',     title:'Udaipur City of Lakes',      state:'Rajasthan',       lat:24.58, lon:73.71, category:'Heritage',    rating:4.8, reviews:'3.8k',startsFrom:9500,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1568797629192-789acf8e4df3?w=600&q=80', tags:['Lake Palace','Romantic','Heritage','Boat Ride'], highlights:['Lake Pichola Boat','City Palace','Jag Mandir'], breakdown:{travel:3000,stay:4500,food:2000}},
  {id:'jaisalmer',   title:'Jaisalmer Golden Fort',      state:'Rajasthan',       lat:26.91, lon:70.91, category:'Desert',      rating:4.7, reviews:'2.5k',startsFrom:8000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1524230576248-5c50d3ae4f3e?w=600&q=80', tags:['Golden Fort','Sand Dunes','Camel Safari','Desert Camp'], highlights:['Jaisalmer Fort','Sam Sand Dunes','Desert Camp'], breakdown:{travel:3000,stay:3500,food:1500}},
  {id:'pushkar',     title:'Pushkar Holy Lake',          state:'Rajasthan',       lat:26.48, lon:74.55, category:'Pilgrimage',  rating:4.5, reviews:'1.5k',startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80', tags:['Brahma Temple','Camel Fair','Holy Lake','Spiritual'], highlights:['Brahma Temple','Pushkar Lake','Camel Fair'], breakdown:{travel:1500,stay:1800,food:700}},
  {id:'ranthambore', title:'Ranthambore Tiger Reserve',  state:'Rajasthan',       lat:26.01, lon:76.50, category:'Wildlife',    rating:4.7, reviews:'1.8k',startsFrom:9000,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1609619385002-f40f1df9b7f2?w=600&q=80', tags:['Tiger','Wildlife Safari','UNESCO','Photography'], highlights:['Tiger Zone Safari','Ranthambore Fort','Padam Lake'], breakdown:{travel:3000,stay:4500,food:1500}},
  {id:'mount_abu',   title:'Mount Abu Hill Station',     state:'Rajasthan',       lat:24.59, lon:72.70, category:'Hill Stations',rating:4.4,reviews:'1.8k',startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Only Hill Station','Dilwara Temple','Nakki Lake','Sunset'], highlights:['Dilwara Jain Temples','Nakki Lake','Sunset Point'], breakdown:{travel:1800,stay:2200,food:1000}},
  {id:'bikaner',     title:'Bikaner Camel Festival',     state:'Rajasthan',       lat:28.01, lon:73.31, category:'Desert',      rating:4.3, reviews:'900', startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1524230576248-5c50d3ae4f3e?w=600&q=80', tags:['Camel Safari','Junagarh Fort','Camel Festival','Heritage'], highlights:['Junagarh Fort','Camel Research Centre','Karni Mata Temple'], breakdown:{travel:2000,stay:2500,food:1000}},
  {id:'ajmer',       title:'Ajmer Sharif Dargah',        state:'Rajasthan',       lat:26.44, lon:74.63, category:'Pilgrimage',  rating:4.6, reviews:'3k',  startsFrom:2500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80', tags:['Dargah','Sufi','Pilgrimage','Ana Sagar Lake'],  highlights:['Dargah Khwaja Sahib','Ana Sagar Lake','Taragarh Fort'], breakdown:{travel:900,stay:1000,food:600}},
  {id:'chittorgarh', title:'Chittorgarh Fort',           state:'Rajasthan',       lat:24.88, lon:74.62, category:'Heritage',    rating:4.5, reviews:'1.2k',startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Largest Fort','Rani Padmini','Heritage','History'], highlights:['Chittorgarh Fort','Vijay Stambha','Rani Padmini Palace'], breakdown:{travel:1600,stay:2000,food:900}},
  {id:'bharatpur',   title:'Bharatpur Bird Sanctuary',   state:'Rajasthan',       lat:27.21, lon:77.50, category:'Wildlife',    rating:4.5, reviews:'1.1k',startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Bird Watching','UNESCO','Migratory Birds','Cycling'], highlights:['Keoladeo Bird Sanctuary','Bharatpur Palace','Deeg Palace'], breakdown:{travel:1000,stay:1200,food:800}},

  // ── GUJARAT ───────────────────────────────────────────────────────────────────
  {id:'rann',        title:'Rann of Kutch',              state:'Gujarat',         lat:23.73, lon:69.86, category:'Desert',      rating:4.8, reviews:'2.2k',startsFrom:8000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1524230576248-5c50d3ae4f3e?w=600&q=80', tags:['White Desert','Rann Utsav','Culture','Kutch Craft'], highlights:['White Rann','Rann Utsav Festival','Mandvi Beach'], breakdown:{travel:3000,stay:3500,food:1500}},
  {id:'ahmedabad',   title:'Ahmedabad Sabarmati',        state:'Gujarat',         lat:23.02, lon:72.57, category:'Heritage',    rating:4.4, reviews:'2k',  startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tags:['Gandhi Ashram','Heritage Walk','Food Capital','Kite Festival'], highlights:['Sabarmati Ashram','Adalaj Stepwell','Calico Museum'], breakdown:{travel:1000,stay:1200,food:800}},
  {id:'somnath',     title:'Somnath Jyotirlinga',        state:'Gujarat',         lat:20.88, lon:70.40, category:'Pilgrimage',  rating:4.8, reviews:'3.5k',startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Jyotirlinga','Coastal Temple','Pilgrimage','Sacred'], highlights:['Somnath Temple','Light & Sound Show','Bhalka Tirth'], breakdown:{travel:1500,stay:1800,food:1200}},
  {id:'dwarka',      title:'Dwarka Krishna Dham',        state:'Gujarat',         lat:22.23, lon:68.96, category:'Pilgrimage',  rating:4.7, reviews:'2.8k',startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Krishna','Dwarkadhish','Char Dham','Sacred'],   highlights:['Dwarkadhish Temple','Bet Dwarka Island','Nageshwar Jyotirlinga'], breakdown:{travel:1400,stay:1600,food:1000}},
  {id:'gir',         title:'Gir National Park',          state:'Gujarat',         lat:21.12, lon:70.82, category:'Wildlife',    rating:4.7, reviews:'1.8k',startsFrom:7500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Asiatic Lion','Only Lions','Safari','Wildlife'],  highlights:['Lion Safari','Kamleshwar Dam','Interpretation Zone'], breakdown:{travel:2500,stay:3500,food:1500}},
  {id:'saputara',    title:'Saputara Hill Station',      state:'Gujarat',         lat:20.57, lon:73.74, category:'Hill Stations',rating:4.3,reviews:'900', startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&q=80', tags:['Tribal Culture','Waterfalls','Lake','Eco Tourism'], highlights:['Saputara Lake','Step Garden','Tribal Museum'], breakdown:{travel:1400,stay:1800,food:800}},
  {id:'statue_unity',title:'Statue of Unity',            state:'Gujarat',         lat:21.83, lon:73.71, category:'Heritage',    rating:4.6, reviews:'3.5k',startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tags:['Worlds Tallest Statue','Valley of Flowers','Dam','Engineering'], highlights:['Statue of Unity','Flower Valley','Kevadia Colony'], breakdown:{travel:1200,stay:1500,food:800}},

  // ── MAHARASHTRA ──────────────────────────────────────────────────────────────
  {id:'mumbai',      title:'Mumbai City of Dreams',      state:'Maharashtra',     lat:19.07, lon:72.87, category:'City Tour',   rating:4.5, reviews:'8k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Gateway of India','Bollywood','Street Food','Marine Drive'], highlights:['Marine Drive','Elephanta Caves','Juhu Beach'], breakdown:{travel:2000,stay:2500,food:1500}},
  {id:'pune',        title:'Pune City of Youth',         state:'Maharashtra',     lat:18.52, lon:73.85, category:'City Tour',   rating:4.3, reviews:'3k',  startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Osho Ashram','Shaniwar Wada','Cafes','Nightlife'], highlights:['Shaniwar Wada','Aga Khan Palace','Osho Ashram'], breakdown:{travel:1200,stay:1500,food:800}},
  {id:'ajanta',      title:'Ajanta Ellora Caves',        state:'Maharashtra',     lat:20.55, lon:75.70, category:'Heritage',    rating:4.8, reviews:'2.8k',startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['UNESCO','Rock Cut Caves','Buddhist Art','History'], highlights:['Ajanta Caves Paintings','Ellora 34 Caves','Bibi Ka Maqbara'], breakdown:{travel:1800,stay:2000,food:1200}},
  {id:'shirdi',      title:'Shirdi Sai Baba',            state:'Maharashtra',     lat:19.76, lon:74.47, category:'Pilgrimage',  rating:4.9, reviews:'7k',  startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Sai Baba','Pilgrimage','Samadhi','Blessings'],   highlights:['Sai Baba Samadhi Temple','Dwarkamai Masjid','Chavadi'], breakdown:{travel:1000,stay:1200,food:800}},
  {id:'lonavala',    title:'Lonavala & Khandala',        state:'Maharashtra',     lat:18.75, lon:73.40, category:'Nature',      rating:4.4, reviews:'2.5k',startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Waterfalls','Chikki','Weekend Getaway','Trekking'], highlights:['Bhushi Dam','Tiger\'s Leap','Lohagad Fort'], breakdown:{travel:1200,stay:1500,food:800}},
  {id:'mahabaleshwar',title:'Mahabaleshwar Strawberries',state:'Maharashtra',     lat:17.92, lon:73.65, category:'Hill Stations',rating:4.5,reviews:'2.2k',startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&q=80', tags:['Strawberry','Viewpoints','Waterfalls','Romantic'], highlights:['Venna Lake','Pratapgarh Fort','Wilson Point'], breakdown:{travel:2000,stay:2500,food:1000}},
  {id:'nasik',       title:'Nashik Grape City',          state:'Maharashtra',     lat:19.99, lon:73.78, category:'Pilgrimage',  rating:4.4, reviews:'2k',  startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80', tags:['Kumbh Mela','Wine Tour','Grapes','Trimbakeshwar'], highlights:['Trimbakeshwar Temple','Sula Vineyards','Pandavleni Caves'], breakdown:{travel:1000,stay:1200,food:800}},
  {id:'alibag',      title:'Alibag Beach Getaway',       state:'Maharashtra',     lat:18.64, lon:72.87, category:'Beaches',     rating:4.3, reviews:'1.5k',startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Beach','Fort','Ferry','Weekend'],               highlights:['Alibag Beach','Kolaba Fort','Phansad Wildlife Sanctuary'], breakdown:{travel:1200,stay:1500,food:800}},

  // ── GOA ───────────────────────────────────────────────────────────────────────
  {id:'goa_north',   title:'North Goa Beach Vibes',      state:'Goa',             lat:15.55, lon:73.76, category:'Beaches',     rating:4.8, reviews:'6k',  startsFrom:6500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Baga','Calangute','Nightlife','Water Sports'],  highlights:['Baga Beach','Fort Aguada','Anjuna Flea Market'], breakdown:{travel:2000,stay:3000,food:1500}},
  {id:'goa_south',   title:'South Goa Serene Beaches',   state:'Goa',             lat:15.09, lon:73.93, category:'Beaches',     rating:4.9, reviews:'4.5k',startsFrom:8000,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Palolem','Cola Beach','Luxury Resorts','Peaceful'], highlights:['Palolem Beach','Butterfly Beach','Cotigao Wildlife'], breakdown:{travel:2500,stay:4000,food:1500}},
  {id:'goa_heritage',title:'Goa Heritage Walk',          state:'Goa',             lat:15.29, lon:74.12, category:'Heritage',    rating:4.6, reviews:'2k',  startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Old Goa','Portuguese','Churches','UNESCO'],     highlights:['Basilica of Bom Jesus','Old Goa Churches','Spice Plantations'], breakdown:{travel:1500,stay:2000,food:1000}},

  // ── KARNATAKA ─────────────────────────────────────────────────────────────────
  {id:'mysore',      title:'Mysore Palace City',         state:'Karnataka',       lat:12.29, lon:76.63, category:'Heritage',    rating:4.7, reviews:'4k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Palace','Dasara','Silk','Heritage'],            highlights:['Mysore Palace Illumination','Chamundi Hills','Brindavan Gardens'], breakdown:{travel:1800,stay:2000,food:1200}},
  {id:'coorg',       title:'Coorg Coffee Trail',         state:'Karnataka',       lat:12.33, lon:75.80, category:'Nature',      rating:4.6, reviews:'1.8k',startsFrom:7000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Coffee Estates','Waterfalls','Homestay','Misty Hills'], highlights:['Abbey Falls','Raja\'s Seat','Nagarhole Tiger Reserve'], breakdown:{travel:2500,stay:3200,food:1300}},
  {id:'hampi',       title:'Hampi Ruins',                state:'Karnataka',       lat:15.33, lon:76.46, category:'Heritage',    rating:4.8, reviews:'2.5k',startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a449?w=600&q=80', tags:['UNESCO Ruins','Vijayanagara','Boulders','Backpacker'], highlights:['Virupaksha Temple','Stone Chariot','Tungabhadra River'], breakdown:{travel:2000,stay:2500,food:1000}},
  {id:'bangalore',   title:'Bengaluru Garden City',      state:'Karnataka',       lat:12.97, lon:77.59, category:'City Tour',   rating:4.3, reviews:'4k',  startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Pub Hopping','Lalbagh','IT City','Cubbon Park'], highlights:['Lalbagh Botanical Garden','Cubbon Park','Tipu Sultan Palace'], breakdown:{travel:1500,stay:2000,food:1500}},
  {id:'chikmagalur', title:'Chikmagalur Coffee Hills',   state:'Karnataka',       lat:13.31, lon:75.77, category:'Nature',      rating:4.5, reviews:'1.2k',startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Coffee Estates','Trekking','Mullayanagiri','Fog'], highlights:['Mullayanagiri Peak','Baba Budangiri','Hebbe Falls'], breakdown:{travel:2000,stay:2500,food:1000}},
  {id:'badami',      title:'Badami Cave Temples',        state:'Karnataka',       lat:15.91, lon:75.67, category:'Heritage',    rating:4.6, reviews:'900', startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Cave Temples','Chalukya','Rock Cut Art','History'], highlights:['Badami Caves','Pattadakal','Aihole'], breakdown:{travel:1500,stay:1800,food:700}},
  {id:'kabini',      title:'Kabini Wildlife Resort',     state:'Karnataka',       lat:11.92, lon:76.35, category:'Wildlife',    rating:4.8, reviews:'1.4k',startsFrom:15000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Elephant','Leopard','Luxury Safari','Backwaters'], highlights:['Kabini Backwaters Safari','Nagarhole National Park','Elephant Herd'], breakdown:{travel:3000,stay:10000,food:2000}},
  {id:'gokarna',     title:'Gokarna Beach Paradise',     state:'Karnataka',       lat:14.54, lon:74.31, category:'Beaches',     rating:4.7, reviews:'1.9k',startsFrom:5000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Om Beach','Hippie Vibe','Mahabaleshwara Temple','Trek'], highlights:['Om Beach','Kudle Beach','Mahabaleshwara Temple'], breakdown:{travel:1800,stay:2000,food:1200}},

  // ── KERALA ────────────────────────────────────────────────────────────────────
  {id:'munnar',      title:'Munnar Tea Gardens',         state:'Kerala',          lat:10.08, lon:77.05, category:'Nature',      rating:4.7, reviews:'2.5k',startsFrom:8000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', tags:['Tea Estates','Eravikulam','Cool Climate','Waterfalls'], highlights:['Tea Museum','Eravikulam National Park','Mattupetty Dam'], breakdown:{travel:2500,stay:3800,food:1700}},
  {id:'alleppey',    title:'Alleppey Backwaters',        state:'Kerala',          lat:9.49,  lon:76.33, category:'Backwaters',  rating:4.8, reviews:'3.2k',startsFrom:9000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=600&q=80', tags:['Houseboat','Backwaters','Rice Fields','Sunset'],highlights:['Houseboat Cruise','Punnamada Lake','Vembanad Lake'], breakdown:{travel:3000,stay:4500,food:1500}},
  {id:'thekkady',    title:'Thekkady Periyar Wildlife',  state:'Kerala',          lat:9.59,  lon:77.16, category:'Wildlife',    rating:4.6, reviews:'1.8k',startsFrom:7500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Periyar Tiger Reserve','Spice Garden','Boat Safari','Elephant'], highlights:['Periyar Lake Boat Safari','Spice Plantation','Tribal Heritage'], breakdown:{travel:2500,stay:3500,food:1500}},
  {id:'varkala',     title:'Varkala Cliff Beach',        state:'Kerala',          lat:8.73,  lon:76.71, category:'Beaches',     rating:4.7, reviews:'1.5k',startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Cliff Beach','Ayurveda','Yoga','Papanasam Beach'], highlights:['Varkala Cliff Walk','Janardanaswami Temple','Ayurveda Spa'], breakdown:{travel:2000,stay:2800,food:1200}},
  {id:'wayanad',     title:'Wayanad Tribal Hills',       state:'Kerala',          lat:11.60, lon:76.08, category:'Nature',      rating:4.6, reviews:'1.4k',startsFrom:6500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Tribal Culture','Waterfalls','Tea','Wildlife'], highlights:['Edakkal Caves','Chembra Peak','Soochipara Waterfalls'], breakdown:{travel:2200,stay:3000,food:1300}},
  {id:'kovalam',     title:'Kovalam Beach Resort',       state:'Kerala',          lat:8.39,  lon:76.97, category:'Beaches',     rating:4.5, reviews:'2k',  startsFrom:7000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Lighthouse Beach','Ayurveda','Catamaran','Seafood'], highlights:['Lighthouse Beach','Kovalam Ayurveda Centre','Padmanabhaswamy Temple'], breakdown:{travel:2500,stay:3200,food:1300}},
  {id:'kochi',       title:'Kochi Fort & Backwaters',    state:'Kerala',          lat:9.93,  lon:76.26, category:'City Tour',   rating:4.5, reviews:'3k',  startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Chinese Fishing Nets','Fort Kochi','Jewish Synagogue','Heritage'], highlights:['Fort Kochi Chinese Nets','Mattancherry Palace','Kerala Cuisine'], breakdown:{travel:2000,stay:2500,food:1000}},

  // ── TAMIL NADU ───────────────────────────────────────────────────────────────
  {id:'madurai',     title:'Madurai Meenakshi Temple',   state:'Tamil Nadu',      lat:9.92,  lon:78.11, category:'Pilgrimage',  rating:4.8, reviews:'4.5k',startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Meenakshi Amman','Gopuram','South India Temple','Pilgrimage'], highlights:['Meenakshi Amman Temple','Thirumalai Nayakkar Palace','Gandhi Museum'], breakdown:{travel:1500,stay:1800,food:700}},
  {id:'ooty',        title:'Ooty Nilgiri Hills',         state:'Tamil Nadu',      lat:11.41, lon:76.69, category:'Hill Stations',rating:4.5,reviews:'2.8k',startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=600&q=80', tags:['Toy Train','Tea Gardens','Botanical Garden','Cool Climate'], highlights:['Nilgiri Toy Train','Ooty Botanical Garden','Doddabetta Peak'], breakdown:{travel:2000,stay:2800,food:1200}},
  {id:'kodaikanal',  title:'Kodaikanal Princess Hills',  state:'Tamil Nadu',      lat:10.23, lon:77.48, category:'Hill Stations',rating:4.5,reviews:'1.8k',startsFrom:7000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1627301517152-11505d049c30?w=600&q=80', tags:['Star Shaped Lake','Cycling','Pine Forest','Chocolate'], highlights:['Kodai Lake Boating','Coaker\'s Walk','Pillar Rocks'], breakdown:{travel:2500,stay:3200,food:1300}},
  {id:'rameshwaram', title:'Rameshwaram Sacred Island',  state:'Tamil Nadu',      lat:9.28,  lon:79.31, category:'Pilgrimage',  rating:4.8, reviews:'4k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Ramanathaswamy','Char Dham','Sacred Baths','Pamban Bridge'], highlights:['Ramanathaswamy Temple','Agni Theertham','Pamban Bridge'], breakdown:{travel:2000,stay:2000,food:1000}},
  {id:'kanyakumari', title:'Kanyakumari Land\'s End',    state:'Tamil Nadu',      lat:8.07,  lon:77.55, category:'Pilgrimage',  rating:4.7, reviews:'2.8k',startsFrom:4500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Sunrise & Sunset','Vivekananda Rock','Three Seas Meet','Memorial'], highlights:['Vivekananda Rock Memorial','Thiruvalluvar Statue','Kumari Amman Temple'], breakdown:{travel:1800,stay:1800,food:900}},
  {id:'mahabalipuram',title:'Mahabalipuram Shore Temple',state:'Tamil Nadu',      lat:12.61, lon:80.19, category:'Heritage',    rating:4.6, reviews:'1.8k',startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Shore Temple','UNESCO','Beach','Sculpture'],   highlights:['Shore Temple','Pancha Rathas','Krishna\'s Butter Ball'], breakdown:{travel:1500,stay:1800,food:700}},
  {id:'pondicherry', title:'Pondicherry French Colony',  state:'Puducherry',      lat:11.93, lon:79.83, category:'City Tour',   rating:4.6, reviews:'2.5k',startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['French Quarter','Auroville','Promenade Beach','Cafes'], highlights:['French Quarter Walk','Auroville Matrimandir','Sri Aurobindo Ashram'], breakdown:{travel:1800,stay:2200,food:1000}},
  {id:'coimbatore',  title:'Coimbatore to Valparai',     state:'Tamil Nadu',      lat:11.00, lon:76.96, category:'Nature',      rating:4.4, reviews:'900', startsFrom:4500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Tea Estates','Hairpin Bends','Trekking','Waterfalls'], highlights:['Valparai Tea Estates','Monkey Falls','Chinnakallar'], breakdown:{travel:1500,stay:2000,food:1000}},

  // ── ANDHRA PRADESH & TELANGANA ───────────────────────────────────────────────
  {id:'tirupati',    title:'Tirupati Balaji Temple',     state:'Andhra Pradesh',  lat:13.63, lon:79.41, category:'Pilgrimage',  rating:4.9, reviews:'9k',  startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Venkateshwara','Richest Temple','Laddu','Holy Dip'], highlights:['Tirumala Venkateswara Temple','Sri Vari Museum','Akasaganga Teertham'], breakdown:{travel:1200,stay:1500,food:800}},
  {id:'araku',       title:'Araku Valley Coffee',        state:'Andhra Pradesh',  lat:18.32, lon:82.87, category:'Nature',      rating:4.5, reviews:'1.2k',startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Tribal Coffee','Train Journey','Waterfalls','Caves'], highlights:['Borra Caves','Waterfalls','Coffee Museum'], breakdown:{travel:2000,stay:2500,food:1000}},
  {id:'hyderabad',   title:'Hyderabad City of Nawabs',   state:'Telangana',       lat:17.38, lon:78.48, category:'City Tour',   rating:4.5, reviews:'4k',  startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Biryani','Charminar','Golconda Fort','Pearl'],  highlights:['Charminar','Golconda Fort Light Show','Salar Jung Museum'], breakdown:{travel:1500,stay:2000,food:1500}},
  {id:'warangal',    title:'Warangal Kakatiya Heritage', state:'Telangana',       lat:17.96, lon:79.59, category:'Heritage',    rating:4.4, reviews:'800', startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Thousand Pillar Temple','Warangal Fort','Ramappa','UNESCO'], highlights:['Thousand Pillar Temple','Warangal Fort Gates','Ramappa Lake'], breakdown:{travel:1000,stay:1200,food:800}},

  // ── ODISHA ────────────────────────────────────────────────────────────────────
  {id:'puri',        title:'Puri Jagannath Dham',        state:'Odisha',          lat:19.80, lon:85.82, category:'Pilgrimage',  rating:4.8, reviews:'4.5k',startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Jagannath Temple','Char Dham','Rath Yatra','Beach'], highlights:['Jagannath Temple','Puri Beach','Konark Sun Temple'], breakdown:{travel:1500,stay:1800,food:700}},
  {id:'konark',      title:'Konark Sun Temple',          state:'Odisha',          lat:19.88, lon:86.09, category:'Heritage',    rating:4.7, reviews:'1.8k',startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Sun Temple','UNESCO','Architecture','Rath Yatra'], highlights:['Sun Temple','Chandrabhaga Beach','Puri Jagannath'], breakdown:{travel:1600,stay:2000,food:900}},
  {id:'bhubaneswar', title:'Bhubaneswar Temple City',    state:'Odisha',          lat:20.29, lon:85.82, category:'Heritage',    rating:4.5, reviews:'1.2k',startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['1000 Temples','Lingaraj','Odisha Dance','Art'],  highlights:['Lingaraj Temple','Mukteshwar Temple','Odisha State Museum'], breakdown:{travel:1200,stay:1500,food:800}},
  {id:'chilika',     title:'Chilika Lake Bird Watching', state:'Odisha',          lat:19.72, lon:85.32, category:'Wildlife',    rating:4.5, reviews:'1k',  startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Flamingos','Irrawaddy Dolphin','Bird Watching','Largest Lagoon'], highlights:['Flamingo Watching','Irrawaddy Dolphins','Nalabana Island'], breakdown:{travel:1400,stay:1800,food:800}},

  // ── WEST BENGAL ──────────────────────────────────────────────────────────────
  {id:'darjeeling',  title:'Darjeeling Tea Capital',     state:'West Bengal',     lat:27.03, lon:88.26, category:'Hill Stations',rating:4.7,reviews:'3k',  startsFrom:7500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', tags:['Toy Train','Tea Gardens','Kanchenjunga View','Tiger Hill'], highlights:['Tiger Hill Sunrise','Darjeeling Himalayan Railway','Tea Garden Tour'], breakdown:{travel:2500,stay:3500,food:1500}},
  {id:'kolkata',     title:'Kolkata City of Joy',        state:'West Bengal',     lat:22.57, lon:88.36, category:'City Tour',   rating:4.4, reviews:'4k',  startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Victoria Memorial','Durga Puja','Street Food','Cultural'], highlights:['Victoria Memorial','Howrah Bridge','Park Street'], breakdown:{travel:1500,stay:2000,food:1500}},
  {id:'sundarbans',  title:'Sundarbans Tiger Delta',     state:'West Bengal',     lat:21.94, lon:88.87, category:'Wildlife',    rating:4.6, reviews:'1.2k',startsFrom:8000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Royal Bengal Tiger','Mangrove','UNESCO','Boat Safari'], highlights:['Tiger Census Boat Safari','Sajnekhali Wildlife Sanctuary','Sudhanyakhali Watch Tower'], breakdown:{travel:3000,stay:4000,food:1000}},
  {id:'sikkim',      title:'Sikkim Gangtok Nathula',     state:'Sikkim',          lat:27.32, lon:88.61, category:'Hill Stations',rating:4.7,reviews:'2k',  startsFrom:10000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', tags:['Nathula Pass','Kanchenjunga','Rumtek Monastery','Orchids'], highlights:['Nathula Pass','Rumtek Monastery','MG Marg Gangtok'], breakdown:{travel:3500,stay:5000,food:1500}},

  // ── NORTHEAST INDIA ──────────────────────────────────────────────────────────
  {id:'kaziranga',   title:'Kaziranga One Horn Rhino',   state:'Assam',           lat:26.57, lon:93.17, category:'Wildlife',    rating:4.7, reviews:'1.4k',startsFrom:12000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1549366021-9f761d450615?w=600&q=80', tags:['One Horned Rhino','UNESCO','Elephant Safari','Tiger'], highlights:['Jeep Safari Central Range','Elephant Back Safari','Kaziranga Orchid Park'], breakdown:{travel:4500,stay:6000,food:1500}},
  {id:'majuli',      title:'Majuli Island Assam',        state:'Assam',           lat:26.95, lon:94.16, category:'Offbeat',     rating:4.5, reviews:'600', startsFrom:5000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['River Island','Satras','Mising Tribe','Nature'],highlights:['Majuli Satras','Mising Tribal Village','Ferries'], breakdown:{travel:2000,stay:2500,food:500}},
  {id:'shillong',    title:'Shillong Scotland of East',  state:'Meghalaya',       lat:25.57, lon:91.88, category:'Hill Stations',rating:4.6,reviews:'1.5k',startsFrom:7000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&q=80', tags:['Khasi Culture','Waterfalls','Caves','Cleanest Village'], highlights:['Cherrapunji Waterfalls','Mawsmai Cave','Dawki Crystal River'], breakdown:{travel:2500,stay:3000,food:1500}},
  {id:'cherrapunji', title:'Cherrapunji Living Roots',   state:'Meghalaya',       lat:25.28, lon:91.72, category:'Nature',      rating:4.7, reviews:'1.2k',startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Wettest Place','Living Root Bridges','Waterfalls','Trek'], highlights:['Nohkalikai Falls','Double Decker Root Bridge','Dawki River'], breakdown:{travel:2000,stay:3000,food:1000}},
  {id:'dzukou',      title:'Dzukou Valley Nagaland',     state:'Nagaland',        lat:25.60, lon:94.08, category:'Trekking',    rating:4.8, reviews:'700', startsFrom:8000,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', tags:['Valley of Flowers','Trek','Naga Culture','Pristine'], highlights:['Dzukou Valley','Japfu Peak','Kohima War Cemetery'], breakdown:{travel:3000,stay:4000,food:1000}},
  {id:'arunachal',   title:'Arunachal Tawang Monastery', state:'Arunachal Pradesh',lat:27.58,lon:91.86, category:'Spiritual',   rating:4.7, reviews:'800', startsFrom:15000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1583082824910-f7b3c3e71ae3?w=600&q=80', tags:['Largest Monastery','Sela Pass','Tibetan Culture','Snow'], highlights:['Tawang Monastery','Sela Pass','Bum La Pass'], breakdown:{travel:6000,stay:6000,food:3000}},
  {id:'ziro',        title:'Ziro Valley Apatani Tribe',  state:'Arunachal Pradesh',lat:27.54,lon:93.82, category:'Offbeat',    rating:4.6, reviews:'500', startsFrom:12000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Apatani Tribe','Music Festival','UNESCO Nomination','Rice Fields'], highlights:['Ziro Music Festival','Apatani Villages','Talley Valley'], breakdown:{travel:5000,stay:5000,food:2000}},
  {id:'manipur',     title:'Manipur Loktak Lake',        state:'Manipur',         lat:24.58, lon:93.90, category:'Offbeat',     rating:4.4, reviews:'400', startsFrom:8000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Loktak Lake','Floating Islands','Meitei Culture','Keibul Deer'], highlights:['Loktak Lake Phumdis','Keibul Lamjao National Park','Imphal War Cemetery'], breakdown:{travel:3500,stay:3500,food:1000}},

  // ── MADHYA PRADESH & CHHATTISGARH ───────────────────────────────────────────
  {id:'khajuraho',   title:'Khajuraho Temple Art',       state:'Madhya Pradesh',  lat:24.85, lon:79.92, category:'Heritage',    rating:4.7, reviews:'2k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['UNESCO','Erotic Temples','Medieval Art','Chandela'], highlights:['Western Group Temples','Eastern Group','Kandariya Mahadev'], breakdown:{travel:1800,stay:2200,food:1000}},
  {id:'bandhavgarh', title:'Bandhavgarh Tiger Reserve',  state:'Madhya Pradesh',  lat:23.72, lon:81.02, category:'Wildlife',    rating:4.8, reviews:'1.6k',startsFrom:10000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1609619385002-f40f1df9b7f2?w=600&q=80', tags:['Highest Tiger Density','Jungle Safari','White Tigers','Nature'], highlights:['Tala Zone Safari','Bandhavgarh Fort','Shesh Shaiya'], breakdown:{travel:3000,stay:5500,food:1500}},
  {id:'kanha',       title:'Kanha Tiger Reserve',        state:'Madhya Pradesh',  lat:22.33, lon:80.61, category:'Wildlife',    rating:4.7, reviews:'1.4k',startsFrom:9500,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1609619385002-f40f1df9b7f2?w=600&q=80', tags:['Barasingha Deer','Tiger','Jungle Book','Safari'], highlights:['Kanha Safari','Barasingha Meadows','Bamni Dadar Sunset'], breakdown:{travel:3000,stay:5000,food:1500}},
  {id:'orchha',      title:'Orchha Forgotten Kingdom',   state:'Madhya Pradesh',  lat:25.35, lon:78.64, category:'Heritage',    rating:4.6, reviews:'1k',  startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Medieval Temples','Cenotaphs','Betwa River','Heritage'], highlights:['Orchha Fort','Ram Raja Temple','Chaturbhuj Temple'], breakdown:{travel:1600,stay:2000,food:900}},
  {id:'bhopal',      title:'Bhopal City of Lakes',       state:'Madhya Pradesh',  lat:23.25, lon:77.40, category:'City Tour',   rating:4.3, reviews:'1.5k',startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tags:['Upper Lake','Tribal Museum','Bhimbetka Caves','Heritage'], highlights:['Upper Lake','Bhimbetka Rock Shelters','Tribal Museum Bhopal'], breakdown:{travel:1000,stay:1200,food:800}},
  {id:'jagdalpur',   title:'Jagdalpur Bastar Waterfalls',state:'Chhattisgarh',    lat:19.07, lon:82.02, category:'Nature',      rating:4.5, reviews:'800', startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Chitrakote Falls','Kanger Valley','Tribal Culture','Offbeat'], highlights:['Chitrakote Waterfalls','Kanger Valley NP','Bastar Dussehra'], breakdown:{travel:2200,stay:2800,food:1000}},

  // ── BIHAR & JHARKHAND ────────────────────────────────────────────────────────
  {id:'bodh_gaya',   title:'Bodh Gaya Enlightenment',    state:'Bihar',           lat:24.69, lon:84.99, category:'Pilgrimage',  rating:4.9, reviews:'3.5k',startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Buddha Enlightenment','Mahabodhi Temple','UNESCO','Buddhist Circuit'], highlights:['Mahabodhi Temple','Bodhi Tree','Thai Temple'], breakdown:{travel:1200,stay:1500,food:800}},
  {id:'nalanda',     title:'Nalanda Ancient University', state:'Bihar',           lat:25.13, lon:85.44, category:'Heritage',    rating:4.6, reviews:'1.2k',startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Ancient University','UNESCO','Buddhist Learning','Ruins'], highlights:['Nalanda Ruins','Nalanda Museum','Rajgir Ropeway'], breakdown:{travel:1000,stay:1200,food:800}},
  {id:'rajgir',      title:'Rajgir Hot Springs',         state:'Bihar',           lat:25.03, lon:85.41, category:'Pilgrimage',  rating:4.4, reviews:'900', startsFrom:2500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Hot Springs','Buddha Connection','Gridhakuta Hill','Jain Temples'], highlights:['Venuvan Vihar','Gridhakuta Parvat','Hot Springs'], breakdown:{travel:800,stay:1000,food:700}},
  {id:'betla',       title:'Betla Palamau Tiger Reserve', state:'Jharkhand',      lat:23.65, lon:84.08, category:'Wildlife',    rating:4.4, reviews:'600', startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Tiger Reserve','Elephant','Waterfalls','Tribal'], highlights:['Palamau Tiger Reserve','Waterfalls','Palamau Fort'], breakdown:{travel:2200,stay:2800,food:1000}},

  // ── ANDAMAN & LAKSHADWEEP ────────────────────────────────────────────────────
  {id:'andaman',     title:'Andaman Islands Paradise',   state:'Andaman & Nicobar',lat:11.74,lon:92.65, category:'Beaches',    rating:4.9, reviews:'4.2k',startsFrom:22000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600&q=80', tags:['Radhanagar Beach','Scuba Diving','Cellular Jail','Snorkeling'], highlights:['Radhanagar Beach','Cellular Jail','Neil Island','Havelock'], breakdown:{travel:12000,stay:7000,food:3000}},
  {id:'lakshadweep', title:'Lakshadweep Coral Islands',  state:'Lakshadweep',     lat:10.56, lon:72.64, category:'Beaches',     rating:4.8, reviews:'800', startsFrom:25000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600&q=80', tags:['Coral Reef','Kayaking','Lagoon','Remote Island'], highlights:['Agatti Island','Glass Bottom Boat','Snorkeling Lagoon'], breakdown:{travel:15000,stay:8000,food:2000}},
];

const FILTERS  = ['All','Wildlife','Adventure','Heritage','Beaches','Hill Stations','Spiritual','Nature','City Tour','Offbeat','Pilgrimage','Desert','Backwaters','Trekking','Skiing','Lakes'];
const PRICE_F  = ['All','Budget Friendly (Under ₹7k)','Premium (Above ₹7k)'];
const SORT_OPT = [['popular','⭐ Popular'],['distance','📍 Nearest'],['price_asc','💰 Low Price'],['price_desc','💎 Premium']];

export default function TripDiscoveryScreen({ navigation }) {
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [sortBy,      setSortBy]      = useState('popular');
  const [locLoading,  setLocLoading]  = useState(false);
  const [userCoords,  setUserCoords]  = useState(null);
  const [cityName,    setCityName]    = useState('');
  const [expanded,    setExpanded]    = useState({});
  const [showFilters, setShowFilters] = useState(false);

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

  const tripsWithDist = useMemo(() =>
    ALL_TRIPS.map(t => ({
      ...t,
      dist: userCoords ? haversine(userCoords.lat, userCoords.lon, t.lat, t.lon) : t.baseDist || 500,
    })), [userCoords]);

  const filtered = useMemo(() => {
    return tripsWithDist.filter(t => {
      const s    = search.toLowerCase();
      const mSrch = !s || t.title.toLowerCase().includes(s) || t.state.toLowerCase().includes(s) || t.category.toLowerCase().includes(s) || t.tags.some(tg => tg.toLowerCase().includes(s));
      const mType  = filter === 'All' || t.category === filter;
      const mPrice = priceFilter === 'All' ||
        (priceFilter === 'Budget Friendly (Under ₹7k)' && t.startsFrom < 7000) ||
        (priceFilter === 'Premium (Above ₹7k)'         && t.startsFrom >= 7000);
      // When sorted by distance — only show up to 2000km
      const mDist = sortBy === 'distance' ? t.dist <= 2000 : true;
      return mSrch && mType && mPrice && mDist;
    }).sort((a, b) => {
      if (sortBy === 'distance')   return a.dist - b.dist;
      if (sortBy === 'price_asc')  return a.startsFrom - b.startsFrom;
      if (sortBy === 'price_desc') return b.startsFrom - a.startsFrom;
      return b.rating - a.rating;
    });
  }, [tripsWithDist, search, filter, priceFilter, sortBy]);

  const renderTrip = ({ item: trip }) => {
    const isEx = expanded[trip.id];
    const cc   = CAT_COLOR[trip.category] || COLORS.primary;
    return (
      <View style={s.tripCard}>
        <View style={{ position:'relative' }}>
          <Image source={{ uri: trip.image }} style={s.tripImage} resizeMode="cover" />
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
                <View style={s.statBox}><Text style={s.statLabel}>🏨 STAY</Text><Text style={s.statVal}>₹{trip.breakdown.stay.toLocaleString('en-IN')}</Text></View>
                <View style={s.statBox}><Text style={s.statLabel}>🚗 TRAVEL</Text><Text style={s.statVal}>₹{trip.breakdown.travel.toLocaleString('en-IN')}</Text></View>
                <View style={s.statBox}><Text style={s.statLabel}>🍔 FOOD</Text><Text style={s.statVal}>₹{trip.breakdown.food.toLocaleString('en-IN')}</Text></View>
              </View>
            </>
          )}

          <View style={s.cardFooter}>
            <View>
              <Text style={s.priceLabel}>STARTS FROM</Text>
              <Text style={s.priceVal}>₹{trip.startsFrom.toLocaleString('en-IN')}</Text>
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

          <TouchableOpacity style={s.launchBtn}
            onPress={() => Alert.alert('✈️ Activate Trip',
              `Launch "${trip.title}" as your active split group?\nEstimated: ₹${trip.startsFrom.toLocaleString('en-IN')}/person`,
              [{ text:'Cancel', style:'cancel' },{ text:'Activate!', onPress: () => navigation.navigate('TripNavigation', { trip }) }]
            )}>
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
        <Text style={s.title}>Explore Trips ({ALL_TRIPS.length})</Text>
        <TouchableOpacity onPress={() => setShowFilters(p => !p)} style={s.filterToggle}>
          <Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>{showFilters ? 'Hide ▲' : 'Filters ▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Filters */}
      {showFilters && (
        <View style={s.filtersPanel}>
          {/* Search */}
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

          {/* Category chips */}
          <Text style={s.filterLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:10 }}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f} style={[s.filterChip, filter===f && { backgroundColor: CAT_COLOR[f]||COLORS.primary, borderColor: CAT_COLOR[f]||COLORS.primary }]} onPress={() => setFilter(f)}>
                <Text style={[s.filterChipText, filter===f && { color:'#fff' }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Price chips */}
          <Text style={s.filterLabel}>BUDGET</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:10 }}>
            {PRICE_F.map(p => (
              <TouchableOpacity key={p} style={[s.filterChip, priceFilter===p && s.filterChipActive]} onPress={() => setPriceFilter(p)}>
                <Text style={[s.filterChipText, priceFilter===p && { color:'#fff' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort */}
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

      {/* Location banner */}
      {!cityName ? (
        <TouchableOpacity style={s.locBanner} onPress={handleGetLocation} disabled={locLoading}>
          <Text style={s.locBannerText}>📍 Allow Location — Sort {ALL_TRIPS.length} trips nearest to you (up to 2000 km)</Text>
          {locLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: COLORS.gold, fontWeight:'800', fontSize:13 }}>Allow →</Text>}
        </TouchableOpacity>
      ) : (
        <View style={s.locActive}>
          <Text style={s.locActiveText}>📍 Sorted from <Text style={{ fontWeight:'800' }}>{cityName}</Text> — {filtered.length} trips within 2000 km</Text>
        </View>
      )}

      {/* Results count + active filters */}
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
        data={filtered}
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
  locActive:     { backgroundColor: COLORS.primary+'15', padding:10, paddingHorizontal: SPACING.md, borderBottomWidth:1, borderBottomColor: COLORS.primary+'30' },
  locActiveText: { color: COLORS.primary, fontSize:12, lineHeight:18 },

  resultsBar:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: SPACING.md, paddingVertical:8, backgroundColor: COLORS.surface, borderBottomWidth:1, borderBottomColor: COLORS.borderLight },
  resultsCount: { color: COLORS.textMuted, fontSize:12, fontWeight:'600' },

  // Trip card
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
  launchBtn:     { backgroundColor:'#4f46e5', borderRadius: RADIUS.md, height:43, alignItems:'center', justifyContent:'center' },
  launchBtnText: { color:'#fff', fontWeight:'800', fontSize:13 },
  curatedCard:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.lg, marginTop: SPACING.sm, marginBottom: SPACING.lg },
  curatedTitle:  { color:'#fff', fontWeight:'700', fontSize:18, marginBottom:8 },
  curatedSub:    { color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:20, marginBottom: SPACING.md },
});
