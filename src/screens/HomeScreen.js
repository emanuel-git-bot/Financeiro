import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import BankCard from '../components/BankCard';
import { useUser } from '../context/UserContext';

export default function HomeScreen({ navigation }) {
  const { user, setUser } = useUser();

  const switchUser = () => {
    setUser(null);
    navigation.reset({ index: 0, routes: [{ name: 'ProfileSelect' }] });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Controle Financeiro</Text>
            <Text style={styles.subtitle}>Perfil: {user?.name}</Text>
          </View>
          <TouchableOpacity onPress={switchUser}>
            <Text style={styles.switchLink}>Trocar usuário</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 24 }}>
          <BankCard
            label="PicPay"
            color="#21C25E"
            subtitle="Extrato .xlsx ou .csv"
            onPress={() => navigation.navigate('Account', { accountId: 'picpay' })}
          />
          <BankCard
            label="PagBank"
            color="#FFA300"
            subtitle="Empresa ou pessoal"
            onPress={() => navigation.navigate('PagBankSelect')}
          />
          <BankCard
            label="Dashboard"
            color="#3498DB"
            subtitle="Ver resumo de todos os bancos salvos"
            onPress={() => navigation.navigate('Dashboard')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { flex: 1, padding: 24, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  switchLink: { fontSize: 12, color: '#3498DB', fontWeight: '600', marginTop: 6 },
});
