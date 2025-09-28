import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - only run when ANALYZE=true
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      // Package aliases are resolved from node_modules automatically
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    // Increase warning limit temporarily while we optimize
    chunkSizeWarningLimit: 600, // Lower this to see what's actually large
    rollupOptions: {
      output: {
        // Aggressive chunking strategy to force code splitting
        manualChunks: (id) => {
          // First check if it's a node_modules dependency
          if (id.includes('node_modules')) {
            // React ecosystem - keep React and React-DOM together for better caching
            if (id.includes('react') && !id.includes('react-router') && !id.includes('react-hook-form')) {
              return 'react-core';
            }
            
            // React Router - separate chunk
            if (id.includes('react-router')) {
              return 'react-router';
            }
            
            // Charts - definitely separate (recharts is large)
            if (id.includes('recharts')) {
              return 'charts';
            }
            
            // UI libraries - group all Radix components
            if (id.includes('@radix-ui')) {
              return 'ui-radix';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'forms';
            }
            
            // Animation libraries
            if (id.includes('framer-motion') || id.includes('@formkit/auto-animate')) {
              return 'animations';
            }
            
            // Icons and utilities
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            
            // Styling utilities
            if (id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui-utils';
            }
            
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            
            // Notifications
            if (id.includes('sonner') || id.includes('next-themes') || id.includes('vaul')) {
              return 'ui-extras';
            }
            
            // TanStack Query
            if (id.includes('@tanstack')) {
              return 'tanstack';
            }
            
            // Blok SDK packages
            if (id.includes('@well-prado/blok-')) {
              return 'blok-sdk';
            }
            
            // Any other node_modules - create individual chunks for larger packages
            const chunks = id.split('node_modules/')[1].split('/');
            const packageName = chunks[0].startsWith('@') ? `${chunks[0]}/${chunks[1]}` : chunks[0];
            
            // Group very small packages together
            const tinyPackages = ['tslib', 'scheduler', 'use-sync-external-store'];
            if (tinyPackages.includes(packageName)) {
              return 'vendor-tiny';
            }
            
            // Everything else gets its own chunk
            return `vendor-${packageName.replace('@', '').replace('/', '-')}`;
          }
          
          // App code chunking - more aggressive
          if (id.includes('/src/pages/')) {
            // Each page gets its own chunk
            const pageName = id.split('/src/pages/')[1].split('.')[0];
            return `page-${pageName.toLowerCase()}`;
          }
          
          if (id.includes('/src/components/ui/')) {
            return 'ui-components';
          }
          
          if (id.includes('/src/components/')) {
            return 'components';
          }
          
          if (id.includes('/src/contexts/')) {
            return 'contexts';
          }
          
          if (id.includes('/src/lib/')) {
            return 'lib';
          }
          
          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
        }
      }
    }
  },
  server: {
    port: 5173, // Standard Vite port
    host: '0.0.0.0', // Allow external connections
    strictPort: true, // Don't try other ports if 5173 is busy
    cors: true, // Enable CORS for cross-origin requests
    origin: 'http://localhost:5173', // Explicit origin for HMR
    proxy: {
      // Proxy API calls to the Express backend
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying for HMR
      },
      // Proxy uploads to the Express backend
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy health-check and metrics to the Express backend
      '/health-check': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/metrics': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: {
      port: 5173,
      host: 'localhost',
      clientPort: 5173, // Force client to use port 5173
    }
  }
})