 import react from '@vitejs/plugin-react';
 import path from 'path';
 import { fileURLToPath } from 'url';
 import { defineConfig } from 'vitest/config';
 
 const __dirname = path.dirname(fileURLToPath(import.meta.url));
 
 export default defineConfig({
   plugins: [react()],
   resolve: {
     alias: {
       '@': path.resolve(__dirname, 'src'),
     },
   },
   test: {
     environment: 'jsdom',
     include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
