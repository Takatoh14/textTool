// Viteのbaseを環境変数で切替（開発: "/", 本番: "/textTool/"）
import { defineConfig, loadEnv } from 'vite';

import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // .env.* もしくはビルド時の環境変数から読み込む
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE || '/'; // デフォルトはルート

  return {
    plugins: [react()],
    base,
  };
});
