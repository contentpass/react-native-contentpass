const path = require('path');
const { FlatCompat } = require('@eslint/eslintrc');

const reactPlugin = require('eslint-plugin-react');
const prettierPlugin = require('eslint-plugin-prettier');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/lib/**',
      '**/ios/**',
      '**/android/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/babel.config.js',
    ],
  },
  ...compat.extends('@react-native', 'prettier'),
  {
    plugins: {
      react: reactPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-native/no-inline-styles': 'off',
      'no-console': 'off',
      'prettier/prettier': [
        'error',
        {
          quoteProps: 'consistent',
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          useTabs: false,
        },
      ],
    },
  },
];
