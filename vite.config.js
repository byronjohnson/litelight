import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { transform } from 'lightningcss';

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
        
        // Minify with LightningCSS (spec-compliant, handles calc/nesting/etc.)
        const { code } = transform({
          filename: 'lite-light.css',
          code: Buffer.from(css),
          minify: true
        });
        
        // Emit the minified CSS file
        this.emitFile({
          type: 'asset',
          fileName: 'lite-light.min.css',
          source: code
        });
        
        console.log('✓ CSS minified and added to bundle');
      }
    }
  ]
});
