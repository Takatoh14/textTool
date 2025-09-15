// src/features/csvTool/CsvTool.tsx
import { useMemo, useState } from 'react';
import {
  toDelimited,
  type JsonData,
  type RowObject,
  type Matrix,
  EOLS,
  type EolKey,
} from '../../utils/csvOps';
import '../textTool/textTool.scss'; // 既存の tt- スタイルを流用 (tt-xxx)

type PresetKey = 'csv' | 'tsv' | 'pipe' | 'custom';

const PRESETS: { value: PresetKey; label: string; sep: string }[] = [
  { value: 'csv', label: 'カンマ', sep: ',' },
  { value: 'tsv', label: 'タブ', sep: '\t' },
  { value: 'pipe', label: 'パイプ（|）', sep: '|' },
  { value: 'custom', label: 'カスタム', sep: '' },
];

// ---------- 小さなユーティリティ ----------

/** JSON 文字列 → unknown。空文字は空配列として扱う（エラーにしない） */
function parseJsonLoose(input: string): unknown {
  const trimmed = input.trim();
  if (!trimmed) return [];
  return JSON.parse(trimmed);
}

// 型ガード：RowObject[]
function isRowObjectArray(x: unknown): x is RowObject[] {
  return (
    Array.isArray(x) &&
    x.every(r => r !== null && typeof r === 'object' && !Array.isArray(r))
  );
}
// 型ガード：Matrix
function isMatrix(x: unknown): x is Matrix {
  return Array.isArray(x) && x.every(r => Array.isArray(r));
}

// ---------- コンポーネント本体 ----------

export default function CsvTool() {
  // 入力 JSON
  const [input, setInput] = useState<string>(
    `[
  {"name":"Alice","age":20},
  {"name":"Bob","age":30}
]`
  );

  // 区切りプリセット & カスタム区切り
  const [preset, setPreset] = useState<PresetKey>('csv');
  const [customSep, setCustomSep] = useState<string>(',');

  // 改行 & ヘッダ
  const [eolKey, setEolKey] = useState<EolKey>('lf');
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);

  // 実際に使う区切り文字
  const sepInUse =
    preset === 'custom'
      ? customSep
      : PRESETS.find(p => p.value === preset)!.sep;

  // 変換実行
  const { output, error } = useMemo(() => {
    try {
      const parsed = parseJsonLoose(input);

      if (!isRowObjectArray(parsed) && !isMatrix(parsed)) {
        throw new Error(
          'JSON は「オブジェクト配列」または「配列の配列」である必要があります。'
        );
      }
      const json: JsonData = parsed;

      const out = toDelimited({
        data: json,
        sep: sepInUse,
        eol: EOLS[eolKey],
        includeHeader,
      });

      return { output: out, error: '' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: '', error: `JSON の解析に失敗しました: ${msg}` };
    }
  }, [input, sepInUse, eolKey, includeHeader]);

  // コピー
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      alert('出力をコピーしました');
    } catch {
      alert('コピーに失敗しました');
    }
  };

  // ダウンロード
  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = preset === 'tsv' ? 'tsv' : 'csv';
    a.href = url;
    a.download = `export.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tt-container">
      <h1 className="tt-title">JSON → CSV/TSV 変換</h1>

      {/* 入力 */}
      <section className="tt-section">
        <h2 className="tt-section__title">入力（JSON）</h2>
        <textarea
          className="tt-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={12}
          placeholder='[{"name":"Alice","age":20},{"name":"Bob","age":30}]'
        />
      </section>

      {/* 変換設定 */}
      <section className="tt-section">
        <h2 className="tt-section__title">変換設定</h2>

        {/* 区切りプリセット */}
        <label className="tt-form__item" style={{ maxWidth: 360 }}>
          <span>区切り文字</span>
          <select
            className="tt-input"
            value={preset}
            onChange={e => setPreset(e.target.value as PresetKey)}
          >
            {PRESETS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {/* カスタム区切り（プリセットの直下に表示 / EOL は動かさない） */}
        {preset === 'custom' && (
          <label
            className="tt-form__item"
            style={{ maxWidth: 360, marginTop: 8 }}
          >
            <span>カスタム区切り</span>
            <input
              className="tt-input"
              type="text"
              value={customSep}
              onChange={e => setCustomSep(e.target.value)}
              placeholder="例）|  or ::"
            />
          </label>
        )}

        {/* 改行コード（位置は固定のまま） */}
        <label className="tt-form__item" style={{ maxWidth: 360 }}>
          <span>改行コード</span>
          <select
            className="tt-input"
            value={eolKey}
            onChange={e => setEolKey(e.target.value as EolKey)}
          >
            <option value="lf">LF（Unix / macOS / Linux）</option>
            <option value="crlf">CRLF（Windows）</option>
            <option value="cr">CR（古い macOS）</option>
          </select>
        </label>

        {/* ヘッダ */}
        <label className="tt-checkbox" style={{ marginTop: 8 }}>
          <input
            type="checkbox"
            checked={includeHeader}
            onChange={e => setIncludeHeader(e.target.checked)}
          />
          ヘッダ行を出力する
        </label>
      </section>

      {/* 出力 */}
      <section className="tt-section">
        <div className="tt-section__header">
          <h2 className="tt-section__title">出力</h2>
          <div className="tt-actions">
            <button className="tt-btn" onClick={handleCopy} disabled={!output}>
              出力をコピー
            </button>
            <button
              className="tt-btn"
              onClick={handleDownload}
              disabled={!output}
              style={{ marginLeft: 8 }}
            >
              ダウンロード
            </button>
          </div>
        </div>

        {error ? (
          <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>
        ) : null}

        <textarea
          className="tt-textarea tt-textarea--output"
          value={output}
          readOnly
          rows={12}
        />
      </section>
    </div>
  );
}
