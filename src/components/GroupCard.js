import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function GroupCard({ group, memberCount, billCount, net, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
        <View style={styles.iconBox}><Text style={{ fontSize:22 }}>{group.icon}</Text></View>
        <View>
          <Text style={styles.name}>{group.name}</Text>
          <Text style={styles.meta}>{memberCount} members · {billCount} bills</Text>
        </View>
      </View>
      <View style={{ alignItems:'flex-end' }}>
        {net !== 0 && (
          <Text style={[styles.net, { color: net > 0 ? COLORS.primary : COLORS.danger }]}>
            {net > 0 ? '+' : ''}{net.toFixed(2)}
          </Text>
        )}
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor: COLORS.surface, borderRadius:14, padding:16, paddingHorizontal:18, borderWidth:1, borderColor: COLORS.border, flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  iconBox: { width:44, height:44, backgroundColor:'rgba(99,102,241,0.15)', borderRadius:12, alignItems:'center', justifyContent:'center' },
  name:    { color: COLORS.text, fontWeight:'700', fontSize:15 },
  meta:    { color: COLORS.textMuted, fontSize:12, marginTop:2 },
  net:     { fontWeight:'700', fontSize:15 },
  arrow:   { color: COLORS.textDisabled, fontSize:11 },
});
