import * as path from 'path';

import {defineConfig} from 'vite';
import license from 'rollup-plugin-license';

import {manifestPlugin} from './scripts/vite-manifest-plugin';
import packageJson from './package.json';

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');

// Fallback license texts for packages whose published tarball omits a
// LICENSE file. Mirrors licenseTextOverrides from the previous
// license-webpack-plugin config.
const licenseTextOverrides: Record<string, string> = {
  'styled-components':
    'https://github.com/styled-components/styled-components/blob/master/LICENSE',
  isarray: 'https://github.com/juliangruber/isarray/blob/master/LICENSE',
  '@react-dnd/invariant':
    'https://github.com/react-dnd/react-dnd/blob/main/LICENSE',
  '@react-dnd/shallowequal':
    'https://github.com/react-dnd/react-dnd/blob/main/LICENSE',
};

export default defineConfig({
  root: srcDir,
  base: './',
  publicDir: false,
  build: {
    outDir: path.join(rootDir, 'build'),
    emptyOutDir: true,
    minify: false,
    sourcemap: 'inline',
    rollupOptions: {
      input: {
        popup: path.join(srcDir, 'popup.html'),
        options: path.join(srcDir, 'options.html'),
        sandbox: path.join(srcDir, 'sandbox.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  plugins: [
    manifestPlugin({
      srcManifest: path.join(srcDir, 'manifest.json'),
      srcImgDir: path.join(srcDir, 'img'),
      packageVersion: packageJson.version,
    }),
    license({
      thirdParty: {
        includePrivate: false,
        output: {
          file: path.join(rootDir, 'build', 'licenses.txt'),
          template(dependencies) {
            return dependencies
              .map(dependency => {
                const header = `${dependency.name}@${dependency.version} (${dependency.license ?? 'UNKNOWN'})`;
                const text =
                  dependency.licenseText ??
                  licenseTextOverrides[dependency.name] ??
                  '(license text not found)';
                return `${header}\n${'-'.repeat(header.length)}\n${text}`;
              })
              .join('\n\n');
          },
        },
      },
    }),
  ],
});
