import { useMemo, useState } from 'react';
import { formatJson, type IndentKind } from '../../utils/jsonOps';
import '../../features/textTool/textTool.scss'; // 既存の tt- スタイルを流用

export default function JsonTool() {
  const [input, setInput] = useState<string>('');
  const [indent, setIndent] = useState<IndentKind>('2');
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [minify, setMinify] = useState<boolean>(false);

  const { output, error } = useMemo(() => {
    try {
      const out = formatJson({ input, indent, sortKeys, minify });
      return { output: out, error: '' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { output: '', error: `JSON の解析に失敗しました: ${msg}` };
    }
  }, [input, indent, sortKeys, minify]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      alert('整形結果をコピーしました');
    } catch {
      alert('コピーに失敗しました');
    }
  };

  return (
    <div className="tt-container">
      <h1 className="tt-title">JSON フォーマッタ</h1>

      <section className="tt-section">
        <h2 className="tt-section__title">入力（JSON）</h2>
        <textarea
          className="tt-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='[{"key":"value"}]'
          rows={10}
        />
      </section>

      <section className="tt-section">
        <h2 className="tt-section__title">整形設定</h2>
        <div className="tt-form">
          <label className="tt-form__item">
            <span>インデント</span>
            <select
              className="tt-input"
              value={indent}
              onChange={e => setIndent(e.target.value as IndentKind)}
            >
              <option value="2">スペース 2</option>
              <option value="4">スペース 4</option>
              <option value="tab">タブ</option>
            </select>
          </label>

          <label className="tt-checkbox">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={e => setSortKeys(e.target.checked)}
            />
            キーをアルファベット順にソート
          </label>

          <label className="tt-checkbox">
            <input
              type="checkbox"
              checked={minify}
              onChange={e => setMinify(e.target.checked)}
            />
            最小化（詰めて出力）
          </label>
        </div>
      </section>

      <section className="tt-section">
        <div className="tt-section__header">
          <h2 className="tt-section__title">出力</h2>
          <div className="tt-actions">
            <button className="tt-btn" onClick={handleCopy} disabled={!output}>
              出力をコピー
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
          rows={10}
        />
      </section>
    </div>
  );
}
