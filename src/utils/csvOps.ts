// src/utils/csvOps.ts

/** 行オブジェクト（キー＝列名） */
export type RowObject = Record<string, unknown>;
/** 行列（配列の配列） */
export type Matrix = unknown[][];
/** どちらの JSON でも受け付けられる型 */
export type JsonData = RowObject[] | Matrix;

/** 値を CSV 用の文字列に変換（必要に応じてクォート） */
function cellToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return quoteIfNeeded(v);
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  // オブジェクトや配列は JSON にして出力
  return quoteIfNeeded(JSON.stringify(v));
}

function quoteIfNeeded(s: string): string {
  // 罫線・改行・" が含まれる場合や前後空白は "..." にして " を二重化
  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** RowObject[] からヘッダ（列名のユニーク順序）を作る */
function collectHeaders(rows: RowObject[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) set.add(k);
  }
  return [...set];
}

/**
 * JSON（RowObject[] or Matrix）を区切り文字付きテキストに変換
 */
export function toDelimited({
  data,
  sep,
  eol,
  includeHeader,
}: {
  data: JsonData;
  sep: string;
  eol: string;
  includeHeader: boolean;
}): string {
  if (!Array.isArray(data) || data.length === 0) return '';

  // 行列（Matrix）
  if (Array.isArray(data[0])) {
    const rows = (data as Matrix).map(row => row.map(cellToString).join(sep));
    return rows.join(eol);
  }

  // 行オブジェクト配列（RowObject[]）
  const rows = data as RowObject[];
  const headers = collectHeaders(rows);
  const out: string[] = [];

  if (includeHeader) {
    out.push(headers.map(h => quoteIfNeeded(h)).join(sep));
  }

  for (const r of rows) {
    const line = headers.map(h => cellToString((r as RowObject)[h]));
    out.push(line.join(sep));
  }

  return out.join(eol);
}

/** 改行コードの候補 */
export const EOLS = {
  lf: '\n',
  crlf: '\r\n',
  cr: '\r',
} as const;

export type EolKey = keyof typeof EOLS;

/** jsonToCsv のオプション */
export interface JsonToCsvOptions {
  /** 区切り文字（デフォルト: ,） */
  delimiter?: string;
  /** ヘッダ行を出力するか（RowObject[] のとき true がデフォルト、Matrix のとき false） */
  header?: boolean;
  /** 改行コード（デフォルト: \n） */
  newline?: string;
}

/** 緩めの JSON 受け入れ: 空文字は空配列として扱う */
function parseJsonLoose(input: unknown): JsonData {
  if (Array.isArray(input)) {
    // すでに JSON として渡ってきた
    return input as JsonData;
  }
  if (input && typeof input === 'object') {
    // オブジェクト単体は配列に包む（RowObject 1行として扱う）
    return [input as RowObject];
  }
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return []; // 空なら空出力
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed as JsonData;
    return [parsed as RowObject];
  }
  // それ以外は空扱い
  return [];
}

/**
 * 高レベル API: JSON を CSV/TSV 等に変換する
 * - `input`: RowObject[] / Matrix / RowObject / JSON文字列（配列 or オブジェクト）
 * - `options.delimiter`: 区切り文字（既定: ','）
 * - `options.header`: ヘッダ行の有無（RowObject[] では true、Matrix では false が既定）
 * - `options.newline`: 改行コード（既定: '\n'）
 */
export function jsonToCsv(
  input: unknown,
  options: JsonToCsvOptions = {}
): string {
  const data = parseJsonLoose(input);

  if (!Array.isArray(data) || data.length === 0) return '';

  const sep = options.delimiter ?? ',';
  const eol = options.newline ?? EOLS.lf;

  // 既定のヘッダ有無はデータ形状で決める
  const first = data[0];
  const defaultHeader = Array.isArray(first) ? false : true;
  const includeHeader = options.header ?? defaultHeader;

  return toDelimited({
    data,
    sep,
    eol,
    includeHeader,
  });
}

/** 便利のため default でも出せるようにしておく（任意） */
export default jsonToCsv;
