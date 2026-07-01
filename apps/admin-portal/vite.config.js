import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Impor di sini

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  build: {
    // Tambahkan baris ini agar folder asset admin bernama unik dan tidak tabrakan
    assetsDir: 'admin-assets' 
  },
  plugins: [
    react(),
    tailwindcss(), // <-- Tambahkan di dalam array plugins
  ],
})