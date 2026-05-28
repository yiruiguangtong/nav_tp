import { cpSync, existsSync } from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'github' ? '/navigation_tp/' : '/',
  plugins: [
    {
      name: 'copy-glb-assets',
      closeBundle() {
        if (existsSync('glb')) {
          cpSync('glb', 'dist/glb', { recursive: true });
        }
      }
    }
  ]
}));
