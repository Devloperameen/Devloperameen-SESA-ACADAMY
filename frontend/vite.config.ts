import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    // Base path for production deployment
    base: mode === 'production' ? '/' : '/',
    // Environment variable configuration
    define: {
      'process.env': env
    },
    // Build optimization
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
            charts: ['recharts'],
            utils: ['axios', '@tanstack/react-query']
          }
        }
      }
    },
    // Preview server for production build
    preview: {
      port: 3000,
      host: true
    }
  }
})
