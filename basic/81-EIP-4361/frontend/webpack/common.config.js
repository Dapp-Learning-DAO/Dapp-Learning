/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

/** @type {import('webpack').Configuration} */
const config = {
  entry: path.resolve("src/index.tsx"),
  output: {
    filename: "js/[name].[contenthash:8].js",
    path: path.resolve("dist"),
    publicPath: "/",
  },
  resolve: {
    extensions: [".ts", ".tsx", "..."],
    alias: {
      "@": path.resolve("src"),
    },
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      vm: require.resolve("vm-browserify"),
    },
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },
      {
        test: /\.css/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
          },
          {
            loader: "postcss-loader",
          },
        ],
      },
      {
        test: /\.less/,

        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[path]__[name]__[local]",
              },
            },
          },
          {
            loader: "postcss-loader",
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg|docx)$/,
        type: "asset",
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process",
      Buffer: ["buffer", "Buffer"],
    }),
    new HtmlWebpackPlugin({
      title: "EIP-4361以太坊登录",
      template: path.resolve("public/index.html"),
      favicon: path.resolve("public/favicon.ico"),
    }),
    new MiniCssExtractPlugin({
      filename: "css/[contenthash].[name].css",
    }),
    new CleanWebpackPlugin(),
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendors: {
          name: `vendors`,
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          filename: "js/common/[name].[contenthash].js",
        },
      },
    },
  },
};

module.exports = config;
