import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import tsparser from '@typescript-eslint/parser'
import pluginVue from 'eslint-plugin-vue'
import vueparser from 'vue-eslint-parser'

export default tseslint.config(
  { ignores: ['**/dist/', '**/coverage/','**/src/**/*.d.ts', '**/test/**/*.d.ts'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      parser: vueparser,
      parserOptions: {
        parser: tsparser,
        sourceType: "module"
      },
    },
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
      'consistent-return': 'off',
      'vue/multi-word-component-names': 'off'
    },
  }
)
