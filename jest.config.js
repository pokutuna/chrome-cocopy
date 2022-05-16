module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./src/jest.setup.js'],
  moduleNameMapper: {
    '^react$': 'preact/compat',
    '^react-dom$': 'preact/compat',
    '^react-dom/test-utils$': 'preact/test-utils',
    '^.+\\.(css|sass|scss|less)$': 'identity-obj-proxy',
    '^react/jsx-runtime$': 'preact-jsx-runtime',
  },
};
