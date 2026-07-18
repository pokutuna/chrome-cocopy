const {defineConfig} = require('eslint/config');
const globals = require('globals');
const gts = require('gts');
const vitest = require('@vitest/eslint-plugin');
const react = require('eslint-plugin-react');

module.exports = defineConfig([
  {
    ignores: ['build/', '**/node_modules/', 'src/**/*.ajv.js'],
  },
  ...gts,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {react},
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'node/no-unpublished-import': 'off',
      'node/no-unpublished-require': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/display-name': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}'],
    plugins: {vitest},
    languageOptions: {
      globals: {
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },
    rules: {
      ...vitest.configs.recommended.rules,
      // gallery/gallery.test.ts builds test titles from yaml category
      // names read at runtime, which this rule can't statically verify.
      'vitest/valid-title': 'off',
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
]);
