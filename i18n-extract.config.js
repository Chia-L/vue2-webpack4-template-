module.exports = {
  srcDir: './src', // 源目录
  outputDir: './src/i18n/lang', // 语言包输出目录
  inspectDir: './src/i18n/locales_inspect', // 视察目录
  languages: ['zh-CN', 'en-US'], // 支持的语言
  excludeDirs: ['i18n'], // 排除目录
  vueI18nPath: '@/i18n', // Vue I18n导入路径
  // 新增配置项
  keyGeneration: 'path-based', // 键生成方式: 'path-based' 或 'hash'
  ignoreComments: true, // 是否忽略注释中的中文
  templateStringSupport: true, // 是否支持模板字符串中的中文
}
