import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(pluginJs.configs.recommended, ...tseslint.configs.recommended, {
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
    },
    parserOptions: {
      project: ['tsconfig.json', 'tsconfig.dev.json'],
      sourceType: 'module',
    },
  },
  ignores: ['lib/**/*'], // Built dosyalarını yok say.
  rules: {
    quotes: ['off'],
    'import/no-unresolved': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
});
