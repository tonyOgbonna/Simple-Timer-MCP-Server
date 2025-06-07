module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Make sure this is last in the extends array
  ],
  rules: {
    // Add any specific rule overrides here
    '@typescript-eslint/no-explicit-any': 'warn', // Example: change 'error' to 'warn'
  },
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json', // Point to your tsconfig.json
  },
  ignorePatterns: ['dist/**/*', 'node_modules/**/*', '.eslintrc.cjs', 'yarn.lock', 'package.json'],
};
