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
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          // Ensure SSE isn't buffered by Vite
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              if (req.url && req.url.includes('/notifications/stream')) {
                proxyReq.setHeader('Cache-Control', 'no-cache');
                proxyReq.setHeader('Connection', 'keep-alive');
                proxyReq.setHeader('X-Accel-Buffering', 'no'); // Prevent buffering in Vite & Nginx
              }
            });

            // Also listen to the proxy response and ensure headers are flush
            proxy.on('proxyRes', (proxyRes, req, res) => {
              if (req.url && req.url.includes('/notifications/stream')) {
                proxyRes.headers['Cache-Control'] = 'no-cache';
                proxyRes.headers['X-Accel-Buffering'] = 'no';
              }
            });
          }
        }
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
