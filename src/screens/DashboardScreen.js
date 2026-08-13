import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { getAccounts, getTransactions } from '../storage/db';
import { computeSummary, formatMoney, formatDate } from '../logic/calculations';

export default function DashboardScreen({ navigation }) {
  const { user } = useUser();
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    const accounts = await getAccounts(user.id);
    const perAccount = await Promise.all(
      accounts.map(async (acc) => {
        const rows = await getTransactions(user.id, acc.id);
        let summary = null;
        if (rows.length > 0) {
          try {
            summary = computeSummary(rows, { extraIgnoreKeywords: acc.ignoreKeywords ?? [] });
          } catch {
            summary = null;
          }
        }
        return { account: acc, rows, summary };
      })
    );

    // "Todos os bancos": junta as transações de todas as contas e roda o mesmo
    // cálculo do teto sobre o conjunto combinado (não é só somar os resumos
    // individuais — a última data e o número de meses completos passam a
    // considerar o histórico de todas as contas juntas).
    const allRows = perAccount.flatMap(({ rows }) => rows);
    const allKeywords = Array.from(new Set(perAccount.flatMap(({ account }) => account.ignoreKeywords ?? [])));

    let combined = null;
    if (allRows.length > 0) {
      try {
        combined = computeSummary(allRows, { extraIgnoreKeywords: allKeywords });
      } catch {
        combined = null;
      }
    }

    setItems(perAccount.map(({ account, summary }) => ({ account, summary })));
    setTotal(combined);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!items) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumo de todos os bancos salvos de {user?.name}</Text>

        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>Todos os bancos (soma)</Text>
          {total ? (
            <>
              <Text style={styles.totalLine}>
                Entradas acumuladas: <Text style={styles.totalBold}>{formatMoney(total.totalEntradasRealizado)}</Text>
              </Text>
              <Text style={styles.totalLine}>
                Limite acumulado: <Text style={styles.totalBold}>{formatMoney(total.limiteProporcional)}</Text>
              </Text>
              <Text style={[styles.statusTag, { color: total.ultrapassou ? '#FF8A80' : '#7CE0B3' }]}>
                {total.ultrapassou ? 'Ultrapassou o limite' : 'Dentro do limite'}
              </Text>
              <Text style={styles.totalFooter}>Atualizado até {formatDate(total.ultimaData)}</Text>
            </>
          ) : (
            <Text style={styles.totalEmptyText}>Nenhum dado salvo ainda em nenhuma conta.</Text>
          )}
        </View>

        {items.map(({ account, summary }) => (
          <TouchableOpacity
            key={account.id}
            style={[styles.card, { borderColor: account.color }]}
            onPress={() => navigation.navigate('Account', { accountId: account.id })}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.dot, { backgroundColor: account.color }]} />
              <Text style={styles.cardTitle}>{account.label}</Text>
            </View>

            {summary ? (
              <>
                <Text style={styles.cardLine}>
                  Entradas acumuladas: <Text style={styles.bold}>{formatMoney(summary.totalEntradasRealizado)}</Text>
                </Text>
                <Text style={styles.cardLine}>
                  Limite acumulado: <Text style={styles.bold}>{formatMoney(summary.limiteProporcional)}</Text>
                </Text>
                <Text style={[styles.statusTag, { color: summary.ultrapassou ? '#C0392B' : '#1E8449' }]}>
                  {summary.ultrapassou ? 'Ultrapassou o limite' : 'Dentro do limite'}
                </Text>
                <Text style={styles.cardFooter}>Atualizado até {formatDate(summary.ultimaData)}</Text>
              </>
            ) : (
              <Text style={styles.emptyText}>Nenhum dado salvo ainda — toque para importar um extrato.</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { padding: 24, paddingTop: 32, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 20 },
  totalCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    backgroundColor: '#1C1C1E',
  },
  totalTitle: { fontSize: 13, fontWeight: '700', color: '#BBB', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalLine: { fontSize: 14, color: '#DDD', marginTop: 8 },
  totalBold: { fontWeight: '800', color: '#fff', fontSize: 16 },
  totalFooter: { fontSize: 11, color: '#999', marginTop: 6 },
  totalEmptyText: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 8 },
  card: { borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 16, backgroundColor: '#fff' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  cardLine: { fontSize: 13, color: '#555', marginTop: 2 },
  bold: { fontWeight: '700', color: '#111' },
  statusTag: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  cardFooter: { fontSize: 11, color: '#999', marginTop: 4 },
  emptyText: { fontSize: 12, color: '#888', fontStyle: 'italic' },
});
