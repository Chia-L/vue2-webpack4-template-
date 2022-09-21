'use strict'

require('./check-versions')() // 检查node、npm版本

process.env.NODE_ENV = 'production'

//优雅的终端微调器 打包开始提示对cli进行输出一个带spinner的文案，告诉用户正在打包中
const ora = require('ora')
// 以包的形式包装rm -rf命令，就是用来删除文件和文件夹的，不管文件夹是否为空，都可以删除。
// 去除先前的打包,这个模块是用来清除之前的打的包，
// 因为在vue-cli中每次打包会生成不同的hash,每次打包都会生成新的文件，那就不对了，
// 我们要复盖原先的文件，因为hash不同复盖不了，所以要清除
const rm = require('rimraf')
const path = require('path')
// 更好的命令行字符串格式
const chalk = require('chalk')
const webpack = require('webpack')

const config = require('./config')
const webpackConfig = require('./webpack.prod')

const spinner = ora('building for production...')
spinner.start()

rm(path.join(config.build.assetsRoot, config.build.assetsSubDirectory), err => {
  if (err) throw err
  webpack(webpackConfig, (err, stats) => {
    spinner.stop()
    if (err) throw err

    process.stdout.write(
      stats.toString({
        colors: true,
        modules: false,
        children: false, // if you are using ts-loader, setting this to true will make typescript errors show up during build
        chunks: false,
        chunkModules: false
      }) + '\n\n'
    )

    if (stats.hasErrors()) {
      console.log(chalk.red(' Build failed with errors.\n'))
      process.exit(1)
    }
    console.log(chalk.cyan('  Build complete.\n'))
    console.log(chalk.yellow(
      '  Tip: built files are meant to be served over an HTTP server.\n' +
      '  Opening index.html over file:// won\'t work.\n'
    ))
  })
})
