import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useUser } from '../context/UserContext';
import { getAccounts, updateAccount, getTransactions, mergeTransactions, clearTransactions } from '../storage/db';
import { computeSummary } from '../logic/calculations';
import { parsePicPayFile } from '../logic/picpayParser';
import { parsePagBankFile } from '../logic/pagbankParser';
import { parseNubankFile } from '../logic/nubankParser';
import { parseOfxFile } from '../logic/ofxParser';
import { suggestTransferKeywords } from '../logic/transferSuggestions';
import SummaryResult from '../components/SummaryResult';

const PARSERS = { picpay: parsePicPayFile, pagbank: parsePagBankFile, nubank: parseNubankFile, ofx: parseOfxFile };
const MIME_TYPES = {
  picpay: ['*/*'],
  pagbank: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  nubank: ['*/*'],
  ofx: ['*/*'],
};
const HINTS = {
  picpay: 'Selecione o extrato exportado do PicPay (.xlsx ou .csv)',
  pagbank: 'Selecione o extrato exportado do PagBank (.xlsx)',
  nubank: 'Selecione o extrato exportado do Nubank (.csv) — exporte mês a mês',
  ofx: 'Selecione o arquivo .ofx exportado do banco',
};

export default function AccountScreen({ route, navigation }) {
  const { accountId } = route.params;
  const { user } = useUser();

  const [account, setAccount] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const recomputeFrom = useCallback(async (acc) => {
    const rows = await getTransactions(user.id, acc.id);
    if (rows.length === 0) {
      setResult(null);
      return;
    }
    try {
      setResult(computeSummary(rows, { extraIgnoreKeywords: acc.ignoreKeywords ?? [] }));
    } catch {
      setResult(null);
    }
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    const accounts = await getAccounts(user.id);
    const acc = accounts.find((a) => a.id === accountId);
    setAccount(acc);
    navigation.setOptions({ title: acc?.label ?? 'Conta' });
    if (acc) await recomputeFrom(acc);
  }, [user, accountId, navigation, recomputeFrom]);

  useEffect(() => {
    load();
  }, [load]);

  const pickFile = useCallback(async () => {
    setError(null);
    setStatusMsg(null);
    const res = await DocumentPicker.getDocumentAsync({
      type: MIME_TYPES[account?.bankType] ?? ['*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled) return;
    const asset = res.assets && res.assets[0];
    if (!asset) return;
    setFile(asset);
  }, [account]);

  const processFile = useCallback(async () => {
    if (!file || !account || !user) return;
    setLoading(true);
    setError(null);
    setStatusMsg(null);
    try {
      const parse = PARSERS[account.bankType];
      const newRows = await parse(file.uri, file.name);
      const { rows, added, total } = await mergeTransactions(user.id, account.id, newRows);
      setResult(computeSummary(rows, { extraIgnoreKeywords: account.ignoreKeywords ?? [] }));
      setStatusMsg(
        added > 0
          ? `${added} transação(ões) nova(s) adicionada(s). Total salvo: ${total}.`
          : `Nenhuma transação nova (esse período já estava salvo). Total salvo: ${total}.`
      );
    } catch (e) {
      setError(`Erro ao processar: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }, [file, account, user]);

  const addKeyword = useCallback(
    async (kwArg) => {
      const kw = (kwArg ?? newKeyword).trim();
      if (!kw || !account || !user) return;
      const current = account.ignoreKeywords ?? [];
      if (current.some((k) => k.toLowerCase() === kw.toLowerCase())) {
        if (!kwArg) setNewKeyword('');
        return;
      }
      const updated = await updateAccount(user.id, account.id, { ignoreKeywords: [...current, kw] });
      setAccount(updated);
      if (!kwArg) setNewKeyword('');
      setSuggestions((prev) => (prev ? prev.filter((s) => s.keyword.toLowerCase() !== kw.toLowerCase()) : prev));
      await recomputeFrom(updated);
    },
    [newKeyword, account, user, recomputeFrom]
  );

  const loadSuggestions = useCallback(async () => {
    if (!account || !user) return;
    setLoadingSuggestions(true);
    try {
      const accounts = await getAccounts(user.id);
      const allAccountsWithRows = await Promise.all(
        accounts.map(async (acc) => ({ account: acc, rows: await getTransactions(user.id, acc.id) }))
      );
      const found = suggestTransferKeywords(account.id, allAccountsWithRows);
      const alreadyIgnored = new Set((account.ignoreKeywords ?? []).map((k) => k.toLowerCase()));
      setSuggestions(found.filter((s) => !alreadyIgnored.has(s.keyword.toLowerCase())));
    } finally {
      setLoadingSuggestions(false);
    }
  }, [account, user]);

  const removeKeyword = useCallback(
    async (kw) => {
      if (!account || !user) return;
      const updated = await updateAccount(user.id, account.id, {
        ignoreKeywords: (account.ignoreKeywords ?? []).filter((k) => k !== kw),
      });
      setAccount(updated);
      await recomputeFrom(updated);
    },
    [account, user, recomputeFrom]
  );

  const resetData = useCallback(async () => {
    if (!account || !user) return;
    await clearTransactions(user.id, account.id);
    setResult(null);
    setStatusMsg('Dados salvos desta conta foram apagados.');
  }, [account, user]);

  if (!account) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: account.color }]}>{account.label}</Text>
        <Text style={styles.hint}>{HINTS[account.bankType] ?? 'Selecione o extrato'}</Text>

        <TouchableOpacity style={[styles.button, { backgroundColor: account.color }]} onPress={pickFile}>
          <Text style={styles.buttonText}>Selecionar arquivo</Text>
        </TouchableOpacity>

        {file ? <Text style={styles.fileName}>Arquivo: {file.name}</Text> : null}

        <TouchableOpacity
          style={[styles.button, styles.processButton, !file && styles.buttonDisabled]}
          onPress={processFile}
          disabled={!file || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Processar e salvar</Text>}
        </TouchableOpacity>

        {statusMsg ? <Text style={styles.status}>{statusMsg}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.filtersBox}>
          <Text style={styles.filtersTitle}>Ignorar no teto (ex: transferências entre suas próprias contas)</Text>
          <Text style={styles.filtersSubtitle}>
            "Resgate de CDB" já é ignorado automaticamente. Adicione aqui outros textos que aparecem na descrição
            (ex: um trecho do nome da outra conta) para essas transações não contarem como entrada/saída real.
          </Text>

          <TouchableOpacity style={styles.suggestButton} onPress={loadSuggestions} disabled={loadingSuggestions}>
            {loadingSuggestions ? (
              <ActivityIndicator size="small" color="#333" />
            ) : (
              <Text style={styles.suggestButtonText}>Ver sugestões (cruza com suas outras contas)</Text>
            )}
          </TouchableOpacity>

          {suggestions ? (
            suggestions.length > 0 ? (
              <View style={styles.chipsRow}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s.keyword}
                    style={styles.suggestionChip}
                    onPress={() => addKeyword(s.keyword)}
                  >
                    <Text style={styles.suggestionChipText}>
                      + {s.keyword} ({s.count}× com {s.otherAccountLabels.join(', ')})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.filtersSubtitle}>
                Nenhuma transação batendo em valor/data com suas outras contas por enquanto.
              </Text>
            )
          ) : null}

          <View style={styles.filtersInputRow}>
            <TextInput
              style={styles.filtersInput}
              value={newKeyword}
              onChangeText={setNewKeyword}
              placeholder="ex: transferência joão"
              placeholderTextColor="#999"
              onSubmitEditing={() => addKeyword()}
            />
            <TouchableOpacity style={styles.filtersAddButton} onPress={() => addKeyword()}>
              <Text style={styles.filtersAddButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {(account.ignoreKeywords ?? []).length > 0 ? (
            <View style={styles.chipsRow}>
              {account.ignoreKeywords.map((kw) => (
                <TouchableOpacity key={kw} style={styles.chip} onPress={() => removeKeyword(kw)}>
                  <Text style={styles.chipText}>{kw} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {result ? <SummaryResult result={result} /> : null}

        {result ? (
          <TouchableOpacity style={styles.resetButton} onPress={resetData}>
            <Text style={styles.resetButtonText}>Apagar dados salvos desta conta</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { padding: 24, paddingTop: 32, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '800' },
  hint: { fontSize: 13, color: '#777', marginTop: 4, marginBottom: 20 },
  button: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  processButton: { backgroundColor: '#333' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fileName: { marginTop: 10, fontSize: 13, color: '#444' },
  status: { marginTop: 12, fontSize: 13, color: '#1E8449' },
  error: { marginTop: 16, color: '#C0392B', fontSize: 13 },
  filtersBox: {
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  filtersTitle: { fontSize: 13, fontWeight: '700', color: '#333' },
  filtersSubtitle: { fontSize: 11, color: '#888', marginTop: 4, marginBottom: 10 },
  suggestButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  suggestButtonText: { fontSize: 12, fontWeight: '700', color: '#333' },
  suggestionChip: {
    backgroundColor: '#E8F4FD',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BEE0F7',
  },
  suggestionChipText: { fontSize: 12, color: '#1B6FA8', fontWeight: '600' },
  filtersInputRow: { flexDirection: 'row', alignItems: 'center' },
  filtersInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#222',
  },
  filtersAddButton: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersAddButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  chip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 12, color: '#444' },
  resetButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  resetButtonText: { color: '#C0392B', fontSize: 12, textDecorationLine: 'underline' },
});
