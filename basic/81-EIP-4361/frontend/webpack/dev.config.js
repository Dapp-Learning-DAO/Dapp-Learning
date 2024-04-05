/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

const { merge } = require("webpack-merge");

const common = require("./common.config.js");

const config = merge(common, {
  mode: "development",
  devtool: "source-map",
  devServer: {
    port: 3000,
    open: true,
    hot: true,
    static: path.resolve("./dist"),
    historyApiFallback: true,
  },
});

module.exports = config;
