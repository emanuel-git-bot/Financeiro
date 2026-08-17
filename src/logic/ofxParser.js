// Parser genérico de OFX (padrão usado pela maioria dos bancos/fintechs pra exportar
// extrato). OFX "clássico" é SGML, não XML — bancos variam em detalhes (algumas tags
// vêm sem fechamento, encoding pode variar), então a extração de campos é tolerante:
// pega o conteúdo depois de <TAG> até achar outro "<" ou fim de linha, com ou sem
// </TAG>. Testado contra os .ofx reais do Nubank (que usam FITID/MEMO/TRNAMT/DTPOSTED
// dentro de blocos <STMTTRN>...</STMTTRN>, igual ao FITID = "Identificador" do CSV).
import { readTextFile, toNumberOrZero } from './excelUtils';

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function parseOfxDate(raw) {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 8);
  if (digits.length < 8) return null;
  const year = parseInt(digits.slice(0, 4), 10);
  const month = parseInt(digits.slice(4, 6), 10);
  const day = parseInt(digits.slice(6, 8), 10);
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

export async function parseOfxFile(fileUri, fileName) {
  const text = await readTextFile(fileUri, 'utf8');
  if (!text || text.trim().length === 0) {
    throw new Error('Arquivo vazio ou ilegível.');
  }

  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
  if (blocks.length === 0) {
    throw new Error(
      'Nenhuma transação (<STMTTRN>) encontrada. Verifique se o arquivo é um extrato OFX válido exportado do banco.'
    );
  }

  const rows = blocks.map((block) => {
    const valor = toNumberOrZero(extractTag(block, 'TRNAMT'));
    const descricao = extractTag(block, 'MEMO') ?? extractTag(block, 'NAME') ?? '';
    const fitid = extractTag(block, 'FITID');
    return {
      data: parseOfxDate(extractTag(block, 'DTPOSTED')),
      entradas: valor > 0 ? valor : 0,
      saidas: valor < 0 ? Math.abs(valor) : 0,
      descricao,
      externalId: fitid || undefined,
    };
  });

  if (!rows.some((r) => r.data)) {
    throw new Error('Não foi possível reconhecer as datas (<DTPOSTED>) das transações no arquivo OFX.');
  }

  return rows;
}
