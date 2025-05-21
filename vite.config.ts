import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
    plugins: [react()],
    // SCSS 전역 사용
    server: {
        https: {
            key: fs.readFileSync('localhost-key.pem'),
            cert: fs.readFileSync('localhost.pem'),
        },
        port: 5173,
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "/src/assets/styles/main.scss" as *;`,
            },
        },
    },
});
