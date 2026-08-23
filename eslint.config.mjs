import js from '@eslint/js';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'test/legacy/**', 'demo/**']
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      'no-var': 'off',
      eqeqeq: 'off',
      'no-redeclare': 'off',
      // 重抛错误不带 cause，保持旧版行为
      'preserve-caught-error': 'off',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }]
    }
  },
  {
    files: ['test/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly'
      }
    }
  }
];
