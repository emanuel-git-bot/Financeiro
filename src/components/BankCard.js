import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export default function BankCard({ label, color, onPress, subtitle }) {
  return (
    <TouchableOpacity style={[styles.card, { borderColor: color }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 14 },
  label: { fontSize: 17, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 12, color: '#777', marginTop: 2 },
});
