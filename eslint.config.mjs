import eslintPluginAstro from 'eslint-plugin-astro';
import tsLint from 'typescript-eslint';

export default tsLint.config(
  ...tsLint.configs.recommended,
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { 'allow': ['warn', 'error'] }],
    }
  },
  {
    files: ['tasks/**/*.ts'],
    rules: {
      'no-console': 'off',
    }
  },
  {
    ignores: ['dist/**', 'standalone/**', 'node_modules/**', '.astro/**', 'public/**'],
  }
);
