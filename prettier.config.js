// for more details https://prettier.io/docs/en/configuration.html
// prettier.config.js or .prettierrc.js
module.exports = {
  trailingComma: 'es5',
  tabWidth: 2,
  Tabs: false,
  overrides: [
    {
      files: ['*.js', '*.ts'],
      options: {
        semi: true,
        singleQuote: true,
      },
    },
    // solidity
    {
      files: '*.sol',
      options: {
        semi: false,
        tabWidth: 4,
        printWidth: 120,
      },
    },
  ],
};
