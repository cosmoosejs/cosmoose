import globals from 'globals';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,

  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {},
  },
];
