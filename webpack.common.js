const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  plugins: [
    new MiniCssExtractPlugin()
  ],
  entry: {
    background: './src/background.ts',
    index: './src/index.ts',
    options: './src/options.ts',
    popup: './src/popup.ts'
  },
  output: {
    clean: true,
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      loader: 'ts-loader'
    }, {
      test: /\.(less)$/,
      use: [
        MiniCssExtractPlugin.loader,
        "css-loader",
        "less-loader"
      ]
    }]
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src')
    ],
    extensions: ['.js', '.ts']
  }
}
