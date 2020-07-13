const exec = require('child_process').exec;
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function versionName() {
  return new Promise((resolve, reject) => {
    exec('git describe --tags --always --dirty', (err, stdout, _stderr) =>
      err ? reject(err) : resolve('Build ' + stdout.replace('\n', ''))
    );
  });
}

module.exports = {
  mode: 'development',
  entry: {
    eventpage: './src/eventpage.ts',
    sandbox: './src/sandbox.ts',
    popup: './src/popup.tsx',
    options: './src/options.tsx',
  },
  output: {
    path: __dirname + '/build/',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-typescript',
                '@babel/preset-react',
                '@emotion/babel-preset-css-prop',
              ],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({cleanStaleWebpackAssets: false}),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          transform: (content, _path) => {
            return versionName().then(versionName => {
              return JSON.stringify({
                ...JSON.parse(content.toString()),
                version: process.env.npm_package_version,
                version_name: versionName,
              });
            });
          },
        },
        {
          from: 'src/img/',
          to: 'img/',
        },
      ],
    }),
    new HtmlWebpackPlugin({
      chunks: ['eventpage'],
      template: 'src/eventpage.html',
      filename: 'eventpage.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['sandbox'],
      template: 'src/sandbox.html',
      filename: 'sandbox.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['popup'],
      template: 'src/popup.html',
      filename: 'popup.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['options'],
      template: 'src/options.html',
      filename: 'options.html',
    }),
  ],
  devtool: 'inline-source-map',
};
