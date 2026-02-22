import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': 'http://localhost:3002'
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
