import { useMemo, useState } from 'react';
import { replaceText, type ReplaceOptions } from '../../utils/textOps';
import { decodeEscapes } from '../../utils/decodeEscapes';
import './textTool.scss';

export default function TextTool() {
  const [input, setInput] = useState('Hello World. hello world.');
  const [pattern, setPattern] = useState('hello');
  const [replacement, setReplacement] = useState('\\t'); // 例: \t
  const [regex, setRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  // 置換文字列は「正規表現モードのときだけ」エスケープを解釈
  const replacementForUse = useMemo(
    () => (regex ? decodeEscapes(replacement) : replacement),
    [replacement, regex]
  );

  const output = useMemo(() => {
    const opts: ReplaceOptions = {
      input,
      pattern,
      replacement: replacementForUse,
      regex, // ← ユーザーのチェックをそのまま反映
      caseSensitive, // ← 同上
    };
    return replaceText(opts);
  }, [input, pattern, replacementForUse, regex, caseSensitive]);

  return (
    <div className="tt-container">
      <h1 className="tt-title">React Text Tool</h1>

      {/* 入力 */}
      <section className="tt-section">
        <h2 className="tt-section__title">入力</h2>
        <textarea
          className="tt-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={8}
          placeholder="ここにテキストを貼り付け"
        />
      </section>

      {/* 設定 */}
      <section className="tt-section">
        <h2 className="tt-section__title">置換設定</h2>

        <div className="tt-form">
          <label className="tt-form__item">
            <span>検索パターン</span>
            <input
              className="tt-input"
              type="text"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder="例) hello / ^a.b$ ..."
            />
          </label>

          <label className="tt-form__item">
            <span>置換文字列</span>
            <input
              className="tt-input"
              type="text"
              value={replacement}
              onChange={e => setReplacement(e.target.value)}
              placeholder="例) \\t や \\n（正規表現モード時のみ解釈）"
            />
          </label>

          <label className="tt-checkbox">
            <input
              type="checkbox"
              checked={regex}
              onChange={e => setRegex(e.target.checked)}
            />
            正規表現モード（ON で置換の \t / \n などを解釈）
          </label>

          <label className="tt-checkbox">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={e => setCaseSensitive(e.target.checked)}
            />
            大文字小文字を区別する
          </label>
        </div>
      </section>

      {/* 出力 */}
      <section className="tt-section">
        <div className="tt-section__header">
          <h2 className="tt-section__title">出力</h2>
          {/* コピーなどのボタンは既存のままでOK */}
        </div>
        <textarea
          className="tt-textarea tt-textarea--output"
          value={output}
          readOnly
          rows={8}
        />
      </section>
    </div>
  );
}
