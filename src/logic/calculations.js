// Lógica compartilhada entre PicPay e PagBank: agrupamento mensal e
// cálculo do teto proporcional. Equivalente aos passos 3-7 de picpay.py / execute.py.

const META_ANUAL = 81000;
const META_MENSAL = META_ANUAL / 12; // R$ 6.750,00

function monthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-');
  return `${m}/${y}`;
}

/**
 * @param {{data: Date|null, entradas: number, saidas: number, descricao: string}[]} rows
 * @param {{extraIgnoreKeywords?: string[]}} options - textos extras (ex: transferências
 *   entre contas do mesmo usuário) que devem ser ignorados no teto, além de "Resgate de CDB".
 */
export function computeSummary(rows, { extraIgnoreKeywords = [] } = {}) {
  const keywords = ['resgate de cdb', ...extraIgnoreKeywords.map((k) => k.toLowerCase().trim()).filter(Boolean)];

  const isIgnorado = (desc) => {
    if (typeof desc !== 'string') return false;
    const d = desc.toLowerCase();
    return keywords.some((k) => d.includes(k));
  };

  // Captura linhas ignoradas (CDB + filtros extras) ANTES de filtrar
  const ignoradas = rows.filter((r) => isIgnorado(r.descricao));
  const totalIgnorado = ignoradas.reduce((acc, r) => acc + r.entradas, 0);

  let filtered = rows.filter((r) => !isIgnorado(r.descricao));

  // Remove linhas com data inválida
  filtered = filtered.filter((r) => r.data instanceof Date && !isNaN(r.data.getTime()));

  if (filtered.length === 0) {
    throw new Error('Nenhuma linha com data válida encontrada após o processamento.');
  }

  // Resumo mensal (sem CDB)
  const groups = new Map();
  for (const r of filtered) {
    const key = monthKey(r.data);
    if (!groups.has(key)) groups.set(key, { entradas: 0, saidas: 0 });
    const g = groups.get(key);
    g.entradas += r.entradas;
    g.saidas += r.saidas;
  }

  const resumo = Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, v]) => ({
      mesAno: monthLabel(key),
      entradas: v.entradas,
      saidas: v.saidas,
      saldoMensal: v.entradas - v.saidas,
    }));

  // Período: última data, meses completos e dia atual
  const ultimaData = filtered.reduce((max, r) => (r.data > max ? r.data : max), filtered[0].data);
  const mesesCompletos = ultimaData.getMonth(); // 0-based == (mês - 1)
  const diaAtual = ultimaData.getDate();

  // Limite proporcional
  const resultado1 = META_MENSAL * mesesCompletos;
  const resultado2 = (META_MENSAL / 30) * diaAtual;
  const limiteProporcional = resultado1 + resultado2;

  // Total de entradas realizado (vendas reais)
  const totalEntradasRealizado = filtered.reduce((acc, r) => acc + r.entradas, 0);
  const totalRedistribuir = totalEntradasRealizado - limiteProporcional;

  return {
    ultimaData,
    resumo,
    totalEntradasRealizado,
    limiteProporcional,
    totalIgnorado,
    totalRedistribuir,
    ultrapassou: totalEntradasRealizado > limiteProporcional,
  };
}

// Replica o formato "{:,.2f}" do Python (milhar com vírgula, decimal com ponto)
export function formatMoney(value) {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}R$ ${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
