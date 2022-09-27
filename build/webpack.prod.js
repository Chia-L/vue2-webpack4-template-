'use strict'

const path = require('path')
const utils = require('./utils')
const webpack = require('webpack')
const config = require('./config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const webpackConfig = merge(baseWebpackConfig, {
  module: {
    // 把utils配置好的处理各种css类型的配置拿过来，和dev设置一样，
    // 就是这里多了个extract: true，此项是自定义项，设置为true表示，生成独立的文件
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true,
      usePostCSS: true
    })
  },
  // devtool开发工具，用来生成个sourcemap方便调试
  // 按理说这里不用生成sourcemap多次一举，这里生成了source-map类型的map文件，只用于生产环境
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  output: {
    // 打包后的文件放在dist目录里面
    path: config.build.assetsRoot,
    filename: utils.assetsPath('js/[name].[chunkhash].js'),
    chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
  },
  plugins: [
    new HardSourceWebpackPlugin({
      cacheDirectory: config.absoluteCachePath('hard-source')
    }),

    // 利用DefinePlugin插件，定义process.env环境变量为'production'
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    // UglifyJsPlugin插件是专门用来压缩js文件的
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          warnings: false
        }
      },
      sourceMap: config.build.productionSourceMap,
      parallel: true
    }),
    new ExtractTextPlugin({
      // 生成独立的css文件，下面是生成独立css文件的名称
      filename: utils.assetsPath('css/[name].[md5:contenthash:hex:8].css'),
      allChunks: true,
    }),
    new MiniCssExtractPlugin({
      filename: utils.assetsPath("css/[name].[contenthash].css"),
      allChunks: true
    }),
    // OptimizeCSSPlugin 插件的作用是压缩css代码的，还能去掉extract-text-webpack-plugin插件抽离文件产生的重复代码，
    // 因为同一个css可能在多个模块中出现所以会导致重复代码，换句话说这两个插件是两兄弟
    new OptimizeCSSPlugin({
      cssProcessorOptions: config.build.productionSourceMap
        ? { safe: true, map: { inline: false } }
        : { safe: true }
    }),

    // 生成html页面
    new HtmlWebpackPlugin({
      filename: config.build.index,
      template: 'index.html',
      inject: true, // 将js文件放到body标签的结尾
      minify: {
        // 压缩产出后的html页面
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      },
      // 分类要插到html页面的模块
      chunksSortMode: 'dependency'
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),

    // 下面是复制文件的插件，我认为在这里并不是起到复制文件的作用，而是过滤掉打包过程中产生的以.开头的文件
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../public'),
        to: config.build.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})

if (config.build.productionGzip) {
  // 开启Gzi压缩打包后的文件，就跟你打包压缩包一样，把这个压缩包给浏览器，浏览器自动解压的
  // vue-cli默认将这个功能禁用掉的，理由是Surge 和 Netlify 静态主机默认帮你把上传的文件gzip了
  const CompressionWebpackPlugin = require('compression-webpack-plugin')
  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

if (config.build.bundleAnalyzerReport) {
  // 打包编译后的文件打印出详细的文件信息，vue-cli默认把这个禁用了，可以自行配置
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
