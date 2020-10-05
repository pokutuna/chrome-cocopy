module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./src/jest.setup.js'],
  moduleNameMapper: {
    '^react$': 'preact/compat',
    '^react-dom$': 'preact/compat',
    '^.+\\.(css|sass|scss|less)$': 'identity-obj-proxy',
  },
};
