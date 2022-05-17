const exec = require('child_process').exec;
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {LicenseWebpackPlugin} = require('license-webpack-plugin');

function versionName() {
  return new Promise((resolve, reject) => {
    exec('git describe --tags --always --dirty', (err, stdout, _stderr) =>
      err ? reject(err) : resolve(`Build ${stdout.replace('\n', '')}`)
    );
  });
}

module.exports = {
  mode: 'development',
  entry: {
    // Stop context menu feature on c44a127b
    // eventpage: './src/eventpage.ts',
    sandbox: './src/sandbox.ts',
    popup: './src/popup.tsx',
    options: './src/options.tsx',
  },
  output: {
    path: `${__dirname}/build/`,
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
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
    new LicenseWebpackPlugin({
      perChunkOutput: false,
      licenseTextOverrides: {
        // LICENSE file is not included in the package
        'styled-components':
          'https://github.com/styled-components/styled-components/blob/master/LICENSE',
        isarray: 'https://github.com/juliangruber/isarray/blob/master/LICENSE',
      },
    }),
  ],
  performance: {
    maxEntrypointSize: 2000000,
    maxAssetSize: 2000000,
  },
  devtool: 'inline-source-map',
};
