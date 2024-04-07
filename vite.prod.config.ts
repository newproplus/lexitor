/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import {replaceCodePlugin} from 'vite-plugin-replace';

import viteCopyEsm from './viteCopyEsm';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './build',
    target: 'esnext',
    lib: {
      entry: 'src/App.tsx',
      name: 'Lexitor',
      formats: ['es'],
      fileName: (format) => `app.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },

    reportCompressedSize: false,
    sourcemap: false,
    // minify: true,
    minify: 'terser',
    terserOptions: {
      output: {
        comments: false,
        beautify: false,
      },
      compress: {
        toplevel: true,
        drop_console: true,
        collapse_vars: true,
        reduce_vars: true,
        drop_debugger: true,
        keep_infinity: true,
      },
    },
  },
  define: {
    'process.env.IS_PREACT': process.env.IS_PREACT,
  },
  plugins: [
    replaceCodePlugin({
      replacements: [
        {
          from: /__DEV__/g,
          to: 'true',
        },
      ],
    }),
    react(),
    viteCopyEsm(),
  ],
  resolve: {
    alias: {
      '@': '/src',
      'shared/invariant': '/src/shared/invariant',
      'shared/environment': '/src/shared/environment',
      'shared/useLayoutEffect': '/src/shared/useLayoutEffect',
      'shared/canUseDOM': '/src/shared/canUseDOM',
    },
  },
});
