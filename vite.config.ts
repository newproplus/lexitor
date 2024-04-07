/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// TODO: xadd
// import babel from '@rollup/plugin-babel';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import {replaceCodePlugin} from 'vite-plugin-replace';

import viteCopyEsm from './viteCopyEsm';
// TODO: xadd
// import moduleResolution from './viteModuleResolution';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './build',
    target: 'esnext',
    minify: 'terser',
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
    terserOptions: {
      compress: {
        toplevel: true,
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
    // TODO: xadd
    // babel({
    //   babelHelpers: 'bundled',
    //   babelrc: false,
    //   configFile: false,
    //   exclude: '/**/node_modules/**',
    //   extensions: ['jsx', 'js', 'ts', 'tsx', 'mjs'],
    //   plugins: [
    //     '@babel/plugin-transform-flow-strip-types',
    //     [
    //       require('../../scripts/error-codes/transform-error-messages'),
    //       {
    //         noMinify: true,
    //       },
    //     ],
    //   ],
    //   presets: ['@babel/preset-react'],
    // }),
    react(),
    viteCopyEsm(),
  ],
  resolve: {
    // TODO: xadd
    // alias: moduleResolution,
    alias: {
      '@': '/src',
      'shared/invariant': '/src/shared/invariant',
      'shared/environment': '/src/shared/environment',
      'shared/useLayoutEffect': '/src/shared/useLayoutEffect',
      'shared/canUseDOM': '/src/shared/canUseDOM',
    },
  },
});
