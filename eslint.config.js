import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

export default [{
  files: ['apps/web/src/**/*.{ts,tsx}'],
  ignores: ['**/dist/**'],
  languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' } },
  plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooks },
  rules: { 'no-console': 'warn', ...tsPlugin.configs.recommended.rules, ...reactHooks.configs.recommended.rules }
}];
