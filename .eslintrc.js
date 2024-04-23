module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  plugins: ['@typescript-eslint', 'eslint-plugin-vue'],
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    'airbnb-base',
    'plugin:monorepo/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  ignorePatterns: ['*.d.ts'],
  rules: {
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-restricted-syntax': 'off',
    'no-useless-constructor': 'off',
    'no-empty-function': ['error', { 'allow': ['constructors'] }],
    'dot-notation': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'warn',
    'consistent-return': 'off'
  },
  overrides: [
    {
      files: ['*-test.ts'],
      rules: {
        'import/first': 'off'
      }
    },
    {
      files: ['*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off'
      }
    }
  ],
  env: {
    browser: true
  }
};
