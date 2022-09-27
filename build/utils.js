'use strict'

// 引入nodejs路径模块
const path = require('path')
// 引入当前目录下的index.js配置文件
const config = require('./config')
// 引入extract-text-webpack-plugin插件，用来将css提取到单独的css文件中
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// 引入package文件
const packageConfig = require('../package.json')

/*const resolve = dir => {
  return path.join(__dirname, '..', dir)
}*/


exports.assetsPath = function (_path) {
  // 如果是生产环境使用build属性的assetsSubDirectory属性值，否则使用dev属性的assetsSubDirectory属性值
  const assetsSubDirectory = process.env.NODE_ENV === 'production'
  ? config.build.assetsSubDirectory
  : config.dev.assetsSubDirectory

  // path.join和path.posix.join的区别就是，前者返回的是完整的路径，后者返回的是完整路径的相对根路径
  // 也就是说path.join的路径是D:user/work/youProjectName/build，那么path.posix.join就是build
  return path.posix.join(assetsSubDirectory, _path)
  // 所以这个方法的作用就是返回一个干净的相对根路径
}

// 导出cssLoaders的相关配置
exports.cssLoaders = options => {
  options = options || {}

  const cssLoader = {
    // options是用来传递参数给loader的
    // minimize表示压缩，如果是生产环境就压缩css代码
    // minimize: process.env.NODE_ENV === 'production',
    // 是否开启cssmap，默认是false
    loader: 'css-loader',
    options: {
      minimize: process.env.NODE_ENV === 'production',
      sourceMap: options.sourceMap
    }
  }

  const postcssLoader = {
    loader: 'postcss-loader',
    options: {
      sourceMap: options.sourceMap
    }
  }

  const generateLoaders = (loader, loaderOptions) => {
    // 将上面的基础cssLoader、postcssLoader，配置放在一个数组里面
    const loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]

    if (loader) {
      // 如果该函数传递了单独的loader就加到这个loaders数组里面，这个loader可能是less,sass之类的
      loaders.push({
        loader: loader + '-loader', // 加载对应的loader
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        }) // Object.assign是es6的方法，合并loader参数对象的，浅拷贝
      })
      if (loader === 'less') {
        loaders.push(
          {
            loader: 'sass-resources-loader',
            options: {
              resources: [
                path.resolve(__dirname, '../src/assets/less/global.less'), //定义全局变量的文件路径
              ]
            }
          }
        )
      }
    }

    if (options.extract) {
      // 注意这个extract是自定义的属性，可以定义在options里面，
      // 主要作用就是当配置为true就把文件单独提取，false表示不单独提取，这个可以在使用的时候单独配置
      return ExtractTextPlugin.extract({
        use: loaders,
        fallback: 'vue-style-loader',
        publicPath: '../../'
      })
    } else {
      // 下面这段代码就是用来返回最终读取和导入loader，来处理对应类型的文件
      return ['vue-style-loader'].concat(loaders)
    }
  }

  return  {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass'),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus')
  }
}

exports.styleLoaders = options => {
  // 下面这个主要处理import这种方式导入的文件类型的打包，上面的exports.cssLoaders是为这一步服务的
  const output = []
  const loaders =  exports.cssLoaders(options) || {}

  // 把每一种文件的loader都提取出来
  Object.keys(loaders).forEach(extension => {
    const loader = loaders[extension]
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    })
  })

  return output
}

exports.createNotifierCallback = () => {
  const notifier = require('node-notifier')

  return (severity, errors) => {
    if (severity !== 'error') return

    const error = errors[0]
    const filename = error.file && error.file.split('!').pop()

    notifier.notify({
      title: packageConfig.name,
      message: severity + '：' + error.name,
      subtitle: filename || '',
      icon: path.join(__dirname, 'logo.png')
    })
  }
}
