import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'], rollupTypes: true, aliasesExclude: [/^@/], }), 
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),  // ← ADD THIS
    },
  },

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TristateLoader',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
    },
    rollupOptions: {
      // React is a peer dependency — don't bundle it
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    // Fail the build if bundle exceeds this (keeps the library lean)
    chunkSizeWarningLimit: 15,
  },
});