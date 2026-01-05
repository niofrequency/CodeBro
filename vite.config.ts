import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load all env variables from the current directory
    const env = loadEnv(mode, '.', '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // This ensures the code in grokService.ts can find the key
        'process.env.API_KEY': JSON.stringify(env.VITE_XAI_API_KEY),
        'process.env.VITE_XAI_API_KEY': JSON.stringify(env.VITE_XAI_API_KEY),
        // Keeping GEMINI for backward compatibility if needed
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_XAI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});