import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true,
        // Туннели (tuna, ngrok и т.д.): поддомен меняется — разрешаем все host
        allowedHosts: true,
        proxy: {
            '/api': {
                // Docker: nginx на :80 → app-1/app-2. Локальный jar без Docker — :8080
                target: process.env.VITE_DEV_API_PROXY ?? 'http://localhost:80',
                changeOrigin: true,
                timeout: 600000,
                proxyTimeout: 600000,
            },
        },
    },
    build: {
        chunkSizeWarningLimit: 1000, // Увеличиваем лимит до 1 MB
    },
});
