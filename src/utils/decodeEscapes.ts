// 置換文字列に含まれる一般的なエスケープを実体化
export function decodeEscapes(input: string): string {
  if (!input) return input;

  // 最低限よく使うものをカバー（必要に応じて拡張）
  return input
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\f/g, '\f')
    .replace(/\\v/g, '\v')
    .replace(/\\\\/g, '\\');
}
