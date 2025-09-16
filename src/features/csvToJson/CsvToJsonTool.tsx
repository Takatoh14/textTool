// src/features/csvToJson/CsvToJsonTool.tsx
import { useMemo, useState } from 'react';
import { csvToJson, type ParseOptions } from '../../utils/csvOps';
import '../../features/textTool/textTool.scss'; // 既存のスタイルを流用 (tt-*)

const PRESETS = [
  { label: 'カンマ (,)', value: ',' },
  { label: 'タブ (\\t)', value: '\t' },
  { label: 'セミコロン (;)', value: ';' },
  { label: 'パイプ (|)', value: '|' },
  { label: 'カスタム', value: '__CUSTOM__' },
] as const;

const NEWLINES = [
  { label: '自動検出', value: '' },
  { label: 'LF (Unix/macOS/Linux)', value: '\n' },
  { label: 'CRLF (Windows)', value: '\r\n' },
  { label: 'CR (Classic Mac)', value: '\r' },
] as const;

export default function CsvToJsonTool() {
  // 入力・設定
  const [input, setInput] = useState<string>('name,age\nAlice,20\nBob,30');
  const [delimPreset, setDelimPreset] = useState<string>(PRESETS[0].value);
  const [customDelim, setCustomDelim] = useState<string>('');
  const [useHeader, setUseHeader] = useState<boolean>(true);
  const [newline, setNewline] = useState<string>(''); // 自動検出

  // 実際に使う区切り文字
  const delimiter = delimPreset === '__CUSTOM__' ? customDelim : delimPreset;

  const { outputJsonText, error } = useMemo(() => {
    try {
      const opts: ParseOptions = {
        delimiter: delimiter || ',', // 未設定のカスタム対策
        header: useHeader,
        newline: newline || undefined, // '' のときは自動検出
      };
      const json = csvToJson(input ?? '', opts);
      // 整形して出力
      return { outputJsonText: JSON.stringify(json, null, 2), error: '' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { outputJsonText: '', error: `変換に失敗しました: ${msg}` };
    }
  }, [input, delimiter, useHeader, newline]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputJsonText);
      alert('出力JSONをコピーしました');
    } catch {
      alert('コピーに失敗しました');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([outputJsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tt-container">
      <h1 className="tt-title">CSV/TSV → JSON 変換</h1>

      {/* 入力 */}
      <section className="tt-section">
        <h2 className="tt-section__title">入力（CSV/TSV）</h2>
        <textarea
          className="tt-textarea"
          rows={10}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={'name,age\nAlice,20\nBob,30'}
        />
      </section>

      {/* 変換設定 */}
      <section className="tt-section">
        <h2 className="tt-section__title">変換設定</h2>
        <div className="tt-form">
          {/* 区切り文字 */}
          <label className="tt-form__item" style={{ minWidth: 320 }}>
            <span>区切り文字</span>
            <select
              className="tt-input"
              value={delimPreset}
              onChange={e => setDelimPreset(e.target.value)}
            >
              {PRESETS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          {/* カスタム区切り（区切り文字の直下に出す） */}
          {delimPreset === '__CUSTOM__' && (
            <label className="tt-form__item" style={{ minWidth: 320 }}>
              <span>カスタム区切り</span>
              <input
                className="tt-input"
                type="text"
                value={customDelim}
                onChange={e => setCustomDelim(e.target.value)}
                placeholder="例) |  または  ::"
              />
            </label>
          )}

          {/* 改行コード（固定位置） */}
          <label className="tt-form__item" style={{ minWidth: 320 }}>
            <span>改行コード</span>
            <select
              className="tt-input"
              value={newline}
              onChange={e => setNewline(e.target.value)}
            >
              {NEWLINES.map(n => (
                <option key={n.label} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>

          {/* ヘッダ */}
          <label className="tt-checkbox">
            <input
              type="checkbox"
              checked={useHeader}
              onChange={e => setUseHeader(e.target.checked)}
            />
            先頭行をヘッダとして扱う
          </label>
        </div>
      </section>

      {/* 出力 */}
      <section className="tt-section">
        <div className="tt-section__header">
          <h2 className="tt-section__title">出力（JSON）</h2>
          <div className="tt-actions">
            <button
              className="tt-btn"
              onClick={handleCopy}
              disabled={!outputJsonText}
            >
              出力をコピー
            </button>
            <button
              className="tt-btn"
              onClick={handleDownload}
              disabled={!outputJsonText}
            >
              ダウンロード
            </button>
          </div>
        </div>

        {error && (
          <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>
        )}

        <textarea
          className="tt-textarea tt-textarea--output"
          rows={12}
          value={outputJsonText}
          readOnly
        />
      </section>
    </div>
  );
}
