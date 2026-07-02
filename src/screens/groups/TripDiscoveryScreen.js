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

const ALL_TRIPS = [
  {id:'tajmahal',    title:'Taj Mahal, Agra',           state:'Uttar Pradesh',   lat:27.17, lon:78.04, category:'Heritage',     rating:4.9, reviews:'12k', startsFrom:1800,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80', tags:['UNESCO','Photography','History','Sunrise'],    highlights:['Taj Mahal at Sunrise','Agra Fort','Fatehpur Sikri'],  breakdown:{travel:600,stay:800,food:400},   description:'The iconic symbol of love — witness the Taj Mahal at sunrise for an unforgettable experience.', bestMonths:'Oct–Mar'},
  {id:'varanasi',    title:'Varanasi Ghats',             state:'Uttar Pradesh',   lat:25.31, lon:82.97, category:'Spiritual',    rating:4.8, reviews:'6k',  startsFrom:3500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1561361058-c24e01bfe3e5?w=600&q=80', tags:['Ghats','Aarti','Boat Ride','Temples'],         highlights:['Dashashwamedh Ghat Aarti','Kashi Vishwanath','Sarnath'], breakdown:{travel:1200,stay:1500,food:800}, description:'Experience the spiritual soul of India with evening Ganga Aarti and ancient ghats.', bestMonths:'Oct–Mar'},
  {id:'allahabad',   title:'Prayagraj Sangam',           state:'Uttar Pradesh',   lat:25.43, lon:81.84, category:'Pilgrimage',  rating:4.6, reviews:'3k',  startsFrom:2000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80', tags:['Sangam','Kumbh','Pilgrimage','Holy River'],    highlights:['Triveni Sangam','Anand Bhawan','Allahabad Fort'], breakdown:{travel:800,stay:800,food:400}, description:'Where three sacred rivers meet — a place of immense spiritual significance.', bestMonths:'Nov–Feb'},
  {id:'lucknow',     title:'Lucknow City of Nawabs',     state:'Uttar Pradesh',   lat:26.84, lon:80.94, category:'City Tour',   rating:4.5, reviews:'2k',  startsFrom:2500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tags:['Biryani','Heritage','Nawabi','Architecture'], highlights:['Bara Imambara','Rumi Darwaza','Hazratganj'], breakdown:{travel:900,stay:1000,food:600}, description:'The city of tehzeeb, biryani and stunning Mughal architecture.', bestMonths:'Oct–Feb'},
  {id:'mathura',     title:'Mathura Vrindavan',          state:'Uttar Pradesh',   lat:27.49, lon:77.67, category:'Pilgrimage',  rating:4.7, reviews:'4k',  startsFrom:1500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Krishna','Temples','Holi','Pilgrimage'],       highlights:['Banke Bihari Temple','ISKCON','Govardhan Hill'], breakdown:{travel:600,stay:600,food:300}, description:"Birthplace of Lord Krishna — celebrate Holi in the most colorful way possible.", bestMonths:'Oct–Mar'},
  {id:'corbett',     title:'Jim Corbett Safari',         state:'Uttarakhand',     lat:29.53, lon:78.77, category:'Wildlife',    rating:4.9, reviews:'2.4k',startsFrom:12500, intensity:'Premium',  image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Tiger','Jungle Safari','Wildlife','Eco'],      highlights:['Dhikala Zone Safari','Corbett Waterfall','Garjiya Devi'], breakdown:{travel:4000,stay:6000,food:2500}, description:"India's oldest national park — spot the majestic Royal Bengal Tiger.", bestMonths:'Nov–Jun'},
  {id:'rishikesh',   title:'Rishikesh Adventure Hub',    state:'Uttarakhand',     lat:30.08, lon:78.26, category:'Adventure',   rating:4.8, reviews:'3.8k',startsFrom:4200,  intensity:'Standard', image:'https://images.unsplash.com/photo-1545203149-f4d24ee42c52?w=600&q=80', tags:['Rafting','Bungee','Yoga','Camping'],           highlights:['Ganges Rafting','Laxman Jhula','Bungee Jumping'], breakdown:{travel:1200,stay:1800,food:1200}, description:'The Yoga Capital of the World and adventure sports hub on the banks of the Ganga.', bestMonths:'Sep–Jun'},
  {id:'haridwar',    title:'Haridwar Har Ki Pauri',      state:'Uttarakhand',     lat:29.94, lon:78.16, category:'Pilgrimage',  rating:4.7, reviews:'5k',  startsFrom:2000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Ganga Aarti','Pilgrimage','Holy Dip','Temples'],highlights:['Har Ki Pauri','Ganga Aarti','Chandi Devi'], breakdown:{travel:800,stay:800,food:400}, description:'The gateway to the Char Dhams — witness the mesmerizing Ganga Aarti every evening.', bestMonths:'Oct–Mar'},
  {id:'mussoorie',   title:'Mussoorie Queen of Hills',   state:'Uttarakhand',     lat:30.45, lon:78.06, category:'Hill Stations',rating:4.5,reviews:'2.2k',startsFrom:4800,  intensity:'Standard', image:'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&q=80', tags:['Hill Station','Waterfalls','Mall Road','Honeymoon'], highlights:['Kempty Falls','Gun Hill','Company Garden'], breakdown:{travel:1500,stay:2200,food:1100}, description:'The Queen of Hills with stunning Himalayan views, waterfalls and colonial charm.', bestMonths:'Mar–Jun'},
  {id:'nainital',    title:'Nainital Lake City',         state:'Uttarakhand',     lat:29.38, lon:79.45, category:'Lakes',       rating:4.6, reviews:'2.8k',startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80', tags:['Lake','Boating','Hill Station','Honeymoon'],   highlights:['Naini Lake Boating','Snow View Point','Jim Corbett'], breakdown:{travel:1600,stay:2000,food:900}, description:'A charming hill station built around a beautiful lake in the Kumaon Himalayas.', bestMonths:'Mar–Jun'},
  {id:'auli',        title:'Auli Skiing Resort',         state:'Uttarakhand',     lat:30.52, lon:79.56, category:'Skiing',      rating:4.7, reviews:'1.2k',startsFrom:9500,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80', tags:['Skiing','Snow','Cable Car','Trekking'],        highlights:['Auli Ski Resort','Nanda Devi View','Gurso Bugyal'], breakdown:{travel:3000,stay:5000,food:1500}, description:"India's best ski resort with panoramic Himalayan views and cable car rides.", bestMonths:'Jan–Mar'},
  {id:'chardham',    title:'Char Dham Yatra',            state:'Uttarakhand',     lat:30.74, lon:79.06, category:'Pilgrimage',  rating:4.9, reviews:'7k',  startsFrom:15000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1583082824910-f7b3c3e71ae3?w=600&q=80', tags:['Kedarnath','Badrinath','Gangotri','Yamunotri'], highlights:['Kedarnath Temple','Badrinath Dham','Valley of Flowers'], breakdown:{travel:6000,stay:6000,food:3000}, description:'The ultimate Hindu pilgrimage — visit all four sacred dhams in the Himalayas.', bestMonths:'May–Jun & Sep–Oct'},
  {id:'manali',      title:'Manali Snow Peaks',          state:'Himachal Pradesh',lat:32.23, lon:77.18, category:'Hill Stations',rating:4.9,reviews:'3.1k',startsFrom:9800,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80', tags:['Snow Trek','Camping','Solang','Rohtang'],      highlights:['Solang Valley','Rohtang Pass','Hadimba Temple'], breakdown:{travel:3500,stay:4500,food:1800}, description:'A paradise for snow lovers with adventure sports, scenic valleys and Rohtang Pass.', bestMonths:'Oct–Jun'},
  {id:'shimla',      title:'Shimla Colonial Hill Town',  state:'Himachal Pradesh',lat:31.10, lon:77.17, category:'Hill Stations',rating:4.6,reviews:'3.5k',startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80', tags:['Toy Train','Mall Road','Colonial','Snow'],     highlights:['The Ridge','Jakhu Temple','Kufri'], breakdown:{travel:2000,stay:2500,food:1000}, description:'Former summer capital of British India with toy train rides and colonial architecture.', bestMonths:'Mar–Jun'},
  {id:'dharamshala', title:'Dharamshala & McLeod Ganj',  state:'Himachal Pradesh',lat:32.21, lon:76.32, category:'Spiritual',   rating:4.7, reviews:'1.9k',startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1583082824910-f7b3c3e71ae3?w=600&q=80', tags:['Dalai Lama','Tibetan','Monastery','Trekking'], highlights:['Tsuglagkhang','Bhagsu Falls','Triund Trek'], breakdown:{travel:2000,stay:2800,food:1200}, description:'Home of the Dalai Lama with Tibetan culture, monasteries and Triund trek.', bestMonths:'Mar–Jun & Sep–Nov'},
  {id:'spiti',       title:'Spiti Valley Cold Desert',   state:'Himachal Pradesh',lat:32.24, lon:78.03, category:'Offbeat',     rating:4.8, reviews:'920', startsFrom:18000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', tags:['Cold Desert','Monastery','Off-Road','Camping'], highlights:['Key Monastery','Chandratal Lake','Pin Valley'], breakdown:{travel:7000,stay:6000,food:5000}, description:'A remote high-altitude desert valley with ancient monasteries and surreal landscapes.', bestMonths:'Jun–Sep'},
  {id:'kasol',       title:'Kasol Parvati Valley',       state:'Himachal Pradesh',lat:32.00, lon:77.31, category:'Offbeat',     rating:4.6, reviews:'1.4k',startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', tags:['Backpacker','Trekking','Cafes','River'],       highlights:['Kheerganga Trek','Chalal Village','Manikaran Sahib'], breakdown:{travel:1800,stay:2000,food:1200}, description:'Backpacker haven in the Parvati Valley with Israeli cafes and the Kheerganga trek.', bestMonths:'Mar–Jun & Sep–Nov'},
  {id:'kufri',       title:'Kufri Snow Point',           state:'Himachal Pradesh',lat:31.09, lon:77.26, category:'Skiing',      rating:4.4, reviews:'1.1k',startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80', tags:['Snow','Skiing','Horses','Fun Park'],           highlights:['Kufri Fun World','Himalayan Nature Park','Chail'], breakdown:{travel:1500,stay:1800,food:700}, description:'Snow-covered slopes near Shimla perfect for skiing, horse riding and snow play.', bestMonths:'Jan–Mar'},
  {id:'amritsar',    title:'Amritsar Golden Temple',     state:'Punjab',          lat:31.63, lon:74.87, category:'Pilgrimage',  rating:4.9, reviews:'8k',  startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=600&q=80', tags:['Golden Temple','Langar','Wagah Border','Sikh'], highlights:['Harmandir Sahib','Jallianwala Bagh','Wagah Border Ceremony'], breakdown:{travel:1200,stay:1500,food:800}, description:'The holiest Sikh shrine glowing in gold — a spiritual and emotional experience.', bestMonths:'Oct–Mar'},
  {id:'chandigarh',  title:'Chandigarh Planned City',    state:'Punjab/Haryana',  lat:30.73, lon:76.77, category:'City Tour',   rating:4.3, reviews:'1.5k',startsFrom:2500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tags:['Rock Garden','Sukhna Lake','Modern City','Garden'], highlights:['Rock Garden','Sukhna Lake','Capitol Complex'], breakdown:{travel:900,stay:1000,food:600}, description:"India's most planned city with beautiful gardens, Rock Garden and Sukhna Lake.", bestMonths:'Oct–Mar'},
  {id:'leh',         title:'Leh Ladakh Adventure',       state:'Ladakh',          lat:34.15, lon:77.57, category:'Adventure',   rating:4.9, reviews:'4.2k',startsFrom:20000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600&q=80', tags:['Pangong Lake','Monasteries','Bike Trip','High Altitude'], highlights:['Pangong Tso','Nubra Valley','Magnetic Hill','Diskit Monastery'], breakdown:{travel:8000,stay:7000,food:5000}, description:'The crown jewel of India — monasteries, lakes and the highest motorable roads.', bestMonths:'Jun–Sep'},
  {id:'jammu',       title:'Jammu Vaishno Devi',         state:'J&K',             lat:32.72, lon:74.85, category:'Pilgrimage',  rating:4.8, reviews:'5k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Vaishno Devi','Pilgrimage','Trek','Bhawan'],   highlights:['Vaishno Devi Shrine','Banganga','Bhairon Temple'], breakdown:{travel:2000,stay:2000,food:1000}, description:'Trek to the sacred Vaishno Devi shrine through beautiful mountain terrain.', bestMonths:'Mar–Oct'},
  {id:'srinagar',    title:'Srinagar Dal Lake',          state:'J&K',             lat:34.08, lon:74.79, category:'Lakes',       rating:4.8, reviews:'3.5k',startsFrom:12000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', tags:['Houseboat','Shikara','Dal Lake','Chinar'],     highlights:['Shikara Ride','Mughal Gardens','Gulmarg Gondola'], breakdown:{travel:5000,stay:5000,food:2000}, description:'Stay on a floating houseboat on the iconic Dal Lake surrounded by Himalayan peaks.', bestMonths:'Apr–Oct'},
  {id:'gulmarg',     title:'Gulmarg Gondola',            state:'J&K',             lat:34.05, lon:74.38, category:'Skiing',      rating:4.8, reviews:'2.1k',startsFrom:14000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80', tags:['Gondola','Skiing','Snow','Golf Course'],       highlights:['Gondola Cable Car','Kongdori','Alpine Meadows'], breakdown:{travel:5000,stay:6000,food:3000}, description:"Asia's highest gondola with world-class skiing and breathtaking snow-covered meadows.", bestMonths:'Dec–Mar'},
  {id:'jaipur',      title:'Jaipur Pink City',           state:'Rajasthan',       lat:26.91, lon:75.78, category:'Heritage',    rating:4.7, reviews:'5.5k',startsFrom:6500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Amer Fort','Hawa Mahal','Shopping','Heritage'], highlights:['Amer Fort Elephant','Hawa Mahal','City Palace'], breakdown:{travel:2000,stay:3000,food:1500}, description:'The Pink City with majestic forts, palaces, vibrant bazaars and Rajasthani culture.', bestMonths:'Oct–Mar'},
  {id:'jodhpur',     title:'Jodhpur Blue City',          state:'Rajasthan',       lat:26.23, lon:73.02, category:'Heritage',    rating:4.6, reviews:'2.8k',startsFrom:7000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1524230576248-5c50d3ae4f3e?w=600&q=80', tags:['Mehrangarh Fort','Blue City','Rajasthani Food','Heritage'], highlights:['Mehrangarh Fort','Clock Tower Bazar','Umaid Bhawan'], breakdown:{travel:2500,stay:3200,food:1300}, description:'The Blue City dominated by the magnificent Mehrangarh Fort and colorful bazaars.', bestMonths:'Oct–Mar'},
  {id:'udaipur',     title:'Udaipur City of Lakes',      state:'Rajasthan',       lat:24.58, lon:73.71, category:'Heritage',    rating:4.8, reviews:'3.8k',startsFrom:9500,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1568797629192-789acf8e4df3?w=600&q=80', tags:['Lake Palace','Romantic','Heritage','Boat Ride'], highlights:['Lake Pichola Boat','City Palace','Jag Mandir'], breakdown:{travel:3000,stay:4500,food:2000}, description:'The Venice of the East with stunning lake palaces, romantic sunsets and royal heritage.', bestMonths:'Sep–Mar'},
  {id:'jaisalmer',   title:'Jaisalmer Golden Fort',      state:'Rajasthan',       lat:26.91, lon:70.91, category:'Desert',      rating:4.7, reviews:'2.5k',startsFrom:8000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1524230576248-5c50d3ae4f3e?w=600&q=80', tags:['Golden Fort','Sand Dunes','Camel Safari','Desert Camp'], highlights:['Jaisalmer Fort','Sam Sand Dunes','Desert Camp'], breakdown:{travel:3000,stay:3500,food:1500}, description:'A golden fortress rising from the Thar Desert with camel safaris and desert camping.', bestMonths:'Oct–Mar'},
  {id:'pushkar',     title:'Pushkar Holy Lake',          state:'Rajasthan',       lat:26.48, lon:74.55, category:'Pilgrimage',  rating:4.5, reviews:'1.5k',startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80', tags:['Brahma Temple','Camel Fair','Holy Lake','Spiritual'], highlights:['Brahma Temple','Pushkar Lake','Camel Fair'], breakdown:{travel:1500,stay:1800,food:700}, description:'Home to the only Brahma temple in India and the famous Pushkar Camel Fair.', bestMonths:'Oct–Mar'},
  {id:'ranthambore', title:'Ranthambore Tiger Reserve',  state:'Rajasthan',       lat:26.01, lon:76.50, category:'Wildlife',    rating:4.7, reviews:'1.8k',startsFrom:9000,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1609619385002-f40f1df9b7f2?w=600&q=80', tags:['Tiger','Wildlife Safari','UNESCO','Photography'], highlights:['Tiger Zone Safari','Ranthambore Fort','Padam Lake'], breakdown:{travel:3000,stay:4500,food:1500}, description:'One of the best places in India to spot tigers in a stunning fort backdrop.', bestMonths:'Oct–Jun'},
  {id:'mount_abu',   title:'Mount Abu Hill Station',     state:'Rajasthan',       lat:24.59, lon:72.70, category:'Hill Stations',rating:4.4,reviews:'1.8k',startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Only Hill Station','Dilwara Temple','Nakki Lake','Sunset'], highlights:['Dilwara Jain Temples','Nakki Lake','Sunset Point'], breakdown:{travel:1800,stay:2200,food:1000}, description:"Rajasthan's only hill station with exquisite Dilwara Jain temples and cool climate.", bestMonths:'Oct–Jun'},
  {id:'bikaner',     title:'Bikaner Camel Festival',     state:'Rajasthan',       lat:28.01, lon:73.31, category:'Desert',      rating:4.3, reviews:'900', startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1524230576248-5c50d3ae4f3e?w=600&q=80', tags:['Camel Safari','Junagarh Fort','Camel Festival','Heritage'], highlights:['Junagarh Fort','Camel Research Centre','Karni Mata Temple'], breakdown:{travel:2000,stay:2500,food:1000}, description:'Famous for the Camel Festival, Junagarh Fort and the unique Karni Mata rat temple.', bestMonths:'Oct–Mar'},
  {id:'ajmer',       title:'Ajmer Sharif Dargah',        state:'Rajasthan',       lat:26.44, lon:74.63, category:'Pilgrimage',  rating:4.6, reviews:'3k',  startsFrom:2500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80', tags:['Dargah','Sufi','Pilgrimage','Ana Sagar Lake'],  highlights:['Dargah Khwaja Sahib','Ana Sagar Lake','Taragarh Fort'], breakdown:{travel:900,stay:1000,food:600}, description:'The revered Dargah of Hazrat Khwaja Moinuddin Chishti — a symbol of communal harmony.', bestMonths:'Oct–Mar'},
  {id:'chittorgarh', title:'Chittorgarh Fort',           state:'Rajasthan',       lat:24.88, lon:74.62, category:'Heritage',    rating:4.5, reviews:'1.2k',startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Largest Fort','Rani Padmini','Heritage','History'], highlights:['Chittorgarh Fort','Vijay Stambha','Rani Padmini Palace'], breakdown:{travel:1600,stay:2000,food:900}, description:"India's largest fort with tales of Rajput valor, sacrifice and the legendary Rani Padmini.", bestMonths:'Oct–Mar'},
  {id:'bharatpur',   title:'Bharatpur Bird Sanctuary',   state:'Rajasthan',       lat:27.21, lon:77.50, category:'Wildlife',    rating:4.5, reviews:'1.1k',startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Bird Watching','UNESCO','Migratory Birds','Cycling'], highlights:['Keoladeo Bird Sanctuary','Bharatpur Palace','Deeg Palace'], breakdown:{travel:1000,stay:1200,food:800}, description:'UNESCO World Heritage bird sanctuary home to over 370 species of migratory birds.', bestMonths:'Nov–Feb'},
  {id:'rann',        title:'Rann of Kutch',              state:'Gujarat',         lat:23.73, lon:69.86, category:'Desert',      rating:4.8, reviews:'2.2k',startsFrom:8000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1524230576248-5c50d3ae4f3e?w=600&q=80', tags:['White Desert','Rann Utsav','Culture','Kutch Craft'], highlights:['White Rann','Rann Utsav Festival','Mandvi Beach'], breakdown:{travel:3000,stay:3500,food:1500}, description:'The Great White Desert transforms into a magical moonlit landscape during Rann Utsav.', bestMonths:'Nov–Feb'},
  {id:'ahmedabad',   title:'Ahmedabad Sabarmati',        state:'Gujarat',         lat:23.02, lon:72.57, category:'Heritage',    rating:4.4, reviews:'2k',  startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tags:['Gandhi Ashram','Heritage Walk','Food Capital','Kite Festival'], highlights:['Sabarmati Ashram','Adalaj Stepwell','Calico Museum'], breakdown:{travel:1000,stay:1200,food:800}, description:"Gandhi's ashram, stepwells, world-class street food and the vibrant Kite Festival.", bestMonths:'Oct–Mar'},
  {id:'somnath',     title:'Somnath Jyotirlinga',        state:'Gujarat',         lat:20.88, lon:70.40, category:'Pilgrimage',  rating:4.8, reviews:'3.5k',startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Jyotirlinga','Coastal Temple','Pilgrimage','Sacred'], highlights:['Somnath Temple','Light & Sound Show','Bhalka Tirth'], breakdown:{travel:1500,stay:1800,food:1200}, description:'One of the 12 Jyotirlingas of Lord Shiva standing majestically by the Arabian Sea.', bestMonths:'Oct–Mar'},
  {id:'dwarka',      title:'Dwarka Krishna Dham',        state:'Gujarat',         lat:22.23, lon:68.96, category:'Pilgrimage',  rating:4.7, reviews:'2.8k',startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Krishna','Dwarkadhish','Char Dham','Sacred'],   highlights:['Dwarkadhish Temple','Bet Dwarka Island','Nageshwar Jyotirlinga'], breakdown:{travel:1400,stay:1600,food:1000}, description:"One of the Char Dhams — Lord Krishna's legendary city and ancient seat of his kingdom.", bestMonths:'Oct–Mar'},
  {id:'gir',         title:'Gir National Park',          state:'Gujarat',         lat:21.12, lon:70.82, category:'Wildlife',    rating:4.7, reviews:'1.8k',startsFrom:7500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Asiatic Lion','Only Lions','Safari','Wildlife'],  highlights:['Lion Safari','Kamleshwar Dam','Interpretation Zone'], breakdown:{travel:2500,stay:3500,food:1500}, description:'The only place on Earth where Asiatic Lions roam free in their natural habitat.', bestMonths:'Dec–Jun'},
  {id:'statue_unity',title:'Statue of Unity',            state:'Gujarat',         lat:21.83, lon:73.71, category:'Heritage',    rating:4.6, reviews:'3.5k',startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tags:['Worlds Tallest Statue','Valley of Flowers','Dam','Engineering'], highlights:['Statue of Unity','Flower Valley','Kevadia Colony'], breakdown:{travel:1200,stay:1500,food:800}, description:"World's tallest statue — a tribute to Sardar Vallabhbhai Patel amidst scenic Narmada.", bestMonths:'Oct–Mar'},
  {id:'mumbai',      title:'Mumbai City of Dreams',      state:'Maharashtra',     lat:19.07, lon:72.87, category:'City Tour',   rating:4.5, reviews:'8k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Gateway of India','Bollywood','Street Food','Marine Drive'], highlights:['Marine Drive','Elephanta Caves','Juhu Beach'], breakdown:{travel:2000,stay:2500,food:1500}, description:'The city that never sleeps — Bollywood, street food, beaches and the iconic Gateway.', bestMonths:'Oct–Feb'},
  {id:'pune',        title:'Pune City of Youth',         state:'Maharashtra',     lat:18.52, lon:73.85, category:'City Tour',   rating:4.3, reviews:'3k',  startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Osho Ashram','Shaniwar Wada','Cafes','Nightlife'], highlights:['Shaniwar Wada','Aga Khan Palace','Osho Ashram'], breakdown:{travel:1200,stay:1500,food:800}, description:'The Oxford of the East — vibrant cafe culture, nightlife and Maratha heritage.', bestMonths:'Oct–Feb'},
  {id:'ajanta',      title:'Ajanta Ellora Caves',        state:'Maharashtra',     lat:20.55, lon:75.70, category:'Heritage',    rating:4.8, reviews:'2.8k',startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['UNESCO','Rock Cut Caves','Buddhist Art','History'], highlights:['Ajanta Caves Paintings','Ellora 34 Caves','Bibi Ka Maqbara'], breakdown:{travel:1800,stay:2000,food:1200}, description:'34 UNESCO World Heritage cave temples with stunning Buddhist, Hindu and Jain art.', bestMonths:'Nov–Mar'},
  {id:'shirdi',      title:'Shirdi Sai Baba',            state:'Maharashtra',     lat:19.76, lon:74.47, category:'Pilgrimage',  rating:4.9, reviews:'7k',  startsFrom:3000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Sai Baba','Pilgrimage','Samadhi','Blessings'],   highlights:['Sai Baba Samadhi Temple','Dwarkamai Masjid','Chavadi'], breakdown:{travel:1000,stay:1200,food:800}, description:'The abode of Sai Baba — one of the most visited pilgrimage sites in India.', bestMonths:'All Year'},
  {id:'lonavala',    title:'Lonavala & Khandala',        state:'Maharashtra',     lat:18.75, lon:73.40, category:'Nature',      rating:4.4, reviews:'2.5k',startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Waterfalls','Chikki','Weekend Getaway','Trekking'], highlights:['Bhushi Dam','Tiger\'s Leap','Lohagad Fort'], breakdown:{travel:1200,stay:1500,food:800}, description:'The most popular weekend getaway from Mumbai and Pune with monsoon waterfalls.', bestMonths:'Jun–Sep'},
  {id:'mahabaleshwar',title:'Mahabaleshwar Strawberries',state:'Maharashtra',     lat:17.92, lon:73.65, category:'Hill Stations',rating:4.5,reviews:'2.2k',startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&q=80', tags:['Strawberry','Viewpoints','Waterfalls','Romantic'], highlights:['Venna Lake','Pratapgarh Fort','Wilson Point'], breakdown:{travel:2000,stay:2500,food:1000}, description:'Maharashtra hill station famous for strawberries, viewpoints and pleasant climate.', bestMonths:'Oct–Jun'},
  {id:'goa_north',   title:'North Goa Beach Vibes',      state:'Goa',             lat:15.55, lon:73.76, category:'Beaches',     rating:4.8, reviews:'6k',  startsFrom:6500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Baga','Calangute','Nightlife','Water Sports'],  highlights:['Baga Beach','Fort Aguada','Anjuna Flea Market'], breakdown:{travel:2000,stay:3000,food:1500}, description:'Party beaches, water sports, flea markets and the vibrant Goan nightlife scene.', bestMonths:'Nov–Mar'},
  {id:'goa_south',   title:'South Goa Serene Beaches',   state:'Goa',             lat:15.09, lon:73.93, category:'Beaches',     rating:4.9, reviews:'4.5k',startsFrom:8000,  intensity:'Premium',  image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Palolem','Cola Beach','Luxury Resorts','Peaceful'], highlights:['Palolem Beach','Butterfly Beach','Cotigao Wildlife'], breakdown:{travel:2500,stay:4000,food:1500}, description:'Pristine beaches, luxury resorts and peaceful vibes away from the tourist rush.', bestMonths:'Nov–Mar'},
  {id:'mysore',      title:'Mysore Palace City',         state:'Karnataka',       lat:12.29, lon:76.63, category:'Heritage',    rating:4.7, reviews:'4k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Palace','Dasara','Silk','Heritage'],            highlights:['Mysore Palace Illumination','Chamundi Hills','Brindavan Gardens'], breakdown:{travel:1800,stay:2000,food:1200}, description:'The City of Palaces with the magnificent illuminated Mysore Palace during Dasara.', bestMonths:'Oct–Feb'},
  {id:'coorg',       title:'Coorg Coffee Trail',         state:'Karnataka',       lat:12.33, lon:75.80, category:'Nature',      rating:4.6, reviews:'1.8k',startsFrom:7000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Coffee Estates','Waterfalls','Homestay','Misty Hills'], highlights:['Abbey Falls','Raja\'s Seat','Nagarhole Tiger Reserve'], breakdown:{travel:2500,stay:3200,food:1300}, description:'Scotland of India — misty coffee estates, waterfalls and Kodava culture.', bestMonths:'Oct–Mar'},
  {id:'hampi',       title:'Hampi Ruins',                state:'Karnataka',       lat:15.33, lon:76.46, category:'Heritage',    rating:4.8, reviews:'2.5k',startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a449?w=600&q=80', tags:['UNESCO Ruins','Vijayanagara','Boulders','Backpacker'], highlights:['Virupaksha Temple','Stone Chariot','Tungabhadra River'], breakdown:{travel:2000,stay:2500,food:1000}, description:'A surreal UNESCO World Heritage Site with ancient Vijayanagara Empire ruins amid boulders.', bestMonths:'Oct–Mar'},
  {id:'gokarna',     title:'Gokarna Beach Paradise',     state:'Karnataka',       lat:14.54, lon:74.31, category:'Beaches',     rating:4.7, reviews:'1.9k',startsFrom:5000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Om Beach','Hippie Vibe','Mahabaleshwara Temple','Trek'], highlights:['Om Beach','Kudle Beach','Mahabaleshwara Temple'], breakdown:{travel:1800,stay:2000,food:1200}, description:'A serene alternative to Goa with pristine beaches, temple town and hippie vibe.', bestMonths:'Oct–Mar'},
  {id:'munnar',      title:'Munnar Tea Gardens',         state:'Kerala',          lat:10.08, lon:77.05, category:'Nature',      rating:4.7, reviews:'2.5k',startsFrom:8000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', tags:['Tea Estates','Eravikulam','Cool Climate','Waterfalls'], highlights:['Tea Museum','Eravikulam National Park','Mattupetty Dam'], breakdown:{travel:2500,stay:3800,food:1700}, description:'Rolling hills covered with emerald tea gardens, misty valleys and rare Nilgiri Tahr.', bestMonths:'Sep–May'},
  {id:'alleppey',    title:'Alleppey Backwaters',        state:'Kerala',          lat:9.49,  lon:76.33, category:'Backwaters',  rating:4.8, reviews:'3.2k',startsFrom:9000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=600&q=80', tags:['Houseboat','Backwaters','Rice Fields','Sunset'],highlights:['Houseboat Cruise','Punnamada Lake','Vembanad Lake'], breakdown:{travel:3000,stay:4500,food:1500}, description:'Glide through Kerala backwaters on a luxury houseboat past paddy fields and coconut groves.', bestMonths:'Aug–Mar'},
  {id:'varkala',     title:'Varkala Cliff Beach',        state:'Kerala',          lat:8.73,  lon:76.71, category:'Beaches',     rating:4.7, reviews:'1.5k',startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', tags:['Cliff Beach','Ayurveda','Yoga','Papanasam Beach'], highlights:['Varkala Cliff Walk','Janardanaswami Temple','Ayurveda Spa'], breakdown:{travel:2000,stay:2800,food:1200}, description:'Dramatic red cliffs, beach cafes and Kerala ayurveda treatments all in one place.', bestMonths:'Oct–Mar'},
  {id:'wayanad',     title:'Wayanad Tribal Hills',       state:'Kerala',          lat:11.60, lon:76.08, category:'Nature',      rating:4.6, reviews:'1.4k',startsFrom:6500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Tribal Culture','Waterfalls','Tea','Wildlife'], highlights:['Edakkal Caves','Chembra Peak','Soochipara Waterfalls'], breakdown:{travel:2200,stay:3000,food:1300}, description:'Lush green hills, ancient Edakkal Caves and unique tribal heritage of Kerala.', bestMonths:'Oct–May'},
  {id:'madurai',     title:'Madurai Meenakshi Temple',   state:'Tamil Nadu',      lat:9.92,  lon:78.11, category:'Pilgrimage',  rating:4.8, reviews:'4.5k',startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Meenakshi Amman','Gopuram','South India Temple','Pilgrimage'], highlights:['Meenakshi Amman Temple','Thirumalai Nayakkar Palace','Gandhi Museum'], breakdown:{travel:1500,stay:1800,food:700}, description:'The 2500-year-old temple city with the stunning Meenakshi Amman temple gopurams.', bestMonths:'Oct–Mar'},
  {id:'ooty',        title:'Ooty Nilgiri Hills',         state:'Tamil Nadu',      lat:11.41, lon:76.69, category:'Hill Stations',rating:4.5,reviews:'2.8k',startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=600&q=80', tags:['Toy Train','Tea Gardens','Botanical Garden','Cool Climate'], highlights:['Nilgiri Toy Train','Ooty Botanical Garden','Doddabetta Peak'], breakdown:{travel:2000,stay:2800,food:1200}, description:'Queen of the Nilgiris with UNESCO Toy Train, tea gardens and pleasant weather.', bestMonths:'Mar–Jun'},
  {id:'rameshwaram', title:'Rameshwaram Sacred Island',  state:'Tamil Nadu',      lat:9.28,  lon:79.31, category:'Pilgrimage',  rating:4.8, reviews:'4k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Ramanathaswamy','Char Dham','Sacred Baths','Pamban Bridge'], highlights:['Ramanathaswamy Temple','Agni Theertham','Pamban Bridge'], breakdown:{travel:2000,stay:2000,food:1000}, description:'Sacred island connected by the iconic Pamban Bridge — one of the Char Dhams.', bestMonths:'Oct–Apr'},
  {id:'pondicherry', title:'Pondicherry French Colony',  state:'Puducherry',      lat:11.93, lon:79.83, category:'City Tour',   rating:4.6, reviews:'2.5k',startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['French Quarter','Auroville','Promenade Beach','Cafes'], highlights:['French Quarter Walk','Auroville Matrimandir','Sri Aurobindo Ashram'], breakdown:{travel:1800,stay:2200,food:1000}, description:'A slice of France in India with colorful villas, Auroville and beachside cafes.', bestMonths:'Oct–Mar'},
  {id:'tirupati',    title:'Tirupati Balaji Temple',     state:'Andhra Pradesh',  lat:13.63, lon:79.41, category:'Pilgrimage',  rating:4.9, reviews:'9k',  startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Venkateshwara','Richest Temple','Laddu','Holy Dip'], highlights:['Tirumala Venkateswara Temple','Sri Vari Museum','Akasaganga Teertham'], breakdown:{travel:1200,stay:1500,food:800}, description:"The world's richest temple and most visited pilgrimage destination in India.", bestMonths:'All Year'},
  {id:'hyderabad',   title:'Hyderabad City of Nawabs',   state:'Telangana',       lat:17.38, lon:78.48, category:'City Tour',   rating:4.5, reviews:'4k',  startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Biryani','Charminar','Golconda Fort','Pearl'],  highlights:['Charminar','Golconda Fort Light Show','Salar Jung Museum'], breakdown:{travel:1500,stay:2000,food:1500}, description:'The City of Pearls with world-famous biryani, Charminar and Golconda Fort.', bestMonths:'Oct–Feb'},
  {id:'puri',        title:'Puri Jagannath Dham',        state:'Odisha',          lat:19.80, lon:85.82, category:'Pilgrimage',  rating:4.8, reviews:'4.5k',startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Jagannath Temple','Char Dham','Rath Yatra','Beach'], highlights:['Jagannath Temple','Puri Beach','Konark Sun Temple'], breakdown:{travel:1500,stay:1800,food:700}, description:'One of the four Char Dhams with the magnificent Rath Yatra and golden beach.', bestMonths:'Oct–Jun'},
  {id:'konark',      title:'Konark Sun Temple',          state:'Odisha',          lat:19.88, lon:86.09, category:'Heritage',    rating:4.7, reviews:'1.8k',startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Sun Temple','UNESCO','Architecture','Rath Yatra'], highlights:['Sun Temple','Chandrabhaga Beach','Puri Jagannath'], breakdown:{travel:1600,stay:2000,food:900}, description:'A UNESCO masterpiece — the 13th century Sun Temple built as a giant chariot.', bestMonths:'Oct–Mar'},
  {id:'darjeeling',  title:'Darjeeling Tea Capital',     state:'West Bengal',     lat:27.03, lon:88.26, category:'Hill Stations',rating:4.7,reviews:'3k',  startsFrom:7500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', tags:['Toy Train','Tea Gardens','Kanchenjunga View','Tiger Hill'], highlights:['Tiger Hill Sunrise','Darjeeling Himalayan Railway','Tea Garden Tour'], breakdown:{travel:2500,stay:3500,food:1500}, description:'Watch Kanchenjunga at sunrise from Tiger Hill and ride the Darjeeling Toy Train.', bestMonths:'Mar–May & Sep–Nov'},
  {id:'sikkim',      title:'Sikkim Gangtok Nathula',     state:'Sikkim',          lat:27.32, lon:88.61, category:'Hill Stations',rating:4.7,reviews:'2k',  startsFrom:10000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', tags:['Nathula Pass','Kanchenjunga','Rumtek Monastery','Orchids'], highlights:['Nathula Pass','Rumtek Monastery','MG Marg Gangtok'], breakdown:{travel:3500,stay:5000,food:1500}, description:'Buddhist monasteries, the Nathula Pass border crossing and Himalayan landscapes.', bestMonths:'Mar–Jun & Sep–Dec'},
  {id:'kaziranga',   title:'Kaziranga One Horn Rhino',   state:'Assam',           lat:26.57, lon:93.17, category:'Wildlife',    rating:4.7, reviews:'1.4k',startsFrom:12000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1549366021-9f761d450615?w=600&q=80', tags:['One Horned Rhino','UNESCO','Elephant Safari','Tiger'], highlights:['Jeep Safari Central Range','Elephant Back Safari','Kaziranga Orchid Park'], breakdown:{travel:4500,stay:6000,food:1500}, description:'UNESCO World Heritage Site — home to the highest density of one-horned rhinos.', bestMonths:'Nov–Apr'},
  {id:'shillong',    title:'Shillong Scotland of East',  state:'Meghalaya',       lat:25.57, lon:91.88, category:'Hill Stations',rating:4.6,reviews:'1.5k',startsFrom:7000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&q=80', tags:['Khasi Culture','Waterfalls','Caves','Cleanest Village'], highlights:['Cherrapunji Waterfalls','Mawsmai Cave','Dawki Crystal River'], breakdown:{travel:2500,stay:3000,food:1500}, description:'The Scotland of the East with living root bridges, crystal-clear Dawki River and waterfalls.', bestMonths:'Sep–May'},
  {id:'cherrapunji', title:'Cherrapunji Living Roots',   state:'Meghalaya',       lat:25.28, lon:91.72, category:'Nature',      rating:4.7, reviews:'1.2k',startsFrom:6000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80', tags:['Wettest Place','Living Root Bridges','Waterfalls','Trek'], highlights:['Nohkalikai Falls','Double Decker Root Bridge','Dawki River'], breakdown:{travel:2000,stay:3000,food:1000}, description:'Home to the Double Decker Living Root Bridge and Nohkalikai — India\'s tallest waterfall.', bestMonths:'Sep–May'},
  {id:'leh',         title:'Leh Ladakh Adventure',       state:'Ladakh',          lat:34.15, lon:77.57, category:'Adventure',   rating:4.9, reviews:'4.2k',startsFrom:20000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600&q=80', tags:['Pangong Lake','Monasteries','Bike Trip','High Altitude'], highlights:['Pangong Tso','Nubra Valley','Magnetic Hill'], breakdown:{travel:8000,stay:7000,food:5000}, description:'The crown jewel of India — monasteries, lakes and the highest motorable roads on Earth.', bestMonths:'Jun–Sep'},
  {id:'khajuraho',   title:'Khajuraho Temple Art',       state:'Madhya Pradesh',  lat:24.85, lon:79.92, category:'Heritage',    rating:4.7, reviews:'2k',  startsFrom:5000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['UNESCO','Erotic Temples','Medieval Art','Chandela'], highlights:['Western Group Temples','Eastern Group','Kandariya Mahadev'], breakdown:{travel:1800,stay:2200,food:1000}, description:'UNESCO World Heritage medieval temples with extraordinary sculptural art of the Chandela dynasty.', bestMonths:'Oct–Mar'},
  {id:'bandhavgarh', title:'Bandhavgarh Tiger Reserve',  state:'Madhya Pradesh',  lat:23.72, lon:81.02, category:'Wildlife',    rating:4.8, reviews:'1.6k',startsFrom:10000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1609619385002-f40f1df9b7f2?w=600&q=80', tags:['Highest Tiger Density','Jungle Safari','White Tigers','Nature'], highlights:['Tala Zone Safari','Bandhavgarh Fort','Shesh Shaiya'], breakdown:{travel:3000,stay:5500,food:1500}, description:'Highest tiger density in India — your best chance to spot a wild Royal Bengal Tiger.', bestMonths:'Oct–Jun'},
  {id:'bodh_gaya',   title:'Bodh Gaya Enlightenment',    state:'Bihar',           lat:24.69, lon:84.99, category:'Pilgrimage',  rating:4.9, reviews:'3.5k',startsFrom:3500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Buddha Enlightenment','Mahabodhi Temple','UNESCO','Buddhist Circuit'], highlights:['Mahabodhi Temple','Bodhi Tree','Thai Temple'], breakdown:{travel:1200,stay:1500,food:800}, description:'The most sacred Buddhist site where Gautama Buddha attained enlightenment under the Bodhi Tree.', bestMonths:'Oct–Mar'},
  {id:'andaman',     title:'Andaman Islands Paradise',   state:'Andaman & Nicobar',lat:11.74,lon:92.65, category:'Beaches',    rating:4.9, reviews:'4.2k',startsFrom:22000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600&q=80', tags:['Radhanagar Beach','Scuba Diving','Cellular Jail','Snorkeling'], highlights:['Radhanagar Beach','Cellular Jail','Neil Island','Havelock'], breakdown:{travel:12000,stay:7000,food:3000}, description:'Asia\'s best beach, crystal clear waters, scuba diving and the historic Cellular Jail.', bestMonths:'Oct–May'},
  {id:'lakshadweep', title:'Lakshadweep Coral Islands',  state:'Lakshadweep',     lat:10.56, lon:72.64, category:'Beaches',     rating:4.8, reviews:'800', startsFrom:25000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600&q=80', tags:['Coral Reef','Kayaking','Lagoon','Remote Island'], highlights:['Agatti Island','Glass Bottom Boat','Snorkeling Lagoon'], breakdown:{travel:15000,stay:8000,food:2000}, description:'A pristine archipelago of coral atolls with turquoise lagoons and untouched marine life.', bestMonths:'Oct–May'},
  {id:'kochi',       title:'Kochi Fort & Backwaters',    state:'Kerala',          lat:9.93,  lon:76.26, category:'City Tour',   rating:4.5, reviews:'3k',  startsFrom:5500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Chinese Fishing Nets','Fort Kochi','Jewish Synagogue','Heritage'], highlights:['Fort Kochi Chinese Nets','Mattancherry Palace','Kerala Cuisine'], breakdown:{travel:2000,stay:2500,food:1000}, description:'A historic port city with Chinese fishing nets, colonial heritage and Kerala cuisine.', bestMonths:'Oct–Mar'},
  {id:'kolkata',     title:'Kolkata City of Joy',        state:'West Bengal',     lat:22.57, lon:88.36, category:'City Tour',   rating:4.4, reviews:'4k',  startsFrom:4000,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tags:['Victoria Memorial','Durga Puja','Street Food','Cultural'], highlights:['Victoria Memorial','Howrah Bridge','Park Street'], breakdown:{travel:1500,stay:2000,food:1500}, description:'The cultural capital of India — Durga Puja, street food, art and intellectual heritage.', bestMonths:'Oct–Mar'},
  {id:'sundarbans',  title:'Sundarbans Tiger Delta',     state:'West Bengal',     lat:21.94, lon:88.87, category:'Wildlife',    rating:4.6, reviews:'1.2k',startsFrom:8000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Royal Bengal Tiger','Mangrove','UNESCO','Boat Safari'], highlights:['Tiger Census Boat Safari','Sajnekhali Wildlife Sanctuary','Sudhanyakhali Watch Tower'], breakdown:{travel:3000,stay:4000,food:1000}, description:'The world\'s largest mangrove forest — home to Royal Bengal Tigers and Irrawaddy Dolphins.', bestMonths:'Oct–Mar'},
  {id:'arunachal',   title:'Arunachal Tawang Monastery', state:'Arunachal Pradesh',lat:27.58,lon:91.86, category:'Spiritual',   rating:4.7, reviews:'800', startsFrom:15000, intensity:'Premium',  image:'https://images.unsplash.com/photo-1583082824910-f7b3c3e71ae3?w=600&q=80', tags:['Largest Monastery','Sela Pass','Tibetan Culture','Snow'], highlights:['Tawang Monastery','Sela Pass','Bum La Pass'], breakdown:{travel:6000,stay:6000,food:3000}, description:'Asia\'s second largest monastery amid snow-capped peaks and the dramatic Sela Pass.', bestMonths:'Mar–Oct'},
  {id:'orchha',      title:'Orchha Forgotten Kingdom',   state:'Madhya Pradesh',  lat:25.35, lon:78.64, category:'Heritage',    rating:4.6, reviews:'1k',  startsFrom:4500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Medieval Temples','Cenotaphs','Betwa River','Heritage'], highlights:['Orchha Fort','Ram Raja Temple','Chaturbhuj Temple'], breakdown:{travel:1600,stay:2000,food:900}, description:'A forgotten Bundela kingdom with magnificent forts and cenotaphs on the Betwa River.', bestMonths:'Oct–Mar'},
  {id:'thekkady',    title:'Thekkady Periyar Wildlife',  state:'Kerala',          lat:9.59,  lon:77.16, category:'Wildlife',    rating:4.6, reviews:'1.8k',startsFrom:7500,  intensity:'Standard', image:'https://images.unsplash.com/photo-1602491453979-53a9d167599c?w=600&q=80', tags:['Periyar Tiger Reserve','Spice Garden','Boat Safari','Elephant'], highlights:['Periyar Lake Boat Safari','Spice Plantation','Tribal Heritage'], breakdown:{travel:2500,stay:3500,food:1500}, description:'Periyar Tiger Reserve with boat safaris on the lake and aromatic spice plantations.', bestMonths:'Oct–Jun'},
  {id:'kanyakumari', title:'Kanyakumari Land\'s End',    state:'Tamil Nadu',      lat:8.07,  lon:77.55, category:'Pilgrimage',  rating:4.7, reviews:'2.8k',startsFrom:4500,  intensity:'Budget',   image:'https://images.unsplash.com/photo-1609766418204-94aae0ecfdfc?w=600&q=80', tags:['Sunrise & Sunset','Vivekananda Rock','Three Seas Meet','Memorial'], highlights:['Vivekananda Rock Memorial','Thiruvalluvar Statue','Kumari Amman Temple'], breakdown:{travel:1800,stay:1800,food:900}, description:'The southernmost tip of India where three seas meet — witness both sunrise and sunset.', bestMonths:'Oct–Mar'},
  {id:'mahabalipuram',title:'Mahabalipuram Shore Temple',state:'Tamil Nadu',      lat:12.61, lon:80.19, category:'Heritage',    rating:4.6, reviews:'1.8k',startsFrom:4000,  intensity:'Standard', image:'https://images.unsplash.com/photo-1477584322402-2869ec11a149?w=600&q=80', tags:['Shore Temple','UNESCO','Beach','Sculpture'],   highlights:['Shore Temple','Pancha Rathas','Krishna\'s Butter Ball'], breakdown:{travel:1500,stay:1800,food:700}, description:'UNESCO World Heritage Pallava temples with stunning rock-cut sculptures by the sea.', bestMonths:'Oct–Mar'},
];

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
  const [sortBy,      setSortBy]      = useState('popular');
  const [locLoading,  setLocLoading]  = useState(false);
  const [userCoords,  setUserCoords]  = useState(null);
  const [cityName,    setCityName]    = useState('');
  const [expanded,    setExpanded]    = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [activating,  setActivating]  = useState(false);
  const [syncModal,   setSyncModal]   = useState(null); // trip object

  useEffect(() => { if (profile?.id) loadFriends(profile.id); }, [profile?.id]);

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

          {/* ✅ Create Group Button */}
          <TouchableOpacity
            style={s.createGroupBtn}
            onPress={() => handleCreateGroup(trip)}
          >
            <Text style={s.createGroupBtnText}>👥 Create Group & Split Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.launchBtn} onPress={() => setSyncModal(trip)}>
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
          <Text style={s.locBannerText}>📍 Allow Location — Sort {ALL_TRIPS.length} trips nearest to you (up to 2000 km)</Text>
          {locLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: COLORS.gold, fontWeight:'800', fontSize:13 }}>Allow →</Text>}
        </TouchableOpacity>
      ) : (
        <View style={s.locActive}>
          <Text style={s.locActiveText}>📍 Sorted from <Text style={{ fontWeight:'800' }}>{cityName}</Text> — {filtered.length} trips within 2000 km</Text>
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
