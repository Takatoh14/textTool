import '../textTool/textTool.scss';

import { useMemo, useState } from 'react';

import type { ReactNode } from 'react';

/** 差分セグメント */
type Seg =
  | { type: 'equal'; text: string }
  | { type: 'add'; text: string }
  | { type: 'del'; text: string };

/** 改行コードの統一・必要なら空白の正規化も行う */
function normalize(
  s: string,
  opts: { normalizeNewline: boolean; ignoreMultipleSpaces: boolean }
): string {
  let out = opts.normalizeNewline ? s.replace(/\r\n?/g, '\n') : s;
  if (opts.ignoreMultipleSpaces) {
    // 連続する空白を1個にまとめる（タブも含める）
    out = out.replace(/[ \t]+/g, ' ');
  }
  return out;
}

/** 文字単位 LCS で a→b の差分を出す（equal / add / del） */
function diffChars(a: string, b: string): Seg[] {
  const n = a.length;
  const m = b.length;

  // DP テーブル
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // 復元
  const segs: Seg[] = [];
  let i = 0,
    j = 0;

  const push = (type: Seg['type'], text: string) => {
    if (!text) return;
    const last = segs[segs.length - 1];
    if (last && last.type === type) {
      // any を使わず安全にキャスト
      (last as Extract<Seg, { type: typeof type }>).text += text;
    } else {
      segs.push({ type, text } as Seg);
    }
  };

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('equal', a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('del', a[i]);
      i++;
    } else {
      push('add', b[j]);
      j++;
    }
  }
  while (i < n) push('del', a[i++]);
  while (j < m) push('add', b[j++]);

  return segs;
}

export default function DiffTool() {
  const [left, setLeft] = useState<string>('Hello World.\nLine2');
  const [right, setRight] = useState<string>('Hello  World!\nLine2');
  const [normalizeNewline, setNormalizeNewline] = useState(true);
  const [ignoreMultipleSpaces, setIgnoreMultipleSpaces] = useState(false);

  // 折返し制御（テキストエリア）
  const [noWrap, setNoWrap] = useState(false);

  const { equal, segs } = useMemo(() => {
    const A = normalize(left, { normalizeNewline, ignoreMultipleSpaces });
    const B = normalize(right, { normalizeNewline, ignoreMultipleSpaces });
    if (A === B) return { equal: true, segs: [] as Seg[] };
    return { equal: false, segs: diffChars(A, B) };
  }, [left, right, normalizeNewline, ignoreMultipleSpaces]);

  // 左用: equal + del を表示（add は表示しない）
  const renderLeft = useMemo<ReactNode>(() => {
    if (equal) return left;
    const parts: ReactNode[] = [];
    for (const s of segs) {
      if (s.type === 'equal' || s.type === 'del') {
        parts.push(
          <span
            key={parts.length}
            className={s.type === 'del' ? 'diff-del' : undefined}
          >
            {s.text}
          </span>
        );
      }
    }
    return parts;
  }, [equal, segs, left]);

  // 右用: equal + add を表示（del は表示しない）
  const renderRight = useMemo<ReactNode>(() => {
    if (equal) return right;
    const parts: ReactNode[] = [];
    for (const s of segs) {
      if (s.type === 'equal' || s.type === 'add') {
        parts.push(
          <span
            key={parts.length}
            className={s.type === 'add' ? 'diff-add' : undefined}
          >
            {s.text}
          </span>
        );
      }
    }
    return parts;
  }, [equal, segs, right]);

  return (
    <div className="tt-container">
      <h1 className="tt-title">差分比較</h1>

      <section className="tt-section">
        <div className="tt-form" style={{ gap: 16 }}>
          <label className="tt-checkbox">
            <input
              type="checkbox"
              checked={normalizeNewline}
              onChange={e => setNormalizeNewline(e.target.checked)}
            />
            改行コードを統一して比較（CRLF / LF / CR）
          </label>
          <label className="tt-checkbox">
            <input
              type="checkbox"
              checked={ignoreMultipleSpaces}
              onChange={e => setIgnoreMultipleSpaces(e.target.checked)}
            />
            連続する空白を 1 個にまとめて比較
          </label>
          <label className="tt-checkbox">
            <input
              type="checkbox"
              checked={noWrap}
              onChange={e => setNoWrap(e.target.checked)}
            />
            入力の折り返しなし（横スクロール）
          </label>
        </div>
      </section>

      {equal && (
        <div style={{ color: '#31c48d', marginBottom: 12 }}>
          ✅ 全て一致しています。
        </div>
      )}

      {/* 入力を左右2カラムに配置 */}
      <section className="tt-section two-col">
        <div>
          <div className="tt-section__title">左</div>
          <textarea
            className="tt-textarea"
            value={left}
            onChange={e => setLeft(e.target.value)}
            rows={14}
            wrap={noWrap ? 'off' : 'soft'}
            style={noWrap ? { overflow: 'auto' } : undefined}
          />
        </div>
        <div>
          <div className="tt-section__title">右</div>
          <textarea
            className="tt-textarea"
            value={right}
            onChange={e => setRight(e.target.value)}
            rows={14}
            wrap={noWrap ? 'off' : 'soft'}
            style={noWrap ? { overflow: 'auto' } : undefined}
          />
        </div>
      </section>

      <section className="tt-section">
        <h2 className="tt-section__title">結果</h2>

        <div className="diff-columns">
          <div className="diff-pane">
            <div className="diff-pane__title">左の結果</div>
            <pre className="diff-pre">{renderLeft}</pre>
          </div>
          <div className="diff-pane">
            <div className="diff-pane__title">右の結果</div>
            <pre className="diff-pre">{renderRight}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}
