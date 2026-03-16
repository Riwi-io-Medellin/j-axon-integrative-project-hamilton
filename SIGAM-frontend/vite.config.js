import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',

  build: {
    // Especifica el directorio de salida para el build.
    // Usamos resolve para asegurarnos de que la ruta sea absoluta.
    outDir: resolve(__dirname, 'dist'),
    // Limpia el directorio de salida antes de cada build.
    emptyOutDir: true,
  },
});
