import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatMoney, formatDate } from '../logic/calculations';

export default function SummaryResult({ result }) {
  const {
    ultimaData,
    resumo,
    totalEntradasRealizado,
    limiteProporcional,
    totalIgnorado,
    totalRedistribuir,
    ultrapassou,
  } = result;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Controle de Teto (Entradas) até {formatDate(ultimaData)}</Text>

      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell, { flex: 1.3 }]}>Mês/Ano</Text>
          <Text style={[styles.cell, styles.headerCell]}>Entradas</Text>
          <Text style={[styles.cell, styles.headerCell]}>Saídas</Text>
          <Text style={[styles.cell, styles.headerCell]}>Saldo</Text>
        </View>
        {resumo.map((r) => (
          <View style={styles.row} key={r.mesAno}>
            <Text style={[styles.cell, { flex: 1.3 }]}>{r.mesAno}</Text>
            <Text style={styles.cell}>{formatMoney(r.entradas)}</Text>
            <Text style={styles.cell}>{formatMoney(r.saidas)}</Text>
            <Text style={styles.cell}>{formatMoney(r.saldoMensal)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.stats}>
        <StatRow label="Total Entradas (Vendas Reais)" value={formatMoney(totalEntradasRealizado)} />
        <StatRow label="Limite Acumulado até hoje" value={formatMoney(limiteProporcional)} />
        <StatRow label="Total ignorado no teto (CDB / transferências internas)" value={formatMoney(totalIgnorado)} />
      </View>

      <View
        style={[
          styles.alertBox,
          {
            backgroundColor: ultrapassou ? '#FDECEA' : '#E9F7EF',
            borderColor: ultrapassou ? '#E74C3C' : '#27AE60',
          },
        ]}
      >
        {ultrapassou ? (
          <>
            <Text style={[styles.alertTitle, { color: '#C0392B' }]}>
              ATENÇÃO: Você ultrapassou o limite proporcional!
            </Text>
            <Text style={styles.alertText}>
              Valor excedente para redistribuir: {formatMoney(totalRedistribuir)}
            </Text>
            <Text style={styles.alertHint}>
              Dica: Reduza as entradas nos próximos meses para não estourar os 81k.
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.alertTitle, { color: '#1E8449' }]}>
              DENTRO DO LIMITE: Você está abaixo do teto proporcional.
            </Text>
            <Text style={styles.alertText}>
              Margem de segurança atual: {formatMoney(Math.abs(totalRedistribuir))}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

function StatRow({ label, value }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 12, color: '#222' },
  table: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerRow: { backgroundColor: '#F5F5F5' },
  cell: { flex: 1, padding: 8, fontSize: 12, color: '#333' },
  headerCell: { fontWeight: '700' },
  stats: { marginBottom: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  statLabel: { fontSize: 13, color: '#555', flex: 1 },
  statValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  alertBox: { borderWidth: 1, borderRadius: 8, padding: 12 },
  alertTitle: { fontWeight: '700', fontSize: 14, marginBottom: 4 },
  alertText: { fontSize: 13, color: '#333' },
  alertHint: { fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' },
});
