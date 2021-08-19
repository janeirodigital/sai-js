module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/test/.*-test.ts$',
  moduleFileExtensions: ['js', 'ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  setupFilesAfterEnv: ['../../setup-jest.js']
};
