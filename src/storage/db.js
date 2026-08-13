import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'financeiro:users';
const accountsKey = (userId) => `financeiro:accounts:${userId}`;
const transactionsKey = (userId, accountId) => `financeiro:transactions:${userId}:${accountId}`;

export async function getUsers() {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addUser(name) {
  const users = await getUsers();
  const user = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
  };
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  return user;
}

export async function deleteUser(userId) {
  const users = await getUsers();
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users.filter((u) => u.id !== userId)));

  const accounts = await getAccounts(userId);
  await AsyncStorage.multiRemove([accountsKey(userId), ...accounts.map((a) => transactionsKey(userId, a.id))]);
}

// Contas padrão criadas na primeira vez que um perfil é acessado.
const DEFAULT_ACCOUNTS = [
  { id: 'picpay', bankType: 'picpay', variant: null, label: 'PicPay', color: '#21C25E', ignoreKeywords: [] },
  {
    id: 'pagbank-empresa',
    bankType: 'pagbank',
    variant: 'empresa',
    label: 'PagBank Empresa',
    color: '#FFA300',
    ignoreKeywords: [],
  },
  {
    id: 'pagbank-pessoal',
    bankType: 'pagbank',
    variant: 'pessoal',
    label: 'PagBank Pessoal',
    color: '#FFC24D',
    ignoreKeywords: [],
  },
];

export async function getAccounts(userId) {
  const raw = await AsyncStorage.getItem(accountsKey(userId));
  if (raw) return JSON.parse(raw);
  await AsyncStorage.setItem(accountsKey(userId), JSON.stringify(DEFAULT_ACCOUNTS));
  return DEFAULT_ACCOUNTS;
}

export async function updateAccount(userId, accountId, patch) {
  const accounts = await getAccounts(userId);
  const updated = accounts.map((a) => (a.id === accountId ? { ...a, ...patch } : a));
  await AsyncStorage.setItem(accountsKey(userId), JSON.stringify(updated));
  return updated.find((a) => a.id === accountId);
}

function reviveRow(row) {
  return { ...row, data: row.data ? new Date(row.data) : null };
}

export async function getTransactions(userId, accountId) {
  const raw = await AsyncStorage.getItem(transactionsKey(userId, accountId));
  if (!raw) return [];
  return JSON.parse(raw).map(reviveRow);
}

// Chave de deduplicação: mesma data + entradas + saídas + descrição =
// considerada a mesma transação (evita duplicar ao reimportar um período já salvo).
function rowKey(row) {
  const d = row.data instanceof Date && !isNaN(row.data.getTime()) ? row.data.toISOString().slice(0, 10) : 'sem-data';
  return `${d}|${row.entradas.toFixed(2)}|${row.saidas.toFixed(2)}|${(row.descricao || '').trim().toLowerCase()}`;
}

export async function mergeTransactions(userId, accountId, newRows) {
  const existing = await getTransactions(userId, accountId);
  const seen = new Set(existing.map(rowKey));
  const merged = [...existing];
  let added = 0;

  for (const row of newRows) {
    const key = rowKey(row);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(row);
      added++;
    }
  }

  await AsyncStorage.setItem(transactionsKey(userId, accountId), JSON.stringify(merged));
  return { rows: merged, added, total: merged.length };
}

export async function clearTransactions(userId, accountId) {
  await AsyncStorage.removeItem(transactionsKey(userId, accountId));
}
