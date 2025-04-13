import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
    plugins: [react()],
    server: {
        https: {
            key: fs.readFileSync('localhost-key.pem'),
            cert: fs.readFileSync('localhost.pem'),
        },
        port: 5173,
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
            '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
            '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
            '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
            '@apis': fileURLToPath(new URL('./src/apis', import.meta.url)),
        },
    },
    // SCSS 전역 사용
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "@assets/styles/main.scss";`,
            },
        },
    },
});
