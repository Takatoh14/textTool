// src/utils/textOps.ts

/**
 * 正規表現のメタ文字をエスケープする
 * 例: '.' -> '\.'、'*' -> '\*' など
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 置換のオプション型（再利用しやすいように定義） */
export interface ReplaceOptions {
  input: string; // 入力テキスト
  pattern: string; // 置換対象（検索パターン）
  replacement: string; // 置換後の文字列
  regex: boolean; // 正規表現モード（ON なら pattern をそのまま使う）
  caseSensitive: boolean; // 大文字小文字を区別する
}

/**
 * RegExp を安全に組み立てる。失敗したら null を返す。
 * - regex=false のときは検索語を自動エスケープ
 * - フラグは g（全置換）+ i（case-insensitive）を必要に応じて付与
 */
function buildRegExp({
  pattern,
  regex,
  caseSensitive,
}: Pick<ReplaceOptions, 'pattern' | 'regex' | 'caseSensitive'>): RegExp | null {
  if (!pattern) return null;

  const source = regex ? pattern : escapeRegExp(pattern);
  const flags = caseSensitive ? 'g' : 'gi';

  try {
    return new RegExp(source, flags);
  } catch {
    // 無効な正規表現。ここで例外内容は使わないため catch 変数を省略（ESLint対策）
    return null;
  }
}

/**
 * テキスト置換のメイン関数
 * - 入力やパターンが空、または無効な正規表現の場合は元テキストを返す
 */
export function replaceText(opts: ReplaceOptions): string {
  const { input, replacement } = opts;
  if (!input || !opts.pattern) return input;

  const re = buildRegExp(opts);
  if (!re) return input;

  return input.replace(re, replacement);
}
