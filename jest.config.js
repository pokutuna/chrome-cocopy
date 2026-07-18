module.exports = {
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets/
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./src/jest.setup.js'],
  // e2e/ holds Playwright specs, run via `pnpm e2e`, not Jest.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest'],
  },
  moduleNameMapper: {
    '^.+\\.(css|sass|scss|less)$': 'identity-obj-proxy',
  },

  // https://github.com/react-dnd/react-dnd/issues/3443
  // pnpm nests packages under node_modules/.pnpm/<pkg>/node_modules/<pkg>,
  // so the pattern must also let the `.pnpm` segment through.
  transformIgnorePatterns: [
    '/node_modules/(?!\\.pnpm|react-dnd|dnd-core|@react-dnd)',
  ],
};
