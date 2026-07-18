module.exports = {
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets/
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./src/jest.setup.js'],
  // e2e/ holds Playwright specs, run via `yarn e2e`, not Jest.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest'],
  },
  moduleNameMapper: {
    '^.+\\.(css|sass|scss|less)$': 'identity-obj-proxy',
  },

  // https://github.com/react-dnd/react-dnd/issues/3443
  transformIgnorePatterns: ['/node_modules/(?!react-dnd|dnd-core|@react-dnd)'],
};
