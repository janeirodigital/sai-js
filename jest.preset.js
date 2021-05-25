module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/test/.*-test.ts$',
  moduleFileExtensions: [ 'js', 'ts' ],
  collectCoverage: false,
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};