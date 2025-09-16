// src/utils/csvOps.ts

/** 行オブジェクト（キー＝列名） */
export type RowObject = Record<string, unknown>;
/** 行列（配列の配列） */
export type Matrix = unknown[][];
/** どちらの JSON でも受け付けられる型 */
export type JsonData = RowObject[] | Matrix;

/** 改行コードの候補 */
export const EOLS = {
  lf: '\n',
  crlf: '\r\n',
  cr: '\r',
} as const;

export type EolKey = keyof typeof EOLS;

/* -------------------------------------------------------------------------- */
/*                               生成（JSON→CSV）                              */
/* -------------------------------------------------------------------------- */

/** 区切り文字や改行や " を含む／前後が空白 の場合は引用が必要 */
function needsQuote(s: string, sep: string): boolean {
  return (
    s.includes('"') ||
    s.includes('\r') ||
    s.includes('\n') ||
    s.includes(sep) ||
    /^\s|\s$/.test(s)
  );
}

/** " を "" にエスケープして "..." で包む */
function quote(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

/** 値を CSV 用の文字列に変換（必要に応じてクォート／sep を考慮） */
function cellToString(v: unknown, sep: string): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return needsQuote(v, sep) ? quote(v) : v;
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  // オブジェクトや配列は JSON にして出力
  const s = JSON.stringify(v);
  return needsQuote(s, sep) ? quote(s) : s;
}

/** RowObject[] からヘッダ（列名のユニーク順序）を作る */
function collectHeaders(rows: RowObject[]): string[] {
  const set = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) set.add(k);
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
    const rows = (data as Matrix).map(row =>
      row.map(v => cellToString(v, sep)).join(sep)
    );
    return rows.join(eol);
  }

  // 行オブジェクト配列（RowObject[]）
  const rows = data as RowObject[];
  const headers = collectHeaders(rows);
  const out: string[] = [];

  if (includeHeader) {
    out.push(headers.map(h => (needsQuote(h, sep) ? quote(h) : h)).join(sep));
  }

  for (const r of rows) {
    const line = headers.map(h => cellToString((r as RowObject)[h], sep));
    out.push(line.join(sep));
  }

  return out.join(eol);
}

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

/** 便利のため default でも出せるようにしておく */
export default jsonToCsv;

/* -------------------------------------------------------------------------- */
/*                               解析（CSV→JSON）                              */
/* -------------------------------------------------------------------------- */

export interface ParseOptions {
  delimiter: string; // 区切り文字（例: ',', '\t', ';', '|', '::' など）
  header: boolean; // 先頭行をヘッダとして扱うか
  newline?: string; // 改行コード強制指定（指定なしは自動: CRLF/LF/CR どれでもOK）
}

/** 行配列（Matrix）をパース: RFC4180 準拠の "..." と "" のエスケープに対応 */
function parseRows(
  input: string,
  delimiter: string,
  newline?: string
): string[][] {
  if (!input.trim()) return [];

  // 改行の検出/統一
  const nl =
    newline ??
    (input.includes('\r\n') ? '\r\n' : input.includes('\r') ? '\r' : '\n');

  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = '';
  let i = 0;
  const DL = delimiter.length;

  // 先頭のBOM対策
  if (input.charCodeAt(0) === 0xfeff) {
    input = input.slice(1);
  }

  while (i < input.length) {
    const ch = input[i];

    if (ch === '"') {
      // quoted field
      i++; // skip first quote
      let inQuotes = true;
      while (inQuotes && i < input.length) {
        const c = input[i];
        if (c === '"') {
          const next = input[i + 1];
          if (next === '"') {
            // "" -> "
            cell += '"';
            i += 2;
          } else {
            // close quote
            i++;
            inQuotes = false;
          }
        } else {
          cell += c;
          i++;
        }
      }
      // 引用終了後は、delimiter / 改行 / EOF を許可
      if (i < input.length) {
        if (input.startsWith(delimiter, i)) {
          cur.push(cell);
          cell = '';
          i += DL;
          continue;
        }
        if (input.startsWith(nl, i)) {
          cur.push(cell);
          rows.push(cur);
          cur = [];
          cell = '';
          i += nl.length;
          continue;
        }
      }
      // その他（行末など）：そのまま継続
      continue;
    }

    // 非引用フィールド
    if (input.startsWith(delimiter, i)) {
      cur.push(cell);
      cell = '';
      i += DL;
      continue;
    }
    if (input.startsWith(nl, i)) {
      cur.push(cell);
      rows.push(cur);
      cur = [];
      cell = '';
      i += nl.length;
      continue;
    }

    cell += ch;
    i++;
  }

  // 最後のセル/行
  if (cell.length > 0 || cur.length > 0) {
    cur.push(cell);
  }
  if (cur.length > 0) rows.push(cur);

  return rows;
}

/** rows(string[][]) → オブジェクト配列へ（ヘッダ有無で分岐） */
function rowsToObjects(
  rows: string[][],
  useHeader: boolean
): Record<string, string>[] {
  if (rows.length === 0) return [];
  if (!useHeader) {
    // col1..colN を自動付与
    const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const headers = Array.from({ length: maxCols }, (_, i) => `col${i + 1}`);
    return rows.map(r => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] ?? '';
      });
      return obj;
    });
  }

  // 先頭行をヘッダとする
  const [head, ...body] = rows;
  return body.map(r => {
    const obj: Record<string, string> = {};
    head.forEach((h, idx) => {
      obj[h] = r[idx] ?? '';
    });
    return obj;
  });
}

/** CSV/TSV 文字列 → JSON（オブジェクト配列） */
export function csvToJson(
  input: string,
  opts: ParseOptions
): Record<string, string>[] {
  if (!input.trim()) return [];
  const rows = parseRows(input, opts.delimiter, opts.newline);
  return rowsToObjects(rows, opts.header);
}
