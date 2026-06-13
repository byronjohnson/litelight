import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { gzipSync } from 'zlib';
import { transform } from 'lightningcss';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function logBundleSizes(fileName, source) {
  const buffer = Buffer.isBuffer(source) ? source : Buffer.from(source);
  const gzipBytes = gzipSync(buffer).length;
  console.log(`  ${fileName}: ${formatSize(buffer.length)} raw, ${formatSize(gzipBytes)} gzip`);
}

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
    minify: true
  },
  plugins: [
    {
      name: 'build-css',
      generateBundle(_options, bundle) {
        const cssPath = resolve(__dirname, 'lite-light.css');

        if (!fs.existsSync(cssPath)) {
          console.error('CSS file not found:', cssPath);
          return;
        }

        const css = fs.readFileSync(cssPath, 'utf-8');
        const { code } = transform({
          filename: 'lite-light.css',
          code: Buffer.from(css),
          minify: true
        });

        this.emitFile({
          type: 'asset',
          fileName: 'lite-light.min.css',
          source: code
        });

        const typesPath = resolve(__dirname, 'lite-light.d.ts');
        if (fs.existsSync(typesPath)) {
          this.emitFile({
            type: 'asset',
            fileName: 'lite-light.d.ts',
            source: fs.readFileSync(typesPath, 'utf-8')
          });
        }

        console.log('Bundle sizes:');
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'chunk') {
            logBundleSizes(fileName, chunk.code);
          }
        }
        logBundleSizes('lite-light.min.css', code);
      },
      writeBundle(_options, bundle) {
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'asset' && fileName.endsWith('.d.ts')) {
            logBundleSizes(fileName, chunk.source);
          }
        }

        const esmGzip = bundle['lite-light.min.js']?.type === 'chunk'
          ? gzipSync(Buffer.from(bundle['lite-light.min.js'].code)).length
          : 0;
        const cssGzip = bundle['lite-light.min.css']?.type === 'asset'
          ? gzipSync(Buffer.from(bundle['lite-light.min.css'].source)).length
          : 0;

        if (esmGzip && cssGzip) {
          console.log(`  ESM + CSS total: ${formatSize(esmGzip + cssGzip)} gzip`);
        }
      }
    }
  ]
});
