'use strict'

const path = require('path')
const utils = require('./utils')
const config = require('./config')
const webpack = require('webpack')
const vueLoaderConfig = require('./vue-loader.conf')
//处理 js 的压缩和混淆
const TerserPlugin = require("terser-webpack-plugin")


// resolve函数是用来返回当前目录的平行目录的路径，因为有个'..'
const resolve = dir => path.join(__dirname, '..', dir)

const createLintingRule = () => ({
  // 也就是说，对.js和.vue文件在编译之前进行检测，检查有没有语法错误'eslint-loader'
  // enforce: 'pre'选项可以确保，eslint插件能够在编译之前检测，如果不添加此项，就要把这个配置项放到末尾，确保第一个执行
  test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [resolve('src'), resolve('test')],
  options: {
    formatter: require('eslint-friendly-formatter'),
    emitWarning: !config.dev.showEslintErrorsInOverlay
  }
})

const entryChunk = {
  element: "./node_modules/element-ui/lib/element-ui.common.js"
}

module.exports = {
  context: path.resolve(__dirname, '../'),
  entry: Object.assign(entryChunk, { // 入口文件, app是src目录下的main.js
    app: './src/main.js'
  }),
  output: { // path是config文件中build配置中的assetsRoot，也就是dist目录
    path: config.build.assetsRoot,
    filename: '[name].js', // name这里使用默认的name也就是main
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath // 上线地址，也就是真正的文件引用路径，如果是production生产环境，其实这里都是 './'
  },
  plugins: [
    new webpack.IgnorePlugin(/\.\/locale/, /moment/)
  ],
  resolve: {
    // resolve是webpack的内置选项，顾名思义，决定要做的事情，也就是说当使用 import "jquery"，
    // 该如何去执行这件事情就是resolve配置项要做的，
    // import jQuery from "./additional/dist/js/jquery"
    // 这样会很麻烦，可以起个别名简化操作
    extensions: ['.js', '.vue', '.json'],
    alias: {
      //后面的$符号指精确匹配，
      // 也就是说只能使用 import vuejs from "vue"
      // 这样的方式导入vue.esm.js文件，不能在后面跟上 vue/vue.js
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src'),
      'assets': resolve('src/assets'),
      'comps': resolve('src/components')
    }
  },
  optimization: {
    noEmitOnErrors: true,
    concatenateModules: true,
    splitChunks: {
      chunks: 'all'
    },
    minimizer: [
      new TerserPlugin({
        chunkFilter: chunk => {
          return !Object.keys(entryChunk)
            .concat('vendor')
            .includes(chunk.name)
        },
        cache: config.absoluteCachePath('terser-plugin'),
        parallel: true
      })
    ]
  },
  performance: {
    hints: false
  },

  // module用来解析不同的模块
  module: {
    rules: [
      ...(config.dev.useEslint ? [createLintingRule()] : []),
      {
        // 对vue文件使用vue-loader，该loader是vue单文件组件的实现核心，专门用来解析.vue文件的
        // 将vueLoaderConfig当做参数传递给vue-loader,就可以解析文件中的css相关文件
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      {
        // 对js文件使用babel-loader转码,该插件是用来解析es6等代码
        test: /\.js$/,
        use: [
          'thread-loader',
          'babel-loader?cacheDirectory=' + config.absoluteCachePath('babel-loader'),
          'eslint-loader'
        ],
        exclude: [resolve('node_modules')],
        include: [resolve('src'), resolve('node_modules/webpack-dev-server/client')]
      },
      {
        // 对图片相关的文件使用 url-loader 插件，这个插件的作用是将一个足够小的文件生成一个64位的DataURL
        // 当一个图片足够小，为了避免单独请求可以把图片的二进制代码变成64位的
        // DataURL，使用src加载，也就是把图片当成一串代码，避免请求。
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  },
  node: {
    setImmediate: false,
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  }
}
