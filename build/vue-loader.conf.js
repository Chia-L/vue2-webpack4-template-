'use strict'

const utils = require('./utils')
// config中包含开发和生成环境的相关属性
const config = require('./config')
const isProduction = process.env.NODE_ENV === 'production'
const sourceMapEnabled = isProduction
  ? config.build.productionSourceMap
  : config.dev.productionSourceMap

module.exports = {
  // 调用utils配置文件中的cssLoaders方法，用来返回配置好的css-loader和vue-style-loader
  loader: utils.cssLoaders({
    // 根据所处环境是否生成sourceMap用于代码调试
    sourceMap: sourceMapEnabled,
    // extract是自定义配置项，设置为true表示生成单独样式文件
    extract: isProduction
  }),
  cssSourceMap: sourceMapEnabled,
  cacheBusting: config.dev.cacheBusting,
  transformToRequire: {
    video: ['src', 'poster'],
    source: 'src',
    img: 'src',
    image: 'xlink:href'
  }
}

