const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const environment = require('./environment')

const templateFiles = fs.readdirSync(environment.paths.source)
  .filter((file) => ['.html', '.ejs'].includes(path.extname(file).toLocaleLowerCase()))
  .map((filename) => ({
    input: filename,
    output: filename.replace(/\.ejs$/, '.html')
  }))

const htmlPluginEntries = templateFiles.map((template) => new HtmlWebpackPlugin({
  inject: true,
  template: path.resolve(environment.paths.source, template.input),
  filename: template.output,
  minify: {
    collapseWhitespace: true,
    keepClosingSlash: true,
    removeComments: true,
    removeRedundantAttributes: false,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
  },
  chunks: [path.basename(template.input, '.html')]
}))

module.exports = {
  mode: 'production',
  entry: {
    index: path.resolve(environment.paths.source, 'index.js')
  },
  output: {
    path: environment.paths.output,
    filename: 'js/[contenthash].js',
    clean: true
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.(c|sa|sc)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.json$/,
        type: 'asset/resource',
        generator: {
          filename: 'data/[hash].json'
        }
      },
      {
        test: /\.(jpg|jpeg|png|gif|svg|webp)$/,
        type: 'asset/resource',
        parser: {
          dataUrlCondition: {
            maxSize: environment.limits.images,
          }
        },
        generator: {
          filename: 'assets/images/[hash][ext][query]'
        }
      },
      {
        test: /\.(eot|ttf|woff|woff2|otf)$/,
        type: 'asset/resource',
        parser: {
          dataUrlCondition: {
            maxSize: environment.limits.fonts,
          }
        },
        generator: {
          filename: 'assets/fonts/[hash][ext]'
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[contenthash].css'
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(environment.paths.source, 'assets/images'),
          to: 'assets/images',
          globOptions: {
            ignore: ['*.DS_Store', 'Thumbs.db'],
          },
          noErrorOnMissing: true
        }
      ]
    })
  ].concat(htmlPluginEntries),
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
      new JsonMinimizerPlugin()
    ]
  }
}