import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Bind mount de Docker en Windows: los eventos de archivo del host no
    // llegan al watcher nativo dentro del contenedor — sin polling, Vite
    // nunca se entera de los cambios y sirve el bundle viejo indefinidamente.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
