import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
      configure: (proxy) => {
        proxy.on('error', (err, req, res) => {
          if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') return;
        });
      },
    },
    '/socket.io': {
      target: 'http://127.0.0.1:5000',
      ws: true,
      changeOrigin: true,
      configure: (proxy) => {
        proxy.on('error', (err) => {
          if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') return;
        });
      },
    },
  },
},
});
