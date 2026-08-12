// SDK 54: a API clássica (readAsStringAsync/EncodingType) mudou para o subpath "legacy".
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';
import * as XLSX from 'xlsx';

/**
 * Lê um arquivo (.xlsx/.xls ou .csv) e devolve uma matriz de linhas (array de arrays),
 * igual ao que pandas enxerga como um DataFrame cru, sem cabeçalho ainda aplicado.
 */
export async function readWorkbookRows(fileUri, fileName) {
  const isCsv = fileName.toLowerCase().endsWith('.csv');
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (isCsv) {
    // picpay.py lê CSV com encoding='latin1'
    const text = Buffer.from(base64, 'base64').toString('latin1');
    return parseCsv(text, ';');
  }

  const workbook = XLSX.read(base64, { type: 'base64', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
}

function parseCsv(text, sep) {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.length > 0);
  return lines.map((line) => splitCsvLine(line, sep));
}

function splitCsvLine(line, sep) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((c) => c.trim());
}

/**
 * Converte uma matriz de linhas em registros (objetos), usando a linha `headerRowIndex`
 * como cabeçalho. Remove colunas "Unnamed"/vazias, equivalente a:
 *   df.loc[:, ~df.columns.str.contains('^Unnamed', ...)]
 */
export function aoaToRecords(aoa, headerRowIndex, normalizeHeader) {
  const rawHeader = aoa[headerRowIndex] || [];
  const columns = rawHeader.map((h, idx) => ({
    idx,
    name: normalizeHeader(String(h ?? '').trim()),
  }));

  const isUnnamed = (name) => !name || /^unnamed/i.test(name) || /^__empty/i.test(name);
  const validColumns = columns.filter((c) => !isUnnamed(c.name));

  const dataRows = aoa.slice(headerRowIndex + 1);
  const records = dataRows
    .filter((row) => row.some((cell) => cell !== '' && cell !== undefined && cell !== null))
    .map((row) => {
      const record = {};
      for (const col of validColumns) {
        record[col.name] = row[col.idx];
      }
      return record;
    });

  return { headers: validColumns.map((c) => c.name), records };
}

/**
 * Procura, dentro das primeiras `maxScan` linhas, a linha que contém todos os
 * `requiredHeaders` (comparação case-insensitive). Usa `fallback` se não achar
 * nenhuma — útil quando o layout do extrato varia um pouco (linhas de metadados
 * a mais/a menos antes do cabeçalho real).
 */
export function findHeaderRowIndex(aoa, requiredHeaders, { maxScan = 25, fallback = 0 } = {}) {
  const normalize = (s) => String(s ?? '').trim().toLowerCase();
  const required = requiredHeaders.map(normalize);
  const limit = Math.min(maxScan, aoa.length);
  for (let i = 0; i < limit; i++) {
    const row = (aoa[i] || []).map(normalize);
    if (required.every((req) => row.includes(req))) return i;
  }
  return fallback;
}

// Amostra de valores brutos de uma coluna, para mensagens de erro/diagnóstico
export function sampleValues(records, key, n = 3) {
  return records
    .slice(0, n)
    .map((r) => r[key])
    .map((v) => (v === undefined ? '(ausente)' : v instanceof Date ? v.toISOString() : String(v)));
}

// Equivalente a str.title() do Python
export function toTitleCase(str) {
  let result = '';
  let prevIsLetter = false;
  for (const ch of str) {
    if (/[a-zA-ZÀ-ÿ]/.test(ch)) {
      result += prevIsLetter ? ch.toLowerCase() : ch.toUpperCase();
      prevIsLetter = true;
    } else {
      result += ch;
      prevIsLetter = false;
    }
  }
  return result;
}

// Equivalente a pd.to_numeric(..., errors='coerce').fillna(0)
export function toNumberOrZero(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isFinite(value) ? value : 0;

  let str = String(value).trim();
  if (str === '') return 0;
  str = str.replace(/[^\d,.\-]/g, '');
  if (str === '' || str === '-') return 0;

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');
  if (hasComma && hasDot) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    str = str.replace(',', '.');
  }

  const n = parseFloat(str);
  return isFinite(n) ? n : 0;
}

// Parser de data flexível: aceita Date (célula de Excel), serial do Excel e texto dd/mm/aaaa ou aaaa-mm-dd
export function parseDateFlexible(value, { dayFirst = true } = {}) {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF && XLSX.SSF.parse_date_code ? XLSX.SSF.parse_date_code(value) : null;
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
    return null;
  }

  const str = String(value ?? '').trim();
  if (!str) return null;

  const match = str.match(/^(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})/);
  if (match) {
    const [, a, b, c] = match;
    let day, month, year;
    if (a.length === 4) {
      year = parseInt(a, 10);
      month = parseInt(b, 10);
      day = parseInt(c, 10);
    } else if (dayFirst) {
      day = parseInt(a, 10);
      month = parseInt(b, 10);
      year = parseInt(c, 10);
    } else {
      month = parseInt(a, 10);
      day = parseInt(b, 10);
      year = parseInt(c, 10);
    }
    if (year < 100) year += 2000;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
    return null;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}
