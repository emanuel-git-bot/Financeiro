import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import BankCard from '../components/BankCard';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Controle Financeiro</Text>
        <Text style={styles.subtitle}>Selecione o banco para analisar o extrato</Text>

        <View style={{ marginTop: 24 }}>
          <BankCard
            label="PicPay"
            color="#21C25E"
            subtitle="Extrato .xlsx ou .csv"
            onPress={() => navigation.navigate('PicPay')}
          />
          <BankCard
            label="PagBank"
            color="#FFA300"
            subtitle="Extrato .xlsx"
            onPress={() => navigation.navigate('PagBank')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { flex: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 6 },
});
