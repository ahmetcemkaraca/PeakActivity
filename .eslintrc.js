module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './functions/tsconfig.json', './aw-server/aw-webui/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'prefer-arrow'
  ],
  rules: {
    // TypeScript specific rules to eliminate 'any'
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-implicit-any-catch': 'error',
    '@typescript-eslint/no-unsafe-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    
    // Function and return type annotations
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/typedef': [
      'warn',
      {
        'arrayDestructuring': false,
        'arrowParameter': true,
        'memberVariableDeclaration': true,
        'objectDestructuring': false,
        'parameter': true,
        'propertyDeclaration': true,
        'variableDeclaration': false,
        'variableDeclarationIgnoreFunction': true
      }
    ],
    
    // Null safety rules
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    
    // Code quality rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }
    ],
    '@typescript-eslint/no-unused-expressions': 'error',
    '@typescript-eslint/no-duplicate-enum-values': 'error',
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/prefer-for-of': 'warn',
    '@typescript-eslint/prefer-includes': 'warn',
    '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
    
    // Import rules
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'pathGroups': [
          {
            'pattern': '~/**',
            'group': 'internal'
          },
          {
            'pattern': '@/**',
            'group': 'internal'
          }
        ],
        'pathGroupsExcludedImportTypes': ['builtin'],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }
    ],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off', // TypeScript handles this
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    
    // General code quality
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-alert': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow/prefer-arrow-functions': [
      'warn',
      {
        'disallowPrototype': true,
        'singleReturnOnly': false,
        'classPropertiesAllowed': false
      }
    ],
    
    // Error handling
    'no-throw-literal': 'error',
    '@typescript-eslint/only-throw-error': 'error',
    
    // Performance
    'no-await-in-loop': 'warn',
    'prefer-promise-reject-errors': 'error',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    },
    {
      files: ['*.vue'],
      extends: [
        'plugin:vue/vue3-essential',
        'plugin:vue/vue3-strongly-recommended',
        'plugin:vue/vue3-recommended'
      ],
      rules: {
        'vue/component-definition-name-casing': ['error', 'PascalCase'],
        'vue/component-name-in-template-casing': ['error', 'kebab-case'],
        'vue/no-v-html': 'warn',
        'vue/require-default-prop': 'error',
        'vue/require-prop-types': 'error',
        'vue/no-unused-components': 'error',
        'vue/no-unused-vars': 'error'
      }
    },
    {
      files: ['functions/src/**/*.ts'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        'no-console': 'off' // Console is acceptable in Firebase Functions
      }
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts'],
      env: {
        jest: true,
        node: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        'prefer-arrow/prefer-arrow-functions': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'lib/',
    'build/',
    'coverage/',
    '*.min.js',
    'aw-core/',
    'static/',
    'public/'
  ]
};
