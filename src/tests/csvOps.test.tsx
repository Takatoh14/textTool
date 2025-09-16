import { EOLS, csvToJson, jsonToCsv } from '../utils/csvOps';
// src/tests/csvOps.test.ts
import { describe, expect, it } from 'vitest';

describe('jsonToCsv', () => {
  const rows = [
    { name: 'Alice', age: 20, city: 'To"kyo' }, // ダブルクォート含む
    { name: 'Bob', age: 30, note: 'a,b' }, // カンマ含む
  ];

  it('カンマ区切りでCSVを出力（ヘッダあり）', () => {
    const csv = jsonToCsv(rows, { delimiter: ',', header: true });
    expect(csv.split('\n')[0]).toContain('name'); // 先頭行にヘッダ
    expect(csv).toContain('"To""kyo"'); // ダブルクォートは二重化
    expect(csv).toContain('"a,b"'); // 区切りを含むセルはクォート
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
    const out = jsonToCsv(rows, { delimiter: ',', newline: EOLS.crlf });
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
});

describe('csvToJson', () => {
  it('カンマ区切り（ヘッダあり）', () => {
    const csv = `name,age,note\n"Alice",20,"a,b"`;
    const json = csvToJson(csv, { delimiter: ',', header: true });
    expect(json[0].name).toBe('Alice');
    expect(json[0].note).toBe('a,b');
  });

  it('TSV（ヘッダあり）', () => {
    const tsv = `name\tage\nBob\t30`;
    const json = csvToJson(tsv, { delimiter: '\t', header: true });
    expect(json[0].name).toBe('Bob');
    expect(json[0].age).toBe('30');
  });

  it('カスタム区切り（"::"）・ヘッダ無し', () => {
    const text = `Alice::20::X\nBob::30::Y`;
    const json = csvToJson(text, { delimiter: '::', header: false });
    // 自動ヘッダ col1..colN
    expect(json[0].col1).toBe('Alice');
    expect(json[0].col2).toBe('20');
    expect(json[0].col3).toBe('X');
  });

  it('CRLF 改行をパース', () => {
    const csv = `a,b\r\n1,2\r\n3,4`;
    const json = csvToJson(csv, { delimiter: ',', header: true });
    expect(json.length).toBe(2);
    expect(json[0].a).toBe('1');
  });

  it('空文字は空配列', () => {
    const json = csvToJson('', { delimiter: ',', header: true });
    expect(json.length).toBe(0);
  });

  it('引用とエスケープ（"" -> "）', () => {
    const csv = `name,note\n"Al""ice","say ""hello"""`;
    const json = csvToJson(csv, { delimiter: ',', header: true });
    expect(json[0].name).toBe('Al"ice');
    expect(json[0].note).toBe('say "hello"');
  });
});
