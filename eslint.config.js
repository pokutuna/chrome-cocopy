const {defineConfig} = require('eslint/config');
const globals = require('globals');
const gts = require('gts');
const jest = require('eslint-plugin-jest');
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
    plugins: {jest, react},
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
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
      'jest/valid-title': 'off',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}'],
    ...jest.configs['flat/recommended'],
    rules: {
      'jest/valid-title': 'off',
    },
  },
  {
    files: ['webpack.config.js', 'jest.config.js', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
]);
