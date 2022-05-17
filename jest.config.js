module.exports = {
  // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets/
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./src/jest.setup.js'],
  moduleNameMapper: {
    '^.+\\.(css|sass|scss|less)$': 'identity-obj-proxy',
  },
};
