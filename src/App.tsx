// src/App.tsx
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import CsvToJsonTool from './features/csvToJson/CsvToJsonTool'; // ← 追加
import CsvTool from './features/csvTool/CsvTool';
import DiffTool from './features/diffTool/DiffTool';
import JsonTool from './components/jsonTool/JsonTool';
import TextTool from './features/textTool/TextTool';

export default function App() {
  return (
    <Router>
      <div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>テキスト操作ツール集</h1>

        <nav style={{ marginBottom: '1rem' }}>
          <Link to="/" style={{ marginRight: 12 }}>
            テキスト置換
          </Link>
          <Link to="/json" style={{ marginRight: 12 }}>
            JSON整形
          </Link>
          <Link to="/csv" style={{ marginRight: 12 }}>
            JSON→CSV/TSV
          </Link>
          <Link to="/csv-to-json" style={{ marginRight: 12 }}>
            CSV/TSV→JSON
          </Link>
          <Link to="/diff">差分比較</Link>
        </nav>

        <Routes>
          <Route path="/" element={<TextTool />} />
          <Route path="/json" element={<JsonTool />} />
          <Route path="/csv" element={<CsvTool />} />
          <Route path="/csv-to-json" element={<CsvToJsonTool />} />{' '}
          <Route path="/diff" element={<DiffTool />} />
          {/* ← 追加 */}
        </Routes>
      </div>
    </Router>
  );
}
