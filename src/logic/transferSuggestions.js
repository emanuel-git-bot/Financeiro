// Sugere textos pra "ignorar no teto" cruzando as transações da conta atual com as
// outras contas do mesmo usuário: uma transferência entre contas próprias normalmente
// aparece como Saída numa conta e Entrada na outra, no mesmo valor, por volta da mesma
// data — um sinal bem mais confiável que só repetição de palavras na descrição.

// Extrai um nome/identificação curta da contraparte a partir da descrição (ex:
// "Transferência recebida pelo Pix - MARCIA BARBOSA... - 25.334.446/0001-83 - PICPAY..."
// -> "MARCIA BARBOSA..."), pulando o primeiro trecho (tipo de operação) e trechos que
// parecem CPF/CNPJ, agência/conta ou banco.
export function extractCounterpartyName(descricao) {
  if (!descricao) return null;
  const parts = descricao
    .split(' - ')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts.slice(1)) {
    if (/^\d/.test(part)) continue; // CPF/CNPJ, número de conta mascarado
    if (/agência|ag[eê]ncia|conta:|banco|ltda|s\.?a\.?$/i.test(part) && part.length > 40) continue;
    if (part.length < 3) continue;
    return part;
  }
  return parts[0] || descricao.trim();
}

/**
 * @param {string} currentAccountId
 * @param {{account: object, rows: object[]}[]} allAccountsWithRows
 * @param {{dayWindowMs?: number}} options
 * @returns {{keyword: string, count: number, otherAccountLabels: string[]}[]}
 */
export function suggestTransferKeywords(currentAccountId, allAccountsWithRows, { dayWindowMs = 86400000 } = {}) {
  const current = allAccountsWithRows.find((a) => a.account.id === currentAccountId);
  if (!current) return [];
  const others = allAccountsWithRows.filter((a) => a.account.id !== currentAccountId);
  if (others.length === 0) return [];

  const suggestions = new Map();

  for (const row of current.rows) {
    if (!(row.data instanceof Date) || isNaN(row.data.getTime())) continue;
    const isEntrada = row.entradas > 0;
    const amount = isEntrada ? row.entradas : row.saidas;
    if (amount <= 0) continue;

    for (const other of others) {
      for (const otherRow of other.rows) {
        if (!(otherRow.data instanceof Date) || isNaN(otherRow.data.getTime())) continue;
        // procura o espelho: se aqui é entrada, lá tem que ser saída (e vice-versa)
        const otherAmount = isEntrada ? otherRow.saidas : otherRow.entradas;
        if (Math.abs(otherAmount - amount) > 0.01) continue;
        if (Math.abs(otherRow.data.getTime() - row.data.getTime()) > dayWindowMs) continue;

        const keyword = extractCounterpartyName(row.descricao);
        if (!keyword) continue;
        const key = keyword.toLowerCase();
        const entry = suggestions.get(key) ?? { keyword, count: 0, otherAccountLabels: new Set() };
        entry.count++;
        entry.otherAccountLabels.add(other.account.label);
        suggestions.set(key, entry);
      }
    }
  }

  return Array.from(suggestions.values())
    .map((s) => ({ keyword: s.keyword, count: s.count, otherAccountLabels: Array.from(s.otherAccountLabels) }))
    .sort((a, b) => b.count - a.count);
}
