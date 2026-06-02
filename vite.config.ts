import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const frontendHost = env.FRONTEND_HOST || '0.0.0.0';
  const frontendPort = Number.parseInt(env.FRONTEND_PORT || '3002', 10);
  const backendUrl = env.BACKEND_URL || `http://127.0.0.1:${env.BACKEND_PORT || '3003'}`;

  return {
    publicDir: false,
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/assets': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
    },
  };
});
