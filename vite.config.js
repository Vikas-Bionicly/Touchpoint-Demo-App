import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves from https://<user>.github.io/<repo>/ — relative base avoids 404s when
// the repo name differs from a hardcoded path. Override with VITE_BASE if needed.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? './',
});
