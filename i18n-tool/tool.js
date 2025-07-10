const fs = require('fs').promises
const path = require('path')
const glob = require('glob')
const { promisify } = require('util')

const globPromise = promisify(glob)

// 语言名称映射
const langNameMap = {
  'zh-CN': '中文-简体',
  'zh-TW': '中文-台湾',
  'zh-HK': '中文-香港'
}

// 从命令行参数获取配置文件路径
function getConfigPath() {
  const configIndex = process.argv.indexOf('--config')
  if (configIndex === -1 || configIndex + 1 >= process.argv.length) {
    console.error('请使用 --config 参数指定配置文件路径')
    process.exit(1)
  }
  return path.resolve(process.cwd(), process.argv[configIndex + 1])
}

// 加载配置文件
function loadConfig(configPath) {
  try {
    const config = require(configPath)
    console.log(`已加载配置文件: ${configPath}`)
    return config
  } catch (error) {
    console.error(`加载配置文件失败: ${configPath}`)
    console.error(error)
    process.exit(1)
  }
}

// 主函数
async function main() {
  try {
    const configPath = getConfigPath()
    const config = loadConfig(configPath)

    // 确保输出目录存在
    await fs.mkdir(config.outputDir, { recursive: true })

    // 初始化语言包
    const langFiles = {}
    config.languages.forEach(lang => {
      const langPath = path.join(config.outputDir, `${lang === 'en-US' ? 'en' : lang}.js`)
      let existingContent = {}
      // 读取已有语言包内容（若存在）
      if (require('fs').existsSync(langPath)) {
        try {
          // 注意：需确保语言包导出格式为CommonJS（或调整导入方式）
          existingContent = require(langPath).default
        } catch (e) {
          console.warn(`读取已有语言包 ${langPath} 失败，将重新创建`)
          existingContent = {}
        }
      }
      langFiles[lang] = {
        content: existingContent, // 初始化时载入已有翻译
        path: langPath
      }
    })

    // 扫描文件
    const files = await scanFiles(config)
    console.log(`找到 ${files.length} 个文件需要处理`)

    // 处理每个文件
    let processedCount = 0
    for (const file of files) {
      await processFile(file, langFiles, config)
      processedCount++
      console.log(`已处理 ${processedCount}/${files.length}: ${file}`)
    }

    // 写入语言包文件
    await writeLangFiles(langFiles)

    console.log('中文提取及国际化处理完成!')
  } catch (error) {
    console.error('处理过程中出错:', error)
    process.exit(1)
  }
}

// 扫描文件
async function scanFiles(config) {
  const excludePatterns = config.excludeDirs.map(dir => `!${config.srcDir}/**/${dir}/**`)
  const patterns = [
    `${config.srcDir}/**/*.vue`,
    `${config.srcDir}/**/*.js`,
    `${config.srcDir}/**/*.jsx`
  ]

  const allPatterns = [...patterns, ...excludePatterns]
  return globPromise(`{${allPatterns.join(',')}}`, { nodir: true })
}

// 处理单个文件
async function processFile(filePath, langFiles, config) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const { newContent, keys } = extractChinese(content, filePath, config)

    // 更新语言包
    keys.forEach(({ key, text }) => {
      config.languages.forEach(lang => {
        langFiles[lang].content[key] = text // lang === 'zh-CN' ? text : ''
      })
    })

    // 写入修改后的文件
    if (newContent !== content) {
      await fs.writeFile(filePath, newContent, 'utf-8')
    }

    return keys.length
  } catch (error) {
    console.error(`处理文件 ${filePath} 时出错:`, error)
    return 0
  }
}

// 提取中文并替换
function extractChinese(content, filePath, config) {
  const keys = []
  let newContent = content

  // 计算文件路径相对路径
  const relativePath = path.relative(config.srcDir, filePath)
    .replace(/\.(vue|js|jsx)$/, '')
    .replace(/[\\/]/g, '.')
    .replace(/[^a-zA-Z0-9_.]/g, '_')

  // 处理Vue模板部分
  if (filePath.endsWith('.vue')) {
    const templateRegex = /(<template>[\s\S]*?<\/template>)/g
    newContent = newContent.replace(templateRegex, (match) => {
      return processVueTemplate(match, relativePath, keys, config)
    })
  }

  // 处理JavaScript部分
  const scriptRegex = /(<script[^>]*>[\s\S]*?<\/script>)/g
  newContent = newContent.replace(scriptRegex, (match) => {
    return processScript(match, relativePath, keys, filePath.endsWith('.vue'), config)
  })

  // 处理纯JS文件
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    newContent = processScript(newContent, relativePath, keys, false, config)
  }

  return { newContent, keys }
}

// Vue模板处理函数：支持v-bind、双花括号、普通指令中的中文提取
function processVueTemplate(template, relativePath, keys, config) {
  let newTemplate = template

  // 1. 处理双花括号插值 ({{ 中文 }})
  const interpolationRegex = /{{\s*([^}]*?[\u4e00-\u9fa5]+[^}]*?)\s*}}/g
  newTemplate = newTemplate.replace(interpolationRegex, (match, text) => {
    if (!text.trim()) return match
    const key = generateKey(relativePath, text, config)
    keys.push({ key, text })
    return `{{ $t('${key}') }}`
  })

  // 2. 处理v-bind和普通属性中的中文文本
  // 匹配格式：
  //   1. :属性="中文" 或 v-bind:属性="中文"
  //   2. 普通属性="中文"（排除v-开头的指令）
  const attrRegex = /(\s|:|v-bind:)(\w+)\s*=\s*["']([^"']*?[\u4e00-\u9fa5]+[^"']*?)["']/g
  newTemplate = newTemplate.replace(attrRegex, (match, prefix, attr, text) => {
    // 排除Vue指令 (v-if, v-show等)
    if (prefix === ' ' && attr.startsWith('v-')) {
      return match
    }

    if (!text.trim()) return match
    const key = generateKey(relativePath, text, config)
    keys.push({ key, text })

    // 关键修改：普通属性需要添加:前缀转换为v-bind
    if (prefix === ' ') {
      return ` :${attr}="$t('${key}')"`
    } else if (prefix === ':') {
      return `:${attr}="$t('${key}')"`
    } else if (prefix === 'v-bind:') {
      return `v-bind:${attr}="$t('${key}')"`
    }

    return match
  })

  // 3. 处理普通指令中的文本 (如v-text、v-html等)
  const directiveRegex = /(v-text|v-html|v-tooltip)\s*=\s*["']([^"']*?[\u4e00-\u9fa5]+[^"']*?)["']/g
  newTemplate = newTemplate.replace(directiveRegex, (match, directive, text) => {
    if (!text.trim()) return match
    const key = generateKey(relativePath, text, config)
    keys.push({ key, text })
    return `${directive}="$t('${key}')"`
  })

  // 4. 处理标签内文本 (不含指令的纯文本)
  const tagTextRegex = />([^<]*?[\u4e00-\u9fa5]+[^<]*?)</g
  newTemplate = newTemplate.replace(tagTextRegex, (match, text) => {
    if (!text.trim()) return match
    const key = generateKey(relativePath, text, config)
    keys.push({ key, text })
    return `>{{ $t('${key}') }}<`
  })

  // 5. 处理HTML注释中的中文 (可选)
  if (!config.ignoreComments) {
    const commentRegex = /<!--([\s\S]*?)-->/g
    newTemplate = newTemplate.replace(commentRegex, (match, commentText) => {
      if (!commentText.includes('[\u4e00-\u9fa5]')) return match
      const key = generateKey(relativePath, commentText, config)
      keys.push({ key, text: commentText })
      return `<!-- $t('${key}') -->`
    })
  }

  return newTemplate
}

// 处理脚本
function processScript(script, relativePath, keys, isVueFile, config) {
  let newScript = script
  let hasTransImport = script.includes(`import { trans } from '${config.vueI18nPath}'`)

  // 处理普通字符串中的中文
  const stringRegex = /(['"])((?:(?!\1).)*?[\u4e00-\u9fa5]+(?:(?!\1).)*?)\1/g
  newScript = newScript.replace(stringRegex, (match, quote, text) => {
    // 排除导入语句、注释、正则表达式等
    if (isInExcludedContext(script, script.indexOf(match))) {
      return match
    }

    const key = generateKey(relativePath, text, config)
    keys.push({ key, text })

    // 对于Vue组件中的this.t
    if (isVueFile) {
      return `this.$t('${key}')`
    }

    // 对于普通JS文件，确保导入trans函数
    if (!hasTransImport) {
      hasTransImport = true
    }

    return `trans('${key}')`
  })

  // 处理模板字符串中的中文 (可选)
  if (config.templateStringSupport) {
    const templateRegex = /`((?:\\`|(?!`).)*?[\u4e00-\u9fa5]+(?:\\`|(?!`).)*?)`/g
    newScript = newScript.replace(templateRegex, (match, text) => {
      // 排除导入语句、注释、正则表达式等
      if (isInExcludedContext(script, script.indexOf(match))) {
        return match
      }

      // 模板字符串可能包含表达式，需要特殊处理
      const key = generateKey(relativePath, text, config)
      keys.push({ key, text })

      // 对于Vue组件中的this.t
      if (isVueFile) {
        return `\`\${this.$t('${key}')}\``
      }

      // 对于普通JS文件
      if (!hasTransImport) {
        hasTransImport = true
      }

      return `\`\${trans('${key}')}\``
    })
  }

  // 添加导入语句
  if (hasTransImport && !isVueFile && !script.includes(`import { trans } from '${config.vueI18nPath}'`)) {
    const importStatement = `import { trans } from '${config.vueI18nPath}';\n`
    newScript = importStatement + newScript
  }

  return newScript
}

// 判断位置是否在排除的上下文中（如注释、导入语句等）
function isInExcludedContext(fullText, position) {
  // 提取当前位置之前的文本
  const precedingText = fullText.substring(0, position)

  // 检查是否在单行注释中
  const singleLineComment = /\/\/.*$/gm
  singleLineComment.lastIndex = 0
  let match
  while ((match = singleLineComment.exec(precedingText)) !== null) {
    if (match.index + match[0].length > position) {
      return true
    }
  }

  // 检查是否在多行注释中
  const multiLineComment = /\/\*[\s\S]*?\*\//g
  multiLineComment.lastIndex = 0
  while ((match = multiLineComment.exec(precedingText)) !== null) {
    if (match.index + match[0].length > position) {
      return true
    }
  }

  // 检查是否在导入语句中
  const importStatement = /import\s+['"][^'"]+['"]/g
  if (importStatement.test(precedingText)) {
    return true
  }

  // 检查是否在require语句中
  const requireStatement = /\brequire\s*\(['"][^'"]+['"]\)/g
  if (requireStatement.test(precedingText)) {
    return true
  }

  return false
}

// 生成语言键
function generateKey(relativePath, text, config) {
  if (config.keyGeneration === 'hash') {
    // 使用哈希值作为键
    const crypto = require('crypto')
    const hash = crypto.createHash('md5').update(text).digest('hex')
    return `${relativePath}.${hash.substring(0, 8)}`
  }

  // 默认使用基于路径的键生成方式
  // 简化文本，移除特殊字符和空格
  const simplifiedText = text
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()

  // 限制长度
  const maxLength = 50
  const truncatedText = simplifiedText.length > maxLength
    ? simplifiedText.substring(0, maxLength)
    : simplifiedText

  return `${relativePath}.${truncatedText}`
}

// 写入语言包文件
async function writeLangFiles(langFiles) {
  for (const [lang, file] of Object.entries(langFiles)) {
    const langName = langNameMap[lang] || lang
    let content = `export const _langName = '${langName}';\nexport default {\n`

    // 按key排序
    const sortedKeys = Object.keys(file.content).sort()
    sortedKeys.forEach(key => {
      const value = JSON.stringify(file.content[key] || key)
      content += `  '${key}': ${value},\n`
    })

    content += '};\n'

    await fs.writeFile(file.path, content, 'utf-8')
    console.log(`已生成语言包: ${file.path}`)
  }
}

// 执行主函数
main()
