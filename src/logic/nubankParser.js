// Nubank exporta sempre .csv com cabeçalho fixo "Data,Valor,Identificador,Descrição",
// separador vírgula, utf-8, valor já em ponto decimal (sem ambiguidade de formato BR).
// "Identificador" é um ID único por transação do próprio banco — usamos ele como chave
// de deduplicação exata (ver rowKey em src/storage/db.js), diferente do hash heurístico
// usado para PicPay/PagBank, que não têm um ID assim no extrato.
import { readWorkbookRows, aoaToRecords, toNumberOrZero, parseDateFlexible, sampleValues } from './excelUtils';

export async function parseNubankFile(fileUri, fileName) {
  const aoa = await readWorkbookRows(fileUri, fileName, { csvEncoding: 'utf8', csvSeparator: ',' });
  if (!aoa || aoa.length === 0) {
    throw new Error('Arquivo vazio ou ilegível.');
  }

  const { headers, records } = aoaToRecords(aoa, 0, (h) => h.trim());
  if (records.length === 0) {
    throw new Error('Nenhuma linha de dados encontrada no arquivo.');
  }

  const rows = records.map((rec) => {
    const valor = toNumberOrZero(rec['Valor']);
    return {
      data: parseDateFlexible(rec['Data'], { dayFirst: true }),
      entradas: valor > 0 ? valor : 0,
      saidas: valor < 0 ? Math.abs(valor) : 0,
      descricao: rec['Descrição'] !== undefined ? String(rec['Descrição']) : '',
      externalId: rec['Identificador'] ? String(rec['Identificador']) : undefined,
    };
  });

  if (!rows.some((r) => r.data)) {
    const amostra = sampleValues(records, 'Data');
    throw new Error(
      `Não foi possível reconhecer a coluna de datas. Cabeçalho detectado: [${headers.join(', ')}]. ` +
        `Exemplos em "Data": ${amostra.length ? amostra.join(' | ') : '(coluna não encontrada)'}`
    );
  }

  return rows;
}
