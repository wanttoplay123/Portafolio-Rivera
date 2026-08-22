import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  /* En GitHub Pages de proyecto el sitio cuelga de /<repo>/, así que la base la
     pasa el flujo de despliegue por entorno; en local y en Netlify vale '/'. */
  base: process.env.VITE_BASE || '/',
  build: {
    // three + drei + fiber pesan más que todo lo demás junto y solo hacen
    // falta para el polvo del fondo, que se carga aparte (ver App.jsx). Con
    // los trozos separados, esa descarga no bloquea la primera pintura.
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['framer-motion'],
          react: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
