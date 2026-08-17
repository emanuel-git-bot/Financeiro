import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ScrollView } from 'react-native';
import { useUser } from '../context/UserContext';
import { getAccounts, addAccount, BANK_TEMPLATES } from '../storage/db';

const OFX_COLORS = ['#3498DB', '#1ABC9C', '#E67E22', '#9B59B6', '#16A085', '#2980B9'];
function colorForName(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % OFX_COLORS.length;
  return OFX_COLORS[hash];
}

export default function AddBankScreen({ navigation }) {
  const { user } = useUser();
  const [existingIds, setExistingIds] = useState([]);
  const [customName, setCustomName] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const accounts = await getAccounts(user.id);
    setExistingIds(accounts.map((a) => a.id));
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const handleAddTemplate = useCallback(
    async (template) => {
      await addAccount(user.id, template);
      navigation.navigate('Account', { accountId: template.id });
    },
    [user, navigation]
  );

  const handleAddCustomOfx = useCallback(async () => {
    const name = customName.trim();
    if (!name || !user) return;
    const id = `ofx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const account = { id, bankType: 'ofx', variant: null, label: name, color: colorForName(name) };
    await addAccount(user.id, account);
    setCustomName('');
    navigation.navigate('Account', { accountId: id });
  }, [customName, user, navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Adicionar banco</Text>
        <Text style={styles.sectionLabel}>Bancos com suporte pronto</Text>

        {BANK_TEMPLATES.map((tpl) => {
          const added = existingIds.includes(tpl.id);
          return (
            <TouchableOpacity
              key={tpl.id}
              style={[styles.card, { borderColor: tpl.color }, added && styles.cardAdded]}
              onPress={() =>
                added ? navigation.navigate('Account', { accountId: tpl.id }) : handleAddTemplate(tpl)
              }
            >
              <View style={[styles.dot, { backgroundColor: tpl.color }]} />
              <Text style={styles.cardLabel}>{tpl.label}</Text>
              <Text style={styles.cardAction}>{added ? 'Já adicionado ›' : '+ Adicionar'}</Text>
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Outro banco (via arquivo .ofx)</Text>
        <Text style={styles.hint}>
          Pra bancos que ainda não têm um parser específico aqui, mas que exportam extrato em .ofx — formato
          padrão que a maioria dos bancos oferece. Só dar um nome pra identificar a conta.
        </Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customName}
            onChangeText={setCustomName}
            placeholder="ex: Itaú, Bradesco, Inter..."
            placeholderTextColor="#999"
            onSubmitEditing={handleAddCustomOfx}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.customButton} onPress={handleAddCustomOfx}>
            <Text style={styles.customButtonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { padding: 24, paddingTop: 32, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 20, marginBottom: 12 },
  hint: { fontSize: 12, color: '#888', marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  cardAdded: { opacity: 0.6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  cardLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#222' },
  cardAction: { fontSize: 12, color: '#3498DB', fontWeight: '600' },
  customRow: { flexDirection: 'row', alignItems: 'center' },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  customButton: {
    marginLeft: 10,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    justifyContent: 'center',
  },
  customButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
