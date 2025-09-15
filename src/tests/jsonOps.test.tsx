import { describe, expect, it } from 'vitest';

import { formatJson } from '../utils/jsonOps';

describe('formatJson', () => {
  it('空入力は空文字を返す', () => {
    expect(
      formatJson({ input: '', indent: '2', sortKeys: false, minify: false })
    ).toBe('');
    expect(
      formatJson({ input: '   ', indent: '2', sortKeys: false, minify: false })
    ).toBe('');
  });

  it('スペース2で整形', () => {
    const input = '{"b":2,"a":1}';
    const output = formatJson({
      input,
      indent: '2',
      sortKeys: false,
      minify: false,
    });
    expect(output).toBe('{\n  "b": 2,\n  "a": 1\n}');
  });

  it('スペース4で整形', () => {
    const input = '{"x":1}';
    const output = formatJson({
      input,
      indent: '4',
      sortKeys: false,
      minify: false,
    });
    expect(output).toBe('{\n    "x": 1\n}');
  });

  it('タブで整形', () => {
    const input = '{"x":1}';
    const output = formatJson({
      input,
      indent: 'tab',
      sortKeys: false,
      minify: false,
    });
    expect(output).toBe('{\n\t"x": 1\n}');
  });

  it('キーをアルファベット順にソート', () => {
    const input = '{"z":3,"a":1,"m":2}';
    const output = formatJson({
      input,
      indent: '2',
      sortKeys: true,
      minify: false,
    });
    expect(output).toBe('{\n  "a": 1,\n  "m": 2,\n  "z": 3\n}');
  });

  it('最小化（minify）', () => {
    const input = '{ "foo": 1, "bar": 2 }';
    const output = formatJson({
      input,
      indent: '2',
      sortKeys: false,
      minify: true,
    });
    expect(output).toBe('{"foo":1,"bar":2}');
  });

  it('整形とソートと最小化を同時に適用', () => {
    const input = '{"z":3,"a":1}';
    const output = formatJson({
      input,
      indent: '4',
      sortKeys: true,
      minify: true,
    });
    expect(output).toBe('{"a":1,"z":3}');
  });

  it('不正なJSONはエラーを投げる', () => {
    const input = '{invalid}';
    expect(() =>
      formatJson({ input, indent: '2', sortKeys: false, minify: false })
    ).toThrow();
  });
});
