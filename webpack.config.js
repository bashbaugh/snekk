const webpack = require('webpack'),
  path = require('path'),
  CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin,
  MiniCssExtractPlugin = require('mini-css-extract-plugin'),
  CssMinimizerPlugin = require('css-minimizer-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin')
  WebpackObfuscator = require('webpack-obfuscator'),
  CopyWebpackPlugin = require('copy-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production'

const OBFUSCATE = true

/** Get correct path relative to root dir  */
const p = (l) => path.join(__dirname, '.', l)

const config = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    game: p('src/client/index.ts'),
  },
  output: {
    path: p('build'),
    filename: '[name].[contenthash].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', 'json'],
    modules: [
      p('src'),
      p('node_modules')
    ],
    alias: {
      'pixi.js': p('src/pixi.ts')
    }
  },
  module: {
    rules: [
      // TODO should we use Babel as well for JS?
      {
        test: /\.(js|tsx?)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: p('tsconfig.client.json')
            }
          }
        ]
      },
      {
        test: /\.(css)$/,
        use: [
          MiniCssExtractPlugin.loader, 
          'css-loader',
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: {
                  tailwindcss: {},
                  autoprefixer: {},
                }
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: new RegExp(
          '.(' + ['jpg', 'jpeg', 'png', 'gif', 'svg'].join('|') + ')$'
        ),
        use: 'file-loader?name=[name].[ext]',
        exclude: /node_modules/,
      },
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development' // default
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: p('static'),
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/client/html/index.html',
      chunks: ['game'],
      // cache: false
    }),
  ],
  devServer: {
    static: {
      directory: p('public')
    },
    port: 3000
  }
}

if (devMode) {
  config.devtool = 'eval-cheap-module-source-map'
  config.watchOptions = {
    ignored: /node_modules/,
  }
} else {
  config.optimization = {
    minimize: true,
    minimizer: [
      // '...',
      new CssMinimizerPlugin(),
    ],
  }

  if (OBFUSCATE) config.plugins.push(
    new WebpackObfuscator ({
      rotateStringArray: true
    })
  )

  config.plugins.push(
    new webpack.BannerPlugin({
      banner: `@license\nCOPYRIGHT (C) ${new Date().getFullYear()} BENJAMIN ASHBAUGH\nDO NOT MODIFY OR REDISTRIBUTE THIS FILE`,
      entryOnly: true,
    })
  )
}

module.exports = config
