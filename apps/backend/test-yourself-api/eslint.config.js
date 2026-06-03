const js = require('@eslint/js');
const prettierPlugin = require('eslint-plugin-prettier');
const nodePlugin = require('eslint-plugin-n');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.nyc_output/**',
      'logs/**',
      '*.log',
      '.eslintrc.*',
      'eslint.config.*',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    plugins: {
      prettier: prettierPlugin,
      n: nodePlugin,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': ['error'],

      // Node.js specific rules
      'n/no-unsupported-features/es-syntax': 'off',
      'n/no-missing-require': 'error',
      'n/no-unpublished-require': 'off',
      'n/process-exit-as-throw': 'error',
      'n/no-process-exit': 'warn',

      // Best practices
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console in server-side code
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': ['error', 'never'],
      'prefer-destructuring': [
        'error',
        {
          array: false,
          object: true,
        },
      ],

      // Code quality
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-escape': 'error',
      'no-useless-return': 'error',
      'no-void': 'error',
      'no-with': 'error',
      'wrap-iife': ['error', 'inside'],
      yoda: ['error', 'never'],

      // Error prevention
      'no-undef': 'error',
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
        },
      ],

      // Style consistency (handled by Prettier)
      indent: 'off',
      quotes: 'off',
      semi: 'off',
      'comma-dangle': 'off',
      'max-len': 'off',
    },
  },
];
