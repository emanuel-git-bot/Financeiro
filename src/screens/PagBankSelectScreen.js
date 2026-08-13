import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import BankCard from '../components/BankCard';

export default function PagBankSelectScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>PagBank</Text>
        <Text style={styles.subtitle}>Qual conta você quer atualizar?</Text>

        <View style={{ marginTop: 24 }}>
          <BankCard
            label="PagBank Empresa"
            color="#FFA300"
            subtitle="Conta empresarial"
            onPress={() => navigation.navigate('Account', { accountId: 'pagbank-empresa' })}
          />
          <BankCard
            label="PagBank Pessoal"
            color="#FFC24D"
            subtitle="Conta pessoal"
            onPress={() => navigation.navigate('Account', { accountId: 'pagbank-pessoal' })}
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
