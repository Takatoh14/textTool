// src/App.tsx
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import CsvTool from './features/csvTool/CsvTool';
import JsonTool from './components//jsonTool/JsonTool';
import TextTool from './features/textTool/TextTool';

export default function App() {
  return (
    <Router>
      <div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>テキスト操作ツール集</h1>

        {/* ナビゲーション */}
        <nav style={{ marginBottom: '1rem' }}>
          <Link to="/" style={{ marginRight: 12 }}>
            テキスト置換
          </Link>
          <Link to="/json" style={{ marginRight: 12 }}>
            JSON整形
          </Link>
          <Link to="/csv">JSON→CSV/TSV</Link>
        </nav>

        {/* ルーティング */}
        <Routes>
          <Route path="/" element={<TextTool />} />
          <Route path="/json" element={<JsonTool />} />
          <Route path="/csv" element={<CsvTool />} />
        </Routes>
      </div>
    </Router>
  );
}
