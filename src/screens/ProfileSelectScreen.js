import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Alert, FlatList } from 'react-native';
import { getUsers, addUser, deleteUser } from '../storage/db';
import { useUser } from '../context/UserContext';

const AVATAR_COLORS = ['#21C25E', '#FFA300', '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C'];

function colorFor(id) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export default function ProfileSelectScreen({ navigation }) {
  const { setUser } = useUser();
  const [users, setUsers] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setUsers(await getUsers());
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const selectUser = useCallback(
    (u) => {
      setUser(u);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    },
    [setUser, navigation]
  );

  const handleAdd = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    await addUser(name);
    setNewName('');
    load();
  }, [newName, load]);

  const handleRemove = useCallback(
    (u) => {
      Alert.alert('Remover perfil', `Remover "${u.name}" e todos os dados salvos dele?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await deleteUser(u.id);
            load();
          },
        },
      ]);
    },
    [load]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Quem está usando?</Text>
        <Text style={styles.subtitle}>Toque para entrar · segure para remover</Text>

        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          numColumns={2}
          contentContainerStyle={{ marginTop: 24 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.profileCard}
              onPress={() => selectUser(item)}
              onLongPress={() => handleRemove(item)}
            >
              <View style={[styles.avatar, { backgroundColor: colorFor(item.id) }]}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.profileName}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? <Text style={styles.empty}>Nenhum perfil ainda. Crie o primeiro abaixo.</Text> : null
          }
        />

        <View style={styles.addBox}>
          <TextInput
            style={styles.addInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Nome do novo perfil (ex: Pai, Mãe...)"
            placeholderTextColor="#999"
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Adicionar perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center' },
  profileCard: { width: '47%', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  profileName: { marginTop: 8, fontSize: 15, fontWeight: '600', color: '#222' },
  empty: { textAlign: 'center', color: '#888', marginTop: 20 },
  addBox: { marginTop: 'auto', paddingTop: 16 },
  addInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  addButton: { backgroundColor: '#333', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
