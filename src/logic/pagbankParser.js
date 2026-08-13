// Conversão de execute.py: sempre .xlsx, pula linhas de metadados até achar o
// cabeçalho real (Data/Entradas/Saidas) e usa as colunas fixas Entradas / Saidas / Data / Descrição.
import {
  readWorkbookRows,
  aoaToRecords,
  findHeaderRowIndex,
  sampleValues,
  toNumberOrZero,
  parseDateFlexible,
} from './excelUtils';

// Retorna as transações cruas (não calcula o resumo aqui) — quem chama decide
// se mescla com dados já salvos antes de rodar computeSummary.
export async function parsePagBankFile(fileUri, fileName) {
  const aoa = await readWorkbookRows(fileUri, fileName);
  if (!aoa || aoa.length === 0) {
    throw new Error('Arquivo vazio ou ilegível.');
  }

  // execute.py usa skiprows=8 (cabeçalho na 9ª linha); procuramos essa linha em vez de
  // fixar o índice, para tolerar pequenas variações no extrato.
  const headerRowIndex = findHeaderRowIndex(aoa, ['Data', 'Entradas', 'Saidas'], {
    maxScan: 25,
    fallback: 8,
  });

  const { headers, records } = aoaToRecords(aoa, headerRowIndex, (h) => h.trim());
  if (records.length === 0) {
    throw new Error(
      `Nenhuma linha de dados encontrada. Cabeçalho detectado na linha ${headerRowIndex + 1}: [${headers.join(', ')}]`
    );
  }

  const hasDescricao = headers.includes('Descrição');

  const rows = records.map((rec) => ({
    data: parseDateFlexible(rec['Data'], { dayFirst: true }),
    entradas: toNumberOrZero(rec['Entradas']),
    saidas: Math.abs(toNumberOrZero(rec['Saidas'] ?? rec['Saídas'])),
    descricao: hasDescricao ? String(rec['Descrição'] ?? '') : '',
  }));

  if (!rows.some((r) => r.data)) {
    const amostra = sampleValues(records, 'Data');
    throw new Error(
      `Não foi possível reconhecer a coluna de datas. Cabeçalho detectado na linha ${headerRowIndex + 1}: ` +
        `[${headers.join(', ')}]. Exemplos em "Data": ${amostra.length ? amostra.join(' | ') : '(coluna não encontrada)'}`
    );
  }

  return rows;
}
