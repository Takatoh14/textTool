// src/tests/csvToJson.test.ts
import { describe, expect, it } from 'vitest';

import { csvToJson } from '../utils/csvOps';

describe('csvToJson', () => {
  it('カンマ区切り + ヘッダあり', () => {
    const input = 'name,age\nAlice,20\nBob,30';
    const out = csvToJson(input, { delimiter: ',', header: true });
    expect(out.length).toBe(2);
    expect(out[0]).toEqual({ name: 'Alice', age: '20' });
    expect(out[1]).toEqual({ name: 'Bob', age: '30' });
  });

  it('TSV (タブ区切り) + ヘッダなし → col1,col2...', () => {
    const input = 'Alice\t20\nBob\t30';
    const out = csvToJson(input, { delimiter: '\t', header: false });
    expect(out.length).toBe(2);
    expect(out[0]).toEqual({ col1: 'Alice', col2: '20' });
    expect(out[1]).toEqual({ col1: 'Bob', col2: '30' });
  });

  it('クォートで囲まれたカンマを正しく復元', () => {
    const input = 'name,age\n"A,B",20\n"C,D",30';
    const out = csvToJson(input, { delimiter: ',', header: true });
    expect(out[0].name).toBe('A,B');
    expect(out[1].name).toBe('C,D');
  });

  it('ダブルクォートの二重化（"" → "）を復元', () => {
    const input = 'msg\n"He said ""Hi"""';
    const out = csvToJson(input, { delimiter: ',', header: true });
    expect(out[0].msg).toBe('He said "Hi"');
  });

  it('改行コードの自動検出（CRLF）', () => {
    const input = 'name,age\r\nAlice,20\r\nBob,30';
    const out = csvToJson(input, { delimiter: ',', header: true });
    expect(out.length).toBe(2);
  });

  it('改行コードの自動検出（CR: 旧Mac）', () => {
    const input = 'name,age\rAlice,20';
    const out = csvToJson(input, { delimiter: ',', header: true });
    expect(out.length).toBe(1);
    expect(out[0]).toEqual({ name: 'Alice', age: '20' });
  });

  it('複数行セル（クォート内の改行）', () => {
    const input = 'note\n"line1\nline2"\n';
    const out = csvToJson(input, { delimiter: ',', header: true });
    expect(out[0].note).toBe('line1\nline2');
  });

  it('空文字は空配列', () => {
    const input = '   \n \t';
    const out = csvToJson(input, { delimiter: ',', header: true });
    expect(out).toEqual([]);
  });

  it('BOM 先頭でもパースできる', () => {
    const input = '\uFEFFname,age\nAlice,20';
    const out = csvToJson(input, { delimiter: ',', header: true });
    expect(out[0]).toEqual({ name: 'Alice', age: '20' });
  });

  it('列数が揃っていない場合は足りない列を空文字で補完', () => {
    const input = 'name,age\nAlice\nBob,30';
    const out = csvToJson(input, { delimiter: ',', header: true });
    expect(out[0]).toEqual({ name: 'Alice', age: '' });
    expect(out[1]).toEqual({ name: 'Bob', age: '30' });
  });

  it('セミコロン区切り + ヘッダあり', () => {
    const input = 'a;b;c\n1;2;3';
    const out = csvToJson(input, { delimiter: ';', header: true });
    expect(out[0]).toEqual({ a: '1', b: '2', c: '3' });
  });

  it('縦長データ: ヘッダ無しで col1.. の自動生成', () => {
    const input = '1\n2\n3';
    const out = csvToJson(input, { delimiter: ',', header: false });
    expect(out).toEqual([{ col1: '1' }, { col1: '2' }, { col1: '3' }]);
  });
});
