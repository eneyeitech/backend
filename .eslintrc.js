module.exports = {
  env: {
    browser: true, // You can remove this line if you only have Node.js code
    commonjs: true,
    es2021: true,
    node: true, // Make sure 'node: true' is present for Node.js globals
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12, // Or a higher version like 2021 or latest
  },
  rules: {
    // This is where you can add overrides for rules you want to change
    // For example, to allow console.log during development:
    // 'no-console': 'off',
    // To allow Node.js specific global like process.env if ESLint complains:
    // 'no-restricted-syntax': 'off',
    // 'no-param-reassign': 'off', // Common for Mongoose .save() or updates
    // 'consistent-return': 'off', // Sometimes needed with async/await error handling
  },
};
