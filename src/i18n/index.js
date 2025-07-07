import Vue from 'vue'
import VueI18n from 'vue-i18n'

// 注册 VueI18n
Vue.use(VueI18n)

// 所有语言文件
const langFiles = require.context('@/i18n/lang', false, /.js$/)
// 所有语言key键
const langKeys = langFiles.keys().reduce((pre, key) => {
  const fileName = (key || '').match(/([^/\\]+)\.js$/i)[1] || ''
  if (fileName && !pre.includes(fileName)) pre.push(fileName)
  return pre
}, [])

const LangKeyMap = {
  'zh-CN': 'zh-CN',
  'en': 'en-US'
}
// 所有的语言
const langs = {}
// 注册语言
const messages = langKeys.reduce((pre, lan) => {
  const fileCon = require(`@/i18n/lang/${lan}`)
  const langEle = (require(`element-ui/lib/locale/lang/${lan}`)).default
  const langVxeTable = (require(`vxe-table/lib/locale/lang/${LangKeyMap[lan]}.min.js`)).default
  const langeView = (require(`view-design/dist/locale/${LangKeyMap[lan]}.js`)).default
  const langObj = fileCon.default
  const _langName = fileCon._langName
  langs[lan] = _langName
  pre[lan] = {
    ...langObj,
    ...(langEle || {}),
    ...(langVxeTable || {}),
    ...(langeView || {})
  }
  return pre
}, {})

// 当前语言
const locale = localStorage.getItem('lang') || 'zh-CN'

const i18n = new VueI18n({
  locale,
  messages,
  silentTranslationWarn: true // 忽略翻译警告
})

// 非Vue文件翻译
const trans = localeKey => {
  // 使用i18n检查是否可以匹配到对应键
  const hasLang = i18n.te(localeKey, locale)
  if (hasLang) return i18n.t(localeKey)
  return localeKey
}

// 导出翻译实例
export default i18n

export {
  langs,
  locale,
  trans
}
