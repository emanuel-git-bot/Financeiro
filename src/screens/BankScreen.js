import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import SummaryResult from '../components/SummaryResult';

// Tela genérica reutilizada por PicPayScreen e PagBankScreen: escolhe o arquivo,
// chama o parser específico do banco (parseFn) e mostra o mesmo resumo.
export default function BankScreen({ title, color, mimeTypes, parseFn, hint }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const pickFile = useCallback(async () => {
    setError(null);
    setResult(null);
    const res = await DocumentPicker.getDocumentAsync({
      type: mimeTypes,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled) return;
    const asset = res.assets && res.assets[0];
    if (!asset) return;
    setFile(asset);
  }, [mimeTypes]);

  const processFile = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const summary = await parseFn(file.uri, file.name);
      setResult(summary);
    } catch (e) {
      setError(`Erro ao processar: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }, [file, parseFn]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}

        <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={pickFile}>
          <Text style={styles.buttonText}>Selecionar arquivo</Text>
        </TouchableOpacity>

        {file ? <Text style={styles.fileName}>Arquivo: {file.name}</Text> : null}

        <TouchableOpacity
          style={[styles.button, styles.processButton, !file && styles.buttonDisabled]}
          onPress={processFile}
          disabled={!file || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Processar</Text>}
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {result ? <SummaryResult result={result} /> : null}
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
  error: { marginTop: 16, color: '#C0392B', fontSize: 13 },
});
