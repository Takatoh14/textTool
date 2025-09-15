// tests/replaceText.test.ts
// Vitest で実行するユニットテスト。
// src/utils/textOps.ts の replaceText の挙動をケース表で網羅します。

import { describe, it, expect } from 'vitest';
import { replaceText, type ReplaceOptions } from '../utils/textOps';

type Case = {
  title: string;
  opts: ReplaceOptions;
  expect: string;
};

const cases: Case[] = [
  {
    title: '大文字小文字を区別しない（regex: false, i フラグ）',
    opts: {
      input: 'Hello World. hello world.',
      pattern: 'hello',
      replacement: 'Hi',
      regex: false,
      caseSensitive: false,
    },
    expect: 'Hi World. Hi world.',
  },
  {
    title: '大文字小文字を区別する（regex: false, i なし）',
    opts: {
      input: 'Hello World. hello world.',
      pattern: 'world',
      replacement: 'Earth',
      regex: false,
      caseSensitive: true,
    },
    // "world" だけが置換対象。先頭の "World" は大文字違いでマッチしない。
    expect: 'Hello World. hello Earth.',
  },
  {
    title: '正規表現 ON（"." は任意1文字 → 全部にマッチ）',
    opts: {
      input: 'a.b c.d',
      pattern: '.',
      replacement: 'X',
      regex: true,
      caseSensitive: true,
    },
    expect: 'XXXXXXX',
  },
  {
    title: '正規表現 OFF（"." はリテラル扱い：自動エスケープ）',
    opts: {
      input: 'a.b c.d',
      pattern: '.',
      replacement: 'X',
      regex: false,
      caseSensitive: true,
    },
    expect: 'aXb cXd',
  },
  {
    title: '無効な正規表現（例: "(" 単体）→ 元テキスト返却',
    opts: {
      input: 'abc(def',
      pattern: '(',
      replacement: 'X',
      regex: true,
      caseSensitive: true,
    },
    expect: 'abc(def',
  },
  {
    title: 'パターンが空 → 変換なし',
    opts: {
      input: 'foo bar',
      pattern: '',
      replacement: 'X',
      regex: false,
      caseSensitive: true,
    },
    expect: 'foo bar',
  },
];

describe('replaceText', () => {
  cases.forEach(({ title, opts, expect: expected }) => {
    it(title, () => {
      const output = replaceText(opts);
      expect(output).toBe(expected);
    });
  });
});
