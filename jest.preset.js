/* eslint-disable no-undef */
module.exports = {
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  testRegex: '/test/.*-test.ts$',
  moduleFileExtensions: ['js', 'ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }]
  },
  setupFilesAfterEnv: ['../../setup-jest.js']
};
