import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';
import fs from 'fs';

export default defineConfig({
    plugins: [react()],
    server: {
        https: {
            key: fs.readFileSync('localhost-key.pem'),
            cert: fs.readFileSync('localhost.pem'),
        },
        port: 5173,
    },
    // SCSS 전역 사용
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "/src/assets/styles/main.scss" as *;`,
            },
        },
    },
});
