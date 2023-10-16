module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'plugin:monorepo/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  ignorePatterns: ['*.d.ts'],
  rules: {
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    'no-restricted-syntax': 'off',
    'no-useless-constructor': 'off',
    'no-empty-function': ['error', { 'allow': ['constructors'] }],
    'dot-notation': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'warn',
  },
  overrides: [
    {
      files: ['*-test.ts'],
      rules: {
        'import/first': 'off'
      }
    }
  ],
  env: {
    browser: true
  }
};
