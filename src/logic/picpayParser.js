// Conversão de picpay.py: aceita .xlsx ou .csv (sep=';', latin1),
// normaliza colunas com title-case e usa a 3ª coluna como descrição.
import {
  readWorkbookRows,
  aoaToRecords,
  toTitleCase,
  toNumberOrZero,
  parseDateFlexible,
  sampleValues,
} from './excelUtils';
import { computeSummary } from './calculations';

export async function processPicPayFile(fileUri, fileName) {
  const aoa = await readWorkbookRows(fileUri, fileName);
  if (!aoa || aoa.length === 0) {
    throw new Error('Arquivo vazio ou ilegível.');
  }

  const { headers, records } = aoaToRecords(aoa, 0, toTitleCase);
  if (records.length === 0) {
    throw new Error('Nenhuma linha de dados encontrada no arquivo.');
  }

  // col_desc = df.columns[2] if len(df.columns) > 2 else 'Descrição'
  const colDesc = headers.length > 2 ? headers[2] : 'Descrição';

  const rows = records.map((rec) => {
    const valor = toNumberOrZero(rec['Valor']);
    return {
      data: parseDateFlexible(rec['Data'], { dayFirst: true }),
      entradas: valor > 0 ? valor : 0,
      saidas: valor < 0 ? Math.abs(valor) : 0,
      descricao: rec[colDesc] !== undefined ? String(rec[colDesc]) : '',
    };
  });

  if (!rows.some((r) => r.data)) {
    const amostra = sampleValues(records, 'Data');
    throw new Error(
      `Não foi possível reconhecer a coluna de datas. Cabeçalho detectado: [${headers.join(', ')}]. ` +
        `Exemplos em "Data": ${amostra.length ? amostra.join(' | ') : '(coluna não encontrada)'}`
    );
  }

  return computeSummary(rows);
}
