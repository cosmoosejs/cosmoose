import js from '@eslint/js';
import nxPlugin from '@nx/eslint-plugin';
import stylisticPlugin from '@stylistic/eslint-plugin';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@nx': nxPlugin,
      '@typescript-eslint': tsPlugin,
      '@stylistic': stylisticPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,

      // Stylistic formatting rules (Airbnb-inspired)
      '@stylistic/indent': [ 'error', 2 ],
      '@stylistic/quotes': [ 'error', 'single' ],
      '@stylistic/semi': [ 'error', 'always' ],
      '@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
      '@stylistic/arrow-spacing': [ 'error', { before: true, after: true } ],
      '@stylistic/object-curly-spacing': [ 'error', 'always' ],
      '@stylistic/array-bracket-spacing': [ 'error', 'always' ],
      '@stylistic/space-before-function-paren': [ 'error', 'always' ],
      '@stylistic/keyword-spacing': [ 'error', { before: true, after: true } ],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/eol-last': 'error',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/no-multiple-empty-lines': [ 'error', { max: 1 } ],
      '@stylistic/brace-style': [ 'error', '1tbs' ],
      '@stylistic/jsx-quotes': [ 'error', 'prefer-double' ],

      // Non-stylistic rules that remain as regular ESLint rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'curly': [ 'error', 'all' ],
      'eqeqeq': [ 'error', 'always' ],
      'no-eq-null': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-duplicate-imports': 'error',

      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }],
        },
      ],
    },
  },

  stylisticPlugin.configs['disable-legacy'],

  {
    ignores: ['dist/', 'node_modules/', '.nx/'],
  },
];
