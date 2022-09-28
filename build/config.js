'use strict'

const path = require('path')

// env = "development" 时，代理服务器域名地址
const proxyUrl = 'http://172.16.5.108'

module.exports = {
  // 开发服务器配置
  dev: {
    // 资源子目录，除了index.html外，其他产物都放在该目录下
    assetsSubDirectory: 'public',
    // 项目目录
    assetsPublicPath: '/',
    proxyTable: {
      // url中匹配到/api,就会将/api之前的路径换为target中的路径
      [process.env.VUE_APP_BASE_API_PROXY]: {
        // 目标服务器域名
        target: proxyUrl,
        // 是否跨域
        changeOrigin: true,
        // 重写接口
        pathRewrite: { [`^${process.env.VUE_APP_BASE_API_PROXY}`]: "" }
      }
    },
    // 开发服务器的配置
    host: 'localhost', // 能被process.env.HOST重写
    port: 8080, // 能被process.env.PORT重写，如何端口被占用，将会使用一个空闲的端口
    open: true,
    after: require('../mock/mock-server'),
    autoOpenBrowser: false,
    errorOverlay: true,
    notifyOnErrors: true,
    poll: false,
    useEslint: true,
    showEslintErrorsInOverlay: false,
    devtool: 'eval-source-map', // 源码映射
    cacheBusting: true,
    cssSourceMap: true //css 源码
  },
  // 构建配置
  build: {
    // 索引文件的文件名
    index: path.resolve(__dirname, '../dist/index.html'),
    // 构建产物存放目录
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'public',
    assetsPublicPath: './',
    productionSourceMap: false,
    devtool: 'source-map',
    // productionGzip默认是false，因为许多流行的静态主机（如Surge或Netlify），已经压缩了所有的静态资源，如果你要开启，
    // 确保你 npm install --save-dev compression-webpack-plugin
    productionGzip: false,
    productionGzipExtensions: ['js', 'css'],
    // 运行带有额外参数的build命令以在构建完成后查看包分析器报告 npm run build --report
    bundleAnalyzerReport: process.env.npm_config_report
  },
  absoluteCachePath: (name) => {
    return path.resolve('/cache/migrate_yun', name)
  }
}
