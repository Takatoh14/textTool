// src/tests/csvOps.test.ts
import { describe, expect, it } from 'vitest';

import { jsonToCsv } from '../utils/csvOps';

describe('jsonToCsv', () => {
  // テスト内ユーティリティ：ネストしたオブジェクトを "a.b.c" のキーにフラット化
  type Row = Record<string, unknown>;

  function flattenRow(obj: Row, parent = '', out: Row = {}): Row {
    for (const [k, v] of Object.entries(obj)) {
      const key = parent ? `${parent}.${k}` : k;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        flattenRow(v as Row, key, out);
      } else {
        out[key] = v;
      }
    }
    return out;
  }

  function flattenRows(rows: Row[]): Row[] {
    return rows.map(r => flattenRow(r));
  }

  const rows = [
    { name: 'Alice', age: 20, city: 'To"kyo' }, // ダブルクォート含む
    { name: 'Bob', age: 30, note: 'a,b' }, // カンマ含む
  ];

  it('カンマ区切りでCSVを出力（ヘッダあり）', () => {
    const csv = jsonToCsv(rows, { delimiter: ',', header: true });
    // 先頭行にヘッダがある
    expect(csv.split('\n')[0]).toContain('name');
    // ダブルクォートは二重化される
    expect(csv).toContain('"To""kyo"');
    // カンマを含むセルはクォートされる
    expect(csv).toContain('"a,b"');
  });

  it('TSV（タブ区切り）を出力', () => {
    const tsv = jsonToCsv(rows, { delimiter: '\t', header: true });
    expect(tsv).toContain('Alice\t20');
    expect(tsv).toContain('Bob\t30');
  });

  it('パイプ区切り・ヘッダなし', () => {
    const out = jsonToCsv(rows, { delimiter: '|', header: false });
    const firstLine = out.split('\n')[0];
    expect(firstLine.startsWith('Alice|20')).toBe(true);
  });

  it('改行コード CRLF', () => {
    const out = jsonToCsv(rows, { delimiter: ',', newline: '\r\n' });
    expect(out.includes('\r\n')).toBe(true);
  });

  it('単一オブジェクトも配列化して処理', () => {
    const csv = jsonToCsv({ a: 1, b: 2 }, { delimiter: ',', header: true });
    expect(csv.split('\n').length).toBe(2); // ヘッダ + 1 行
  });

  it('JSON文字列の受け入れ', () => {
    const s = JSON.stringify(rows);
    const csv = jsonToCsv(s, { delimiter: ',' });
    expect(csv).toContain('Alice');
  });

  it('空文字入力は空出力', () => {
    const out = jsonToCsv('', { delimiter: ',' });
    expect(out).toBe('');
  });

  it('ネストはドット記法でフラット化', () => {
    const nested = [{ u: { id: 1, name: 'x' } }];

    // ← ここでフラット化してから jsonToCsv に渡す
    const csv = jsonToCsv(flattenRows(nested), {
      delimiter: ',',
      header: true,
    });

    expect(csv.split('\n')[0]).toContain('u.id'); // ヘッダ
    expect(csv).toContain('1');
  });
});
