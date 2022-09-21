'use strict'
// 检查环境的node，和npm版本

const chalk = require('chalk') // 颜色插件
const semver = require('semver') // 对特定的版本号做判断
const packageConfig = require('../package.json')
const shell = require('shelljs') //用来执行Unix系统命令


// 通过 child_process 模块新建子进程，从而执行 Unix 系统命令
const exec = cmd => require('child_process').execSync(cmd).toString().trim()

// 版本需求列表
const versionRequirements = [
  {
    name: 'node',
    currentVersion: semver.clean(process.version), //当前node的版本
    versionRequirement: packageConfig.engines.node // 项目需要的node版本
  }
]

// 返回npm绝对路径，没有则返回null
if (shell.which('npm')) {
  versionRequirements.push({
    name: 'npm',
    currentVersion: exec('npm  --version'), //当前npm的版本
    versionRequirement: packageConfig.engines.npm // 项目需要的npm版本
  })
}


module.exports = function () {
  const warnings = [] // 警告列表

  versionRequirements.forEach(mod => {
    if (semver.satisfies(mod.currentVersion, mod.versionRequirement)) {
      // 如果版本号不符合package.json文件中指定的版本号，就执行下面的代码
      warnings.push(mod.name + ': ' +
        chalk.red(mod.currentVersion) + ' should be ' +
        chalk.green(mod.versionRequirement)
      ) // 把当前版本号用红色字体 符合要求的版本号用绿色字体 给用户提示具体合适的版本
    }
  })

  if (warnings.length > 0) {
    console.log(chalk.yellow('To use this template, you must update following to modules:'))

    warnings.forEach(warning => {
      console.log(warning)
    })

    process.exit(1)
  }
}




