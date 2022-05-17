module.exports = {
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets/
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./src/jest.setup.js'],
  transformIgnorePatterns: ['/node_modules/(?!@testing-library/preact)/'],
  moduleNameMapper: {
    '^react$': 'preact/compat',
    '^react-dom$': 'preact/compat',
    '^react-dom/test-utils$': 'preact/test-utils',
    '^.+\\.(css|sass|scss|less)$': 'identity-obj-proxy',
    '^react/jsx-runtime$': 'preact/jsx-runtime',
  },
};
