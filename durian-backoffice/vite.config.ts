import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile()

  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    // facultatif : limiter la taille des assets à inliner
    assetsInlineLimit: 100000000, // 100 Mo pour tout inliner
    rollupOptions: {
      output: {
        // pour que tous les imports JS/TS soient regroupés en un seul bundle
        inlineDynamicImports: true,
      },
    },
  },
})
