module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: [
    'plugin:vue/essential',
    'standard'
  ],
  plugins: [
    'vue'
  ],
  globals: {
    '_PRO_CONFIG': 'readonly',
  },
  rules: {
    'brace-style': 'off',
    'vue/no-parsing-error': [2, { 'x-invalid-end-tag': false }],
    camelcase: 'off',
    '@typescript-eslist/camelcase': 0,
    'generator-star-spacing': 'off',
    'no-array-constructor ': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-implicit-globals': 'off',
    'no-new': 'off',
    'no-useless-escape': 'off',
    'new-parens': 'off',
    'one-var': 'off',
    'prefer-promise-reject-errors': 'off',
    'space-before-function-paren': 'off'
  }
}
