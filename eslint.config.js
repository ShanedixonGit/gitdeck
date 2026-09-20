import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteConfig from './svelte.config.js';

export default tseslint.config(
  { ignores: ['.wxt/**', '.output/**', 'node_modules/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, svelteConfig },
    },
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['scripts/**/*.mjs', '*.config.{js,ts}'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
);
