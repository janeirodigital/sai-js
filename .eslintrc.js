module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'plugin:monorepo/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: [
    '*.d.ts',
  ],
  rules: {
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    'no-restricted-syntax': 'off',
    'max-len': ['error', { code: 120 }],
  },
  env: {
    browser: true,
  },
};
