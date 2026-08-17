import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import BankCard from '../components/BankCard';
import { useUser } from '../context/UserContext';
import { getAccounts, removeAccount } from '../storage/db';

export default function HomeScreen({ navigation }) {
  const { user, setUser } = useUser();
  const [accounts, setAccounts] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setAccounts(await getAccounts(user.id));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const switchUser = () => {
    setUser(null);
    navigation.reset({ index: 0, routes: [{ name: 'ProfileSelect' }] });
  };

  const handleRemoveAccount = useCallback(
    (acc) => {
      Alert.alert('Remover banco', `Remover "${acc.label}" e todos os dados salvos dele?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await removeAccount(user.id, acc.id);
            load();
          },
        },
      ]);
    },
    [user, load]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
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
          {accounts && accounts.length > 0 ? (
            accounts.map((acc) => (
              <BankCard
                key={acc.id}
                label={acc.label}
                color={acc.color}
                subtitle={acc.bankType === 'ofx' ? 'Via arquivo .ofx · segure para remover' : 'Segure para remover'}
                onPress={() => navigation.navigate('Account', { accountId: acc.id })}
                onLongPress={() => handleRemoveAccount(acc)}
              />
            ))
          ) : accounts ? (
            <Text style={styles.emptyText}>Nenhum banco adicionado ainda. Toque em "Adicionar banco" abaixo.</Text>
          ) : null}

          <BankCard
            label="Adicionar banco"
            color="#333"
            subtitle="PicPay, PagBank, Nubank ou outro via .ofx"
            onPress={() => navigation.navigate('AddBank')}
          />

          <BankCard
            label="Dashboard"
            color="#3498DB"
            subtitle="Ver resumo de todos os bancos salvos"
            onPress={() => navigation.navigate('Dashboard')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { padding: 24, paddingTop: 40, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  switchLink: { fontSize: 12, color: '#3498DB', fontWeight: '600', marginTop: 6 },
  emptyText: { fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 16 },
});
