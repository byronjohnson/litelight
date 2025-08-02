import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'lite-light.js'),
      name: 'LiteLight',
      fileName: (format) => `lite-light.${format === 'es' ? 'min' : format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: [
        {
          format: 'es',
          entryFileNames: 'lite-light.min.js',
          exports: 'named'
        },
        {
          format: 'umd',
          name: 'LiteLight',
          entryFileNames: 'lite-light.umd.min.js',
          exports: 'named'
        }
      ]
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: true // Uses esbuild by default (faster than terser)
  },
  plugins: [
    {
      name: 'build-css',
      buildStart() {
        console.log('Starting CSS processing...');
      },
      generateBundle() {
        const cssPath = resolve(__dirname, 'lite-light.css');
        
        if (!fs.existsSync(cssPath)) {
          console.error('CSS file not found:', cssPath);
          return;
        }
        
        // Read the original CSS
        const css = fs.readFileSync(cssPath, 'utf-8');
        
        // Create minified version
        const minifiedCSS = css
          // Remove comments
          .replace(/\/\*[\s\S]*?\*\//g, '')
          // Remove extra whitespace and line breaks
          .replace(/\s+/g, ' ')
          // Remove spaces around specific characters
          .replace(/\s*{\s*/g, '{')
          .replace(/\s*}\s*/g, '}')
          .replace(/\s*,\s*/g, ',')
          .replace(/\s*:\s*/g, ':')
          .replace(/\s*;\s*/g, ';')
          .replace(/;\s*}/g, '}')
          .replace(/\s*>\s*/g, '>')
          .replace(/\s*\+\s*/g, '+')
          .replace(/\s*~\s*/g, '~')
          // Remove leading/trailing whitespace
          .trim();
        
        // Emit the minified CSS file
        this.emitFile({
          type: 'asset',
          fileName: 'lite-light.min.css',
          source: minifiedCSS
        });
        
        console.log('✓ CSS minified and added to bundle');
      }
    }
  ]
});