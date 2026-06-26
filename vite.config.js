import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom lightweight compression plugin utilizing Node's built-in zlib module.
 * Automatically compiles Gzip compression variants for static scripts/styles on build completion.
 */
const customCompressionPlugin = () => {
  return {
    name: 'custom-gzip-compression',
    apply: 'build',
    closeBundle() {
      const distPath = path.resolve(__dirname, 'dist');
      
      const compressDir = (dir) => {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir);
        
        for (const entry of entries) {
          const entryPath = path.join(dir, entry);
          const stat = fs.statSync(entryPath);
          
          if (stat.isDirectory()) {
            compressDir(entryPath);
          } else if (/\.(js|css|html|svg)$/.test(entry)) {
            const rawData = fs.readFileSync(entryPath);
            const compressed = zlib.gzipSync(rawData, { level: 9 });
            fs.writeFileSync(`${entryPath}.gz`, compressed);
          }
        }
      };

      console.log('[Vite Build Optimize] Executing Gzip compression for static assets...');
      compressDir(distPath);
      console.log('[Vite Build Optimize] Gzip compression completed successfully.');
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    customCompressionPlugin()
  ],
  esbuild: {
    // Drop all console.log and debugger statements programmatically in production build
    drop: ['console', 'debugger']
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Code Splitting: Bundle heavy frameworks and libraries into distinct chunks
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core react modules chunk
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            // Analytical components and charting icons chunk
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('lucide-react') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // General utilities chunk
            return 'vendor-others';
          }
        }
      }
    }
  }
});
