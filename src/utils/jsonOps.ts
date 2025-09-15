// src/utils/jsonOps.ts

export type IndentKind = '2' | '4' | 'tab';

export interface FormatJsonOptions {
  input: string; // 入力の JSON 文字列
  indent: IndentKind; // インデント（2 / 4 / tab）
  sortKeys?: boolean; // キーをソートする（任意）
  minify?: boolean; // 最小化（整形せず詰める）※ indent より優先
}

/** JSON を安全に parse。失敗したら Error を投げます。 */
export function parseJsonStrict(input: string): unknown {
  // JSON では末尾カンマやコメントは不可（JSON5 ではない）
  // ここでは標準 JSON のみを扱います
  return JSON.parse(input);
}

/** 任意のオブジェクトのキーを再帰的にソートする（オプション） */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(v => sortKeysDeep(v));
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    Object.keys(obj)
      .sort()
      .forEach(k => {
        sorted[k] = sortKeysDeep(obj[k]);
      });
    return sorted;
  }
  return value;
}

/** JSON 整形のメイン関数 */
export function formatJson(opts: FormatJsonOptions): string {
  const { input, indent, sortKeys = false, minify = false } = opts;

  // 入力が空ならそのまま返す（エラーにしない）
  if (!input.trim()) return '';

  // ① parse
  const data = parseJsonStrict(input);

  // ② ソート（任意）
  const toStringify = sortKeys ? sortKeysDeep(data) : data;

  // ③ stringify（インデント or minify）
  const space = minify ? 0 : indent === '2' ? 2 : indent === '4' ? 4 : '\t';
  return JSON.stringify(toStringify, null, space);
}
