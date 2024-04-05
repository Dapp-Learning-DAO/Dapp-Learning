/* eslint-disable @typescript-eslint/no-var-requires */

const { merge } = require("webpack-merge");

const common = require("./common.config.js");

const config = merge(common, {
  mode: "development",
  devtool: "source-map",
});

module.exports = config;
