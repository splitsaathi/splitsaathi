import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const COLORS_LIST = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];

export default function Avatar({ name = '?', size = 36, uri = null }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' }}
      />
    );
  }
  const color = COLORS_LIST[(name.charCodeAt(0) || 0) % COLORS_LIST.length];
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.letter, { fontSize: Math.floor(size * 0.4) }]}>{name[0]?.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' },
  letter: { color: '#fff', fontWeight: '700' },
});

