import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'node:path'

const root = import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  // Set VITE_BASE=/repo-name/ when deploying to GitHub Pages under a subpath.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(root, './src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
