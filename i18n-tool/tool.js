const fs = require('fs').promises
const path = require('path')
const glob = require('glob')
const { promisify } = require('util')
const crc32 = require('crc-32')

const globPromise = promisify(glob)

// 配置映射
const langNameMap = {
  'zh-CN': '中文-简体',
  'zh-TW': '中文-台湾',
  'zh-HK': '中文-香港',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)'
}

const langFileNameMap = {
  'en-US': 'en'
}

// 应用状态
const state = {
  config: null,
  globalTextKeyMap: new Map(),
  mainDirKeys: new Map(),
  inspectDirKeys: new Map(),
  baselineKeys: new Map(),
  inspectLangFiles: {}
}

// 命令行处理
function parseCommandLine() {
  const configIndex = process.argv.indexOf('--config')
  if (configIndex === -1 || configIndex + 1 >= process.argv.length) {
    throw new Error('请使用 --config 参数指定配置文件路径')
  }

  const configPath = path.resolve(process.cwd(), process.argv[configIndex + 1])

  let command = 'process'
  const commandIndex = process.argv.indexOf('--command')
  if (commandIndex !== -1 && commandIndex + 1 < process.argv.length) {
    command = process.argv[commandIndex + 1]
    if (!['process', 'inspect', 'inspect-merge'].includes(command)) {
      throw new Error('无效的指令。支持的指令: process, inspect, inspect-merge')
    }
  }

  return { configPath, command }
}

// 配置加载
async function loadConfig(configPath) {
  try {
    const config = require(configPath)
    config.inspectBaselinePath = path.join(config.inspectDir, '.inspect_baseline.json')
    return config
  } catch (error) {
    throw new Error(`加载配置文件失败: ${configPath}\n${error.message}`)
  }
}

// 初始化
async function initialize() {
  await loadGlobalTextKeyMap()
  await loadExistingTranslations()
  await loadInspectTranslations()
  await loadInspectBaseline()
}

// 加载全局文本-键映射
async function loadGlobalTextKeyMap() {
  try {
    const mapPath = path.join(state.config.outputDir, '.text_key_map.json')
    const content = await fs.readFile(mapPath, 'utf-8')
    state.globalTextKeyMap = new Map(Object.entries(JSON.parse(content)))
    console.log(`已加载全局映射（${state.globalTextKeyMap.size} 条记录）`)
  } catch (error) {
    console.log('未找到全局映射文件，将创建新映射')
    state.globalTextKeyMap = new Map()
  }
}

// 保存全局映射
async function saveGlobalTextKeyMap() {
  try {
    const mapPath = path.join(state.config.outputDir, '.text_key_map.json')
    const mapData = Object.fromEntries(state.globalTextKeyMap)
    await fs.writeFile(mapPath, JSON.stringify(mapData, null, 2), 'utf-8')
    console.log(`已保存全局映射（${state.globalTextKeyMap.size} 条记录）`)
  } catch (error) {
    console.error('保存全局映射失败:', error)
  }
}

// 加载现有翻译
async function loadExistingTranslations() {
  const translations = {}
  try {
    const langFiles = await fs.readdir(state.config.outputDir)
    for (const file of langFiles) {
      if (file.endsWith('.js') && !file.startsWith('.')) {
        const lang = getLangByFileName(file)
        const filePath = path.join(state.config.outputDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        translations[lang] = parseLanguageFile(content)
      }
    }
    console.log(`已加载现有翻译（${Object.keys(translations).length} 种语言）`)
  } catch (error) {
    console.log('未发现现有语言包，将创建新文件')
  }

  // 更新状态
  state.config.languages.forEach(lang => {
    state.mainDirKeys.set(lang, new Set(Object.keys(translations[lang] || {})))
  })

  return translations
}

// 加载视察目录翻译
async function loadInspectTranslations() {
  const translations = {}
  try {
    const langFiles = await fs.readdir(state.config.inspectDir)
    for (const file of langFiles) {
      if (file.endsWith('.js') && !file.startsWith('.')) {
        const lang = getLangByFileName(file)
        const filePath = path.join(state.config.inspectDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        translations[lang] = parseLanguageFile(content)
      }
    }
    console.log(`已加载视察目录翻译（${Object.keys(translations).length} 种语言）`)
  } catch (error) {
    console.log('未发现视察目录语言包，将创建新文件')
  }

  // 更新状态
  state.config.languages.forEach(lang => {
    state.inspectDirKeys.set(lang, new Set(Object.keys(translations[lang] || {})))
  })

  return translations
}

// 加载视察基线
async function loadInspectBaseline() {
  try {
    const content = await fs.readFile(state.config.inspectBaselinePath, 'utf-8')
    const baseline = JSON.parse(content)
    console.log(`已加载视察基线（上次合并: ${new Date(baseline.timestamp).toISOString()}）`)

    // 更新状态
    state.config.languages.forEach(lang => {
      state.baselineKeys.set(lang, new Set(baseline.keys[lang] || []))
    })

    return baseline
  } catch (error) {
    console.log('未找到视察基线，将创建新基线')
    const baseline = { timestamp: Date.now(), keys: {} }
    await saveInspectBaseline(baseline)
    return baseline
  }
}

// 保存视察基线
async function saveInspectBaseline(baseline) {
  try {
    await fs.writeFile(
      state.config.inspectBaselinePath,
      JSON.stringify(baseline, null, 2),
      'utf-8'
    )
    console.log('已保存视察基线')
  } catch (error) {
    console.error('保存视察基线失败:', error)
  }
}

// 解析语言文件
function parseLanguageFile(content) {
  const translations = {}
  const keyValueRegex = /^\s*'([^']+)'\s*:\s*'([^']*)',?\s*$/gm

  let match
  while ((match = keyValueRegex.exec(content)) !== null) {
    translations[match[1]] = match[2]
  }

  return translations
}

// 获取语言代码
function getLangByFileName(fileName) {
  fileName = fileName.replace('.js', '')
  return Object.keys(langFileNameMap).find(
    code => langFileNameMap[code] === fileName
  ) || fileName
}

// 生成/获取文本键
function getOrGenerateKey(text) {
  const normalizedText = text
    .replace(/[\s\n\t]+/g, ' ')
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
    .trim()

  if (state.globalTextKeyMap.has(normalizedText)) {
    return state.globalTextKeyMap.get(normalizedText)
  }

  const hash = Math.abs(crc32.str(normalizedText))
    .toString(16)
    .toUpperCase()
    .padStart(6, '0')

  let key = `LabelMgr.${hash}`
  let counter = 1

  while (Array.from(state.globalTextKeyMap.values()).includes(key)) {
    key = `LabelMgr.${hash}-${counter++}`
  }

  state.globalTextKeyMap.set(normalizedText, key)
  return key
}

// 扫描文件
async function scanFiles() {
  const srcDir = state.config.srcDir.replace(/\\/g, '/')
  const includePatterns = [
    `${srcDir}/**/*.vue`,
    `${srcDir}/**/*.js`,
    `${srcDir}/**/*.jsx`
  ]
  const excludePatterns = state.config.excludeDirs.map(
    dir => `!${srcDir}/${dir}/**`
  )
  const allPatterns = [...includePatterns, ...excludePatterns]

  console.log(`扫描模式: ${allPatterns.join(', ')}`)
  const files = await globPromise(`{${allPatterns.join(',')}}`, {
    nodir: true,
    absolute: true
  })

  const relativeFiles = files.map(file => path.relative(process.cwd(), file))

  // 再次过滤，确保排除路径中的文件
  const filteredFiles = relativeFiles.filter(file => !isFileInExcludedPath(file))

  console.log(`排除后剩余 ${filteredFiles.length} 个文件`)
  return filteredFiles
}

// 检查文件是否在排除路径中
function isFileInExcludedPath(filePath) {
  const relativePath = path.relative(state.config.srcDir, filePath)
  const excludeDirs = state.config.excludeDirs || []

  for (const excludeDir of excludeDirs) {
    if (relativePath.startsWith(excludeDir) || relativePath === excludeDir) {
      return true
    }
  }

  return false
}

// 处理文件
async function processFile(filePath, isInspectMode = false) {
  // 检查文件是否在排除路径中
  if (isFileInExcludedPath(filePath)) {
    console.log(`跳过排除路径中的文件: ${filePath}`)
    return 0
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const { newContent, keys } = extractChinese(content, filePath)

    // 更新语言包
    for (const { key, text } of keys) {
      for (const lang of state.config.languages) {
        const langFile = state.inspectLangFiles[lang]

        // 仅添加不在主目录、视察目录和基线中的key（视察模式）
        if (isInspectMode) {
          const mainKeys = state.mainDirKeys.get(lang) || new Set()
          const existingKeys = state.inspectDirKeys.get(lang) || new Set()
          const baselineKeys = state.baselineKeys.get(lang) || new Set()

          if (!mainKeys.has(key) && !existingKeys.has(key) && !baselineKeys.has(key)) {
            langFile.content[key] =  text
          }
        }
        // 普通模式和合并模式：只添加不在主目录的key
        else if (!state.mainDirKeys.get(lang).has(key)) {
          langFile.content[key] = text
        }
      }
    }

    // 写入修改后的文件（非视察模式，包括合并模式）
    if (!isInspectMode && newContent !== content) {
      await fs.writeFile(filePath, newContent, 'utf-8')
    }

    return keys.length
  } catch (error) {
    console.error(`处理文件 ${filePath} 出错:`, error)
    return 0
  }
}

// 提取中文文本
function extractChinese(content, filePath) {
  const keys = []
  let newContent = content
  const isVueFile = filePath.endsWith('.vue')

  // 处理Vue模板
  if (isVueFile) {
    const templateRegex = /(<template>[\s\S]*?<\/template>)/g
    newContent = newContent.replace(templateRegex, (match) =>
      processVueTemplate(match, keys)
    )
  }

  // 处理脚本
  const scriptRegex = isVueFile
    ? /(<script[^>]*>[\s\S]*?<\/script>)/g
    : null

  let hasTransImport = false

  if (scriptRegex) {
    newContent = newContent.replace(scriptRegex, (match) => {
      const { processedScript, importAdded } = processScript(
        match, keys, true
      )
      hasTransImport = importAdded
      return processedScript
    })
  } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    const { processedScript, importAdded } = processScript(
      content, keys, false
    )
    newContent = processedScript
    hasTransImport = importAdded
  }

  return { newContent, keys }
}

// 处理Vue模板
function processVueTemplate(template, keys) {
  let newTemplate = template

  // 处理插值表达式
  newTemplate = newTemplate.replace(
    /{{\s*([^}]*?[\u4e00-\u9fa5]+[^}]*?)\s*}}/g,
    (match, text) => {
      const cleanText = cleanTextForTranslation(text)
      const key = getOrGenerateKey(cleanText)
      keys.push({ key, text: cleanText })
      return `{{ $t('${key}') }}`
    }
  )

  // 处理属性
  newTemplate = newTemplate.replace(
    /(\s|:|v-bind:)(\w+)\s*=\s*["']([^"']*?[\u4e00-\u9fa5]+[^"']*?)["']/g,
    (match, prefix, attr, text) => {
      if (prefix === ' ' && attr.startsWith('v-')) return match
      const cleanText = cleanTextForTranslation(text)
      const key = getOrGenerateKey(cleanText)
      keys.push({ key, text: cleanText })
      return prefix === ' ' ? ` :${attr}="$t('${key}')"` : `${prefix}${attr}="$t('${key}')"`
    }
  )

  // 处理标签内文本
  newTemplate = newTemplate.replace(
    />([^<]*?[\u4e00-\u9fa5]+[^<]*?)</g,
    (match, text) => {
      const cleanText = cleanTextForTranslation(text)
      const key = getOrGenerateKey(cleanText)
      keys.push({ key, text: cleanText })
      return `>{{ $t('${key}') }}<`
    }
  )

  return newTemplate
}

// 处理脚本
function processScript(script, keys, isVueFile) {
  let newScript = script
  let hasTransImport = script.includes(`import { trans } from '${state.config.vueI18nPath}'`)

  // 处理普通字符串
  newScript = newScript.replace(
    /(['"])((?:(?!\1).)*?[\u4e00-\u9fa5]+(?:(?!\1).)*?)\1/g,
    (match, quote, text) => {
      if (isInExcludedContext(script, script.indexOf(match))) return match
      const cleanText = cleanTextForTranslation(text)
      const key = getOrGenerateKey(cleanText)
      keys.push({ key, text: cleanText })
      return isVueFile ? `this.$t('${key}')` : `trans('${key}')`
    }
  )

  // 处理模板字符串
  if (state.config.templateStringSupport) {
    newScript = newScript.replace(
      /`((?:\\`|(?!`).)*?[\u4e00-\u9fa5]+(?:\\`|(?!`).)*?)`/g,
      (match, text) => {
        if (isInExcludedContext(script, script.indexOf(match))) return match
        const cleanText = cleanTextForTranslation(text)
        const key = getOrGenerateKey(cleanText)
        keys.push({ key, text: cleanText })
        return isVueFile ? `\`\${this.$t('${key}')}\`` : `\`\${trans('${key}')}\``
      }
    )
  }

  // 添加导入语句
  if (!isVueFile && hasTransImport && !script.includes(`import { trans } from '${state.config.vueI18nPath}'`)) {
    newScript = `import { trans } from '${state.config.vueI18nPath}';\n` + newScript
  }

  return { processedScript: newScript, importAdded: hasTransImport }
}

// 判断是否在排除上下文
function isInExcludedContext(fullText, position) {
  const precedingText = fullText.substring(0, position)
  return (
    /\/\/.*$/.test(precedingText.split('\n').pop()) ||
    /\/\*[\s\S]*?\*\//.test(precedingText) &&
    !/\/\*[\s\S]*?\*\//.test(precedingText.split(/\/\*|\*\//).slice(-1)[0]) ||
    /import\s+['"]|require\s*\(['"]/.test(precedingText)
  )
}

// 清理文本
function cleanTextForTranslation(text) {
  return text
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// 写入语言包
async function writeLangFiles(isInspectMode = false) {
  const targetDir = isInspectMode ? state.config.inspectDir : state.config.outputDir

  for (const lang of state.config.languages) {
    const langFile = state.inspectLangFiles[lang]
    const fileName = langFileNameMap[lang] || lang
    const filePath = path.join(targetDir, `${fileName}.js`)
    const langName = langNameMap[lang] || lang

    // 读取现有文件保持原有顺序
    let existingContent = ''
    try {
      existingContent = await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      // 文件不存在
    }

    const existingKeys = []
    const existingValues = {}
    const keyValueRegex = /^\s*'([^']+)'\s*:\s*'([^']*)',?\s*$/gm

    let match
    while ((match = keyValueRegex.exec(existingContent)) !== null) {
      existingKeys.push(match[1])
      existingValues[match[1]] = match[2]
    }

    // 合并键
    const newKeys = Object.keys(langFile.content)
      .filter(key => !existingKeys.includes(key))
      .sort()

    const allKeys = [...existingKeys, ...newKeys]

    // 生成文件内容
    let content = `export const _langName = '${langName}';\nexport default {\n`

    for (const key of allKeys) {
      const value = existingValues[key] !== undefined
        ? existingValues[key]
        : langFile.content[key]
      content += `  '${key}': '${escapeSingleQuotes(value)}',\n`
    }

    content += `};\n`

    await fs.writeFile(filePath, content, 'utf-8')
    console.log(`已更新语言包: ${filePath}（${allKeys.length} 项）`)
  }
}

// 转义单引号
function escapeSingleQuotes(str) {
  return str.replace(/'/g, "\\'")
}

// 合并视察目录到主目录
async function mergeInspectToMain() {
  console.log('开始合并视察目录到主目录...')

  // 加载视察目录和主目录翻译
  const inspectTranslations = await loadInspectTranslations()
  const mainTranslations = await loadExistingTranslations()

  // 合并翻译
  for (const lang of state.config.languages) {
    const inspectTrans = inspectTranslations[lang] || {}
    const mainTrans = mainTranslations[lang] || {}
    const mergedTrans = { ...mainTrans, ...inspectTrans }

    const fileName = langFileNameMap[lang] || lang
    const filePath = path.join(state.config.outputDir, `${fileName}.js`)

    await writeSingleLangFile(filePath, lang, mergedTrans)
    console.log(`语言 ${lang}: 合并了 ${Object.keys(inspectTrans).length} 个词条`)
  }

  // 处理源代码文件，替换中文文本为i18n调用
  await processSourceFilesForMerge()

  // 重置视察目录
  await resetInspectDir()
  console.log('合并完成，视察目录已重置')
}

// 处理源代码文件，替换中文文本为i18n调用
async function processSourceFilesForMerge() {
  console.log('开始处理源代码文件，替换中文文本为i18n调用...')

  const files = await scanFiles()
  console.log(`找到 ${files.length} 个文件需要处理`)

  let processedCount = 0
  for (const file of files) {
    // 注意这里传入false，表示非视察模式，需要替换文件内容
    await processFile(file, false)
    console.log(`已处理 ${++processedCount}/${files.length}: ${file}`)
  }

  console.log('源代码文件处理完成')
}

// 写入单个语言包
async function writeSingleLangFile(filePath, lang, translations) {
  const langName = langNameMap[lang] || lang

  let content = `export const _langName = '${langName}';\nexport default {\n`

  for (const key of Object.keys(translations)) {
    content += `  '${key}': '${escapeSingleQuotes(translations[key])}',\n`
  }

  content += `};\n`

  await fs.writeFile(filePath, content, 'utf-8')
}

// 重置视察目录
async function resetInspectDir() {
  try {
    const langFiles = await fs.readdir(state.config.inspectDir)
    for (const file of langFiles) {
      if (file.endsWith('.js') && !file.startsWith('.')) {
        await fs.unlink(path.join(state.config.inspectDir, file))
      }
    }

    const baseline = { timestamp: Date.now(), keys: {} }
    await saveInspectBaseline(baseline)

    console.log(`已重置视察目录: ${state.config.inspectDir}`)
  } catch (error) {
    console.error('重置视察目录失败:', error)
  }
}

// 初始化语言包文件
function initLangFiles(isInspectMode = false) {
  const targetDir = isInspectMode ? state.config.inspectDir : state.config.outputDir

  for (const lang of state.config.languages) {
    state.inspectLangFiles[lang] = {
      content: {},
      path: path.join(targetDir, `${langFileNameMap[lang] || lang}.js`)
    }
  }
}

// 主函数
async function main() {
  try {
    const { configPath, command } = parseCommandLine()
    state.config = await loadConfig(configPath)
    state.config.command = command

    console.log(`执行指令: ${command}`)

    await initialize()
    initLangFiles(command === 'inspect' || command === 'inspect-merge')

    const files = await scanFiles()
    console.log(`找到 ${files.length} 个文件需要处理`)

    let totalKeys = 0
    for (const [index, file] of files.entries()) {
      const count = await processFile(file, command === 'inspect' || command === 'inspect-merge')
      totalKeys += count
      console.log(`已处理 ${index + 1}/${files.length}: ${file} (提取: ${count})`)
    }

    await writeLangFiles(command === 'inspect' || command === 'inspect-merge')
    await saveGlobalTextKeyMap()

    if (command === 'inspect-merge') {
      await mergeInspectToMain()
    }

    console.log('处理完成!')
  } catch (error) {
    console.error('执行出错:', error.message)
    process.exit(1)
  }
}

// 执行
main()
